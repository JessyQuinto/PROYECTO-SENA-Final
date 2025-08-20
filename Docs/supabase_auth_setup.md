# Configuración de Supabase Authentication

Este documento explica cómo configurar correctamente **Supabase Authentication** para el proyecto Tesoros Chocó.

## 1. Configuración en el Panel de Supabase

### Paso 1: Crear un proyecto en Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Haz clic en **"New project"**
3. Elige tu organización
4. Asigna un nombre a tu proyecto (ej: `tesoros-choco`)
5. Crea una contraseña segura para la base de datos
6. Selecciona la región más cercana
7. Haz clic en **"Create new project"**

### Paso 2: Habilitar Email/Password Authentication
1. En tu proyecto de Supabase, ve a **Authentication > Settings**
2. En la sección **"Authentication"**, asegúrate de que esté habilitado:
   - ✅ **Enable email confirmations**: activado (recomendado)
   - ✅ **Enable email confirmations**: activado para mayor seguridad
3. En **"Email Auth"**:
   - ✅ **Enable email provider**: debe estar activado
   - ✅ **Confirm email**: activado (usuarios deben confirmar su email)

### Paso 3: Configurar URLs de redirección
1. Ve a **Authentication > URL Configuration**
2. En **"Site URL"**: agrega `http://localhost:5173` (para desarrollo)
3. En **"Redirect URLs"**: agrega:
   - `http://localhost:5173`
   - `http://localhost:5173/**` (para wildcards)
   - Agrega tu dominio de producción cuando despliegues

### Paso 4: Obtener las claves de API
1. Ve a **Settings > API**
2. Copia los siguientes valores:
   - **URL**: tu URL del proyecto (ej: `https://abcdefgh.supabase.co`)
   - **anon public**: la clave pública anónima

## 2. Configuración en el Frontend

### Paso 1: Variables de entorno
1. En la carpeta `Frontend/`, copia el archivo `.env.example` como `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` con tus valores reales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-muy-larga-aqui
   ```

### Paso 2: Verificar la instalación
Las dependencias ya están instaladas:
```bash
npm install @supabase/supabase-js framework7 framework7-react
```

## 3. Configuración de la Base de Datos

### Ejecutar el esquema inicial
1. Ve a **SQL Editor** en tu panel de Supabase
2. Copia y ejecuta todo el contenido del archivo `Docs/sql_bootstrap.sql`
3. Esto creará:
   - Tablas necesarias (`users`, `productos`, etc.)
   - Políticas RLS (Row Level Security)
   - Funciones necesarias para el sistema

### Verificar RLS
Las políticas RLS ya están configuradas en el bootstrap, pero puedes verificar en:
**Authentication > Policies** que las tablas tengan sus políticas activas.

## 4. Funcionalidades Implementadas

### Registro de usuarios
- ✅ Formulario con email y contraseña
- ✅ Selección de rol (comprador/vendedor)
- ✅ Confirmación por email
- ✅ Creación automática de perfil en tabla `users`

### Inicio de sesión
- ✅ Formulario con email y contraseña
- ✅ Manejo de errores
- ✅ Persistencia de sesión

### Navegación
- ✅ Navbar responsive
- ✅ Botón "Iniciar sesión" cuando no hay usuario logueado
- ✅ Botón "Cerrar sesión" cuando hay usuario logueado
- ✅ Modal de autenticación con pestañas

### Seguridad
- ✅ Row Level Security habilitado
- ✅ Validación de formularios con Zod
- ✅ Variables de entorno seguras
- ✅ Protección de rutas por rol

## 5. Estructura de Roles

### Compradores (`comprador`)
- ✅ Acceso inmediato tras registro
- ✅ Pueden navegar y comprar productos
- ✅ No requieren aprobación

### Vendedores (`vendedor`)
- ⚠️ Requieren aprobación de admin antes de publicar productos
- ⚠️ Estado inicial: `pendiente`
- ✅ Acceso al panel de vendedor tras aprobación

### Administradores (`admin`)
- ✅ Acceso completo al sistema
- ✅ Pueden aprobar vendedores
- ✅ Gestión de categorías y productos

## 6. Testing

### Probar la autenticación
1. Inicia el servidor de desarrollo:
   ```bash
   cd Frontend
   npm run dev
   ```

2. Ve a `http://localhost:5173`

3. Haz clic en **"Iniciar sesión"**

4. Prueba:
   - Registro con email válido
   - Inicio de sesión con credenciales existentes
   - Cierre de sesión

### Verificar en Supabase
1. Ve a **Authentication > Users** en tu panel
2. Deberías ver los usuarios registrados
3. Ve a **Table Editor > users** para ver los perfiles creados

## 7. Troubleshooting

### Error: "Invalid API key"
- ✅ Verifica que las variables de entorno estén correctas
- ✅ Asegúrate de que el archivo `.env.local` existe
- ✅ Reinicia el servidor de desarrollo

### Error: "Email not confirmed"
- ✅ Revisa el email del usuario (incluye spam)
- ✅ En desarrollo, puedes deshabilitar confirmación de email
- ✅ Ve a Authentication > Settings > "Confirm email" = OFF

### Error de CORS
- ✅ Verifica las URLs de redirección en Supabase
- ✅ Asegúrate de incluir `http://localhost:5173`

### Error de RLS (Row Level Security)
- ✅ Verifica que se ejecutó correctamente `sql_bootstrap.sql`
- ✅ Comprueba que las políticas están activas
- ✅ Usuario debe estar autenticado para acceder a datos

## 8. Próximos pasos

Este setup básico permite:
- ✅ Registro y login funcional
- ✅ Gestión de sesiones
- ✅ UI responsive con modal

**Pendiente para completar el marketplace:**
- 🔲 Gestión de productos por vendedores
- 🔲 Sistema de carrito y pedidos
- 🔲 Panel de administración
- 🔲 Notificaciones por email
- 🔲 Upload de imágenes de productos

¡La base de autenticación está lista para el desarrollo del marketplace completo!
