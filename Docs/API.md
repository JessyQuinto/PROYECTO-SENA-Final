# Documentación de la API

La API del sistema es híbrida. Se compone de la **API RESTful autogenerada por Supabase (PostgREST)** para operaciones CRUD sobre la base de datos, y un conjunto de **endpoints personalizados (Supabase Edge Functions)** para lógica de negocio específica.

## 1. API de Base de Datos (Autogenerada)

Supabase expone automáticamente endpoints RESTful para cada tabla en la base de datos. El acceso está controlado por el rol del usuario y las políticas de Row Level Security (RLS).

*   **URL Base:** `https://<ID_PROYECTO>.supabase.co/rest/v1/`
*   **Autenticación:** Bearer Token (el JWT del usuario).
*   **Header `apikey`:** La `anon key` pública de Supabase.

### Ejemplos de Endpoints CRUD:

*   **Obtener todos los productos:**
    *   `GET /rest/v1/products?select=*`
*   **Obtener un producto por ID:**
    *   `GET /rest/v1/products?id=eq.<ID_PRODUCTO>&select=*`
*   **Crear un nuevo producto (rol vendedor):**
    *   `POST /rest/v1/products`
    *   **Body:** `{ "name": "...", "description": "...", "price": ..., "vendor_id": "..." }`
*   **Actualizar un producto (rol vendedor, solo sus productos):**
    *   `PATCH /rest/v1/products?id=eq.<ID_PRODUCTO>`
    *   **Body:** `{ "price": ... }`
*   **Eliminar un producto (rol vendedor):**
    *   `DELETE /rest/v1/products?id=eq.<ID_PRODUCTO>`

## 2. API de Funciones Serverless (Endpoints Personalizados)

Estos endpoints se utilizan para lógica de negocio que no puede o no debe ser manejada directamente por el cliente.

*   **URL Base:** `https://<ID_PROYECTO>.supabase.co/functions/v1/`
*   **Autenticación:** Bearer Token (el JWT del usuario).

---

### Endpoint: `order-emails`

*   **Método:** `POST`
*   **Descripción:** Envía los correos electrónicos transaccionales después de que se ha creado un pedido. Generalmente no es invocado directamente por el cliente, sino por otra función (como `create-order`) o un trigger de base de datos.
*   **Parámetros (Body):**
    ```json
    {
      "order_id": "uuid",
      "customer_email": "string",
      "vendor_email": "string"
    }
    ```
*   **Respuesta:**
    *   `200 OK`: `{ "message": "Emails sent successfully" }`
    *   `500 Internal Server Error`: `{ "error": "..." }`

---

### Endpoint: `admin-users`

*   **Método:** `POST`
*   **Descripción:** Realiza acciones administrativas sobre los usuarios. Requiere que el solicitante tenga un rol de 'admin'.
*   **Parámetros (Body):**
    ```json
    {
      "action": "disable" | "enable" | "promote_to_admin",
      "target_user_id": "uuid"
    }
    ```
*   **Respuesta:**
    *   `200 OK`: `{ "message": "Action completed successfully" }`
    *   `401 Unauthorized`: `{ "error": "Caller is not an admin" }`
    *   `404 Not Found`: `{ "error": "Target user not found" }`

---

### Endpoint: `notify-vendor-status`

*   **Método:** `POST`
*   **Descripción:** Notifica a un vendedor sobre un cambio en el estado de su cuenta.
*   **Parámetros (Body):**
    ```json
    {
      "vendor_id": "uuid",
      "new_status": "approved" | "rejected" | "suspended",
      "reason": "string" // Opcional
    }
    ```
*   **Respuesta:**
    *   `200 OK`: `{ "message": "Notification sent" }`

---

### Endpoint: `self-account`

*   **Método:** `POST`
*   **Descripción:** Permite a un usuario realizar acciones sobre su propia cuenta.
*   **Parámetros (Body):**
    ```json
    {
      "action": "delete_my_data"
    }
    ```
*   **Respuesta:**
    *   `200 OK`: `{ "message": "Your account and data are scheduled for deletion." }`
    *   `401 Unauthorized`: `{ "error": "Invalid token" }`
