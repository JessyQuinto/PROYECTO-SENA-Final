# Pruebas Unitarias del Frontend - Tesoros Chocó

Este directorio contiene las pruebas unitarias completas para el frontend del proyecto Tesoros Chocó, un marketplace de artesanías del Chocó, Colombia.

## Estructura de Pruebas

### Componentes (`/components/`)
- **Button.test.tsx** - Pruebas para el componente Button de la UI
- **Input.test.tsx** - Pruebas para el componente Input de la UI
- **ProductCard.test.tsx** - Pruebas para la tarjeta de producto
- **Navigation.test.tsx** - Pruebas para la navegación principal
- **ProductForm.test.tsx** - Pruebas para el formulario de productos
- **AuthForms.test.tsx** - Pruebas para los formularios de autenticación
- **Cart.test.tsx** - Pruebas para el carrito de compras

### Hooks (`/hooks/`)
- **useAuthState.test.ts** - Pruebas para el hook de estado de autenticación
- **useProductsQuery.test.ts** - Pruebas para el hook de consulta de productos
- **useForm.test.ts** - Pruebas para el hook de formularios
- **useDebounce.test.ts** - Pruebas para el hook de debounce

### Librería (`/lib/`)
- **utils.test.ts** - Pruebas para las funciones utilitarias
- **security.test.ts** - Pruebas para las funciones de seguridad
- **cache.test.ts** - Pruebas para el sistema de caché

## Configuración

### Dependencias de Pruebas
- **Vitest** - Framework de pruebas principal
- **@testing-library/react** - Utilidades para probar componentes React
- **@testing-library/jest-dom** - Matchers adicionales para DOM
- **@testing-library/user-event** - Simulación de eventos de usuario
- **jsdom** - Entorno DOM para Node.js
- **happy-dom** - Alternativa más rápida a jsdom

### Configuración de Vitest
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## Ejecución de Pruebas

### Comandos Disponibles
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con interfaz gráfica
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar pruebas una sola vez
npm run test:run
```

### Ejecutar Pruebas Específicas
```bash
# Ejecutar pruebas de un archivo específico
npm test -- ProductCard.test.tsx

# Ejecutar pruebas de un directorio
npm test -- components/

# Ejecutar pruebas con patrón
npm test -- --grep "Button"
```

## Cobertura de Pruebas

### Metas de Cobertura
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Excluir de Cobertura
- Archivos de configuración
- Archivos de tipos TypeScript
- Archivos de entrada (main.tsx)
- Directorio de pruebas

## Patrones de Pruebas

### Componentes React
```typescript
import { render, screen, fireEvent } from '../test-utils';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<Component />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Hooks Personalizados
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useHookName', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useHookName());
    act(() => {
      result.current.updateValue('new value');
    });
    expect(result.current.value).toBe('new value');
  });
});
```

### Mocks y Stubs
```typescript
// Mock de hooks
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock de navegación
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock de Supabase
const mockSupabase = {
  auth: { signIn: vi.fn() },
  from: vi.fn(() => ({ select: vi.fn() })),
};
```

## Utilidades de Pruebas

### test-utils.tsx
```typescript
// Render personalizado con providers
export function render(ui: ReactElement, options?: RenderOptions) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Datos mock comunes
export const mockUser = { id: 'user-1', email: 'test@example.com' };
export const mockProduct = { id: 'prod-1', name: 'Test Product' };
```

### setup.ts
```typescript
import '@testing-library/jest-dom';

// Mocks globales
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});
```

## Mejores Prácticas

### Nomenclatura
- Archivos de prueba: `ComponentName.test.tsx`
- Describe blocks: Nombre del componente/hook
- Casos de prueba: Descripción clara de la funcionalidad

### Organización
- Agrupar pruebas relacionadas en `describe` blocks
- Usar `beforeEach` para configuración común
- Limpiar mocks después de cada prueba

### Assertions
- Usar matchers específicos de jest-dom
- Verificar comportamiento, no implementación
- Probar casos edge y errores

### Performance
- Usar `vi.useFakeTimers()` para pruebas de tiempo
- Mockear operaciones costosas (API calls, storage)
- Limpiar timers y listeners después de las pruebas

## Debugging

### Logs de Pruebas
```bash
# Ver logs detallados
npm test -- --reporter=verbose

# Ejecutar una sola prueba
npm test -- --run ProductCard.test.tsx
```

### Debug en VS Code
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--reporter=verbose"],
  "console": "integratedTerminal"
}
```

## Integración Continua

### GitHub Actions
```yaml
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage Report
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

## Recursos Adicionales

- [Documentación de Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
