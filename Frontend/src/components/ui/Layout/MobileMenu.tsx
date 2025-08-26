import React, { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useCart } from '@/modules/buyer/CartContext';
import { Button } from '@/components/ui/shadcn/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  public?: boolean;
  roles?: string[];
  requireApproval?: boolean;
}

interface User {
  email?: string;
  nombre?: string;
  role?: string;
  vendedor_estado?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  user: User | null;
  currentPath: string;
  id?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  items,
  user,
  currentPath,
  id = 'mobile-navigation-menu',
}) => {
  const { signOut } = useAuth();
  const { items: cartItems } = useCart();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);
  
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.cantidad || 0),
    0
  );

  // Handle keyboard navigation and accessibility
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    
    if (event.key === 'Tab') {
      const focusableElements = menuRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  // Set up focus management and keyboard handlers
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element when menu opens
      const timer = setTimeout(() => {
        const firstFocusable = menuRef.current?.querySelector(
          'a, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('[MobileMenu] Sign out error:', error);
      onClose(); // Close menu even if sign out fails
    }
  };

  const getUserInitial = () => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      id={id}
      className='md:hidden border-t bg-card shadow-lg'
      role='region'
      aria-label='Menú de navegación móvil'
    >
      <div className='px-4 py-4 space-y-4'>
        {/* Theme toggle */}
        <div className='flex items-center justify-between py-3 border-b'>
          <span className='text-sm font-medium'>Tema</span>
          <ThemeToggle />
        </div>

        {/* Cart link for buyers */}
        {user?.role === 'comprador' && (
          <Link
            to='/carrito'
            onClick={onClose}
            className='flex items-center justify-between rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label={`Ir al carrito${cartCount > 0 ? ` (${cartCount} artículos)` : ''}`}
          >
            <span>Carrito</span>
            {cartCount > 0 && (
              <span 
                className='flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground'
                aria-label={`${cartCount} artículos en el carrito`}
              >
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* Navigation items */}
        <nav className='space-y-2' role='navigation' aria-label='Elementos de navegación'>
          {items.map(item => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'block rounded-md px-4 py-3 text-base font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {user ? (
          <div className='border-t pt-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
                  {getUserInitial()}
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-foreground'>
                    {user.nombre || user.email}
                  </span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-xs text-muted-foreground capitalize'>
                      {user.role}
                    </span>
                    {user.role === 'vendedor' && user.vendedor_estado && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          {
                            'bg-green-100 text-green-800':
                              user.vendedor_estado === 'aprobado',
                            'bg-yellow-100 text-yellow-800':
                              user.vendedor_estado === 'pendiente',
                            'bg-red-100 text-red-800':
                              user.vendedor_estado === 'rechazado',
                          }
                        )}
                      >
                        {user.vendedor_estado}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant='outline' 
                size='sm' 
                onClick={handleSignOut}
                aria-label='Cerrar sesión'
              >
                Salir
              </Button>
            </div>
          </div>
        ) : (
          <div className='border-t pt-4 space-y-2'>
            <Link to='/login' onClick={onClose} className='block'>
              <Button variant='outline' className='w-full'>
                Iniciar sesión
              </Button>
            </Link>
            <Link to='/register' onClick={onClose} className='block'>
              <Button className='w-full'>Crear cuenta</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
