import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  [
    'relative overflow-hidden rounded-lg border bg-card text-card-foreground',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'border-border shadow-sm',
        outlined: 'border-2 border-border shadow-none',
        elevated: 'border-border/50 shadow-lg hover:shadow-xl',
        ghost: 'border-transparent bg-transparent shadow-none',
        interactive: [
          'border-border cursor-pointer shadow-sm',
          'hover:shadow-md hover:border-border-secondary hover:-translate-y-1',
          'active:scale-[0.99] active:transition-transform active:duration-75',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        ],
        product: [
          'border-border cursor-pointer shadow-sm',
          'hover:shadow-lg hover:border-primary/20 hover:-translate-y-2',
          'active:scale-[0.98] active:transition-transform active:duration-100',
          'transition-all duration-300 ease-out',
        ],
        feature: [
          'border-border/50 bg-gradient-to-br from-card to-card/50',
          'shadow-md hover:shadow-lg',
          'transition-all duration-300',
        ],
      },
      elevation: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        '2xl': 'shadow-2xl',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      elevation: 'sm',
      padding: 'none',
    },
  }
);

const cardHeaderVariants = cva('flex flex-col space-y-1.5', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
});

const cardContentVariants = cva('', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pt-0',
      default: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
});

const cardFooterVariants = cva('flex items-center', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pt-0',
      default: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    },
  },
  defaultVariants: {
    padding: 'default',
    justify: 'start',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, elevation, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, elevation, padding, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ padding, className }))}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-semibold',
    xl: 'text-3xl font-bold',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'leading-none tracking-tight text-foreground',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'muted' | 'subtle';
  }
>(({ className, size = 'md', variant = 'default', ...props }, ref) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    muted: 'text-muted-foreground/80',
    subtle: 'text-muted-foreground/60',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'leading-relaxed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding, className }))}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, justify, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ padding, justify, className }))}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
};
