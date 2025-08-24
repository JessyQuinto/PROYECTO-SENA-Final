import React from 'react';
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
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  items,
  user,
  currentPath,
}) => {
  const { signOut } = useAuth();
  const { items: cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const getUserInitial = () => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t bg-card">
      <div className="px-4 py-4 space-y-3">
        {/* Theme toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">Tema</span>
          <ThemeToggle />
        </div>

        {/* Cart link for buyers */}
        {user?.role === 'comprador' && (
          <Link
            to="/carrito"
            onClick={onClose}
            className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span>Carrito</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* Navigation items */}
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User section */}
        {user ? (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {getUserInitial()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {user.nombre || user.email}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </span>
                    {user.role === 'vendedor' && user.vendedor_estado && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          {
                            'bg-green-100 text-green-800': user.vendedor_estado === 'aprobado',
                            'bg-yellow-100 text-yellow-800': user.vendedor_estado === 'pendiente',
                            'bg-red-100 text-red-800': user.vendedor_estado === 'rechazado',
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
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Salir
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4 space-y-2">
            <Link to="/login" onClick={onClose} className="block">
              <Button variant="outline" className="w-full">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/register" onClick={onClose} className="block">
              <Button className="w-full">
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