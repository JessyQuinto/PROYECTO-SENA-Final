# Documentación del Backend

## 1. Visión General

El backend de este proyecto se implementa utilizando un enfoque de **Backend as a Service (BaaS)**, con **Supabase** como proveedor principal. Esto significa que no hay un servidor monolítico tradicional. En su lugar, la lógica del backend se distribuye entre los servicios que ofrece Supabase.

## 2. Componentes del Backend

### 2.1. Base de Datos (PostgreSQL)

*   **Descripción:** El núcleo del backend es una base de datos PostgreSQL gestionada por Supabase.
*   **Acceso:** El frontend puede interactuar directamente con la base de datos a través de la API de PostgREST que Supabase genera automáticamente, respetando siempre las políticas de seguridad a nivel de fila (RLS).
*   **Esquema (Tablas Principales esperadas):**
    *   `public.users` o `profiles`: Almacena información pública de los perfiles de usuario.
    *   `public.products`: Contiene los detalles de las artesanías en venta.
    *   `public.vendors`: Información sobre los vendedores registrados.
    *   `public.orders`: Registra los pedidos realizados por los clientes.
    *   `public.order_items`: Detalla los productos incluidos en cada pedido.
    *   `public.categories`: Categorías de los productos.

### 2.2. Autenticación (Supabase Auth)

*   **Descripción:** Servicio gestionado para el manejo completo del ciclo de vida de la autenticación de usuarios.
*   **Funcionalidades:** Registro, inicio de sesión (con email/contraseña, OAuth), recuperación de contraseña, y gestión de sesiones a través de JSON Web Tokens (JWT).
*   **Integración:** El frontend utiliza la librería `supabase-js` para interactuar con este servicio. Cada solicitud autenticada a la API o a las funciones incluye un JWT.

### 2.3. Funciones Serverless (Supabase Edge Functions)

*   **Descripción:** Son fragmentos de código TypeScript/Deno que se ejecutan en la infraestructura de Supabase. Se utilizan para lógica de negocio que no debe exponerse al cliente o que requiere privilegios elevados.
*   **Ubicación del código:** `supabase/functions/`
*   **Estructura de Módulos (Funciones Detectadas):**
    *   `_shared/`: Código compartido entre varias funciones (ej: clientes de API, constantes).
    *   `admin-users/`: Funciones para la administración de usuarios, como asignar roles o deshabilitar cuentas. Requiere permisos de administrador.
    *   `create-admin/`: Probablemente una función de inicialización para crear el primer usuario administrador.
    *   `notify-vendor-status/`: Envía notificaciones (email, etc.) a un vendedor cuando su estado cambia (aprobado, rechazado, suspendido).
    *   `order-emails/`: Se encarga de enviar correos de confirmación de pedido tanto al comprador como al vendedor.
    *   `self-account/`: Funciones que un usuario puede ejecutar sobre su propia cuenta, como eliminar sus datos personales.

### 2.4. Almacenamiento (Supabase Storage)

*   **Descripción:** Servicio para almacenar y servir archivos grandes, como imágenes de productos, facturas en PDF o avatares de usuario.
*   **Acceso:** Se gestiona con políticas de seguridad para controlar quién puede ver o subir archivos. Por ejemplo, un vendedor solo puede subir imágenes para sus propios productos.

## 3. Lógica de Negocio y Servicios

*   **Controladores/Servicios:** En esta arquitectura, no existen controladores o servicios en el sentido tradicional de un framework MVC. La lógica se distribuye:
    1.  **Lógica de Cliente:** El frontend maneja la mayor parte de la lógica de presentación.
    2.  **Lógica de API (CRUD):** La API de PostgREST de Supabase maneja las operaciones básicas de Crear, Leer, Actualizar y Borrar.
    3.  **Lógica de Negocio Compleja:** Las **Supabase Functions** actúan como "servicios" o "controladores" para casos de uso específicos y seguros. Cada función es un endpoint independiente que encapsula una tarea concreta.
*   **Modelos:** Los "modelos" de datos son las tablas de la base de datos PostgreSQL. Las interfaces de TypeScript en `Frontend/src/types/` a menudo reflejan la estructura de estas tablas para garantizar la coherencia.
