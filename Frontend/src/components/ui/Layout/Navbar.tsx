import React, { useState, useEffect, useCallback } from 'react';
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
import { useLogoutFlag } from '@/hooks/useLogoutFlag';

interface NavigationItem {
  path: string;
  label: string;
  public?: boolean;
  roles?: string[];
  requireApproval?: boolean;
}

const Navbar: React.FC = () => {
  // 🔑 USAR EL HOOK ORIGINAL de AuthContext
  const { user, loading, isSigningOut } = useAuth();
  
  // 🔑 CLAVE: Usar hook personalizado para detectar logout
  const isLogoutInProgress = useLogoutFlag();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const location = useLocation();

  // Navigation items definition
  const navigationItems: NavigationItem[] = [
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
  ];

  // Filter navigation items based on user authentication and role
  const filterNavItems = useCallback(() => {
    // 🔑 CLAVE: Si está en proceso de cerrar sesión, mostrar solo items públicos
    if (isSigningOut || isLogoutInProgress) {
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
  }, [user, loading, isSigningOut, isLogoutInProgress]);

  // Update navigation items when user or loading state changes
  useEffect(() => {
    setNavItems(filterNavItems());
  }, [filterNavItems]);

  // 🔑 ESCUCHAR CAMBIOS DE ESTADO DE AUTH para actualizar navegación
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      if (event.detail?.type === 'logout_started') {
        console.log('[Navbar] Auth state changed, updating navigation');
        setNavItems(filterNavItems());
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, [filterNavItems]);

  const effectiveUser = user || null;
  const isSigningOutOrLogoutInProgress = isSigningOut || isLogoutInProgress;

  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Left side - Logo and Navigation */}
          <div className='flex items-center space-x-8'>
            {/* Logo */}
            <Link to='/' className='flex items-center space-x-2'>
              <img
                src='/logo.svg'
                alt='Tesoros Chocó'
                className='h-8 w-8'
              />
              <span className='hidden font-bold sm:inline-block'>
                Tesoros Chocó
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-6'>
              {navItems.map((item) => (
                <NavigationMenu
                  key={item.path}
                  items={[item]}
                  currentPath={location.pathname}
                />
              ))}
            </div>
          </div>

          {/* Right side items - Reorganized order */}
          <div className='flex items-center space-x-4'>
            {/* 1. User Avatar (Logo with animation + Name) */}
            {effectiveUser && !isSigningOutOrLogoutInProgress && <UserAvatar user={effectiveUser} />}

            {/* 2. Cart dropdown */}
            {effectiveUser?.role === 'comprador' && !isSigningOutOrLogoutInProgress && <CartDropdown />}

            {/* 3. Theme toggle */}
            <ThemeToggle />

            {/* 4. Sign out button */}
            {effectiveUser && !isSigningOutOrLogoutInProgress && <SignOutButton />}

            {/* Auth buttons for non-authenticated users */}
            {!effectiveUser && (
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
                  className='sm:hidden p-2 hover:bg-accent rounded-md'
                  aria-label='Iniciar Sesión'
                >
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
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
          user={effectiveUser}
          currentPath={location.pathname}
        />
      </div>
    </nav>
  );
};

export default Navbar;
