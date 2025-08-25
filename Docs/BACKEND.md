# Backend - Tesoros Chocó

## 🚀 Tecnologías Utilizadas

### Core Technologies
- **Node.js**: Runtime de JavaScript
- **TypeScript 5.4.0**: Tipado estático para mayor robustez
- **Express.js 4.19.0**: Framework web minimalista y flexible
- **tsx 4.7.0**: Runtime de TypeScript para desarrollo

### Dependencies Principales
- **@supabase/supabase-js 2.43.0**: Cliente oficial de Supabase
- **dotenv 16.4.5**: Gestión de variables de entorno
- **cors 2.8.5**: Middleware para CORS
- **morgan 1.10.0**: Logger HTTP para desarrollo
- **zod 3.23.8**: Validación de esquemas

### Development Dependencies
- **@types/express 4.17.21**: Tipos TypeScript para Express
- **@types/node 20.12.7**: Tipos TypeScript para Node.js
- **@types/cors 2.8.17**: Tipos TypeScript para CORS
- **@types/morgan 1.9.7**: Tipos TypeScript para Morgan

## 📁 Estructura del Proyecto

```
Backend/
├── src/
│   ├── index.ts              # Punto de entrada principal
│   └── lib/
│       └── supabaseAdmin.ts  # Cliente admin de Supabase
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
└── .env                      # Variables de entorno
```

## 🏗️ Arquitectura del Backend

### 1. Estructura Principal
El backend está diseñado como una **API REST monolítica** que actúa como intermediario entre el frontend y Supabase, proporcionando:

- **Validación de datos** con Zod
- **Middleware de seguridad** (CORS, headers)
- **Logging estructurado** con Morgan
- **Manejo de errores** centralizado
- **Integración con Supabase** para operaciones complejas

### 2. Patrón de Diseño
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│                 │◄──►│                 │◄──►│                 │
│ • React App     │    │ • Express.js    │    │ • PostgreSQL    │
│ • Supabase      │    │ • Middleware    │    │ • Auth          │
│   Client        │    │ • Validation    │    │ • Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuración Principal

### 1. Servidor Express
```typescript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();

// Middleware de seguridad
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// Headers de seguridad
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
```

### 2. Configuración CORS
```typescript
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
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
```

## 🛡️ Middleware de Seguridad

### 1. CORS Configurable
- **Orígenes permitidos**: Configurables por variable de entorno
- **Soporte de comodines**: Patrones como `*.azurestaticapps.net`
- **Validación flexible**: Regex y comparación exacta
- **Headers seguros**: Solo headers necesarios permitidos

### 2. Headers de Seguridad
```typescript
// Prevención de ataques comunes
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');
```

### 3. Rate Limiting
- **Protección contra abuso**: Límites configurables por endpoint
- **Window-based**: Ventanas de tiempo configurables
- **IP-based**: Limitación por dirección IP
- **Customizable**: Diferentes límites para diferentes operaciones

## 📊 Endpoints Principales

### 1. Health Check
```typescript
// Ruta raíz amigable
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/health');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    service: 'backend-demo', 
    ts: new Date().toISOString() 
  });
});
```

### 2. Autenticación Post-Signup
```typescript
const postSignupSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['comprador', 'vendedor', 'admin']).default('comprador'),
  nombre: z.string().min(1).optional()
});

app.post('/auth/post-signup', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = postSignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Payload inválido', 
      detail: parsed.error.flatten() 
    });
  }
  
  // Lógica de creación de perfil...
});
```

### 3. Simulación de Pagos
```typescript
app.post('/payments/simulate', async (req: Request, res: Response) => {
  const { order_id, approved } = req.body;
  
  if (!order_id) {
    return res.status(400).json({ error: 'order_id requerido' });
  }
  
  // Simular procesamiento de pago...
  const success = approved !== false;
  
  if (success) {
    res.json({ 
      success: true, 
      message: 'Pago procesado exitosamente',
      order_id 
    });
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'Pago rechazado',
      order_id 
    });
  }
});
```

## 🔐 Integración con Supabase

### 1. Cliente Admin
```typescript
// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const getSupabaseAdmin = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
```

### 2. Operaciones de Base de Datos
```typescript
// Ejemplo de operación con Supabase
const supabase = getSupabaseAdmin();

const { data, error } = await supabase
  .from('users')
  .upsert(
    {
      id: user_id,
      email,
      role,
      nombre_completo: nombre?.trim() || undefined
    },
    { onConflict: 'id' }
  );

if (error) {
  console.error('Error upserting user:', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
```

## 📝 Validación de Datos

### 1. Esquemas Zod
```typescript
// Esquemas de validación para diferentes endpoints
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['comprador', 'vendedor', 'admin']),
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Nombre muy largo')
});

const orderSchema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid('ID de producto inválido'),
    cantidad: z.number().positive('Cantidad debe ser positiva')
  })).min(1, 'Al menos un item requerido')
});
```

### 2. Validación en Endpoints
```typescript
app.post('/api/users', async (req: Request, res: Response) => {
  // Validar payload
  const validation = userSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: validation.error.flatten()
    });
  }
  
  const { email, role, nombre } = validation.data;
  
  // Procesar datos validados...
});
```

## 🚨 Manejo de Errores

### 1. Middleware de Error
```typescript
// Middleware de manejo de errores
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no manejado:', error);
  
  // Errores de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: error.message
    });
  }
  
  // Errores de autenticación
  if (error.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: error.message
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Algo salió mal'
  });
});
```

### 2. Try-Catch en Endpoints
```typescript
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    // Validar datos
    const validation = orderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validation.error.flatten()
      });
    }
    
    // Procesar orden
    const result = await processOrder(validation.data);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({
      error: 'Error procesando orden',
      message: 'No se pudo procesar la orden'
    });
  }
});
```

## 📊 Logging y Monitoreo

### 1. Morgan Logger
```typescript
// Configuración de logging HTTP
app.use(morgan('dev')); // Formato de desarrollo

// Formato personalizado para producción
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}
```

### 2. Logs Estructurados
```typescript
// Logging estructurado para operaciones importantes
const logOperation = (operation: string, details: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation,
    details,
    environment: process.env.NODE_ENV
  }));
};

// Uso en endpoints
app.post('/api/products', async (req: Request, res: Response) => {
  logOperation('create_product', {
    user_id: req.user?.id,
    product_name: req.body.nombre
  });
  
  // ... lógica del endpoint
});
```

## 🔄 Flujos de Negocio

### 1. Flujo de Registro de Usuario
```
1. Usuario se registra en frontend
2. Supabase Auth crea cuenta
3. Frontend llama a /auth/post-signup
4. Backend valida datos con Zod
5. Backend crea perfil en tabla users
6. Backend actualiza app_metadata.role
7. Usuario puede acceder según su rol
```

### 2. Flujo de Creación de Producto
```
1. Vendedor autenticado crea producto
2. Frontend valida datos localmente
3. Frontend envía a Supabase Storage (imagen)
4. Frontend envía datos a Supabase (producto)
5. Backend puede procesar lógica adicional
6. Producto aparece en catálogo
```

### 3. Flujo de Compra
```
1. Comprador agrega productos al carrito
2. Comprador procede al checkout
3. Frontend llama a RPC crear_pedido
4. Supabase procesa transacción
5. Backend simula procesamiento de pago
6. Orden se confirma y se notifica
```

## 🧪 Testing

### 1. Configuración de Tests
```typescript
// tsconfig.json para tests
{
  "compilerOptions": {
    "types": ["node", "jest"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 2. Scripts de Testing
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 3. Ejemplo de Test
```typescript
// tests/auth.test.ts
import request from 'supertest';
import { app } from '../src/index';

describe('POST /auth/post-signup', () => {
  it('should create user profile successfully', async () => {
    const userData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'comprador',
      nombre: 'Usuario Test'
    };
    
    const response = await request(app)
      .post('/auth/post-signup')
      .send(userData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
  
  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/auth/post-signup')
      .send({})
      .expect(400);
    
    expect(response.body.error).toBe('Payload inválido');
  });
});
```

## 🚀 Despliegue

### 1. Variables de Entorno
```bash
# .env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Scripts de Build
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  }
}
```

### 3. Docker (Opcional)
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## 🔮 Futuras Mejoras

### 1. Escalabilidad
- **Microservicios**: Separación en servicios independientes
- **Load Balancing**: Balanceo de carga para alta disponibilidad
- **Caching**: Redis para cache de datos frecuentes
- **Queue System**: Colas para procesamiento asíncrono

### 2. Seguridad
- **Rate Limiting**: Límites más sofisticados por usuario/IP
- **API Keys**: Sistema de claves API para integraciones
- **Audit Logs**: Logs detallados de todas las operaciones
- **Input Sanitization**: Sanitización más robusta de inputs

### 3. Monitoreo
- **Health Checks**: Endpoints de salud más detallados
- **Metrics**: Métricas de performance y uso
- **Alerting**: Sistema de alertas para errores críticos
- **Distributed Tracing**: Trazado de requests distribuidos

### 4. Testing
- **Integration Tests**: Tests de integración con Supabase
- **E2E Tests**: Tests end-to-end completos
- **Performance Tests**: Tests de carga y performance
- **Security Tests**: Tests de seguridad automatizados

---

Esta documentación proporciona una visión completa del backend de Tesoros Chocó, mostrando la arquitectura, configuración y implementación de una API REST moderna y segura que actúa como intermediario entre el frontend y Supabase.
