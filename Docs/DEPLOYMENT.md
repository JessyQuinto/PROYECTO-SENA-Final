# Guía de Despliegue (Deployment)

## 1. Infraestructura

*   **Hosting Frontend:** **Azure Static Web Apps**
*   **Backend y Base de Datos:** **Supabase Cloud**
*   **CI/CD:** **GitHub Actions**

## 2. Proceso de Despliegue Automatizado (CI/CD)

El proyecto está configurado para un despliegue continuo. Cualquier `push` o `merge` a la rama `main` desencadena un workflow de GitHub Actions.

### Workflow: `azure-static-web-apps-....yml`

1.  **Trigger:** Se activa en un `push` a la rama `main`.
2.  **Build:**
    *   Realiza el checkout del código.
    *   Detecta la configuración del proyecto (en este caso, una aplicación de React/Vite).
    *   Navega a la carpeta `Frontend`.
    *   Instala las dependencias (`npm install` o `bun install`).
    *   Construye la aplicación para producción (`npm run build`). El resultado se guarda en la carpeta `Frontend/dist`.
3.  **Deploy:**
    *   Utiliza la action `Azure/static-web-apps-deploy@v1`.
    *   Sube los archivos de la carpeta `Frontend/dist` a Azure Static Web Apps.
    *   Configura el enrutamiento y el proxy para las funciones de Supabase si es necesario.

Las Supabase Functions se despliegan por separado usando la CLI de Supabase, idealmente en un workflow de Actions diferente.

**Comando de despliegue de funciones:**
```bash
# Se necesita configurar los secretos SUPABASE_ACCESS_TOKEN y SUPABASE_DB_PASSWORD en GitHub
supabase functions deploy --project-ref <ID_PROYECTO>
```

## 3. Ejecución en un Entorno Local

### Requisitos

*   Node.js y Bun.
*   Supabase CLI (para las funciones del backend).
*   Credenciales de un proyecto de Supabase (puedes usar uno en la nube o uno local).

### Pasos

1.  **Clonar el repositorio.**
2.  **Configurar variables de entorno del Frontend:**
    *   Ve a la carpeta `Frontend`.
    *   Crea un archivo `.env` a partir de `env.example`.
    *   Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con las credenciales de tu proyecto de Supabase.
3.  **Iniciar el entorno local de Supabase:**
    *   Desde la raíz del proyecto, ejecuta `supabase start`. Esto iniciará un contenedor de Docker con toda la infraestructura de Supabase.
    *   Aplica las migraciones de la base de datos: `supabase db reset`.
4.  **Instalar dependencias (Frontend y Backend):**
    *   `cd Frontend && bun install`
    *   `cd ../Backend && bun install`
5.  **Ejecutar el Frontend:**
    *   `cd ../Frontend`
    *   `bun run dev`
    *   La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).
6.  **Ejecutar las Funciones del Backend:**
    *   Desde la raíz del proyecto, ejecuta `supabase functions serve`.
    *   Las funciones estarán disponibles para ser llamadas por el frontend.

## 4. Requisitos del Servidor (Producción)

Dado que se utilizan servicios gestionados (Azure y Supabase), no hay requisitos de servidor tradicionales.

*   **Azure:** La configuración de Azure Static Web Apps se gestiona a través del portal de Azure o el workflow de GitHub Actions.
*   **Supabase:** La configuración (escalado de la base de datos, etc.) se gestiona desde el dashboard de Supabase. Es importante configurar un plan de producción y realizar copias de seguridad.
*   **Variables de Entorno:** Las claves secretas (como la `SERVICE_ROLE_KEY` de Supabase o claves de APIs de terceros) deben configurarse como "secretos" en el repositorio de GitHub para los workflows y en el dashboard de Supabase para las funciones.
