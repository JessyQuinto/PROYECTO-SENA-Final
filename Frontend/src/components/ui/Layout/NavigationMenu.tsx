import React, { useCallback, useRef, useEffect } from 'react';
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

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  currentPath,
  className,
}) => {
  const navRef = useRef<HTMLElement>(null);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!navRef.current) return;

    const links = navRef.current.querySelectorAll('a[href]');
    const currentIndex = Array.from(links).findIndex(
      link => link === document.activeElement
    );

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % links.length;
        (links[nextIndex] as HTMLElement)?.focus();
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? links.length - 1 : currentIndex - 1;
        (links[prevIndex] as HTMLElement)?.focus();
        break;
      
      case 'Home':
        event.preventDefault();
        (links[0] as HTMLElement)?.focus();
        break;
      
      case 'End':
        event.preventDefault();
        (links[links.length - 1] as HTMLElement)?.focus();
        break;
    }
  }, []);

  return (
    <nav 
      ref={navRef}
      className={cn('flex items-center space-x-1', className)}
      role='navigation'
      aria-label='Menú de navegación principal'
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={0}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

const MemoizedNavigationMenu = React.memo(NavigationMenu);
MemoizedNavigationMenu.displayName = 'NavigationMenu';

export { MemoizedNavigationMenu as NavigationMenu };

export default NavigationMenu;
