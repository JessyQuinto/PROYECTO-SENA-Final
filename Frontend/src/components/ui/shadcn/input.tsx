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
          <div className='absolute left-3 flex items-center pointer-events-none text-muted-foreground z-10'>
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant: effectiveVariant, size, className }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'pr-8' // Extra space for error icon when no rightIcon
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
        {/* Error icon */}
        {error && !rightIcon && (
          <div className='absolute right-3 flex items-center pointer-events-none text-destructive z-10'>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        )}
        {/* Success icon */}
        {success && !rightIcon && !error && (
          <div className='absolute right-3 flex items-center pointer-events-none text-green-600 z-10'>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
        )}
        {rightIcon && (
          <div className='absolute right-3 flex items-center pointer-events-none text-muted-foreground z-10'>
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
                'text-xs mt-1 flex items-start gap-1',
                error || errorMessage
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
              role={error || errorMessage ? 'alert' : undefined}
              aria-live={error || errorMessage ? 'polite' : undefined}
            >
              {error || errorMessage ? (
                <svg
                  className='h-3 w-3 mt-0.5 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              ) : success ? (
                <svg
                  className='h-3 w-3 mt-0.5 flex-shrink-0 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : null}
              <span className='leading-none'>
                {errorMessage || helperText}
              </span>
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
