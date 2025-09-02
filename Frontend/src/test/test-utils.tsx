import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Custom render function that includes providers
function render(ui: ReactElement, options?: RenderOptions) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    role: 'buyer',
  },
};

export const mockProduct = {
  id: 'test-product-id',
  nombre: 'Test Product',
  descripcion: 'A test product description',
  precio: 99.99,
  vendedor_id: 'test-seller-id',
  categoria_id: 'test-category-id',
  stock: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  imagen_url: '/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg',
};

export const mockCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  description: 'A test category',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { render };
