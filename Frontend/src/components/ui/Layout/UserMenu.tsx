import React, { useState, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

interface User {
  email?: string;
  nombre?: string;
  role?: string;
  vendedor_estado?: string;
}

interface UserMenuProps {
  user: User;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, className }) => {
  const { signOut, loading, isSigningOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const userInitial = useMemo(() => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  }, [user?.email]);

  const handleSignOut = async () => {
    console.log('[UserMenu] Sign out initiated');
    setIsOpen(false);

    // No mostrar delay si ya está en proceso de cerrar sesión
    if (isSigningOut) {
      return;
    }

    // Add a small delay to ensure menu closes before signing out
    setTimeout(async () => {
      await signOut();
    }, 100);
  };

  // No mostrar el menú si está cargando o cerrando sesión
  if (loading || isSigningOut) {
    return (
      <div className={cn('relative', className)}>
        <div className='flex items-center space-x-2'>
          <div className='w-8 h-8 rounded-full bg-muted animate-pulse'></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Desktop user info */}
      <div className='hidden sm:flex items-center space-x-3'>
        <div className='flex flex-col items-end text-right'>
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
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
          {userInitial}
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleSignOut}
          aria-label='Cerrar sesión'
          className='h-8 w-8'
        >
          <svg
            className='h-4 w-4'
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
        </Button>
      </div>

      {/* Mobile user avatar */}
      <div className='flex sm:hidden items-center space-x-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
          {userInitial}
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleSignOut}
          aria-label='Cerrar sesión'
          className='h-8 w-8'
        >
          <svg
            className='h-4 w-4'
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
        </Button>
      </div>
    </div>
  );
};

export default UserMenu;
