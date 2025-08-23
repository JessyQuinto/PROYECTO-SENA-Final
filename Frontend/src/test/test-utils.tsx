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
  name: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  seller_id: 'test-seller-id',
  category_id: 'test-category-id',
  stock_quantity: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
