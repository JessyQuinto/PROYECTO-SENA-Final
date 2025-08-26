import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

// Separate components for better maintainability
import NavigationMenu from './NavigationMenu.tsx';
import UserMenu, { UserAvatar, SignOutButton } from './UserMenu.tsx';
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
    const handleStorageChange = (e: StorageEvent | Event) => {
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

  const isActivePage = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <nav className='bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link
            to='/'
            className='flex items-center space-x-2 text-xl font-bold text-primary'
          >
            <svg
              className='h-8 w-8'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
              />
            </svg>
            <span className='hidden sm:inline'>Tesoros Chocó</span>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-6'>
            <NavigationMenu items={navItems} currentPath={location.pathname} />
          </div>

          {/* Right side items - Reorganized order */}
          <div className='flex items-center space-x-4'>
            {/* 1. User Avatar (Logo with animation + Name) */}
            {user && !isSigningOut && <UserAvatar user={user} />}

            {/* 2. Cart dropdown */}
            {user?.role === 'comprador' && !isSigningOut && <CartDropdown />}

            {/* 3. Theme toggle */}
            <ThemeToggle />

            {/* 4. Sign out button */}
            {user && !isSigningOut && <SignOutButton />}

            {/* Auth buttons for non-authenticated users */}
            {!user && (
              <div className='flex items-center space-x-2'>
                {/* Desktop auth buttons */}
                <div className='hidden sm:flex items-center space-x-2'>
                  <Link to='/login'>
                    <Button variant='ghost' size='sm'>
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to='/register'>
                    <Button size='sm'>
                      Registrarse
                    </Button>
                  </Link>
                </div>

                {/* Mobile auth icons */}
                <Link
                  to='/login'
                  className='flex sm:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
                  aria-label='Iniciar sesión'
                >
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
                      d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                    />
                  </svg>
                </Link>
                <Link
                  to='/register'
                  className='flex sm:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
                  aria-label='Crear cuenta'
                >
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
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label='Toggle menu'
              aria-expanded={isMobileMenuOpen}
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

        {/* Mobile menu */}
        <MobileMenu
          items={navItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
          currentPath={location.pathname}
        />
      </div>
    </nav>
  );
};

export default Navbar;
