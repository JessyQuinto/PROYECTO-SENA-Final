import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test-utils';
import Cart from '@/pages/Cart';

describe('Cart Component', () => {
  it('renders cart page title', () => {
    render(<Cart />);
    
    expect(screen.getByText('Carrito de Compras')).toBeInTheDocument();
  });

  it('displays development message', () => {
    render(<Cart />);
    
    expect(screen.getByText('Carrito de compras en desarrollo.')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<Cart />);
    
    const container = screen.getByText('Carrito de Compras').closest('div');
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
    
    const card = screen.getByText('Carrito de compras en desarrollo.').closest('div');
    expect(card).toHaveClass('bg-card', 'rounded-lg', 'p-6', 'border', 'border-border');
  });

  it('renders with proper structure', () => {
    render(<Cart />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Carrito de Compras');
  });

  it('displays muted text styling', () => {
    render(<Cart />);
    
    const message = screen.getByText('Carrito de compras en desarrollo.');
    expect(message).toHaveClass('text-muted-foreground');
  });
});
