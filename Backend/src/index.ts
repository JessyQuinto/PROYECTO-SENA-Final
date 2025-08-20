import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const app = express();

// CORS: permitir orígenes del frontend configurados por env FRONTEND_ORIGINS (separados por coma)
// Ej: FRONTEND_ORIGINS="https://<swa>.azurestaticapps.net,https://www.tudominio.com"
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// Soporte simple de comodines: usar '*' en host o subdominio (p.ej., https://miapp-*.azurestaticapps.net)
const originMatchers = allowedOrigins.map((o) => {
  if (o === '*') return { type: 'any' as const };
  if (o.includes('*')) {
    // Escape regex y reemplazar '*' por '.*'
    const pattern = o
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*');
    return { type: 'regex' as const, re: new RegExp(`^${pattern}$`, 'i') };
  }
  return { type: 'exact' as const, value: o.toLowerCase() };
});

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir llamadas sin origin (p.ej., health checks internos)
    if (!origin) return callback(null, true);
    const o = origin.toLowerCase();
    for (const m of originMatchers) {
      if (m.type === 'any') return callback(null, true);
      if (m.type === 'exact' && m.value === o) return callback(null, true);
      if (m.type === 'regex' && m.re.test(o)) return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent caching of API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Ruta raíz amigable
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/health');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'backend-demo', ts: new Date().toISOString() });
});

// ==============================
// Auth helpers
// ==============================
const postSignupSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['comprador', 'vendedor', 'admin']).default('comprador'),
  nombre: z.string().min(1).optional()
});

// Upsert perfil en tabla pública y fija app_metadata.role para que el JWT lo incluya
app.post('/auth/post-signup', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = postSignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  const { user_id, email, role, nombre } = parsed.data;
  try {
    const supabase = getSupabaseAdmin();
    // 1) Upsert en tabla users
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert(
        {
          id: user_id,
          email,
          role,
          nombre_completo: typeof nombre === 'string' && nombre.trim().length > 0 ? nombre.trim() : undefined
        },
        { onConflict: 'id' }
      );
    if (upsertErr) {
      console.error('[post-signup] upsert users error', upsertErr);
      return res.status(500).json({ error: upsertErr.message });
    }
    // 2) Guardar role en app_metadata (recomendado para claims en JWT)
    try {
      const { error: adminErr } = await supabase.auth.admin.updateUserById(user_id, { app_metadata: { role } });
      if (adminErr) console.warn('[post-signup] updateUserById warning', adminErr.message);
    } catch (e: any) {
      console.warn('[post-signup] updateUserById not available or failed', e?.message || e);
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ==============================
// Auth middlewares (JWT-based)
// ==============================
const RATE_WINDOW_MS = 60_000; // 1 minuto
const RATE_MAX_REQUESTS = 30;
const rateStore = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const record = rateStore.get(ip);
  if (!record || record.resetAt <= now) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    record.count += 1;
    if (record.count > RATE_MAX_REQUESTS) {
      const retry = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: 'Rate limit excedido. Intenta más tarde.' });
    }
  }
  next();
};

const getUserFromAuthHeader = async (req: Request) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const supabaseUser = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data } = await supabaseUser.auth.getUser();
  return data.user as any | null;
};

const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    (req as any).user = user;
    next();
  } catch (e) { next(e); }
};

const requireAdminJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    const role = (user.app_metadata as any)?.role;
    if (role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    (req as any).user = user;
    next();
  } catch (e) { next(e); }
};

const setRoleSchema = z.object({ role: z.enum(['admin', 'vendedor', 'comprador']) });
app.post('/admin/users/:id/role', rateLimit, requireAdminJwt, async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  const parsed = setRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: parsed.data.role } });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Crear usuario (admin) con email/password y asignar rol
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'vendedor', 'comprador']).default('comprador'),
  nombre: z.string().optional()
});

app.post('/admin/create-user', rateLimit, requireAdminJwt, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  const { email, password, role, nombre } = parsed.data;
  try {
    const supabase = getSupabaseAdmin();
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    } as any);
    if (createErr) return res.status(500).json({ error: createErr.message });
    const userId = created?.user?.id;
    if (!userId) return res.status(500).json({ error: 'No se obtuvo user.id' });

    // Upsert perfil público
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert({ id: userId, email, role, nombre_completo: nombre && nombre.trim().length > 0 ? nombre.trim() : undefined }, { onConflict: 'id' });
    if (upsertErr) return res.status(500).json({ error: upsertErr.message });

    // Asegurar app_metadata.role
    await supabase.auth.admin.updateUserById(userId, { app_metadata: { role } });

    res.json({ ok: true, user_id: userId });
  } catch (e) {
    next(e);
  }
});

const crearPedidoSchema = z.object({
  items: z.array(z.object({ producto_id: z.string().uuid(), cantidad: z.number().int().positive() })).min(1)
});

app.post('/rpc/crear_pedido_demo', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = crearPedidoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  const { items } = parsed.data;
  try {
  const supabase = getSupabaseAdmin();
  // La función SQL documentada acepta un jsonb `items` y usa auth.uid() internamente
  const { data, error } = await supabase.rpc('crear_pedido', { items });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pedido: data });
  } catch (e) {
    next(e);
  }
});

// ==============================
// Centralized Purchase Endpoint
// ==============================
const crearPedidoFullSchema = z.object({
  items: z.array(z.object({ producto_id: z.string().uuid(), cantidad: z.number().int().positive() })).min(1),
  shipping: z
    .object({
      nombre: z.string().min(1),
      direccion: z.string().min(1),
      ciudad: z.string().min(1),
      telefono: z.string().min(5)
    })
    .optional(),
  simulate_payment: z.boolean().optional()
});

// Ejecuta la RPC `crear_pedido` en contexto del usuario (JWT del header) y opcionalmente guarda envío y simula pago
app.post('/rpc/crear_pedido', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = crearPedidoFullSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Falta Authorization Bearer token' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Backend no configurado (SUPABASE_URL / SUPABASE_ANON_KEY)' });
  }

  try {
    // Cliente en contexto del usuario
    const supabaseUser = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Validar sesión
    const { data: userData } = await supabaseUser.auth.getUser();
    const caller = userData?.user;
    if (!caller) return res.status(401).json({ error: 'No autenticado' });

    const { items, shipping, simulate_payment } = parsed.data;

    // Crear pedido: usar RPC backend con user_id explícito para evitar depender de claims del JWT en PostgREST
    const { data: orderId, error: errPedido } = await supabaseUser.rpc('crear_pedido_backend', { p_user_id: caller.id, items });
    if (errPedido) {
      console.warn('[crear_pedido] RPC error', {
        message: errPedido.message,
        code: (errPedido as any).code,
        details: (errPedido as any).details,
        hint: (errPedido as any).hint
      });
      return res.status(400).json({ error: errPedido.message, code: (errPedido as any).code, details: (errPedido as any).details, hint: (errPedido as any).hint });
    }

    // Guardar envío si viene (RPC con user_id explícito)
    if (shipping && orderId) {
      await supabaseUser.rpc('guardar_envio_backend', {
        p_user_id: caller.id,
        p_order_id: orderId,
        p_nombre: shipping.nombre,
        p_direccion: shipping.direccion,
        p_ciudad: shipping.ciudad,
        p_telefono: shipping.telefono
      });
    }

    // Simular pago si se solicitó
    if (simulate_payment && orderId) {
      const admin = getSupabaseAdmin();
      const { error: eUpd } = await admin.from('orders').update({ estado: 'procesando' }).eq('id', orderId);
      if (eUpd) {
        // No bloquear por error de simulación; devolver pedido creado
        console.warn('[crear_pedido simulate] warning', eUpd.message);
      }
    }

    return res.json({ ok: true, order_id: orderId });
  } catch (e) {
    next(e);
  }
});

// ==============================
// Simulated Payments for educational flow
// ==============================
const simulatePaymentSchema = z.object({
  order_id: z.string().uuid(),
  approved: z.boolean(),
});

app.post('/payments/simulate', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = simulatePaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  const { order_id, approved } = parsed.data;
  try {
    const supabase = getSupabaseAdmin();
    const nuevo = approved ? 'procesando' : 'cancelado';
    const { error } = await supabase.from('orders').update({ estado: nuevo }).eq('id', order_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, estado: nuevo });
  } catch (e) { next(e); }
});

// ==============================
// Order state endpoints (centralized, JWT-based)
// ==============================
app.post('/orders/:id/cancel', rateLimit, requireUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await supabaseUser.rpc('pedido_cambiar_estado', { p_order_id: req.params.id, nuevo_estado: 'cancelado' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, estado: data });
  } catch (e) { next(e); }
});

app.post('/orders/:id/delivered', rateLimit, requireUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await supabaseUser.rpc('pedido_cambiar_estado', { p_order_id: req.params.id, nuevo_estado: 'entregado' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, estado: data });
  } catch (e) { next(e); }
});

app.post('/order-items/:id/shipped', rateLimit, requireUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await supabaseUser.rpc('marcar_item_enviado', { p_order_item_id: req.params.id });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, enviado: data });
  } catch (e) { next(e); }
});

// Middleware de error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Ejemplo futuro: app.post('/rpc/crear_pedido', ...)

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[backend-demo] listening on :${port}`);
});
