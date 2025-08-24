import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98] active:transition-transform active:duration-75',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 hover:shadow-md',
          'focus-visible:ring-primary',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 hover:shadow-md',
          'focus-visible:ring-destructive',
        ],
        outline: [
          'border border-input bg-background text-foreground shadow-sm',
          'hover:bg-accent hover:text-accent-foreground hover:border-accent',
          'focus-visible:ring-ring',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/80 hover:shadow-md',
          'focus-visible:ring-secondary',
        ],
        ghost: [
          'text-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-ring',
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline hover:text-primary/80',
          'focus-visible:ring-primary focus-visible:ring-offset-0',
        ],
        success: [
          'bg-green-600 text-white shadow-sm',
          'hover:bg-green-700 hover:shadow-md',
          'focus-visible:ring-green-600',
        ],
        warning: [
          'bg-yellow-600 text-white shadow-sm',
          'hover:bg-yellow-700 hover:shadow-md',
          'focus-visible:ring-yellow-600',
        ],
      },
      size: {
        xs: 'h-7 rounded-md px-2 text-xs',
        sm: 'h-8 rounded-md px-3 text-xs',
        default: 'h-9 px-4 py-2 rounded-md',
        lg: 'h-10 rounded-md px-6 text-base',
        xl: 'h-12 rounded-lg px-8 text-base font-semibold',
        icon: 'h-9 w-9 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-10 w-10 rounded-md',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
);

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner className="h-4 w-4" />
        )}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className={loading && !loadingText ? 'sr-only' : undefined}>
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
