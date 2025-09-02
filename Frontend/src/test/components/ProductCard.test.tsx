import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import ProductCard from '@/modules/buyer/ProductCard';
import { mockProduct } from '../test-utils';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the useCart hook
const mockAddToCart = vi.fn();
const mockRequireCartAccess = vi.fn(() => true);
vi.mock('@/modules/buyer/CartContext', () => ({
  useCart: () => ({
    add: mockAddToCart,
  }),
}));

vi.mock('@/hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    requireCartAccess: mockRequireCartAccess,
  }),
}));

describe('ProductCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product card with basic structure', () => {
    render(<ProductCard product={mockProduct as any} />);
    
    // Should render the card container with the specific class
    const card = screen.getByRole('button', { name: /Test Product/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('product-card', 'mobile-card');
  });

  it('renders product link', () => {
    render(<ProductCard product={mockProduct as any} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/productos/${mockProduct.id}`);
  });

  it('handles click to navigate to product detail', () => {
    render(<ProductCard product={mockProduct as any} />);
    
    const card = screen.getByRole('button', { name: /Test Product/i });
    fireEvent.click(card);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/productos/${mockProduct.id}`);
  });

  it('shows new product badge for recent products', () => {
    const recentProduct = { 
      ...mockProduct, 
      created_at: new Date().toISOString() 
    } as any;
    render(<ProductCard product={recentProduct} />);
    
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('shows low stock badge for products with stock <= 5', () => {
    const lowStockProduct = { ...mockProduct, stock: 2 } as any;
    render(<ProductCard product={lowStockProduct} />);
    
    expect(screen.getByText('Stock bajo')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<ProductCard product={mockProduct as any} />);
    
    const card = screen.getByRole('button', { name: /Test Product/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(mockNavigate).toHaveBeenCalledWith(`/productos/${mockProduct.id}`);
  });

  it('adds product to cart when add to cart button is clicked', () => {
    render(<ProductCard product={mockProduct as any} />);
    
    const addToCartButton = screen.getByRole('button', { name: /añadir/i });
    fireEvent.click(addToCartButton);
    
    expect(mockAddToCart).toHaveBeenCalledWith({
      productoId: mockProduct.id,
      nombre: mockProduct.nombre,
      precio: mockProduct.precio,
      cantidad: 1,
      imagenUrl: mockProduct.imagen_url,
      stock: mockProduct.stock,
    });
  });
});
