# Prácticas de Seguridad

## 1. Autenticación

*   **Proveedor:** La autenticación es gestionada por **Supabase Auth**, un servicio basado en GoTrue.
*   **Método:** Se utiliza la autenticación basada en **JSON Web Tokens (JWT)**. Después de un inicio de sesión exitoso, el cliente recibe un JWT que debe incluir en el header `Authorization` de cada solicitud a la API y a las funciones.
*   **Ciclo de Vida del Token:** Los tokens tienen un tiempo de expiración corto. La librería cliente de Supabase se encarga de refrescar el token automáticamente usando un refresh token almacenado de forma segura.
*   **Protección de Contraseña:** Las contraseñas nunca se almacenan en texto plano. Supabase se encarga de hacer el hashing de forma segura.

## 2. Autorización

La autorización (qué puede hacer un usuario autenticado) se implementa en dos niveles:

### 2.1. Seguridad a Nivel de Fila (Row Level Security - RLS)

*   **Tecnología:** Es la característica más importante para la seguridad de los datos. Se utilizan políticas de RLS en la base de datos PostgreSQL.
*   **Funcionamiento:** RLS permite definir reglas que filtran qué filas puede ver o modificar un usuario en una tabla, basándose en su ID de usuario, rol u otros atributos del JWT.
*   **Ejemplos de Políticas:**
    *   Un usuario solo puede ver y editar su propio perfil en la tabla `profiles`.
      ```sql
      -- Política para SELECT
      CREATE POLICY "Users can see their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

      -- Política para UPDATE
      CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
      ```
    *   Un vendedor solo puede ver los pedidos (`orders`) de sus propios productos.
    *   Cualquier usuario puede ver los productos (`products`) que están marcados como `is_published = true`.

### 2.2. Lógica de Autorización en Funciones

*   Para operaciones complejas o que requieren privilegios elevados, la autorización se verifica dentro de las **Supabase Edge Functions**.
*   **Ejemplo:** En la función `admin-users`, el primer paso es verificar si el `auth.uid()` del solicitante corresponde a un usuario con el rol de 'admin' en la base de datos antes de proceder con la lógica.

## 3. Roles de Usuario

El sistema parece diseñado para manejar, como mínimo, los siguientes roles:

*   **Usuario Anónimo:** Puede ver productos y páginas públicas.
*   **Usuario Autenticado (Comprador):** Puede realizar compras, ver su historial de pedidos y gestionar su perfil.
*   **Vendedor:** Puede gestionar sus productos, ver sus ventas y gestionar su perfil de vendedor.
*   **Administrador:** Tiene acceso a paneles de gestión para supervisar usuarios, productos y pedidos.

La gestión de roles se puede implementar añadiendo una columna `role` en la tabla `users` o `profiles` y referenciándola en las políticas de RLS y en las funciones.

## 4. Seguridad del Frontend

*   **Variables de Entorno:** Las claves de Supabase (`SUPABASE_URL` y `SUPABASE_ANON_KEY`) se almacenan en variables de entorno y se exponen al cliente a través de Vite. La `anon_key` es pública y segura de exponer, ya que la seguridad real reside en las políticas de RLS.
*   **Cross-Site Scripting (XSS):** React, por defecto, escapa el contenido renderizado, lo que mitiga los ataques XSS. Se debe tener cuidado al usar `dangerouslySetInnerHTML`.
*   **Cross-Site Request Forgery (CSRF):** No es una preocupación principal en arquitecturas basadas en JWT que no dependen de cookies de sesión para la autenticación.

## 5. Claves y Secretos

*   **NUNCA** se debe incluir en el código fuente ninguna clave privada (`service_role_key` de Supabase, claves de API de pasarelas de pago, etc.).
*   **Gestión de Secretos:**
    *   **Desarrollo Local:** Usar archivos `.env.local`.
    *   **Producción (Funciones):** Usar el gestor de secretos del dashboard de Supabase.
    *   **Producción (CI/CD):** Usar los "Encrypted Secrets" de GitHub Actions.
