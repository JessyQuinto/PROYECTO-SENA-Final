import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/auth/AuthContext';

interface UserAvatarProps {
  user: SessionUser;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Vendedor';
      case 'comprador':
        return 'Comprador';
      default:
        return 'Usuario';
    }
  };

  return (
    <div className='relative'>
      <Button
        variant='ghost'
        size='icon'
        className='relative h-8 w-8 rounded-full'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label='User menu'
        aria-expanded={isDropdownOpen}
      >
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium'>
          {getInitials(user.nombre)}
        </div>
      </Button>

      {isDropdownOpen && (
        <div className='absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover p-2 shadow-lg'>
          <div className='p-2'>
            <div className='mb-2 text-sm font-medium'>
              {user.nombre || 'Usuario'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {getRoleLabel(user.role)}
            </div>
            {user.role === 'vendedor' && user.vendedor_estado && (
              <div className='mt-1 text-xs'>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                    {
                      'bg-yellow-100 text-yellow-800':
                        user.vendedor_estado === 'pendiente',
                      'bg-green-100 text-green-800':
                        user.vendedor_estado === 'aprobado',
                      'bg-red-100 text-red-800':
                        user.vendedor_estado === 'rechazado',
                    }
                  )}
                >
                  {user.vendedor_estado === 'pendiente' && 'Pendiente de aprobación'}
                  {user.vendedor_estado === 'aprobado' && 'Aprobado'}
                  {user.vendedor_estado === 'rechazado' && 'Rechazado'}
                </span>
              </div>
            )}
          </div>

          <div className='border-t pt-2'>
            <Link
              to='/perfil'
              className='block w-full rounded-md px-3 py-2 text-sm hover:bg-accent text-left'
              onClick={() => setIsDropdownOpen(false)}
            >
              Mi Perfil
            </Link>
            {user.role === 'vendedor' && (
              <Link
                to='/vendedor'
                className='block w-full rounded-md px-3 py-2 text-sm hover:bg-accent text-left'
                onClick={() => setIsDropdownOpen(false)}
              >
                Panel Vendedor
              </Link>
            )}
            {user.role === 'admin' && (
              <Link
                to='/admin'
                className='block w-full rounded-md px-3 py-2 text-sm hover:bg-accent text-left'
                onClick={() => setIsDropdownOpen(false)}
              >
                Administración
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SignOutButton: React.FC = () => {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={handleSignOut}
      disabled={isSigningOut}
      className='text-muted-foreground hover:text-foreground'
    >
      {isSigningOut ? (
        <>
          <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          Cerrando...
        </>
      ) : (
        'Cerrar Sesión'
      )}
    </Button>
  );
};

export default UserAvatar;
