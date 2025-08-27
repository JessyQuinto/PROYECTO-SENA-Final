import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface User {
  email?: string;
  nombre?: string;
  role?: string;
  vendedor_estado?: string;
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showRole?: boolean;
  showVendorStatus?: boolean;
  className?: string;
  variant?: 'desktop' | 'mobile' | 'auto';
  interactive?: boolean;
}

// Hook for user avatar logic
export function useUserAvatar(user: User) {
  const initial = useMemo(() => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  }, [user?.email]);

  const displayName = user?.nombre || user?.email || 'Usuario';

  return { initial, displayName };
}

// Vendor status badge component
export const VendorStatusBadge: React.FC<{
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ status, size = 'sm', className }) => {
  const statusStyles = {
    aprobado: 'bg-green-100 text-green-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    rechazado: 'bg-red-100 text-red-700',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium',
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-700',
        sizeStyles[size],
        className
      )}
    >
      {status}
    </span>
  );
};

// Role badge component
export const RoleBadge: React.FC<{
  role: string;
  vendorStatus?: string;
  showVendorStatus?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ role, vendorStatus, showVendorStatus = true, size = 'sm', className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className='text-gray-400 capitalize font-normal text-xs'>
        {role}
      </span>
      {role === 'vendedor' && vendorStatus && showVendorStatus && (
        <VendorStatusBadge status={vendorStatus} size={size} />
      )}
    </div>
  );
};

// Main avatar component
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = false,
  showRole = false,
  showVendorStatus = true,
  className,
  variant = 'auto',
  interactive = true,
}) => {
  const [isNameVisible, setIsNameVisible] = useState(false);
  const { initial, displayName } = useUserAvatar(user);

  const sizeConfig = {
    sm: {
      avatar: 'h-8 w-8 text-sm',
      nameText: 'text-sm',
      namePadding: 'px-2 py-1',
      rolePosition: '-bottom-3',
    },
    md: {
      avatar: 'h-10 w-10 text-sm',
      nameText: 'text-sm',
      namePadding: 'px-3 py-2',
      rolePosition: '-bottom-5',
    },
    lg: {
      avatar: 'h-12 w-12 text-base',
      nameText: 'text-base',
      namePadding: 'px-4 py-2',
      rolePosition: '-bottom-6',
    },
  };

  const config = sizeConfig[size];
  const isDesktop = variant === 'desktop' || (variant === 'auto' && window.innerWidth >= 640);
  const isMobile = variant === 'mobile' || (variant === 'auto' && window.innerWidth < 640);

  const handleInteraction = () => {
    if (interactive) {
      setIsNameVisible(!isNameVisible);
    }
  };

  const avatarElement = (
    <div
      className={cn(
        'relative z-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold cursor-pointer transition-all duration-200',
        config.avatar,
        interactive && (isDesktop ? 'hover:scale-105 hover:shadow-md' : 'active:scale-95'),
        className
      )}
      onMouseEnter={isDesktop && interactive ? () => setIsNameVisible(true) : undefined}
      onMouseLeave={isDesktop && interactive ? () => setIsNameVisible(false) : undefined}
      onClick={interactive ? handleInteraction : undefined}
    >
      {initial}
    </div>
  );

  const nameElement = showName && (
    <div
      className={cn(
        'absolute right-full top-0 z-30 flex items-center transition-all duration-300 ease-in-out pr-3',
        isNameVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'
      )}
      style={{ pointerEvents: isNameVisible ? 'none' : 'none' }}
    >
      <span
        className={cn(
          'font-medium text-foreground whitespace-nowrap bg-background rounded-lg shadow-lg border border-border',
          config.nameText,
          config.namePadding,
          isMobile && 'rounded-md shadow-md'
        )}
      >
        {displayName}
      </span>
    </div>
  );

  const roleElement = showRole && (
    <div className={cn('absolute left-0 right-0 flex justify-center', config.rolePosition)}>
      <RoleBadge
        role={user.role || 'usuario'}
        vendorStatus={user.vendedor_estado}
        showVendorStatus={showVendorStatus}
        size={size === 'lg' ? 'md' : 'sm'}
      />
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      {/* Responsive container */}
      <div className={cn(
        'flex items-center',
        variant === 'desktop' && 'hidden sm:flex',
        variant === 'mobile' && 'flex sm:hidden',
        variant === 'auto' && 'flex'
      )}>
        <div className='relative flex items-center'>
          {avatarElement}
          {nameElement}
          {roleElement}
        </div>
      </div>
    </div>
  );
};

// Simplified avatar for cases where only the image is needed
export const SimpleAvatar: React.FC<{
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ user, size = 'md', className }) => {
  const { initial } = useUserAvatar(user);
  const config = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold',
        config[size],
        className
      )}
    >
      {initial}
    </div>
  );
};

// Loading state for user avatar
export const UserAvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}> = ({ size = 'md', showName = false, className }) => {
  const sizeConfig = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('relative flex items-center space-x-2', className)}>
      <div className={cn('rounded-full bg-muted animate-pulse', sizeConfig[size])} />
      {showName && <div className='h-4 w-20 bg-muted animate-pulse rounded' />}
    </div>
  );
};

// User display card for profiles and lists
export const UserCard: React.FC<{
  user: User;
  showEmail?: boolean;
  showRole?: boolean;
  showVendorStatus?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({
  user,
  showEmail = false,
  showRole = true,
  showVendorStatus = true,
  className,
  onClick,
}) => {
  const { displayName } = useUserAvatar(user);

  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <SimpleAvatar user={user} size='md' />
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-foreground truncate'>{displayName}</p>
        {showEmail && user.email && (
          <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
        )}
        {showRole && user.role && (
          <RoleBadge
            role={user.role}
            vendorStatus={user.vendedor_estado}
            showVendorStatus={showVendorStatus}
            size='sm'
            className='mt-1'
          />
        )}
      </div>
    </div>
  );
};

export type { User, UserAvatarProps };