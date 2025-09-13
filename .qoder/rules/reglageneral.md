---
trigger: manual
---
# Reglas Generales del Proyecto Tesoros Chocó

## 1. Estructura del Proyecto

### 1.1 Organización de Directorios
- **Backend/**: API REST con Express y Supabase
  - `src/lib/`: Gestión de caché y cliente Supabase
  - `src/index.ts`: Punto de entrada del servidor
- **Frontend/**: Aplicación React con Vite, TypeScript y Tailwind CSS
  - `src/components/`: Componentes reutilizables y de seguridad
  - `src/hooks/`: Hooks personalizados (autenticación, caché, notificaciones)
  - `src/lib/`: Utilidades, logging, manejo de errores, CSP
  - `src/modules/`: Lógica por roles (admin, buyer, vendor)
  - `src/pages/`: Páginas de la aplicación
  - `src/services/`: Servicios como notificaciones
  - `src/types/`: Tipos TypeScript
- **Docs/**: Documentación técnica detallada (arquitectura, API, seguridad, despliegue)

### 1.2 Convenciones de Nombramiento
- Los archivos deben usar `kebab-case` (ej: `user-service.ts`)
- Los componentes React deben usar `PascalCase` (ej: `UserProfile.tsx`)
- Las variables y funciones deben usar `camelCase` (ej: `getUserData()`)
- Las constantes deben usar `UPPER_SNAKE_CASE` (ej: `API_BASE_URL`)

## 2. Estilo de Código

### 2.1 TypeScript/JavaScript
- Usar `const` y `let` en lugar de `var`
- Preferir funciones flecha para callbacks
- Utilizar `async/await` en lugar de callbacks
- Aplicar desestructuración cuando sea posible
- Usar tipos explícitos en TypeScript
- Validar entradas con Zod para seguridad en APIs

### 2.2 React
- Utilizar hooks funcionales en lugar de componentes de clase
- Separar lógica de presentación en hooks personalizados
- Usar `React.FC` para tipar componentes
- Implementar memoización cuando sea necesario
- Utilizar patrones de Provider (AuthContext, CacheProvider, ThemeProvider)
- Implementar Route Guards para protección de rutas por roles

## 3. Gestión de Estado

### 3.1 Contexto de React
- Crear contextos específicos por dominio (AuthContext, CartContext)
- Proveer valores por defecto en los contextos
- Usar reducers para estados complejos

### 3.2 Caché
- Implementar estrategias de caché para datos no sensibles
- Invalidar caché cuando los datos cambien
- Usar tiempo de expiración apropiado para cada tipo de dato

## 4. Seguridad

### 4.1 Autenticación
- supabace mcp

### 4.2 Validación de Datos
- Validar todas las entradas del usuario en el backend
- Usar bibliotecas de validación como Zod
- Sanitizar datos antes de almacenarlos
- Implementar Content Security Policy (CSP)

### 4.3 CORS y Headers
- Configurar correctamente los orígenes permitidos
- Implementar Content Security Policy (CSP)
- Usar headers de seguridad recomendados

## 5. Pruebas

### 5.1 Cobertura
- Mínimo 80% de cobertura en archivos críticos
- Pruebas unitarias para funciones puras
- Pruebas de integración para flujos completos

### 5.2 Buenas Prácticas
- Usar nombres descriptivos para las pruebas
- Evitar dependencias entre pruebas
- Mockear servicios externos

## 6. Documentación

### 6.1 Código
- Comentar funciones complejas
- Usar JSDoc para funciones públicas
- Mantener READMEs actualizados

### 6.2 APIs
- Documentar todos los endpoints
- Especificar códigos de estado HTTP
- Incluir ejemplos de uso

## 7. Despliegue

### 7.1 Variables de Entorno
- No hardcodear secretos
- Usar archivos .env para configuraciones
- Diferenciar entre entornos (dev, staging, prod)
- **Frontend** (`Frontend/.env.local`):
  - `VITE_SUPABASE_URL`: URL de Supabase
  - `VITE_SUPABASE_ANON_KEY`: API Key de Supabase
  - `VITE_BACKEND_URL`: URL del backend (http://localhost:4000)
- **Backend** (`Backend/.env`):
  - `SUPABASE_URL`: URL de Supabase
  - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase
  - `FRONTEND_ORIGINS`: Orígenes permitidos (http://localhost:3000)

### 7.2 Optimización
- Minificar assets en producción
- Implementar estrategias de caching
- Comprimir respuestas HTTP

## 8. Manejo de Errores

### 8.1 Logging
- Registrar errores en archivos o servicios externos
- No exponer información sensible en mensajes de error
- Usar niveles de log apropiados (info, warn, error)

### 8.2 Respuestas al Cliente
- Manejar errores de forma consistente
- Proporcionar mensajes útiles al usuario
- No revelar detalles internos del sistema

## 9. Rendimiento

### 9.1 Carga de Datos
- Implementar paginación para listados grandes
- Usar carga diferida cuando sea apropiado
- Optimizar consultas a base de datos
- Implementar estrategias de caching en frontend y backend

### 9.2 Recursos
- Comprimir imágenes y assets
- Usar formatos modernos cuando sea posible
- Implementar pre-carga estratégica
- Optimizar para entornos móviles y bajo ancho de banda (Service Workers, imágenes optimizadas)

## 10. Git y Control de Versiones

### 10.1 Commits
- Usar mensajes descriptivos en commits
- Seguir convenciones de commits semánticos
- Hacer commits pequeños y frecuentes

### 10.2 Ramas
- Usar ramas por feature
- Nombrar ramas con prefijos descriptivos (feature/, bugfix/, etc.)
- Hacer merge con pull requests

### 10.3 Pull Requests
- Revisar código antes de mergear
- Incluir descripción detallada del cambio
- Asegurar que pasen todas las pruebas

## 11. Integración con Supabase

### 11.1 Configuración
- Utilizar PostgreSQL como base de datos
- Usar Supabase Auth para autenticación
- Implementar políticas de seguridad a nivel de fila (RLS)
- Utilizar Supabase Storage para archivos

### 11.2 Políticas de Seguridad
- Implementar RLS para cada rol (admin, vendedor, comprador)
- Validar permisos en todas las operaciones de base de datos

## 14. Estructura de APIs

### 14.1 Principios de Diseño
- Seguir principios REST para recursos
- Usar endpoints RPC para operaciones complejas
- Implementar middlewares de autenticación y autorización por roles

### 14.2 Roles y Permisos
- **Administrador**: Acceso completo al sistema
- **Vendedor**: Gestión de productos, pedidos y perfil
- **Comprador**: Navegación de productos, carrito y pedidos

## 12. Comandos de Ejecución

### 12.1 Desarrollo
- **Backend**: `cd Backend && bun run dev` (puerto 4000)
- **Frontend**: `cd Frontend && bun run dev` (puerto 3000)

### 12.2 Pruebas
- **Frontend**: `cd Frontend && bun run test`
- **Backend**: `cd Backend && bun run test`

### 12.3 Build
- **Frontend**: `cd Frontend && bun run build`
- **Backend**: Compilación con TypeScript

## 13. Requisitos del Sistema

### 13.1 Herramientas Obligatorias
- Node.js >= 20.0.0
- Bun o npm como gestor de paquetes
- Cuenta en Supabase
- Git para control de versiones

### 13.2 Dependencias Clave
- @supabase/supabase-js: ^2.57.3
- axios: ^1.11.0
- dompurify: ^3.2.6
- vitest: ^3.2.4
- React y React DOM
- Express.js
- TypeScript >= 4.0

## 15. Pruebas y Calidad

### 15.1 Frameworks de Pruebas
- Vitest para pruebas unitarias
- @testing-library/react para pruebas de componentes
- jsdom y happy-dom para entornos de prueba

### 15.2 Control de Calidad
- Husky para pre-commit hooks
- ESLint para linting de código
- Lighthouse para auditorías de rendimiento
- Cobertura mínima de 80% en archivos críticos