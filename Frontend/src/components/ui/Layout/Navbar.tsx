import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
// import { cn } from '@/lib/utils';

// Separate components for better maintainability
import NavigationMenu from './NavigationMenu.tsx';
import { UserAvatar, SignOutButton } from './UserMenu.tsx';
import CartDropdown from './CartDropdown.tsx';
import MobileMenu from './MobileMenu.tsx';

interface NavigationItem {
  path: string;
  label: string;
  public?: boolean;
  roles?: string[];
  requireApproval?: boolean;
}

const Navbar: React.FC = () => {
  const { user, loading, isSigningOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const location = useLocation();

  // Memoize navigation items to prevent recreation
  const navigationItems: NavigationItem[] = useMemo(() => [
    { path: '/', label: 'Inicio', public: true },
    { path: '/productos', label: 'Productos', public: true },
    { path: '/perfil', label: 'Mi perfil', roles: ['comprador'] },
    {
      path: '/vendedor',
      label: 'Panel Vendedor',
      roles: ['vendedor'],
      requireApproval: true,
    },
    {
      path: '/admin',
      label: 'Administración',
      roles: ['admin'],
    },
  ], []);

  // Filter navigation items based on user authentication and role - memoized
  const filterNavItems = useCallback(() => {
    // Si está en proceso de cerrar sesión, mostrar solo items públicos
    if (isSigningOut) {
      return navigationItems.filter(item => item.public);
    }

    return navigationItems.filter(item => {
      if (item.public) return true;
      if (!user || loading) return false;
      if (item.roles && !item.roles.includes(user.role || '')) return false;
      if (
        item.requireApproval &&
        user.role === 'vendedor' &&
        user.vendedor_estado !== 'aprobado'
      )
        return false;
      return true;
    });
  }, [user, loading, isSigningOut, navigationItems]);

  // Memoize filtered navigation items
  const filteredNavItems = useMemo(() => filterNavItems(), [filterNavItems]);

  // Consolidated effect for navigation updates and event listeners
  useEffect(() => {
    // Update navigation items when auth state changes
    setNavItems(filteredNavItems);

    // Event handlers
    const handleStorageChange = () => {
      console.log(
        '[Navbar] Storage/logout event detected, updating navigation'
      );
      // No actualizar inmediatamente si está en transición
      if (!isSigningOut) {
        setNavItems(filterNavItems());
      }
      setIsMobileMenuOpen(false);
    };

    const handleLogout = (e: CustomEvent) => {
      console.log('[Navbar] Custom logout event detected:', e.detail);
      // Mostrar solo items públicos inmediatamente
      setNavItems(navigationItems.filter(item => item.public));
      setIsMobileMenuOpen(false);
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedOut', handleLogout as EventListener);
    window.addEventListener('userStateCleanup', handleLogout as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedOut', handleLogout as EventListener);
      window.removeEventListener('userStateCleanup', handleLogout as EventListener);
    };
  }, [filteredNavItems, filterNavItems, isSigningOut, navigationItems]);

  // const isActivePage = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <nav
      className='bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-50 safe-area-padding'
      role='navigation'
      aria-label='Navegación principal'
    >
  <div className='mobile-container mx-auto px-2 md:px-0'>
        <div className='flex items-center justify-between h-14 md:h-14'>
          {/* Logo optimizado para móviles */}
          <Link
            to='/'
            className='flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md touch-target'
            aria-label='Ir a página de inicio - Tesoros Chocó'
          >
            <svg
              className='h-6 w-6 md:h-8 md:w-8 flex-shrink-0'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
              />
            </svg>
            <span className='hidden sm:inline text-base md:text-xl'>Tesoros Chocó</span>
            <span className='sm:hidden text-xs font-semibold leading-tight'>TC</span>
          </Link>

          {/* Desktop Navigation - oculto en móviles */}
          <div className='hidden md:flex items-center space-x-6'>
            <NavigationMenu items={navItems} currentPath={location.pathname} />
          </div>

          {/* Right side items - Reorganizados y optimizados para móviles */}
          <div className='flex items-center gap-1.5 md:gap-4'>
            {/* 1. User Avatar (solo en desktop) */}
            <div className='hidden md:block'>
              {user && !isSigningOut && <UserAvatar user={user} />}
            </div>

            {/* 2. Cart dropdown (optimizado para móviles) */}
            {user?.role === 'comprador' && !isSigningOut && (
              <div className='touch-target'>
                <CartDropdown />
              </div>
            )}

            {/* 3. Theme toggle
                - Desktop only to avoid duplication on mobile (mobile toggle lives in MobileMenu)
            */}
            {/* Toggle de tema - solo visible en desktop */}
            <div className="hidden md:flex items-center">
              <ThemeToggle />
            </div>

            {/* 4. Sign out button (solo en desktop) */}
            <div className='hidden md:block'>
              {user && !isSigningOut && <SignOutButton />}
            </div>

            {/* Auth buttons for non-authenticated users */}
            {!user && (
              <div className='flex items-center space-x-2'>
                {/* Desktop auth buttons */}
                <div className='hidden sm:flex items-center space-x-2'>
                  <Link to='/login'>
                    <Button variant='ghost' size='sm' className='touch-target'>
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to='/register'>
                    <Button size='sm' className='touch-target'>
                      Registrarse
                    </Button>
                  </Link>
                </div>

                {/* Mobile auth icons - optimizados para táctil */}
                <Link
                  to='/login'
                  className='flex sm:hidden touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  aria-label='Iniciar sesión'
                  title='Iniciar sesión'
                >
                  <svg
                    className='h-5 w-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                    />
                  </svg>
                </Link>
                <Link
                  to='/register'
                  className='flex sm:hidden touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  aria-label='Crear cuenta'
                  title='Crear cuenta'
                >
                  <svg
                    className='h-5 w-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </Link>
              </div>
            )}

            {/* Mobile menu button - optimizado para táctil */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden touch-target p-1.5'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
              aria-controls='mobile-navigation-menu'
            >
              {isMobileMenuOpen ? (
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              ) : (
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu optimizado */}
        <MobileMenu
          items={navItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
          currentPath={location.pathname}
          id='mobile-navigation-menu'
        />
      </div>
    </nav>
  );
};

export default Navbar;
