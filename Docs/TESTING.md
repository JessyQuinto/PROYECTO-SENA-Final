# Estrategia de Pruebas (Testing)

## 1. Filosofía de Pruebas

La estrategia de pruebas busca garantizar la fiabilidad, correctitud y robustez de la aplicación. Se enfoca en un enfoque pragmático, priorizando las pruebas en las áreas más críticas del sistema, como los flujos de autenticación, la lógica de negocio de pedidos y los componentes de UI complejos.

## 2. Herramientas Utilizadas

### Frontend:
*   **Framework de Pruebas:** **Vitest**. Es un framework de pruebas moderno y rápido, compatible con la configuración de Vite.
*   **Librería de Utilidades:** **`@testing-library/react`**. Ayuda a escribir pruebas que simulan el comportamiento real del usuario, interactuando con los componentes como lo haría un usuario final.
*   **Pruebas End-to-End (E2E):** (No detectado, pero se recomienda) **Cypress** o **Playwright** para simular flujos completos de usuario en un navegador real.

### Backend (Supabase Functions):
*   **Framework de Pruebas:** **Deno Test Runner**. Las funciones de Supabase se ejecutan en Deno, por lo que se utiliza su corredor de pruebas nativo.
*   **Aserciones:** Librería de aserciones estándar de Deno.
*   **Mocks:** Se utilizan mocks para simular llamadas a la base de datos o a servicios externos durante las pruebas unitarias.

## 3. Tipos de Pruebas

### Frontend (`Frontend/src/test`)

*   **Pruebas Unitarias:**
    *   **Objetivo:** Probar unidades pequeñas y aisladas de lógica, como funciones de utilidad y hooks personalizados.
    *   **Ejemplo:** Probar que un hook `usePriceFormat` formatea correctamente un número a una cadena de moneda.

*   **Pruebas de Componentes:**
    *   **Objetivo:** Renderizar componentes de React de forma aislada y verificar su comportamiento ante diferentes props y eventos de usuario.
    *   **Ejemplo:** Probar que un componente `Button` ejecuta la función `onClick` cuando se hace clic en él, o que se muestra correctamente en su estado `disabled`.

*   **Pruebas de Integración:**
    *   **Objetivo:** Probar cómo múltiples componentes interactúan entre sí en una página o flujo pequeño.
    *   **Ejemplo:** Probar que al rellenar un formulario de login (`LoginPage.tsx`) y hacer clic en "Enviar", se realiza la llamada a la función de autenticación.

### Backend (`supabase/functions/.../index.test.ts`)

*   **Pruebas Unitarias:**
    *   **Objetivo:** Probar la lógica interna de una función de Supabase de forma aislada, sin depender de una base de datos real.
    *   **Ejemplo:** Probar la lógica de validación de entrada de la función `order-emails`, asegurándose de que rechaza peticiones con datos malformados.

*   **Pruebas de Integración:**
    *   **Objetivo:** Probar una función de Supabase con una base de datos de prueba real (el entorno local de Supabase).
    *   **Ejemplo:** Probar que la función `create-order` realmente inserta las filas correctas en las tablas `orders` y `order_items` en la base de datos de prueba.

## 4. Ejecución de Pruebas

### Frontend

Para ejecutar todas las pruebas del frontend, navega a la carpeta `Frontend` y ejecuta:
```bash
bun test
```
O en modo de vigilancia (watch mode):
```bash
bun test --watch
```

### Backend

Para ejecutar las pruebas de una función específica, navega a la carpeta de la función y usa el comando de Deno:
```bash
cd supabase/functions/my-function
deno test --allow-all
```
