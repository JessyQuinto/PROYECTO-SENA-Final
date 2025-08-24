# Configuración de Supabase para Tesoros Chocó

## 🔑 Variables de Entorno Requeridas

### Frontend (.env.local)
Crea `Frontend/.env.local` basándote en `Frontend/env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g

# Backend URL (opcional - para funcionalidades que requieren backend)
VITE_BACKEND_URL=http://localhost:4000

# App Configuration
VITE_APP_NAME=Tesoros Chocó
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:5173
```

### Backend (.env)
Crea `Backend/.env` basándote en `Backend/env.example`:

```env
# Supabase Configuration
SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000

# Email Configuration (Brevo/Sendinblue)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@tesoros-choco.app
BREVO_SENDER_NAME=Tesoros Chocó

# App Configuration
APP_NAME=Tesoros Chocó
PUBLIC_APP_URL=http://localhost:5173
SUPPORT_EMAIL=soporte@tesoros-choco.app
ANON_EMAIL_DOMAIN=tesoros-choco.app
```

## 🛡️ Seguridad Implementada

### ✅ Problemas Corregidos:

1. **RLS (Row Level Security)**
   - ✅ Habilitado en todas las tablas públicas
   - ✅ Políticas específicas por rol (admin, vendedor, comprador)
   - ✅ Protección contra acceso no autorizado

2. **Funciones de Base de Datos**
   - ✅ Search path fijo en funciones críticas
   - ✅ SECURITY DEFINER para operaciones privilegiadas
   - ✅ Validación de permisos en todas las operaciones

3. **Autenticación**
   - ✅ Verificación de email obligatoria
   - ✅ Trigger automático para crear perfiles de usuario
   - ✅ Gestión segura de roles y estados

### 🔐 Flujo de Autenticación:

1. **Registro**:
   ```
   Usuario → Frontend → Supabase Auth → Trigger → Tabla users
   ```

2. **Verificación de Email**:
   ```
   Usuario hace clic en enlace → Supabase confirma → Usuario puede iniciar sesión
   ```

3. **Inicio de Sesión**:
   ```
   Credenciales → Supabase Auth → JWT con claims → Frontend recibe usuario
   ```

## 🚀 Instrucciones de Configuración

### 1. Configurar Variables de Entorno

```bash
# En el directorio Frontend/
cp env.example .env.local
# Editar .env.local con los valores correctos

# En el directorio Backend/
cp env.example .env
# Editar .env con los valores correctos
```

### 2. Instalar Dependencias

```bash
# Frontend
cd Frontend
npm install

# Backend
cd Backend
npm install
```

### 3. Verificar Conexión

```bash
# Frontend
cd Frontend
npm run dev

# Backend (terminal separado)
cd Backend
npm run dev
```

### 4. Probar Autenticación

1. Ir a `http://localhost:5173`
2. Registrarse como nuevo usuario
3. Verificar email (revisar consola si no hay email configurado)
4. Iniciar sesión

## 🔧 Configuración de Email (Opcional)

Para habilitar envío de emails reales:

1. Crear cuenta en [Brevo](https://brevo.com)
2. Obtener API Key
3. Configurar `BREVO_API_KEY` en variables de entorno
4. Configurar email remitente en `BREVO_SENDER_EMAIL`

## 📊 Estados del Sistema

### Roles de Usuario:
- `admin`: Administrador del sistema
- `vendedor`: Artesano que vende productos (requiere aprobación)
- `comprador`: Cliente que compra productos

### Estados de Vendedor:
- `pendiente`: Esperando aprobación de admin
- `aprobado`: Puede publicar productos
- `rechazado`: No puede publicar productos

### Estados de Producto:
- `activo`: Visible para compradores
- `inactivo`: No visible (temporal)
- `bloqueado`: Bloqueado por admin

### Estados de Pedido:
- `pendiente`: Recién creado
- `procesando`: En proceso de preparación
- `enviado`: Enviado al cliente
- `entregado`: Entregado al cliente
- `cancelado`: Cancelado

## 🐛 Solución de Problemas

### Error: "Variables VITE_SUPABASE_URL no definidas"
- Crear archivo `.env.local` en directorio Frontend/
- Copiar valores de `env.example`

### Error: "No autenticado" en backend
- Verificar `SUPABASE_SERVICE_ROLE_KEY` en Backend/.env
- Obtener service role key desde Supabase Dashboard → Settings → API

### Error: "CORS no permitido"
- Verificar `FRONTEND_ORIGINS` en Backend/.env
- Incluir URL del frontend (http://localhost:5173)

### Error: "Email no se envía"
- Configurar `BREVO_API_KEY` en Backend/.env
- Verificar configuración en Edge Functions

## 📝 Logs y Debugging

### Frontend:
- Abrir DevTools (F12) → Console
- Verificar errores de conexión a Supabase

### Backend:
- Revisar logs en terminal del servidor
- Verificar logs de Edge Functions en Supabase Dashboard

### Base de Datos:
- Revisar tabla `audit_log` para cambios importantes
- Verificar tabla `users` para perfiles de usuario

## 🔄 Próximos Pasos

1. **Configurar email de producción** con Brevo
2. **Configurar dominio personalizado** para la aplicación
3. **Configurar SSL/HTTPS** para producción
4. **Configurar backups** automáticos de la base de datos
5. **Implementar monitoreo** de errores y performance

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verificar todos los archivos .env están creados
2. Revisar que todas las variables tienen valores
3. Verificar conexión de red a Supabase
4. Consultar logs en DevTools y terminal

La configuración está optimizada para desarrollo local y lista para producción con las variables correctas.
