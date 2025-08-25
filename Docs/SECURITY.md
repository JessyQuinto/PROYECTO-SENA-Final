# Guía de Seguridad - Tesoros Chocó

## 🛡️ Visión General de Seguridad

**Tesoros Chocó** implementa un modelo de seguridad robusto basado en principios de **defensa en profundidad**, **mínimo privilegio** y **seguridad por diseño**. El sistema está diseñado para proteger tanto a los usuarios como a la plataforma contra amenazas comunes y ataques sofisticados.

## 🔐 Modelo de Autenticación y Autorización

### 1. Sistema de Autenticación

#### JWT (JSON Web Tokens)
**Estructura del Token**:
```typescript
interface JWTPayload {
  sub: string;           // Subject (User ID)
  email: string;         // User email
  role: UserRole;        // User role (comprador, vendedor, admin)
  exp: number;           // Expiration timestamp
  iat: number;           // Issued at timestamp
  jti: string;           // JWT ID (unique identifier)
}
```

**Configuración de Seguridad**:
```typescript
// Configuración de JWT en Supabase
const jwtConfig = {
  expiresIn: '24h',                    // Expiración del token
  refreshTokenExpiry: '7d',            // Expiración del refresh token
  algorithm: 'HS256',                  // Algoritmo de firma
  issuer: 'tesoros-choco',            // Emisor del token
  audience: 'tesoros-choco-users'      // Audiencia del token
};
```

#### Flujo de Autenticación
```
1. Usuario ingresa credenciales
2. Supabase valida credenciales
3. Se genera JWT con claims de rol
4. Token se almacena en AuthContext
5. Token se envía en headers de requests
6. Middleware valida token en cada request
```

### 2. Sistema de Roles y Permisos

#### Roles del Sistema
```typescript
enum UserRole {
  COMPRADOR = 'comprador',
  VENDEDOR = 'vendedor',
  ADMIN = 'admin'
}

interface RolePermissions {
  comprador: {
    canViewProducts: true;
    canAddToCart: true;
    canPlaceOrders: true;
    canReviewProducts: true;
    canViewOwnOrders: true;
    canEditProfile: true;
  };
  vendedor: {
    canCreateProducts: true;
    canEditOwnProducts: true;
    canViewOwnOrders: true;
    canUpdateOrderStatus: true;
    canViewAnalytics: true;
    canEditProfile: true;
  };
  admin: {
    canManageUsers: true;
    canApproveVendors: true;
    canModerateContent: true;
    canViewSystemMetrics: true;
    canManageCategories: true;
    canAccessAuditLogs: true;
  };
}
```

#### Validación de Roles
```typescript
// Middleware de validación de roles
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        details: {
          requiredRoles: allowedRoles,
          userRole: userRole
        }
      });
    }
    
    next();
  };
};

// Uso en endpoints
app.post('/api/products', 
  authenticateToken, 
  requireRole(['vendedor', 'admin']), 
  createProduct
);
```

## 🚪 Control de Acceso

### 1. Row Level Security (RLS)

#### Políticas de Base de Datos
```sql
-- Política para tabla users
CREATE POLICY "Users can only see their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Política para tabla productos
CREATE POLICY "Vendors can only manage their own products" ON productos
  FOR ALL USING (
    auth.uid() = vendedor_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Política para tabla pedidos
CREATE POLICY "Users can only see their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = comprador_id OR
    EXISTS (
      SELECT 1 FROM productos p 
      WHERE p.id IN (
        SELECT producto_id FROM order_items oi 
        WHERE oi.order_id = orders.id
      ) AND p.vendedor_id = auth.uid()
    )
  );
```

#### Implementación de RLS
```typescript
// Habilitar RLS en todas las tablas sensibles
const enableRLS = async (supabase: SupabaseClient) => {
  const tables = ['users', 'productos', 'orders', 'order_items', 'evaluaciones'];
  
  for (const table of tables) {
    await supabase.rpc('enable_rls', { table_name: table });
  }
};

// Verificar políticas activas
const checkRLSPolicies = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('information_schema.policies')
    .select('*')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('Error checking RLS policies:', error);
    return false;
  }
  
  return data.length > 0;
};
```

### 2. Middleware de Seguridad

#### CORS (Cross-Origin Resource Sharing)
```typescript
// Configuración de CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'https://tesoroschoco.com',
      'https://www.tesoroschoco.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600 // 10 minutos
};

app.use(cors(corsOptions));
```

#### Headers de Seguridad
```typescript
// Middleware de headers de seguridad
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevención de ataques XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevención de MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevención de clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Política de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'"
  ].join('; '));
  
  // Cache control para datos sensibles
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
});
```

## 🔒 Validación y Sanitización

### 1. Validación de Entrada

#### Esquemas de Validación con Zod
```typescript
// Esquemas de validación para diferentes entidades
const userSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email muy corto')
    .max(100, 'Email muy largo'),
  role: z.enum(['comprador', 'vendedor', 'admin'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  nombre_completo: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre contiene caracteres inválidos')
});

const productSchema = z.object({
  nombre: z.string()
    .min(3, 'Nombre del producto muy corto')
    .max(200, 'Nombre del producto muy largo')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,]+$/, 'Nombre contiene caracteres inválidos'),
  descripcion: z.string()
    .min(10, 'Descripción muy corta')
    .max(2000, 'Descripción muy larga'),
  precio: z.number()
    .positive('Precio debe ser positivo')
    .max(1000000, 'Precio muy alto'),
  stock: z.number()
    .int('Stock debe ser un número entero')
    .min(0, 'Stock no puede ser negativo')
    .max(10000, 'Stock muy alto'),
  categoria_id: z.string()
    .uuid('ID de categoría inválido')
});

// Validación en endpoints
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const validation = userSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validation.error.flatten()
      });
    }
    
    const userData = validation.data;
    // Procesar datos validados...
    
  } catch (error) {
    console.error('Error processing user creation:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});
```

### 2. Sanitización de Datos

#### Sanitización de HTML
```typescript
import DOMPurify from 'dompurify';

// Sanitización de contenido HTML
const sanitizeHTML = (dirtyHTML: string): string => {
  return DOMPurify.sanitize(dirtyHTML, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
};

// Sanitización de inputs de texto
const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
};
```

#### Sanitización de URLs
```typescript
// Validación y sanitización de URLs
const sanitizeURL = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    
    // Solo permitir URLs HTTPS
    if (parsed.protocol !== 'https:') {
      return null;
    }
    
    // Verificar dominio permitido
    const allowedDomains = [
      'tesoroschoco.com',
      'supabase.co',
      'cloudinary.com'
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      parsed.hostname.endsWith(domain)
    );
    
    if (!isAllowed) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
};
```

## 🚫 Prevención de Ataques

### 1. SQL Injection

#### Uso de Parámetros Preparados
```typescript
// ❌ VULNERABLE - Concatenación de strings
const vulnerableQuery = `
  SELECT * FROM productos 
  WHERE nombre LIKE '%${searchTerm}%'
`;

// ✅ SEGURO - Parámetros preparados
const safeQuery = `
  SELECT * FROM productos 
  WHERE nombre LIKE $1
`;
const { data, error } = await supabase
  .from('productos')
  .select('*')
  .ilike('nombre', `%${searchTerm}%`);
```

#### Validación de Entrada
```typescript
// Validación de parámetros de búsqueda
const searchSchema = z.object({
  q: z.string()
    .min(1, 'Término de búsqueda requerido')
    .max(100, 'Término de búsqueda muy largo')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/, 'Término contiene caracteres inválidos'),
  page: z.number()
    .int('Página debe ser un número entero')
    .min(1, 'Página debe ser mayor a 0'),
  limit: z.number()
    .int('Límite debe ser un número entero')
    .min(1, 'Límite debe ser mayor a 0')
    .max(100, 'Límite máximo es 100')
});
```

### 2. XSS (Cross-Site Scripting)

#### Sanitización de Output
```typescript
// Componente React con sanitización
import DOMPurify from 'dompurify';

interface ProductDescriptionProps {
  description: string;
}

export const ProductDescription: React.FC<ProductDescriptionProps> = ({ description }) => {
  const sanitizedDescription = DOMPurify.sanitize(description);
  
  return (
    <div 
      className="product-description"
      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
    />
  );
};

// Alternativa más segura - Renderizado de texto plano
export const SafeProductDescription: React.FC<ProductDescriptionProps> = ({ description }) => {
  return (
    <div className="product-description">
      {description}
    </div>
  );
};
```

#### Headers de Seguridad
```typescript
// Content Security Policy estricto
const strictCSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join('; ');

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', strictCSP);
  next();
});
```

### 3. CSRF (Cross-Site Request Forgery)

#### Tokens CSRF
```typescript
// Generación de tokens CSRF
import crypto from 'crypto';

const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware de validación CSRF
const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Token CSRF inválido'
    });
  }
  
  next();
};

// Uso en endpoints sensibles
app.post('/api/orders', validateCSRFToken, createOrder);
```

### 4. Rate Limiting

#### Implementación de Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiting por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    error: 'Demasiadas requests desde esta IP',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación',
    retryAfter: '15 minutos'
  },
  skipSuccessfulRequests: true
});

// Rate limiting para creación de productos
const productCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 productos por hora
  message: {
    success: false,
    error: 'Límite de creación de productos alcanzado',
    retryAfter: '1 hora'
  }
});

// Aplicar limiters
app.use('/api/', generalLimiter);
app.use('/auth/', authLimiter);
app.use('/api/products', productCreationLimiter);
```

## 🔍 Auditoría y Logging

### 1. Logs de Seguridad

#### Estructura de Logs
```typescript
interface SecurityLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  requestPath: string;
  requestMethod: string;
  details: Record<string, any>;
}

// Logger de seguridad
const securityLogger = {
  info: (event: string, details: Record<string, any>, req: Request) => {
    const log: SecurityLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      userId: req.user?.id,
      userRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      requestPath: req.path,
      requestMethod: req.method,
      details
    };
    
    console.log(JSON.stringify(log));
  },
  
  warn: (event: string, details: Record<string, any>, req: Request) => {
    // Similar a info pero con level 'warn'
  },
  
  error: (event: string, details: Record<string, any>, req: Request) => {
    // Similar a info pero con level 'error'
  }
};
```

#### Eventos de Seguridad a Registrar
```typescript
// Eventos críticos de seguridad
const SECURITY_EVENTS = {
  // Autenticación
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // Autorización
  ACCESS_DENIED: 'access_denied',
  ROLE_CHANGE: 'role_change',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_REVOKED: 'permission_revoked',
  
  // Datos sensibles
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  DATA_DELETION: 'data_deletion',
  
  // Amenazas
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt'
};

// Uso en middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Log de acceso
  securityLogger.info('api_access', {
    endpoint: req.path,
    method: req.method,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  }, req);
  
  next();
});
```

### 2. Monitoreo de Amenazas

#### Detección de Actividad Sospechosa
```typescript
// Middleware de detección de amenazas
const threatDetection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;
  
  // Detectar patrones sospechosos
  const suspiciousPatterns = [
    /<script/i,           // Script tags
    /javascript:/i,        // JavaScript protocol
    /union\s+select/i,     // SQL injection
    /eval\s*\(/i,          // Eval function
    /on\w+\s*=/i           // Event handlers
  ];
  
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(body) || pattern.test(query) || pattern.test(userAgent)) {
      securityLogger.error('suspicious_activity', {
        pattern: pattern.source,
        body,
        query,
        userAgent,
        ip
      }, req);
      
      return res.status(400).json({
        success: false,
        error: 'Actividad sospechosa detectada'
      });
    }
  }
  
  next();
};

// Aplicar en endpoints sensibles
app.use('/api/', threatDetection);
```

## 🔐 Gestión de Secretos

### 1. Variables de Entorno

#### Configuración Segura
```bash
# .env.example (NO incluir valores reales)
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGINS=http://localhost:3000,https://tesoroschoco.com
SESSION_SECRET=your-session-secret
```

#### Validación de Variables de Entorno
```typescript
// Validación de variables de entorno requeridas
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'SESSION_SECRET'
];

const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }
  
  // Validar formatos
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    throw new Error('SUPABASE_URL debe usar HTTPS');
  }
  
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('PORT debe ser un número válido entre 1 y 65535');
    }
  }
};

// Ejecutar validación al inicio
validateEnvironment();
```

### 2. Rotación de Secretos

#### Estrategia de Rotación
```typescript
// Configuración de rotación de secretos
const secretRotationConfig = {
  jwt: {
    currentSecret: process.env.JWT_SECRET!,
    previousSecret: process.env.JWT_PREVIOUS_SECRET,
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 días
    lastRotation: process.env.JWT_LAST_ROTATION
  },
  session: {
    currentSecret: process.env.SESSION_SECRET!,
    previousSecret: process.env.SESSION_PREVIOUS_SECRET,
    rotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 días
    lastRotation: process.env.SESSION_LAST_ROTATION
  }
};

// Función de rotación
const rotateSecrets = async (): Promise<void> => {
  const now = Date.now();
  
  // Rotar JWT secret si es necesario
  if (shouldRotateSecret('jwt', now)) {
    await rotateJWTSecret();
  }
  
  // Rotar session secret si es necesario
  if (shouldRotateSecret('session', now)) {
    await rotateSessionSecret();
  }
};

// Verificar si debe rotar un secreto
const shouldRotateSecret = (type: 'jwt' | 'session', now: number): boolean => {
  const config = secretRotationConfig[type];
  const lastRotation = parseInt(config.lastRotation || '0');
  
  return (now - lastRotation) >= config.rotationInterval;
};
```

## 🚨 Respuesta a Incidentes

### 1. Plan de Respuesta

#### Niveles de Incidente
```typescript
enum IncidentLevel {
  LOW = 'low',           // Información general
  MEDIUM = 'medium',     // Advertencia
  HIGH = 'high',         // Error crítico
  CRITICAL = 'critical'  // Emergencia
}

interface SecurityIncident {
  id: string;
  level: IncidentLevel;
  type: string;
  description: string;
  timestamp: string;
  affectedUsers: string[];
  affectedSystems: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  actions: string[];
  assignee?: string;
}
```

#### Procedimientos de Respuesta
```typescript
// Procedimientos por nivel de incidente
const incidentProcedures = {
  [IncidentLevel.LOW]: {
    responseTime: '24 hours',
    actions: ['Log incident', 'Monitor situation'],
    notification: 'Team chat'
  },
  [IncidentLevel.MEDIUM]: {
    responseTime: '4 hours',
    actions: ['Log incident', 'Investigate', 'Implement temporary fix'],
    notification: 'Team chat + Email'
  },
  [IncidentLevel.HIGH]: {
    responseTime: '1 hour',
    actions: ['Log incident', 'Immediate investigation', 'Implement fix', 'Notify stakeholders'],
    notification: 'Team chat + Email + Phone'
  },
  [IncidentLevel.CRITICAL]: {
    responseTime: 'Immediate',
    actions: ['Log incident', 'Emergency response', 'System shutdown if necessary', 'Notify all stakeholders'],
    notification: 'All channels + Emergency procedures'
  }
};
```

### 2. Contención y Recuperación

#### Contención de Amenazas
```typescript
// Middleware de contención
const containmentMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const threatLevel = getThreatLevel(ip);
  
  if (threatLevel === 'high') {
    // Bloquear IP temporalmente
    blockIP(ip, 3600000); // 1 hora
    
    securityLogger.error('ip_blocked', {
      ip,
      reason: 'High threat level',
      duration: '1 hour'
    }, req);
    
    return res.status(403).json({
      success: false,
      error: 'Acceso temporalmente bloqueado'
    });
  }
  
  if (threatLevel === 'medium') {
    // Aplicar rate limiting más estricto
    req.rateLimit = { max: 10, windowMs: 15 * 60 * 1000 };
  }
  
  next();
};

// Función de bloqueo de IP
const blockIP = (ip: string, duration: number): void => {
  blockedIPs.set(ip, Date.now() + duration);
  
  // Limpiar IPs bloqueadas expiradas
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, duration);
};
```

## 📚 Mejores Prácticas de Seguridad

### 1. Desarrollo Seguro

#### Principios de Desarrollo
```typescript
// ✅ PRÁCTICAS SEGURAS

// 1. Validar siempre la entrada del usuario
const safeUserInput = userSchema.parse(req.body);

// 2. Usar parámetros preparados para queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// 3. Implementar logging de seguridad
securityLogger.info('user_action', { action: 'profile_update' }, req);

// 4. Validar permisos antes de operaciones
if (!canUserModifyProduct(userId, productId)) {
  throw new Error('Permisos insuficientes');
}

// 5. Sanitizar output antes de renderizar
const safeDescription = DOMPurify.sanitize(product.description);

// ❌ PRÁCTICAS INSEGURAS

// 1. Concatenar strings para queries SQL
const unsafeQuery = `SELECT * FROM users WHERE id = '${userId}'`;

// 2. Renderizar HTML sin sanitizar
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// 3. Confiar en headers del cliente
const userRole = req.headers['x-user-role'];

// 4. Almacenar secretos en código
const apiKey = 'hardcoded-secret-key';

// 5. Ignorar errores de validación
try {
  // ... código
} catch (error) {
  // Ignorar error
}
```

### 2. Revisión de Código

#### Checklist de Seguridad
```typescript
// Checklist para revisión de código
const securityChecklist = {
  authentication: [
    '¿Se valida la autenticación en todos los endpoints protegidos?',
    '¿Se usan tokens JWT seguros?',
    '¿Se implementa logout seguro?',
    '¿Se valida la expiración de tokens?'
  ],
  authorization: [
    '¿Se verifica el rol del usuario antes de operaciones?',
    '¿Se implementa RLS en la base de datos?',
    '¿Se validan permisos a nivel de aplicación?',
    '¿Se registran cambios de permisos?'
  ],
  inputValidation: [
    '¿Se valida toda la entrada del usuario?',
    '¿Se sanitizan los datos antes de procesar?',
    '¿Se usan esquemas de validación (Zod)?',
    '¿Se manejan errores de validación apropiadamente?'
  ],
  outputEncoding: [
    '¿Se sanitiza el output HTML?',
    '¿Se usan headers de seguridad apropiados?',
    '¿Se implementa CSP?',
    '¿Se previene XSS?'
  ],
  dataProtection: [
    '¿Se encriptan datos sensibles?',
    '¿Se implementa logging seguro?',
    '¿Se protege contra acceso no autorizado?',
    '¿Se implementan timeouts de sesión?'
  ]
};
```

## 🔮 Futuras Mejoras de Seguridad

### 1. Autenticación Avanzada
- **2FA (Two-Factor Authentication)**: Autenticación de dos factores
- **OAuth**: Integración con proveedores externos (Google, Facebook)
- **Biometric Authentication**: Autenticación biométrica para móviles
- **Hardware Security Keys**: Soporte para YubiKey y similares

### 2. Monitoreo Avanzado
- **SIEM (Security Information and Event Management)**: Sistema integrado de gestión de eventos de seguridad
- **Threat Intelligence**: Integración con feeds de amenazas
- **Behavioral Analytics**: Análisis de comportamiento anómalo
- **Real-time Alerts**: Alertas en tiempo real para amenazas críticas

### 3. Compliance y Auditoría
- **GDPR Compliance**: Cumplimiento con regulaciones de privacidad
- **SOC 2 Type II**: Certificación de seguridad
- **Penetration Testing**: Tests de penetración regulares
- **Security Audits**: Auditorías de seguridad independientes

---

Esta guía de seguridad proporciona una base sólida para proteger Tesoros Chocó contra amenazas comunes y emergentes, implementando las mejores prácticas de la industria y manteniendo un enfoque proactivo en la seguridad de la aplicación.
