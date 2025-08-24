import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

// Separate components for better maintainability
import NavigationMenu from './NavigationMenu.tsx';
import UserMenu from './UserMenu.tsx';
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
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  const visibleNavItems = navigationItems.filter(item => {
    if (item.public) return true;
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role || '')) return false;
    if (
      item.requireApproval &&
      user.role === 'vendedor' &&
      user.vendedor_estado !== 'aprobado'
    )
      return false;
    return true;
  });

  const isActivePage = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-surface-primary/95 backdrop-blur supports-[backdrop-filter]:bg-surface-primary/60">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 text-xl font-bold text-foreground transition-colors hover:text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">TC</span>
              </div>
              <span className="hidden sm:block">Tesoros Chocó</span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu
              items={visibleNavItems}
              currentPath={location.pathname}
              className="hidden md:flex"
            />

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Cart for buyers */}
              {user?.role === 'comprador' && <CartDropdown />}
              
              {/* Theme toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* User menu or auth buttons */}
              {user ? (
                <UserMenu user={user} />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link to="/register" className="hidden sm:block">
                    <Button size="sm">Crear cuenta</Button>
                  </Link>
                  {/* Mobile auth icons */}
                  <Link
                    to="/login"
                    className="flex sm:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="Iniciar sesión"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </Link>
                  <Link
                    to="/register"
                    className="flex sm:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="Crear cuenta"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMobileMenuOpen ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          items={visibleNavItems}
          user={user}
          currentPath={location.pathname}
        />
      </nav>
    </>
  );
};

export default Navbar;
