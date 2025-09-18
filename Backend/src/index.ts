import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const app = express();
// Export para pruebas (supertest) sin necesidad de abrir puerto real
export { app };

// CORS: permitir orígenes del frontend configurados por env FRONTEND_ORIGINS (separados por coma)
// Ej: FRONTEND_ORIGINS="https://<swa>.azurestaticapps.net,https://www.tudominio.com"
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// Agregar localhost:3000 para desarrollo si no está ya en la lista
if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
  if (!allowedOrigins.includes('http://localhost:3000')) {
    allowedOrigins.push('http://localhost:3000');
  }
}

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
    
    // En modo desarrollo, permitir localhost:3000 incluso si no está en la lista
    if (process.env.NODE_ENV !== 'production' && o === 'http://localhost:3000') {
      return callback(null, true);
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

// Consolidated authentication middleware with parameters
const authenticate = (options: { 
  role?: 'admin' | 'vendedor' | 'comprador', 
  vendedorEstado?: 'aprobado',
  allowBlocked?: boolean 
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getUserFromAuthHeader(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });
      
      // Verify role if specified
      if (options.role) {
        const role = (user.app_metadata as any)?.role;
        if (role !== options.role) {
          return res.status(403).json({ 
            error: `No autorizado. Se requiere rol: ${options.role}` 
          });
        }
      }
      
      // Verify user status in database if role validation needed
      if (options.role || options.vendedorEstado) {
        const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: req.headers.authorization! } },
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        const { data: userProfile, error: profileError } = await supabaseUser
          .from('users')
          .select('role, vendedor_estado, bloqueado')
          .eq('id', user.id)
          .single();
          
        if (profileError || !userProfile) {
          return res.status(401).json({ error: 'Perfil de usuario no encontrado' });
        }
        
        // Check if user is blocked unless explicitly allowed
        if (userProfile.bloqueado && !options.allowBlocked) {
          return res.status(403).json({ error: 'Usuario bloqueado' });
        }
        
        // Check vendor status if required
        if (options.vendedorEstado && userProfile.vendedor_estado !== options.vendedorEstado) {
          return res.status(403).json({ 
            error: `Vendedor debe estar ${options.vendedorEstado} para acceder a este recurso` 
          });
        }
      }
      
      (req as any).user = user;
      next();
    } catch (e) { 
      next(e); 
    }
  };
};

// Export specific middleware functions for backward compatibility
const requireUser = authenticate();
const requireAdminJwt = authenticate({ role: 'admin' });
const requireApprovedVendor = authenticate({ role: 'vendedor', vendedorEstado: 'aprobado' });
const requireApprovedBuyer = authenticate({ role: 'comprador' });

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

const setRoleSchema = z.object({ role: z.enum(['admin', 'vendedor', 'comprador']) });
app.post('/admin/users/:id/role', rateLimit, authenticate({ role: 'admin' }), async (req: Request, res: Response, next: NextFunction) => {
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

app.post('/admin/create-user', rateLimit, authenticate({ role: 'admin' }), async (req: Request, res: Response, next: NextFunction) => {
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
  payment: z
    .object({
      metodo: z.enum(['tarjeta', 'contraentrega']),
      // Información de tarjeta simulada (solo para demostración)
      tarjeta: z.object({
        numero: z.string().min(13).max(19),
        nombre: z.string().min(1),
        expiracion: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/), // MM/YY
        cvv: z.string().min(3).max(4)
      }).optional()
    })
    .optional(),
  simulate_payment: z.boolean().optional(),
  is_quick_checkout: z.boolean().optional() // Nuevo campo
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

    // Verificar rol del usuario en la base de datos
    const { data: userProfile, error: profileError } = await supabaseUser
      .from('users')
      .select('role, bloqueado')
      .eq('id', caller.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({ error: 'Perfil de usuario no encontrado' });
    }

    if (userProfile.bloqueado) {
      return res.status(403).json({ error: 'Usuario bloqueado' });
    }

    if (userProfile.role !== 'comprador') {
      return res.status(403).json({ error: 'Solo compradores pueden crear pedidos' });
    }

    const { items, shipping, payment, simulate_payment, is_quick_checkout } = parsed.data;

    // Para checkout rápido, usar perfiles guardados si no se proporcionan
    let shippingData = shipping;
    let paymentData = payment;
    
    if (is_quick_checkout) {
      // Si es checkout rápido pero no se proporcionaron datos, obtener de perfiles guardados
      if (!shippingData) {
        const { data: savedAddresses } = await supabaseUser
          .from('user_address')
          .select('*')
          .eq('user_id', caller.id)
          .eq('tipo', 'envio')
          .eq('es_predeterminada', true)
          .limit(1)
          .maybeSingle();
          
        if (savedAddresses) {
          shippingData = {
            nombre: savedAddresses.nombre,
            direccion: savedAddresses.direccion,
            ciudad: savedAddresses.ciudad,
            telefono: savedAddresses.telefono || ''
          };
        }
      }
      
      if (!paymentData) {
        const { data: savedPayments } = await supabaseUser
          .from('user_payment_profile')
          .select('*')
          .eq('user_id', caller.id)
          .eq('es_predeterminada', true)
          .limit(1)
          .maybeSingle();
          
        if (savedPayments) {
          paymentData = {
            metodo: savedPayments.metodo
          };
        }
      }
    }

    // Validación de datos requeridos
    if (!shippingData) {
      return res.status(400).json({ error: 'Faltan datos de envío' });
    }
    
    if (!paymentData) {
      return res.status(400).json({ error: 'Faltan datos de pago' });
    }

    // Simular validación de tarjeta (solo para demostración)
    if (paymentData?.metodo === 'tarjeta' && paymentData.tarjeta) {
      const { numero, nombre, expiracion, cvv } = paymentData.tarjeta;
      
      // Simulaciones de validación de tarjeta
      console.log('[SIMULACIÓN] Procesando pago con tarjeta:', {
        numero: `****-****-****-${numero.slice(-4)}`,
        nombre,
        expiracion,
        cvv: '***'
      });
      
      // Simular algunos casos de fallo (para demostración)
      if (numero.includes('0000')) {
        return res.status(400).json({ 
          error: 'Tarjeta rechazada: Número inválido (simulado)',
          code: 'CARD_DECLINED'
        });
      }
      
      if (cvv === '000') {
        return res.status(400).json({ 
          error: 'CVV inválido (simulado)',
          code: 'INVALID_CVV'
        });
      }
    }

    // Crear pedido: usar RPC backend con user_id explícito para evitar depender de claims del JWT en PostgREST
    const { data: orderId, error: errPedido } = await supabaseUser.rpc('crear_pedido_backend', { p_user_id: caller.id, items });
    if (errPedido) {
      console.warn('[crear_pedido] RPC error', {
        message: errPedido.message,
        code: (errPedido as any).code,
        details: (errPedido as any).details,
        hint: (errPedido as any).hint,
        user_id: caller.id,
        items_count: items.length
      });
      
      // Determinar mensaje de error más amigable
      let userMessage = errPedido.message;
      if (errPedido.message?.includes('Stock insuficiente')) {
        userMessage = 'Algunos productos no tienen stock suficiente. Por favor, revisa tu carrito.';
      } else if (errPedido.message?.includes('Producto no encontrado')) {
        userMessage = 'Uno o más productos ya no están disponibles.';
      } else if (errPedido.message?.includes('ambiguous')) {
        userMessage = 'Error interno del sistema. Por favor, inténtalo de nuevo.';
      } else if (errPedido.message?.includes('violates foreign key constraint')) {
        userMessage = 'Error de integridad de datos. Por favor, verifica tu carrito.';
      } else if (errPedido.message?.includes('null value in column')) {
        userMessage = 'Datos incompletos. Por favor, verifica tu información de envío.';
      } else if (errPedido.message?.includes('auth')) {
        userMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
      } else if (errPedido.message?.includes('permission')) {
        userMessage = 'No tienes permiso para realizar esta acción.';
      }
      
      return res.status(400).json({ 
        error: userMessage, 
        code: (errPedido as any).code, 
        details: (errPedido as any).details, 
        hint: (errPedido as any).hint 
      });
    }

    // Guardar envío si viene (RPC con user_id explícito)
    if (shippingData && orderId) {
      const { error: envioError } = await supabaseUser.rpc('guardar_envio_backend', {
        p_user_id: caller.id,
        p_order_id: orderId,
        p_nombre: shippingData.nombre,
        p_direccion: shippingData.direccion,
        p_ciudad: shippingData.ciudad,
        p_telefono: shippingData.telefono
      });
      
      // Log error de envío pero no detener el proceso
      if (envioError) {
        console.warn('[crear_pedido] Error guardando envío:', envioError);
      }
    }

    // Guardar información de pago simulada (solo para registro)
    if (paymentData && orderId) {
      const admin = getSupabaseAdmin();
      
      // Crear registro de pago simulado en la tabla order_payments
      const paymentRecord = {
        order_id: orderId,
        metodo: paymentData.metodo,
        estado: 'simulado',
        ...(paymentData.metodo === 'tarjeta' && paymentData.tarjeta && {
          // Solo guardar últimos 4 dígitos y datos no sensibles
          last4: paymentData.tarjeta.numero.slice(-4),
          nombre_tarjeta: paymentData.tarjeta.nombre,
          exp_mm: parseInt(paymentData.tarjeta.expiracion.split('/')[0]),
          exp_yy: parseInt(paymentData.tarjeta.expiracion.split('/')[1])
        })
      };
      
      try {
        const { error: paymentInsertError } = await admin.from('order_payments').insert(paymentRecord);
        if (paymentInsertError) {
          console.warn('[crear_pedido] No se pudo guardar info de pago:', paymentInsertError);
        }
      } catch (paymentError) {
        console.warn('[crear_pedido] Error al guardar info de pago:', paymentError);
        // No bloquear la creación del pedido por este error
      }
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
    
    // Verificar que el pedido exista
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, estado')
      .eq('id', order_id)
      .single();
      
    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Verificar que el pedido esté en estado válido para simulación
    if (order.estado !== 'pendiente' && order.estado !== 'procesando') {
      return res.status(400).json({ error: 'El pedido no está en un estado válido para simulación de pago' });
    }
    
    const nuevoEstado = approved ? 'procesando' : 'cancelado';
    const { error } = await supabase.from('orders').update({ estado: nuevoEstado }).eq('id', order_id);
    if (error) return res.status(500).json({ error: error.message });
    
    // Si el pago es aprobado, actualizar también el estado del pago
    if (approved) {
      const { error: paymentError } = await supabase
        .from('order_payments')
        .update({ estado: 'procesado' })
        .eq('order_id', order_id);
        
      if (paymentError) {
        console.warn('[simulate_payment] No se pudo actualizar el estado del pago:', paymentError);
      }
    }
    
    res.json({ ok: true, estado: nuevoEstado });
  } catch (e) { next(e); }
});

// ==============================
// Order state endpoints (centralized, JWT-based)
// ==============================
app.post('/orders/:id/cancel', rateLimit, authenticate(), async (req: Request, res: Response, next: NextFunction) => {
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

app.post('/orders/:id/delivered', rateLimit, authenticate(), async (req: Request, res: Response, next: NextFunction) => {
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

app.post('/order-items/:id/shipped', rateLimit, authenticate(), async (req: Request, res: Response, next: NextFunction) => {
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

// ==============================
// Product Management for Vendors
// ==============================

const crearProductoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precio: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoria_id: z.string().uuid().optional(),
  imagen_url: z.string().url().optional()
});

// Create product (vendors only)
app.post('/productos', rateLimit, authenticate({ role: 'vendedor', vendedorEstado: 'aprobado' }), async (req: Request, res: Response, next: NextFunction) => {
  const parsed = crearProductoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  
  try {
    const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = parsed.data;
    const user = (req as any).user;
    
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('productos')
      .insert({
        vendedor_id: user.id,
        nombre,
        descripcion,
        precio,
        stock,
        categoria_id,
        imagen_url,
        estado: 'activo'
      })
      .select()
      .single();
      
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// Update product endpoint with stock monitoring
app.put('/productos/:id', rateLimit, authenticate({ role: 'vendedor', vendedorEstado: 'aprobado' }), async (req: Request, res: Response, next: NextFunction) => {
  const parsed = crearProductoSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  
  try {
    const user = (req as any).user;
    const productoId = req.params.id;
    
    // Verify the product belongs to this vendor
    const supabase = getSupabaseAdmin();
    const { data: existingProduct, error: fetchError } = await supabase
      .from('productos')
      .select('id, vendedor_id, stock')
      .eq('id', productoId)
      .single();
      
    if (fetchError || !existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    if (existingProduct.vendedor_id !== user.id) {
      return res.status(403).json({ error: 'No autorizado para modificar este producto' });
    }
    
    // Check if stock is being updated and if it's below threshold
    if (parsed.data.stock !== undefined && parsed.data.stock < existingProduct.stock) {
      // Stock decreased, check if it's below threshold
      const threshold = 5; // Default threshold, could be configurable per vendor
      if (parsed.data.stock <= threshold) {
        // Trigger low stock notification
        try {
          const projectRef = new URL(process.env.SUPABASE_URL!).host.split('.')[0];
          await fetch(`https://${projectRef}.functions.supabase.co/notify-low-stock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` // Use service role key for internal calls
            },
            body: JSON.stringify({
              producto_id: productoId,
              stock_actual: parsed.data.stock,
              umbral: threshold
            })
          }).catch(() => {}); // Ignore notification errors
        } catch (e) {
          console.warn('Failed to notify low stock:', e);
        }
      }
    }
    
    const { data, error } = await supabase
      .from('productos')
      .update(parsed.data)
      .eq('id', productoId)
      .select()
      .single();
      
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) { next(e); }
});

// Endpoint para actualizar usuarios (requiere admin)
const updateUserSchema = z.object({
  vendedor_estado: z.enum(['pendiente', 'aprobado', 'rechazado']).optional(),
  bloqueado: z.boolean().optional(),
  role: z.enum(['admin', 'vendedor', 'comprador']).optional()
}).strict();

app.put('/users/:id', rateLimit, authenticate({ role: 'admin' }), async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  const parsed = updateUserSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Payload inválido', 
      detail: parsed.error.flatten() 
    });
  }
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Actualizar el usuario
    const { data, error } = await supabase
      .from('users')
      .update(parsed.data)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Si se cambia el rol, también actualizar app_metadata
    if (parsed.data.role) {
      await supabase.auth.admin.updateUserById(userId, { 
        app_metadata: { role: parsed.data.role } 
      });
    }
    
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// ==============================
// Evaluation / Review System
// ==============================

const createEvaluationSchema = z.object({
  order_item_id: z.string().uuid(),
  puntuacion: z.number().int().min(1).max(5),
  comentario: z.string().optional()
});

// Create evaluation (buyers only)
app.post('/evaluaciones', rateLimit, authenticate({ role: 'comprador' }), async (req: Request, res: Response, next: NextFunction) => {
  const parsed = createEvaluationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
  
  try {
    const { order_item_id, puntuacion, comentario } = parsed.data;
    const user = (req as any).user;
    
    const supabase = getSupabaseAdmin();
    
    // Verify the order item belongs to this buyer and is delivered
    const { data: orderItem, error: fetchError } = await supabase
      .from('order_items')
      .select('id, order_id, producto_id')
      .eq('id', order_item_id)
      .single();
      
    if (fetchError || !orderItem) {
      return res.status(404).json({ error: 'Ítem de pedido no encontrado' });
    }
    
    // Verify the order belongs to this buyer and is delivered
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, comprador_id, estado')
      .eq('id', orderItem.order_id)
      .eq('comprador_id', user.id)
      .eq('estado', 'entregado')
      .single();
      
    if (orderError || !order) {
      return res.status(403).json({ error: 'No autorizado para evaluar este ítem' });
    }
    
    // Check if evaluation already exists
    const { data: existingEvaluation } = await supabase
      .from('evaluaciones')
      .select('id')
      .eq('comprador_id', user.id)
      .eq('order_item_id', order_item_id)
      .maybeSingle();
      
    if (existingEvaluation) {
      return res.status(400).json({ error: 'Ya has evaluado este ítem' });
    }
    
    // Create evaluation
    const { data, error } = await supabase
      .from('evaluaciones')
      .insert({
        comprador_id: user.id,
        producto_id: orderItem.producto_id,
        order_item_id,
        puntuacion,
        comentario: comentario || null
      })
      .select()
      .single();
      
    if (error) return res.status(500).json({ error: error.message });
    
    // Trigger notification to vendor
    try {
      const projectRef = new URL(process.env.SUPABASE_URL!).host.split('.')[0];
      await fetch(`https://${projectRef}.functions.supabase.co/notify-evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization!
        },
        body: JSON.stringify({
          producto_id: orderItem.producto_id,
          puntuacion,
          comentario
        })
      }).catch(() => {}); // Ignore notification errors
    } catch (e) {
      console.warn('Failed to notify vendor of new evaluation:', e);
    }
    
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// Get product evaluations (public endpoint)
app.get('/productos/:id/evaluaciones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productoId = req.params.id;
    
    const supabase = getSupabaseAdmin();
    
    // Get evaluations with buyer information (only name, not email)
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`
        id,
        puntuacion,
        comentario,
        created_at,
        users!evaluaciones_comprador_id_fkey (
          nombre_completo
        )
      `)
      .eq('producto_id', productoId)
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    
    // Transform data to hide sensitive information
    const evaluations = data.map(e => ({
      id: e.id,
      puntuacion: e.puntuacion,
      comentario: e.comentario,
      created_at: e.created_at,
      comprador_nombre: e.users && e.users.length > 0 ? e.users[0].nombre_completo || 'Comprador' : 'Comprador'
    }));
    
    res.json(evaluations);
  } catch (e) { next(e); }
});

// Get vendor average rating
app.get('/vendedores/:id/calificacion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendedorId = req.params.id;
    
    const supabase = getSupabaseAdmin();
    
    // Get average rating for all products from this vendor
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('puntuacion')
      .eq('productos.vendedor_id', vendedorId);
      
    if (error) return res.status(500).json({ error: error.message });
    
    if (data.length === 0) {
      return res.json({ promedio: 0, total: 0 });
    }
    
    const total = data.length;
    const suma = data.reduce((acc, e) => acc + e.puntuacion, 0);
    const promedio = Math.round((suma / total) * 100) / 100; // Round to 2 decimals
    
    res.json({ promedio, total });
  } catch (e) { next(e); }
});

// ==============================
// Sales Reports Endpoints
// ==============================

// Get vendor sales report
app.get('/reportes/ventas/vendedor', rateLimit, authenticate({ role: 'vendedor', vendedorEstado: 'aprobado' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { periodo } = req.query; // 'dia', 'semana', 'mes', 'anio'
    
    const supabase = getSupabaseAdmin();
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (periodo) {
      case 'dia':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'semana':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'mes':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'anio':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to last month
    }
    
    // Get sales data
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        cantidad,
        precio_unitario,
        subtotal,
        created_at,
        orders!inner(estado),
        productos(nombre)
      `)
      .eq('vendedor_id', user.id)
      .eq('orders.estado', 'entregado')
      .gte('created_at', startDate.toISOString());
      
    if (error) return res.status(500).json({ error: error.message });
    
    // Calculate summary statistics
    const totalVentas = data.reduce((sum, item) => sum + item.subtotal, 0);
    const totalProductos = data.reduce((sum, item) => sum + item.cantidad, 0);
    const productosVendidos = [...new Set(data.map(item => 
      item.productos && item.productos.length > 0 ? item.productos[0].nombre : null
    ).filter(nombre => nombre !== null))].length;
    
    // Group by date for chart data
    const ventasPorDia: Record<string, { ventas: number; productos: number }> = {};
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!ventasPorDia[date]) {
        ventasPorDia[date] = { ventas: 0, productos: 0 };
      }
      ventasPorDia[date].ventas += item.subtotal;
      ventasPorDia[date].productos += item.cantidad;
    });
    
    res.json({
      resumen: {
        total_ventas: totalVentas,
        total_productos: totalProductos,
        productos_unicos: productosVendidos,
        periodo: {
          inicio: startDate.toISOString(),
          fin: new Date().toISOString()
        }
      },
      ventas_por_dia: ventasPorDia,
      detalles: data.map(item => ({
        producto: item.productos && item.productos.length > 0 ? item.productos[0].nombre : 'Producto desconocido',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        fecha: item.created_at
      }))
    });
  } catch (e) { next(e); }
});

// Get top selling products report
app.get('/reportes/productos/top', rateLimit, authenticate({ role: 'admin' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limite = 10 } = req.query;
    
    const supabase = getSupabaseAdmin();
    
    // Get top selling products
    const { data, error } = await supabase.rpc('top_productos_por_ventas', { limite: parseInt(limite as string) || 10 });
      
    if (error) return res.status(500).json({ error: error.message });
    
    res.json(data);
  } catch (e) { next(e); }
});

// Get vendor trends report
app.get('/reportes/tendencias/vendedor/:id', rateLimit, authenticate({ role: 'admin' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendedorId = req.params.id;
    
    const supabase = getSupabaseAdmin();
    
    // Get vendor information
    const { data: vendor, error: vendorError } = await supabase
      .from('users')
      .select('id, email, nombre_completo')
      .eq('id', vendedorId)
      .single();
      
    if (vendorError) return res.status(404).json({ error: 'Vendedor no encontrado' });
    
    // Get monthly sales data for the last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }
    
    const monthlyData = [];
    for (const month of months) {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select('subtotal, cantidad')
        .eq('vendedor_id', vendedorId)
        .eq('orders.estado', 'entregado')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());
      
      if (!salesError && salesData) {
        const totalVentas = salesData.reduce((sum, item) => sum + item.subtotal, 0);
        const totalProductos = salesData.reduce((sum, item) => sum + item.cantidad, 0);
        
        monthlyData.push({
          mes: month.toISOString().slice(0, 7), // YYYY-MM
          total_ventas: totalVentas,
          total_productos: totalProductos
        });
      }
    }
    
    res.json({
      vendedor: {
        id: vendor.id,
        email: vendor.email,
        nombre: vendor.nombre_completo
      },
      tendencias_mensuales: monthlyData
    });
  } catch (e) { next(e); }
});

// =========================================================
// DEV ONLY helper: seed or ensure an admin user (password reset)
// Guarded by header X-Dev-Secret == process.env.DEV_SEED_SECRET and NODE_ENV!=='production'
// =========================================================
if (process.env.NODE_ENV !== 'production') {
  app.post('/dev/ensure-admin', async (req: Request, res: Response) => {
    const provided = req.headers['x-dev-secret'];
    if (!process.env.DEV_SEED_SECRET || provided !== process.env.DEV_SEED_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Payload inválido', detail: parsed.error.flatten() });
    const { email, password } = parsed.data;
    try {
      const supabase = getSupabaseAdmin();

      // Intentar encontrar en tabla pública users primero
      let userId: string | null = null;
      const { data: existingProfile } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existingProfile?.id) userId = existingProfile.id;

      // Si no tenemos id, intentar enumerar usuarios auth (limit 100) para localizar email
      if (!userId) {
        try {
          // @ts-ignore supabase-js admin listUsers
            const { data: list } = await (supabase as any).auth.admin.listUsers({ page: 1, perPage: 100 });
            const found = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            if (found) userId = found.id;
        } catch (e) {
          // ignorar
        }
      }

      if (!userId) {
        // Crear usuario nuevo
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'admin' }
        } as any);
        if (createErr) return res.status(500).json({ error: createErr.message });
        userId = created?.user?.id || null;
        if (!userId) return res.status(500).json({ error: 'No se obtuvo user.id tras creación' });
        // Perfil público
        await supabase.from('users').upsert({ id: userId, email, role: 'admin' }, { onConflict: 'id' });
      } else {
        // Actualizar password y role
        await supabase.auth.admin.updateUserById(userId, { password, app_metadata: { role: 'admin' } });
        await supabase.from('users').upsert({ id: userId, email, role: 'admin' }, { onConflict: 'id' });
      }
      return res.json({ ok: true, user_id: userId, email });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Error inesperado' });
    }
  });

  // List limited products (debug)
  app.get('/dev/debug/products', async (_req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('products').select('id,nombre,estado,stock').limit(20);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, products: data });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'error' });
    }
  });

  // List recent orders (debug)
  app.get('/dev/debug/orders', async (_req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('orders').select('id,estado,created_at,total').order('created_at', { ascending: false }).limit(10);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, orders: data });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'error' });
    }
  });
}

// Middleware de error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Ejemplo futuro: app.post('/rpc/crear_pedido', ...)

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '127.0.0.1';
try {
  const server = app.listen(port, host, () => {
    const addr = server.address();
    console.log(`[backend-demo] listening on ${typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`}`);
  });
  server.on('error', (err) => {
    console.error('[backend-demo] server error binding port', err);
  });
} catch (e) {
  console.error('[backend-demo] immediate listen error', e);
}


