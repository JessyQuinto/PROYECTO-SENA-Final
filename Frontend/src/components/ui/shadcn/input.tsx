import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'flex w-full transition-all duration-200',
    'border bg-background text-foreground',
    'ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-foreground',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:bg-muted read-only:focus-visible:ring-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-input focus-visible:ring-ring',
          'hover:border-border-secondary',
        ],
        error: [
          'border-destructive text-destructive',
          'focus-visible:ring-destructive placeholder:text-destructive/60',
        ],
        success: [
          'border-green-500 text-green-900',
          'focus-visible:ring-green-500 placeholder:text-green-600/60',
        ],
        ghost: [
          'border-transparent bg-transparent',
          'focus-visible:border-input focus-visible:bg-background',
        ],
      },
      size: {
        sm: 'h-8 px-2 py-1 text-sm rounded-md file:text-xs',
        default: 'h-9 px-3 py-2 text-sm rounded-md file:text-sm',
        lg: 'h-10 px-4 py-2 text-base rounded-md file:text-sm',
        xl: 'h-12 px-6 py-3 text-base rounded-lg file:text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  errorMessage?: string;
  label?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant,
      size,
      error,
      success,
      leftIcon,
      rightIcon,
      helperText,
      errorMessage,
      label,
      required,
      id,
      ...props
    },
    ref
  ) => {
    // Auto-detect variant based on error/success props
    const effectiveVariant = error
      ? 'error'
      : success
        ? 'success'
        : variant || 'default';

    // Always call hooks in the same order: call React.useId() unconditionally
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId =
      helperText || errorMessage ? `${inputId}-helper` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;

    const inputElement = (
      <div className='relative flex items-center'>
        {leftIcon && (
          <div className='absolute left-3 flex items-center pointer-events-none text-muted-foreground'>
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant: effectiveVariant, size, className }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10'
          )}
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            cn(helperId && helperId, errorId && errorId).trim() || undefined
          }
          aria-required={required}
          {...props}
        />
        {rightIcon && (
          <div className='absolute right-3 flex items-center pointer-events-none text-muted-foreground'>
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || helperText || errorMessage) {
      return (
        <div className='space-y-1'>
          {label && (
            <label
              htmlFor={inputId}
              className='text-sm font-medium text-foreground'
            >
              {label}
              {required && (
                <span className='text-destructive ml-1' aria-label='required'>
                  *
                </span>
              )}
            </label>
          )}
          {inputElement}
          {(helperText || errorMessage) && (
            <div
              id={helperId || errorId}
              className={cn(
                'text-xs',
                error || errorMessage
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
              role={error || errorMessage ? 'alert' : undefined}
              aria-live={error || errorMessage ? 'polite' : undefined}
            >
              {errorMessage || helperText}
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
