# Documentación del Frontend

## 1. Visión General

El frontend es una Single Page Application (SPA) construida con el objetivo de ser rápida, moderna y fácil de mantener. Es responsable de renderizar la interfaz de usuario, gestionar el estado de la aplicación del lado del cliente y comunicarse con el backend de Supabase.

## 2. Tecnologías y Librerías Clave

*   **Framework Principal:** **React 18**
*   **Lenguaje:** **TypeScript**
*   **Empaquetador y Servidor de Desarrollo:** **Vite**
*   **Enrutamiento:** **React Router DOM**
*   **Estilos:** **Tailwind CSS** con PostCSS.
*   **Cliente de Backend:** **`@supabase/supabase-js`** para interactuar con la API de Supabase.
*   **Linting y Formateo:** ESLint y Prettier, con hooks de pre-commit gestionados por Husky.
*   **Pruebas:** **Vitest** para pruebas unitarias y de componentes.

## 3. Estructura de Carpetas (`Frontend/src`)

La estructura del código fuente está organizada para promover la modularidad y la separación de responsabilidades.

*   `main.tsx`: Punto de entrada de la aplicación. Aquí se inicializa React y se monta el componente principal.
*   `styles.css`: Archivo de estilos globales, principalmente para las directivas de Tailwind CSS.
*   `pages/`: Contiene los componentes de nivel superior que corresponden a las rutas de la aplicación (ej: `HomePage.tsx`, `LoginPage.tsx`, `ProductDetailsPage.tsx`).
*   `components/`: Almacena componentes de UI reutilizables que se utilizan en varias páginas.
    *   `components/ui/`: Componentes genéricos de UI (botones, inputs, modales).
    *   `components/layout/`: Componentes de estructura (Navbar, Footer, Sidebar).
    *   `components/product/`: Componentes específicos para la lógica de productos (ProductCard, ProductList).
*   `hooks/`: Contiene hooks personalizados de React (ej: `useAuth.ts`, `useProducts.ts`) para encapsular lógica y estado.
*   `lib/`: Módulos de utilidad y configuración.
    *   `lib/supabaseClient.ts`: Configuración e inicialización del cliente de Supabase.
*   `auth/`: Lógica y componentes relacionados específicamente con la autenticación.
*   `types/`: Definiciones de tipos e interfaces de TypeScript que se usan en todo el proyecto (ej: `Product`, `User`, `Order`).
*   `test/`: Archivos de prueba para los componentes y la lógica de la aplicación.

## 4. Dependencias Principales (`package.json`)

### Dependencias de Producción (`dependencies`):
*   `@supabase/supabase-js`: Cliente oficial para interactuar con Supabase.
*   `react`, `react-dom`: Librerías principales de React.
*   `react-router-dom`: Para el enrutamiento del lado del cliente.
*   `tailwindcss`: Framework de CSS para el diseño.
*   (Otras librerías como `axios`, `date-fns`, `zod` pueden estar presentes para tareas específicas).

### Dependencias de Desarrollo (`devDependencies`):
*   `@types/react`, `@types/react-dom`: Tipos de TypeScript para React.
*   `@vitejs/plugin-react`: Plugin de Vite para habilitar el soporte de React.
*   `autoprefixer`, `postcss`: Para procesar el CSS de Tailwind.
*   `eslint`, `prettier`: Herramientas para mantener la calidad y consistencia del código.
*   `husky`: Para ejecutar scripts en los hooks de Git (ej: `pre-commit`).
*   `typescript`: El compilador de TypeScript.
*   `vite`: El empaquetador y servidor de desarrollo.
*   `vitest`, `@testing-library/react`: Para el entorno de pruebas.
