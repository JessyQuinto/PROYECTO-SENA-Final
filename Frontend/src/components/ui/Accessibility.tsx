import React from 'react';
import { cn } from '@/lib/utils';

// Skip Navigation Component
export const SkipNavigation: React.FC = () => {
  return (
    <a
      href=\"#main-content\"
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'z-50 px-4 py-2 bg-primary text-primary-foreground',
        'rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
    >
      Saltar al contenido principal
    </a>
  );
};

// Screen Reader Only Text
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
}) => {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
};

// Accessible Focus Trap
interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  enabled = true,
  className,
}) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled || !trapRef.current) return;

    const trapElement = trapRef.current;
    const focusableElements = trapElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    trapElement.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      trapElement.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return (
    <div ref={trapRef} className={className}>
      {children}
    </div>
  );
};

// Accessible Heading with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  children,
  className,
  id,
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const levelClasses = {
    1: 'heading-4xl',
    2: 'heading-3xl', 
    3: 'heading-2xl',
    4: 'heading-xl',
    5: 'heading-lg',
    6: 'heading-base',
  };

  return (
    <Tag 
      className={cn(levelClasses[level], className)}
      id={id}
    >
      {children}
    </Tag>
  );
};

// Live Region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  className,
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

// Accessible Description
interface AccessibleDescriptionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleDescription: React.FC<AccessibleDescriptionProps> = ({
  id,
  children,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </div>
  );
};

// Main Content Wrapper
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  className,
}) => {
  return (
    <main
      id=\"main-content\"
      className={cn('focus:outline-none', className)}
      tabIndex={-1}
    >
      {children}
    </main>
  );
};

export default {
  SkipNavigation,
  ScreenReaderOnly,
  FocusTrap,
  AccessibleHeading,
  LiveRegion,
  AccessibleDescription,
  MainContent,
};