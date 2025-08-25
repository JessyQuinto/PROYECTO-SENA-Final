# Arquitectura del Sistema

## 1. Modelo Arquitectónico: Cliente-Servidor (BaaS)

El sistema sigue un modelo de arquitectura **Cliente-Servidor**, con un enfoque moderno utilizando **Backend as a Service (BaaS)**. Esto desacopla fuertemente el frontend del backend, permitiendo un desarrollo y despliegue independientes.

*   **Cliente (Frontend):** Es una **Single Page Application (SPA)** construida con React. Se ejecuta completamente en el navegador del usuario y es responsable de toda la lógica de presentación y la interacción con el usuario.
*   **Servidor (Backend):** Se utiliza **Supabase** como plataforma BaaS. Supabase provee la base de datos (PostgreSQL), el sistema de autenticación, APIs autogeneradas y funciones serverless (Edge Functions) para lógica de negocio personalizada.

## 2. Diagrama de Arquitectura

```
+-----------------------+       +--------------------------------+       +-----------------------------+
|      Usuario          |       |      Infraestructura de        |       |      Backend (Supabase)     |
| (Navegador Web)       |       |      Despliegue (Azure)        |       |                             |
+-----------------------+       +--------------------------------+       +-----------------------------+
          |                             |                                        |
          | <-- HTML/CSS/JS -->         |                                        |
          |                             |                                        |
+-----------------------+       +-----------------------+                +-----------------------------+
|                       |       |                       |                |                             |
|   Frontend (React)    |------>| Azure Static Web Apps |--------------->|      Supabase Project       |
| (SPA en el navegador) |       | (Servidor de estáticos|                |                             |
|                       |       | y proxy de API)       |                | - Autenticación (GoTrue)    |
+-----------------------+       +-----------------------+                | - Base de Datos (PostgreSQL)|
          |                                                              | - Almacenamiento (Storage)  |
          |------------------------------------------------------------->| - API (PostgREST)           |
          | (Llamadas directas a la API de Supabase: DB, Auth, Storage)   | - Funciones (Deno)          |
          |                                                              +-----------------------------+
          |------------------------------------------------------------->| (Ej: /functions/v1/order-emails)
          | (Llamadas a funciones serverless para lógica de negocio)     |
          |                                                              |
```

### Flujo de la Arquitectura:

1.  **Solicitud Inicial:** El usuario accede a la URL de la aplicación. Azure Static Web Apps sirve los archivos estáticos (HTML, CSS, JavaScript) que componen la aplicación de React.
2.  **Carga de la SPA:** La aplicación de React se carga en el navegador del usuario.
3.  **Interacción con el Backend:**
    *   **Datos y Autenticación:** El frontend se comunica directamente con los servicios de Supabase a través de la librería cliente (`@supabase/supabase-js`). Realiza operaciones CRUD en la base de datos, gestiona la autenticación de usuarios (login, registro) y sube archivos al almacenamiento.
    *   **Lógica de Negocio:** Para operaciones que requieren lógica segura o compleja (ej: procesar un pago, enviar notificaciones), el frontend invoca **Supabase Edge Functions**. Estas son funciones serverless escritas en TypeScript/Deno que se ejecutan en el entorno de Supabase.
4.  **Seguridad:** La comunicación está asegurada mediante HTTPS. Supabase gestiona la autenticación con JWT y la autorización a nivel de base de datos se controla con **Row Level Security (RLS)**.

## 3. Justificación de la Elección

*   **Desacoplamiento:** Permite que los equipos de frontend y backend trabajen de forma independiente.
*   **Escalabilidad:** Supabase y Azure Static Web Apps son servicios gestionados que escalan automáticamente con la demanda.
*   **Rapidez de Desarrollo:** El uso de BaaS acelera el desarrollo al externalizar la gestión de la infraestructura de base de datos y autenticación.
*   **Coste-Eficiencia:** El modelo serverless reduce los costos operativos, ya que solo se paga por los recursos consumidos.
