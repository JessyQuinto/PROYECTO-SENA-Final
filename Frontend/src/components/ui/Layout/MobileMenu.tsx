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
      <div className='px-3 py-3 space-y-3'>
        {/* Navegación principal - Solo las opciones principales */}
        <nav className='space-y-1' role='navigation' aria-label='Navegación principal'>
          {items.map(item => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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

        {/* Carrito - Solo para compradores */}
        {user?.role === 'comprador' && (
          <Link
            to='/carrito'
            onClick={onClose}
            className='flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-t pt-3'
            aria-label={`Ir al carrito${cartCount > 0 ? ` (${cartCount} artículos)` : ''}`}
          >
            <div className='flex items-center space-x-2'>
              <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 10H19M7 13v10a2 2 0 002 2h10a2 2 0 002-2V13M7 13L5.4 5M7 13h10' />
              </svg>
              <span>Carrito</span>
            </div>
            {cartCount > 0 && (
              <span 
                className='flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground'
                aria-label={`${cartCount} artículos en el carrito`}
              >
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* Theme Toggle Section - Accesible en móvil */}
        <div className='border-t pt-3 mt-4'>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm font-medium text-foreground'>Tema</span>
            <ThemeToggle className='mobile-theme-toggle' />
          </div>
        </div>

        {/* Sección de usuario compacta en la parte inferior */}
        {user ? (
          <div className='border-t pt-3 mt-4'>
            <div className='flex items-center justify-between py-2'>
              <div className='flex items-center space-x-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold'>
                  {getUserInitial()}
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-medium text-foreground truncate max-w-[120px]'>
                    {user.nombre || user.email}
                  </span>
                  <span className='text-xxs text-muted-foreground capitalize'>
                    {user.role}
                  </span>
                </div>
              </div>
              <Button 
                variant='ghost' 
                size='sm' 
                onClick={handleSignOut}
                className='text-xs h-7 px-2'
                aria-label='Cerrar sesión'
              >
                Salir
              </Button>
            </div>
          </div>
        ) : (
          <div className='border-t pt-3 mt-4 space-y-2'>
            <Link to='/login' onClick={onClose} className='block'>
              <Button variant='outline' size='sm' className='w-full text-xs h-8'>
                Iniciar sesión
              </Button>
            </Link>
            <Link to='/register' onClick={onClose} className='block'>
              <Button size='sm' className='w-full text-xs h-8'>Crear cuenta</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
