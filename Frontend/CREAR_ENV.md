# 🔧 CREAR ARCHIVO .env.local MANUALMENTE

## Problema Identificado
El archivo `.env.local` no existe, por lo que las variables de entorno de Supabase no están configuradas.

## Solución

### Paso 1: Crear el archivo .env.local
Crea un archivo llamado `.env.local` en la carpeta `Frontend/` con el siguiente contenido:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87bBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g

# Backend Configuration
VITE_BACKEND_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=Tesoros Chocó
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:3000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Paso 2: Reiniciar el servidor de desarrollo
Después de crear el archivo, reinicia el servidor de desarrollo:

```bash
# En la carpeta Frontend/
npm run dev
```

### Paso 3: Verificar que funciona
1. Abre la consola del navegador (F12)
2. Ve a la página de login
3. Deberías ver logs de diagnóstico
4. Prueba el formulario de login simple

## Ubicación del archivo
El archivo debe estar en:
```
Frontend/.env.local
```

## Verificación
Para verificar que el archivo se creó correctamente, ejecuta este script en la consola del navegador:

```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'NO configurado');
```

Si ves "NO configurado", el archivo no se creó correctamente o el servidor necesita reiniciarse.

## Credenciales de prueba
Una vez que el archivo esté creado, usa estas credenciales:

- **Email**: `admin@tesoros-choco.com`
- **Contraseña**: `TesChoco2024!`

## Si sigue sin funcionar
1. Verifica que el archivo se guardó correctamente
2. Reinicia el servidor de desarrollo
3. Limpia el caché del navegador
4. Ejecuta el script de diagnóstico completo



