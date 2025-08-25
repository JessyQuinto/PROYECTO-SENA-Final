# Diseño del Sistema

## 1. Componentes Principales

El sistema se descompone en tres grandes bloques lógicos: el Frontend, el Backend (servicios de Supabase) y la infraestructura de CI/CD.

### 1.1. Frontend (Cliente)

*   **Framework de UI:** **React** para construir la interfaz de usuario a partir de componentes reutilizables.
*   **Gestor de Estado:** (No se detecta una librería específica como Redux o Zustand, probablemente se usa una combinación de `useState`, `useContext` y hooks personalizados).
*   **Enrutamiento:** **React Router DOM** para gestionar la navegación entre las diferentes páginas de la SPA.
*   **Estilos:** **Tailwind CSS** para un diseño rápido y consistente basado en utilidades.
*   **Cliente HTTP:** Librería cliente de Supabase (`@supabase/supabase-js`) y/o `fetch` nativo para la comunicación con el backend.
*   **Empaquetador:** **Vite** para un desarrollo rápido y una compilación optimizada.

### 1.2. Backend (Supabase)

*   **Base de Datos:** **PostgreSQL** gestionada por Supabase. La interacción se realiza a través de la API de PostgREST o directamente desde las funciones serverless.
*   **Autenticación:** **Supabase Auth (GoTrue)** para el registro, inicio de sesión y gestión de usuarios y tokens (JWT).
*   **Funciones Serverless:** **Supabase Edge Functions** (escritas en TypeScript/Deno) para ejecutar lógica de negocio del lado del servidor. Los triggers de la base de datos también pueden invocar estas funciones.
    *   `admin-users`: Gestión de roles de administrador.
    *   `order-emails`: Envío de correos transaccionales para pedidos.
    *   `notify-vendor-status`: Notificaciones a vendedores.
*   **Almacenamiento:** **Supabase Storage** para guardar archivos como imágenes de productos, avatares de usuario, etc.

### 1.3. CI/CD y Despliegue

*   **Control de Versiones:** **Git** y **GitHub**.
*   **Integración y Despliegue Continuo:** **GitHub Actions**. Los workflows definidos en `.github/workflows` automatizan las pruebas y el despliegue.
*   **Hosting:** **Azure Static Web Apps**, que sirve el frontend estático y actúa como proxy para las funciones de Supabase.

## 2. Flujo de Datos y Casos de Uso Clave

### Caso de Uso 1: Registro de un nuevo Vendedor

1.  **Usuario (Frontend):** Rellena el formulario de registro en la página de registro.
2.  **Frontend:** Llama a la función `supabase.auth.signUp()` con el email, contraseña y metadatos adicionales (ej: `role: 'vendedor'`).
3.  **Supabase Auth:** Crea un nuevo usuario en la tabla `auth.users` y le asigna un ID único. Envía un correo de confirmación.
4.  **Base de Datos (Trigger):** Un trigger en la tabla `auth.users` se dispara al crear un nuevo usuario. Inserta una nueva fila en la tabla `public.profiles` o `public.vendors` con el ID del usuario y valores por defecto.
5.  **Usuario:** Confirma su correo. Ahora puede iniciar sesión.

### Caso de Uso 2: Un Comprador realiza un Pedido

1.  **Usuario (Frontend):** Navega por el catálogo, añade productos al carrito y procede al checkout.
2.  **Frontend:** Recopila la información del carrito y la dirección de envío.
3.  **Frontend:** Invoca la función serverless `create-order`.
4.  **Supabase Function (`create-order`):**
    a. Valida los datos de entrada (productos, stock, etc.).
    b. (Opcional) Se comunica con una pasarela de pago (Stripe, PayPal).
    c. Si el pago es exitoso, crea un nuevo registro en la tabla `orders` y registros asociados en `order_items`.
    d. Decrementa el stock de los productos en la tabla `products`.
    e. Invoca la función `order-emails` para notificar al comprador y al vendedor.
5.  **Frontend:** Recibe la confirmación y muestra al usuario la página de "Pedido realizado con éxito".

### Caso de Uso 3: Un Administrador deshabilita un Vendedor

1.  **Admin (Frontend):** Accede al panel de administración y busca al vendedor.
2.  **Frontend:** Hace clic en "Deshabilitar". Se invoca la función `update-vendor-status`.
3.  **Supabase Function (`admin-users` o similar):**
    a. Verifica que el solicitante es un administrador (usando el JWT).
    b. Cambia el estado del vendedor en la base de datos (ej: `vendors.status = 'disabled'`).
    c. Invoca la función `notify-vendor-status` para informar al vendedor de la acción.
4.  **Frontend:** Muestra una notificación de éxito.
