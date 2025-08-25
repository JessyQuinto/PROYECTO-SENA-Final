import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import { z } from 'zod';
const app = express();
// ==============================
// PERFORMANCE MIDDLEWARE - OPTIMIZED
// ==============================
// Compression middleware - Gzip/Brotli support
app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
        // Don't compress if user explicitly asks not to
        if (req.headers['x-no-compression'])
            return false;
        // Compress text-based responses
        const contentType = res.getHeader('content-type');
        if (typeof contentType === 'string') {
            return /json|text|javascript|css|xml|svg/.test(contentType);
        }
        return compression.filter(req, res);
    },
}));
// Security headers with performance optimizations
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
}));
// Enhanced CORS with performance optimizations
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
const originMatchers = allowedOrigins.map((o) => {
    if (o === '*')
        return { type: 'any' };
    if (o.includes('*')) {
        const pattern = o
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*');
        return { type: 'regex', re: new RegExp(`^${pattern}$`, 'i') };
    }
    return { type: 'exact', value: o.toLowerCase() };
});
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const o = origin.toLowerCase();
        for (const m of originMatchers) {
            if (m.type === 'any')
                return callback(null, true);
            if (m.type === 'exact' && m.value === o)
                return callback(null, true);
            if (m.type === 'regex' && m.re.test(o))
                return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours for preflight cache
    credentials: true,
};
app.use(cors(corsOptions));
// Optimized logging for production
app.use(morgan('combined', {
    skip: (req) => {
        // Skip logging for health checks and static assets
        return req.url === '/health' || req.url.startsWith('/static');
    },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ==============================
// CACHING MIDDLEWARE - NEW
// ==============================
// In-memory cache for API responses
const apiCache = new Map();
const createCacheMiddleware = (ttlSeconds) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET')
            return next();
        const cacheKey = `${req.originalUrl}`;
        const cached = apiCache.get(cacheKey);
        const now = Date.now();
        // Return cached response if valid
        if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
            res.set('X-Cache', 'HIT');
            res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
            return res.json(cached.data);
        }
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
            // Cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                apiCache.set(cacheKey, {
                    data,
                    timestamp: now,
                    ttl: ttlSeconds,
                });
                // Clean up old cache entries (simple LRU)
                if (apiCache.size > 1000) {
                    const entries = Array.from(apiCache.entries());
                    const expired = entries.filter(([_, value]) => (now - value.timestamp) >= (value.ttl * 1000));
                    expired.forEach(([key]) => apiCache.delete(key));
                }
            }
            res.set('X-Cache', 'MISS');
            res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
            return originalJson.call(this, data);
        };
        next();
    };
};
// Performance headers middleware
app.use((req, res, next) => {
    // Enable keep-alive connections
    res.set('Connection', 'keep-alive');
    res.set('Keep-Alive', 'timeout=30, max=1000');
    // Security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Performance headers
    res.set('X-DNS-Prefetch-Control', 'on');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');
    next();
});
const RATE_WINDOW_MS = 60000; // 1 minute
const RATE_MAX_REQUESTS = 100; // Increased from 30
const RATE_BLOCK_DURATION = 300000; // 5 minutes block for abuse
const rateStore = new Map();
// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, limit] of rateStore.entries()) {
        if (limit.resetAt <= now && !limit.blocked) {
            rateStore.delete(ip);
        }
    }
}, 300000);
const rateLimit = (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket.remoteAddress || 'localhost';
    const now = Date.now();
    let record = rateStore.get(ip);
    if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + RATE_WINDOW_MS, blocked: false };
        rateStore.set(ip, record);
    }
    else {
        record.count += 1;
        if (record.count > RATE_MAX_REQUESTS && !record.blocked) {
            record.blocked = true;
            record.resetAt = now + RATE_BLOCK_DURATION;
            res.set('Retry-After', String(Math.ceil(RATE_BLOCK_DURATION / 1000)));
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(RATE_BLOCK_DURATION / 1000),
            });
        }
        if (record.blocked && record.resetAt > now) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                error: 'IP temporarily blocked due to excessive requests.',
                retryAfter,
            });
        }
    }
    // Add rate limit headers
    res.set('X-RateLimit-Limit', String(RATE_MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_MAX_REQUESTS - record.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
    next();
};
// ==============================
// ROUTES WITH CACHING
// ==============================
// Health check (no cache)
app.get('/', (_req, res) => {
    res.redirect('/health');
});
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        service: 'backend-demo',
        ts: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});
// API endpoints with caching
// Categories - cache for 1 hour (3600 seconds)
app.get('/api/categories', createCacheMiddleware(3600), async (_req, res) => {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Products - cache for 5 minutes (300 seconds)
app.get('/api/products', createCacheMiddleware(300), async (req, res) => {
    try {
        const { category, search, limit = '20', offset = '0' } = req.query;
        const supabase = getSupabaseAdmin();
        let query = supabase
            .from('productos')
            .select(`
        id,
        nombre,
        precio,
        stock,
        imagen_url,
        created_at,
        categorias(nombre)
      `)
            .eq('estado', 'activo')
            .gt('stock', 0);
        if (category) {
            query = query.eq('categoria_id', category);
        }
        if (search) {
            query = query.ilike('nombre', `%${search}%`);
        }
        query = query
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        const { data, error } = await query;
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// ==============================
// EXISTING AUTH AND ORDER LOGIC (unchanged)
// ==============================
const postSignupSchema = z.object({
    user_id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['comprador', 'vendedor', 'admin']).default('comprador'),
    nombre: z.string().min(1).optional()
});
// Apply rate limiting to auth endpoints
app.post('/auth/post-signup', rateLimit, async (req, res, next) => {
    const parsed = postSignupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Payload inválido',
            detail: parsed.error.flatten()
        });
    }
    const { user_id, email, role, nombre } = parsed.data;
    try {
        const supabase = getSupabaseAdmin();
        const { error: upsertErr } = await supabase
            .from('users')
            .upsert({
            id: user_id,
            email,
            role,
            nombre_completo: typeof nombre === 'string' && nombre.trim().length > 0 ? nombre.trim() : undefined
        }, { onConflict: 'id' });
        if (upsertErr) {
            console.error('[post-signup] upsert users error', upsertErr);
            return res.status(500).json({ error: upsertErr.message });
        }
        try {
            const { error: adminErr } = await supabase.auth.admin.updateUserById(user_id, {
                app_metadata: { role }
            });
            if (adminErr) {
                console.warn('[post-signup] updateUserById warning', adminErr.message);
            }
        }
        catch (e) {
            console.warn('[post-signup] updateUserById not available or failed', e?.message || e);
        }
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// ==============================
// ERROR HANDLING
// ==============================
// Enhanced error middleware
app.use((err, req, res, _next) => {
    console.error('Unhandled Error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack }),
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
    });
});
// ==============================
// SERVER STARTUP WITH OPTIMIZATIONS
// ==============================
const port = process.env.PORT || 4000;
// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
app.listen(port, () => {
    console.log(`🚀 [backend-optimized] listening on :${port}`);
    console.log(`📊 Memory usage:`, process.memoryUsage());
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
