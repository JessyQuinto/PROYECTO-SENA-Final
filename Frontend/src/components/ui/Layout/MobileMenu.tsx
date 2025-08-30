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
    } catch (error) {
      console.error('[MobileMenu] Error during signOut:', error);
    } finally {
      onClose();
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
      className='
        md:hidden 
        border-t border-border/50 
        bg-card/95 backdrop-blur-sm
        shadow-lg
        animate-in slide-in-up
        mobile-scroll
      '
      role='region'
      aria-label='Menú de navegación móvil'
    >
      <div className='px-4 py-6 space-y-4'>
        {/* Theme toggle - optimizado para móviles */}
        <div className='flex items-center justify-between py-3 px-2 rounded-lg bg-muted/30'>
          <span className='text-sm font-medium text-foreground'>Tema</span>
          <div className='touch-target'>
            <ThemeToggle />
          </div>
        </div>

        {/* Cart link for buyers - optimizado para móviles */}
        {user?.role === 'comprador' && (
          <Link
            to='/carrito'
            onClick={onClose}
            className='
              flex items-center justify-between 
              rounded-lg px-4 py-4 
              text-base font-medium 
              transition-all duration-200
              bg-primary/5 hover:bg-primary/10
              touch-target
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            '
            aria-label={`Ir al carrito${cartCount > 0 ? ` (${cartCount} artículos)` : ''}`}
          >
            <div className='flex items-center gap-3'>
              <svg
                className='w-6 h-6 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01'
                />
              </svg>
              <span>Carrito</span>
            </div>
            {cartCount > 0 && (
              <span 
                className='
                  flex h-6 w-6 items-center justify-center 
                  rounded-full bg-destructive text-xs font-bold text-destructive-foreground
                  animate-pulse
                '
                aria-label={`${cartCount} artículos en el carrito`}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        )}

        {/* Navigation items - optimizados para móviles */}
        <nav className='space-y-2' role='navigation' aria-label='Elementos de navegación'>
          {items.map(item => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'block rounded-lg px-4 py-4 text-base font-medium transition-all duration-200 touch-target',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section - optimizado para móviles */}
        {user ? (
          <div className='border-t border-border/50 pt-6 mt-6'>
            <div className='flex items-center justify-between p-4 rounded-lg bg-muted/30'>
              <div className='flex items-center space-x-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-sm'>
                  {getUserInitial()}
                </div>
                <div className='flex flex-col'>
                  <span className='text-base font-medium text-foreground'>
                    {user.nombre || user.email}
                  </span>
                  <div className='flex items-center space-x-2 mt-1'>
                    <span className='text-sm text-muted-foreground capitalize'>
                      {user.role}
                    </span>
                    {user.role === 'vendedor' && user.vendedor_estado && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
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
                className='touch-target'
                aria-label='Cerrar sesión'
              >
                Salir
              </Button>
            </div>
          </div>
        ) : (
          <div className='border-t border-border/50 pt-6 mt-6 space-y-3'>
            <Link to='/login' onClick={onClose} className='block'>
              <Button variant='outline' className='w-full touch-target-lg text-base py-3'>
                Iniciar sesión
              </Button>
            </Link>
            <Link to='/register' onClick={onClose} className='block'>
              <Button className='w-full touch-target-lg text-base py-3'>
                Crear cuenta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
