# Guía de Mantenimiento

## 1. Buenas Prácticas de Código

*   **Consistencia:** Sigue las guías de estilo y formato definidas en los archivos `.eslintrc.js` y `.prettierrc`. Utiliza los hooks de pre-commit (`husky`) para asegurar que el código cumpla con estas reglas antes de ser enviado al repositorio.
*   **Nomenclatura:** Usa nombres claros y descriptivos para variables, funciones y componentes.
*   **Componentes Pequeños:** Prefiere componentes pequeños y enfocados en una sola responsabilidad sobre componentes monolíticos.
*   **Manejo de Errores:** Implementa un manejo de errores robusto tanto en el frontend (mostrando mensajes útiles al usuario) como en el backend (registrando logs y devolviendo códigos de estado HTTP apropiados).
*   **Evitar "Números Mágicos" y Cadenas de Texto Repetidas:** Usa constantes para valores que se repiten o cuyo significado no es obvio.

## 2. Actualización de Dependencias

Las dependencias deben actualizarse periódicamente para incorporar mejoras de seguridad, rendimiento y nuevas funcionalidades.

### Proceso de Actualización

1.  **Revisar dependencias desactualizadas:**
    *   En la carpeta `Frontend` y `Backend`, ejecuta el comando:
      ```bash
      bun update
      ```
      O para una vista más detallada con `npm`:
      ```bash
      npm outdated
      ```

2.  **Actualizar dependencias:**
    *   **Actualizaciones menores (patch) y de características (minor):** Generalmente son seguras de aplicar.
      ```bash
      npm update
      ```
    *   **Actualizaciones mayores (major):** Requieren precaución. Revisa el `CHANGELOG` o las notas de la versión de la librería para entender los cambios que rompen la compatibilidad (`breaking changes`). Actualiza estas dependencias una por una y prueba la aplicación exhaustivamente.

3.  **Probar la aplicación:** Después de cualquier actualización, ejecuta la suite completa de pruebas y realiza una verificación manual de los flujos principales de la aplicación.

## 3. Monitorización y Logs

*   **Frontend:** Utiliza herramientas de monitorización de errores en producción como Sentry o LogRocket para capturar excepciones que ocurran en el navegador de los usuarios.
*   **Backend (Supabase):** Revisa los logs de las funciones y de la API desde el dashboard de Supabase para diagnosticar problemas. Puedes configurar alertas para picos de errores o latencia.

## 4. Copias de Seguridad (Backups)

*   **Base de Datos:** Supabase realiza copias de seguridad automáticas en sus planes de pago. Asegúrate de que esta opción esté activada y entiende el proceso de restauración. Para mayor seguridad, considera realizar copias de seguridad manuales periódicas usando `pg_dump`.
*   **Código:** El código está seguro en el repositorio de GitHub.

## 5. Gestión de Variables de Entorno

*   **Nunca cometer secretos:** Nunca incluyas claves de API, contraseñas o cualquier otra información sensible directamente en el código.
*   **Uso de `.env`:** Utiliza archivos `.env` para el desarrollo local. El archivo `.gitignore` debe incluir `.env` para evitar que se suba al repositorio.
*   **Secretos en Producción:** Configura los secretos en los ajustes del repositorio de GitHub (para GitHub Actions) y en el dashboard de Supabase (para las Edge Functions).
