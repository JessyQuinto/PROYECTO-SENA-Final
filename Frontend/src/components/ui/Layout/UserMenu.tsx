import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Component for user avatar and name with animation
export const UserAvatar: React.FC<{ user: User; className?: string }> = ({ user, className }) => {
  const [isNameVisible, setIsNameVisible] = useState(false);
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    if (user?.role === 'comprador') {
      navigate('/perfil');
      return;
    }
    setIsNameVisible(!isNameVisible);
  };

  const userInitial = useMemo(() => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  }, [user?.email]);

  return (
    <div className={cn('relative', className)}>
      {/* Desktop user avatar and name */}
      <div className='hidden sm:flex items-center'>
        <div className='relative flex items-center'>
          {/* Avatar/Logo container */}
          <div 
            className='relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md'
            onMouseEnter={() => setIsNameVisible(true)}
            onMouseLeave={() => setIsNameVisible(false)}
            onClick={handleAvatarClick}
          >
            {userInitial}
            {/* Vendor approval status dot (green/red) */}
            {user.role === 'vendedor' && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2',
                  'border-background',
                  user.vendedor_estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'
                )}
                aria-label='Estado de vendedor'
                title={user.vendedor_estado || 'estado'}
              />
            )}
          </div>
          
          {/* Animated name container - positioned to the left of the avatar */}
          <div 
            className={cn(
              'absolute right-full top-0 z-0 flex items-center transition-all duration-300 ease-in-out pr-2',
              isNameVisible 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-4 opacity-0'
            )}
          >
            <span className='text-sm font-medium text-foreground whitespace-nowrap bg-background px-3 py-2 rounded-lg shadow-lg border border-border'>
              {user.nombre || user.email}
            </span>
          </div>
          
          {/* No role text below avatar */}
        </div>
      </div>

      {/* Mobile user avatar */}
      <div className='flex sm:hidden items-center'>
        <div className='relative flex items-center'>
          {/* Avatar/Logo container */}
          <div 
            className='relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold cursor-pointer transition-all duration-200 active:scale-95'
            onClick={handleAvatarClick}
          >
            {userInitial}
            {/* Vendor approval status dot (green/red) */}
            {user.role === 'vendedor' && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2',
                  'border-background',
                  user.vendedor_estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'
                )}
                aria-label='Estado de vendedor'
                title={user.vendedor_estado || 'estado'}
              />
            )}
          </div>
          
          {/* Animated name container for mobile - positioned to the left of the avatar */}
          <div 
            className={cn(
              'absolute right-full top-0 z-0 flex items-center transition-all duration-300 ease-in-out pr-2',
              isNameVisible 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-4 opacity-0'
            )}
          >
            <span className='text-sm font-medium text-foreground whitespace-nowrap bg-background px-2 py-1.5 rounded-md shadow-md border border-border'>
              {user.nombre || user.email}
            </span>
          </div>
          
          {/* No role text below avatar */}
        </div>
      </div>
    </div>
  );
};

// Component for sign out button
export const SignOutButton: React.FC<{ className?: string }> = ({ className }) => {
  const { signOut, loading, isSigningOut } = useAuth();

  const handleSignOut = async () => {
    console.log('[SignOutButton] Sign out initiated');
    
    try {
      // No mostrar delay si ya está en proceso de cerrar sesión
      if (isSigningOut) {
        console.log('[SignOutButton] Already signing out, skipping');
        return;
      }

      // Add a small delay to ensure menu closes before signing out
      setTimeout(async () => {
        try {
          await signOut();
          console.log('[SignOutButton] Sign out completed successfully');
        } catch (error) {
          console.error('[SignOutButton] Sign out failed:', error);
        }
      }, 100);
    } catch (error) {
      console.error('[SignOutButton] Error in handleSignOut:', error);
    }
  };

  // No mostrar el botón si está cargando o cerrando sesión
  if (loading || isSigningOut) {
    return (
      <div className={cn('relative', className)}>
        <div className='w-9 h-9 rounded-md bg-muted animate-pulse'></div>
      </div>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleSignOut}
      aria-label='Cerrar sesión'
      className={cn('h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200', className)}
      disabled={isSigningOut}
    >
      <svg
        className='h-4 w-4'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
        />
      </svg>
    </Button>
  );
};

// Main UserMenu component (kept for backward compatibility)
export const UserMenu: React.FC<UserMenuProps> = ({ user, className }) => {
  const { loading, isSigningOut } = useAuth();

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
      {/* Desktop user info with improved hierarchy */}
      <div className='hidden sm:flex items-center space-x-4'>
        <UserAvatar user={user} />
        <SignOutButton />
      </div>

      {/* Mobile user avatar with improved hierarchy */}
      <div className='flex sm:hidden items-center space-x-3'>
        <UserAvatar user={user} />
        <SignOutButton />
      </div>
    </div>
  );
};

export default UserMenu;
