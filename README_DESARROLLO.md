# Configuración del Entorno de Desarrollo

## Problema de CORS

El error de CORS ocurre cuando el frontend en desarrollo (`http://localhost:3000`) intenta acceder al backend, pero las URLs no están correctamente configuradas.

## Solución

### 1. Configurar variables de entorno en el frontend

Crea un archivo `.env` en el directorio `Frontend/` con el siguiente contenido:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g

# Backend URL (para desarrollo local)
VITE_BACKEND_URL=http://localhost:4000

# App Configuration
VITE_APP_NAME=Tesoros Chocó
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:5173

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
```

### 2. Iniciar el backend en modo desarrollo

En el directorio `Backend/`, ejecuta:

```bash
npm run dev
```

Esto iniciará el backend en `http://localhost:4000`.

### 3. Iniciar el frontend en modo desarrollo

En el directorio `Frontend/`, ejecuta:

```bash
npm run dev
```

Esto iniciará el frontend en `http://localhost:5173`.

### 4. Acceder a la aplicación

Abre tu navegador en `http://localhost:5173` para acceder a la aplicación en modo desarrollo.

## Solución de problemas

### Error de CORS

Si continúas viendo errores de CORS:

1. Asegúrate de que el backend esté corriendo en `http://localhost:4000`
2. Verifica que el archivo `.env` en el frontend tenga `VITE_BACKEND_URL=http://localhost:4000`
3. Reinicia ambos servidores (frontend y backend) después de hacer cambios

### El frontend sigue apuntando al backend de producción

Si el frontend sigue apuntando a `https://marketplace-backend-prod.azurewebsites.net`:

1. Verifica que tengas un archivo `.env` en el directorio `Frontend/`
2. Asegúrate de que contenga la línea: `VITE_BACKEND_URL=http://localhost:4000`
3. Reinicia el servidor de desarrollo del frontend

## Despliegue

Para despliegue en producción, asegúrate de configurar las variables de entorno apropiadas en tu plataforma de hosting (Azure, Vercel, etc.).