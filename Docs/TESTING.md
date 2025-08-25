# Estrategia de Testing - Tesoros Chocó

## 🎯 Visión General del Testing

**Tesoros Chocó** implementa una estrategia de testing integral que cubre múltiples niveles de la aplicación, desde pruebas unitarias hasta tests end-to-end. El objetivo es garantizar la calidad del código, prevenir regresiones y facilitar el desarrollo seguro.

## 🏗️ Arquitectura de Testing

### 1. Pirámide de Testing
```
                    ┌─────────────┐
                    │   E2E Tests │ ← Pocos, lentos, costosos
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │Integration  │ ← Algunos, medios
                    │   Tests     │
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │  Unit Tests │ ← Muchos, rápidos, baratos
                    └─────────────┘
```

### 2. Estrategia por Nivel
- **Unit Tests**: 70% - Componentes, hooks, utilidades
- **Integration Tests**: 20% - APIs, flujos de datos
- **E2E Tests**: 10% - Flujos críticos de usuario

## 🧪 Stack de Testing

### Frontend Testing
- **Vitest**: Framework de testing moderno y rápido
- **Testing Library**: Utilidades para testing de componentes
- **Happy DOM**: Entorno de testing ligero para DOM
- **MSW**: Mock Service Worker para APIs
- **React Testing Library**: Testing específico para React

### Backend Testing
- **Jest**: Framework de testing para Node.js
- **Supertest**: Testing de APIs HTTP
- **Nock**: Mocking de requests HTTP
- **Testcontainers**: Testing con bases de datos reales

### E2E Testing
- **Playwright**: Framework moderno para testing E2E
- **Cypress**: Alternativa para testing de UI
- **Selenium**: Testing legacy (si es necesario)

## 📁 Estructura de Tests

### Frontend Tests
```
Frontend/src/test/
├── setup.ts                 # Configuración global de tests
├── test-utils.tsx          # Utilidades para testing
├── mocks/                  # Mocks y fixtures
│   ├── supabase.ts        # Mock de Supabase
│   ├── auth.ts            # Mock de autenticación
│   └── data.ts            # Datos de prueba
├── components/             # Tests de componentes
│   ├── ui/                # Tests de UI components
│   └── modules/           # Tests de módulos
├── hooks/                  # Tests de hooks personalizados
├── lib/                    # Tests de utilidades
└── integration/            # Tests de integración
```

### Backend Tests
```
Backend/tests/
├── unit/                   # Tests unitarios
│   ├── middleware/         # Tests de middleware
│   ├── validation/         # Tests de validación
│   └── utils/              # Tests de utilidades
├── integration/            # Tests de integración
│   ├── api/                # Tests de endpoints
│   └── database/           # Tests de base de datos
├── fixtures/               # Datos de prueba
├── mocks/                  # Mocks y stubs
└── setup.ts                # Configuración de tests
```

## 🔧 Configuración de Testing

### 1. Configuración de Vitest (Frontend)

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib')
    }
  }
});
```

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }))
}));

// Mock de localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
});

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 2. Configuración de Jest (Backend)

#### `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

## 🧩 Testing de Componentes

### 1. Testing de Componentes UI

#### Ejemplo: Button Component
```typescript
// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    
    let button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toHaveClass('border', 'border-input', 'bg-background');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });
});
```

### 2. Testing de Componentes de Módulos

#### Ejemplo: ProductCard Component
```typescript
// src/modules/buyer/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/test/mocks/data';

describe('ProductCard Component', () => {
  const defaultProps = {
    product: mockProduct,
    onAddToCart: vi.fn(),
    onViewDetails: vi.fn()
  };

  it('should display product information correctly', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.getByText(mockProduct.nombre)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.precio}`)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.descripcion)).toBeInTheDocument();
    expect(screen.getByAltText(mockProduct.nombre)).toBeInTheDocument();
  });

  it('should call onAddToCart when add to cart button is clicked', () => {
    render(<ProductCard {...defaultProps} />);
    
    const addToCartButton = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(addToCartButton);
    
    expect(defaultProps.onAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should call onViewDetails when view details button is clicked', () => {
    render(<ProductCard {...defaultProps} />);
    
    const viewDetailsButton = screen.getByRole('button', { name: /ver detalles/i });
    fireEvent.click(viewDetailsButton);
    
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(mockProduct.id);
  });

  it('should show out of stock message when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard {...defaultProps} product={outOfStockProduct} />);
    
    expect(screen.getByText(/sin stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeDisabled();
  });
});
```

## 🎣 Testing de Hooks

### 1. Testing de Hooks Personalizados

#### Ejemplo: useAuth Hook
```typescript
// src/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { mockUser } from '@/test/mocks/auth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should sign in user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle sign in errors', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('invalid@example.com', 'wrongpassword');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Credenciales inválidas');
      expect(result.current.user).toBeNull();
    });
  });

  it('should sign out user', async () => {
    const { result } = renderHook(() => useAuth());
    
    // First sign in
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    // Then sign out
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
```

### 2. Testing de Hooks con Context

#### Ejemplo: useCart Hook
```typescript
// src/hooks/useCart.test.tsx
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { mockProduct } from '@/test/mocks/data';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('useCart Hook', () => {
  it('should add product to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product).toEqual(mockProduct);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('should remove product from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // Add product first
    act(() => {
      result.current.addToCart(mockProduct, 1);
    });
    
    // Remove product
    act(() => {
      result.current.removeFromCart(mockProduct.id);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('should update product quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // Add product
    act(() => {
      result.current.addToCart(mockProduct, 1);
    });
    
    // Update quantity
    act(() => {
      result.current.updateQuantity(mockProduct.id, 3);
    });
    
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('should calculate total correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    const expectedTotal = mockProduct.precio * 2;
    expect(result.current.total).toBe(expectedTotal);
  });
});
```

## 🔌 Testing de APIs

### 1. Testing de Endpoints del Backend

#### Ejemplo: Auth Endpoint
```typescript
// tests/integration/api/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { mockUser } from '../fixtures/users';

describe('POST /auth/post-signup', () => {
  it('should create user profile successfully', async () => {
    const userData = {
      user_id: mockUser.id,
      email: mockUser.email,
      role: 'comprador',
      nombre: mockUser.nombre_completo
    };
    
    const response = await request(app)
      .post('/auth/post-signup')
      .send(userData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user_id).toBe(userData.user_id);
    expect(response.body.data.role).toBe(userData.role);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/auth/post-signup')
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Payload inválido');
    expect(response.body.details.fieldErrors).toBeDefined();
  });

  it('should validate email format', async () => {
    const invalidUserData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'invalid-email',
      role: 'comprador'
    };
    
    const response = await request(app)
      .post('/auth/post-signup')
      .send(invalidUserData)
      .expect(400);
    
    expect(response.body.details.fieldErrors.email).toBeDefined();
  });

  it('should validate role values', async () => {
    const invalidUserData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'invalid-role'
    };
    
    const response = await request(app)
      .post('/auth/post-signup')
      .send(invalidUserData)
      .expect(400);
    
    expect(response.body.details.fieldErrors.role).toBeDefined();
  });
});
```

### 2. Testing de Middleware

#### Ejemplo: CORS Middleware
```typescript
// tests/unit/middleware/cors.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('CORS Middleware', () => {
  it('should allow requests from allowed origins', async () => {
    const response = await request(app)
      .options('/auth/post-signup')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should reject requests from disallowed origins', async () => {
    const response = await request(app)
      .options('/auth/post-signup')
      .set('Origin', 'http://malicious-site.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(400);
    
    expect(response.body.error).toBe('Not allowed by CORS');
  });

  it('should handle preflight requests correctly', async () => {
    const response = await request(app)
      .options('/auth/post-signup')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(200);
    
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
  });
});
```

## 🗄️ Testing de Base de Datos

### 1. Testing con Supabase

#### Ejemplo: Database Operations
```typescript
// tests/integration/database/users.test.ts
import { createClient } from '@supabase/supabase-js';
import { mockUser } from '../fixtures/users';

describe('Users Database Operations', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!
    );
  });

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from('users')
      .delete()
      .eq('email', mockUser.email);
  });

  it('should create user profile', async () => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        nombre_completo: mockUser.nombre_completo
      })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.email).toBe(mockUser.email);
    expect(data.role).toBe(mockUser.role);
  });

  it('should retrieve user by email', async () => {
    // First create user
    await supabase
      .from('users')
      .insert({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        nombre_completo: mockUser.nombre_completo
      });

    // Then retrieve
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', mockUser.email)
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.email).toBe(mockUser.email);
  });

  it('should update user profile', async () => {
    // First create user
    await supabase
      .from('users')
      .insert({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        nombre_completo: mockUser.nombre_completo
      });

    // Then update
    const newName = 'Nuevo Nombre';
    const { data, error } = await supabase
      .from('users')
      .update({ nombre_completo: newName })
      .eq('id', mockUser.id)
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data.nombre_completo).toBe(newName);
  });
});
```

## 🎭 Testing de Integración

### 1. Testing de Flujos Completos

#### Ejemplo: Flujo de Registro
```typescript
// tests/integration/flows/registration.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { createClient } from '@supabase/supabase-js';

describe('User Registration Flow', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!
    );
  });

  it('should complete full registration flow', async () => {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    // 2. Create user profile via API
    const profileData = {
      user_id: authData.user!.id,
      email: 'test@example.com',
      role: 'comprador',
      nombre: 'Usuario Test'
    };

    const response = await request(app)
      .post('/auth/post-signup')
      .send(profileData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user_id).toBe(authData.user!.id);

    // 3. Verify user exists in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select()
      .eq('id', authData.user!.id)
      .single();

    expect(dbError).toBeNull();
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe('test@example.com');
    expect(dbUser.role).toBe('comprador');
  });
});
```

## 🚀 Testing de Performance

### 1. Testing de Rendimiento de Componentes

#### Ejemplo: Performance Testing
```typescript
// tests/performance/ProductGrid.test.tsx
import { render } from '@testing-library/react';
import { ProductGrid } from '@/modules/buyer/ProductGrid';
import { mockProducts } from '@/test/mocks/data';

describe('ProductGrid Performance', () => {
  it('should render 100 products within performance budget', () => {
    const manyProducts = Array.from({ length: 100 }, (_, i) => ({
      ...mockProducts[0],
      id: `product-${i}`,
      nombre: `Producto ${i}`
    }));

    const startTime = performance.now();
    
    render(<ProductGrid products={manyProducts} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Performance budget: 100ms for 100 products
    expect(renderTime).toBeLessThan(100);
  });

  it('should handle large product lists without memory issues', () => {
    const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
      ...mockProducts[0],
      id: `product-${i}`,
      nombre: `Producto ${i}`
    }));

    expect(() => {
      render(<ProductGrid products={largeProductList} />);
    }).not.toThrow();
  });
});
```

### 2. Testing de APIs de Performance

#### Ejemplo: API Response Time
```typescript
// tests/performance/api.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('API Performance', () => {
  it('should respond to health check within 50ms', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/health')
      .expect(200);
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(50);
  });

  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();
    
    const promises = Array.from({ length: concurrentRequests }, () =>
      request(app).get('/health')
    );
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / concurrentRequests;
    
    // Average response time should be less than 100ms
    expect(averageTime).toBeLessThan(100);
  });
});
```

## 📊 Cobertura de Testing

### 1. Configuración de Cobertura

#### Frontend (Vitest)
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

#### Backend (Jest)
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 2. Reportes de Cobertura

#### Generar Reportes
```bash
# Frontend
cd Frontend
bun run test:coverage

# Backend
cd Backend
npm run test:coverage
```

#### Interpretar Reportes
- **Branches**: Cobertura de ramas condicionales
- **Functions**: Cobertura de funciones ejecutadas
- **Lines**: Cobertura de líneas de código ejecutadas
- **Statements**: Cobertura de declaraciones ejecutadas

## 🔄 CI/CD Integration

### 1. GitHub Actions Workflow

#### `.github/workflows/test.yml`
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:e2e
```

### 2. Pre-commit Hooks

#### `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
npm run test:unit
npm run test:integration

# Check coverage
npm run test:coverage:check
```

## 🚨 Troubleshooting de Tests

### 1. Problemas Comunes

#### Tests que Fallan Intermitentemente
```typescript
// Usar waitFor para operaciones asíncronas
await waitFor(() => {
  expect(screen.getByText('Producto cargado')).toBeInTheDocument();
}, { timeout: 5000 });
```

#### Mocks que No Funcionan
```typescript
// Verificar que los mocks están configurados correctamente
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
```

#### Problemas de Timeout
```typescript
// Aumentar timeout para tests lentos
it('should handle slow operations', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### 2. Debugging de Tests

#### Logs de Testing
```typescript
// Agregar logs para debugging
it('should work correctly', () => {
  console.log('Test data:', testData);
  console.log('Component props:', props);
  
  // ... test code
});
```

#### Testing en Modo Debug
```bash
# Frontend
bun run test --reporter=verbose

# Backend
npm run test -- --verbose
```

## 🔮 Futuras Mejoras del Testing

### 1. Testing Avanzado
- **Visual Regression Testing**: Comparación de capturas de pantalla
- **Accessibility Testing**: Tests automatizados de accesibilidad
- **Performance Testing**: Tests de métricas de rendimiento
- **Security Testing**: Tests de vulnerabilidades de seguridad

### 2. Herramientas de Testing
- **Storybook**: Para testing de componentes aislados
- **Playwright**: Para testing E2E más robusto
- **TestCafe**: Alternativa para testing de UI
- **Detox**: Para testing de aplicaciones móviles

### 3. Automatización
- **Test Data Management**: Gestión automatizada de datos de prueba
- **Parallel Testing**: Ejecución paralela de tests
- **Test Retry Logic**: Reintento automático de tests fallidos
- **Smart Test Selection**: Selección inteligente de tests a ejecutar

---

Esta estrategia de testing proporciona una base sólida para garantizar la calidad del código de Tesoros Chocó, cubriendo todos los niveles de la aplicación y facilitando el desarrollo seguro y mantenible.
