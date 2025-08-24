import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  public?: boolean;
  roles?: string[];
  requireApproval?: boolean;
}

interface NavigationMenuProps {
  items: NavigationItem[];
  currentPath: string;
  className?: string;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  currentPath,
  className,
}) => {
  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {items.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;