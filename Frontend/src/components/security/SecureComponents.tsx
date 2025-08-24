import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import {
  useSecureInput,
  usePasswordValidation,
  useRateLimit,
} from '@/hooks/useSecurity';
import { security } from '@/lib/security';
import { secureValidationSchemas } from '@/hooks/useSecurity';
import { cn } from '@/lib/utils';

interface SecureInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
  > {
  value: string;
  onChange: (value: string) => void;
  validation?:
    | 'email'
    | 'name'
    | 'phone'
    | 'productName'
    | ((value: string) => string);
  enableSanitization?: boolean;
  showValidation?: boolean;
  maxLength?: number;
}

/**
 * Secure input component with built-in validation and sanitization
 */
export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      value,
      onChange,
      validation,
      enableSanitization = true,
      showValidation = true,
      maxLength = 255,
      className,
      size,
      ...props
    },
    ref
  ) => {
    const validator =
      typeof validation === 'string'
        ? secureValidationSchemas[validation]
        : validation;

    const {
      value: inputValue,
      sanitizedValue,
      isValid,
      error,
      setValue,
      validate,
    } = useSecureInput(value, validator);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Enforce max length
      if (newValue.length > maxLength) return;

      setValue(newValue);
      onChange(enableSanitization ? sanitizedValue : newValue);
    };

    const handleBlur = () => {
      if (showValidation) {
        validate();
      }
    };

    return (
      <div className='space-y-1'>
        <Input
          ref={ref}
          {...props}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            error &&
              showValidation &&
              'border-red-500 focus-visible:ring-red-500'
          )}
          maxLength={maxLength}
        />
        {showValidation && error && (
          <p className='text-sm text-red-600'>{error}</p>
        )}
        {showValidation && !error && validation && inputValue && (
          <p className='text-sm text-green-600'>✓ Válido</p>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

interface PasswordInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value' | 'type'
  > {
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
  showToggle?: boolean;
}

/**
 * Password input with strength indicator and security validation
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value,
      onChange,
      showStrength = true,
      showToggle = true,
      className,
      size,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const { isValid, errors, strengthLevel, strengthColor, score } =
      usePasswordValidation(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className='space-y-2'>
        <div className='relative'>
          <Input
            ref={ref}
            {...props}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            className={cn(
              className,
              showToggle && 'pr-10',
              !isValid && value && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          {showToggle && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                  />
                </svg>
              ) : (
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              )}
            </Button>
          )}
        </div>

        {showStrength && value && (
          <div className='space-y-2'>
            {/* Strength bar */}
            <div className='flex space-x-1'>
              {[1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    score >= level * 25
                      ? 'opacity-100'
                      : 'opacity-30 bg-gray-300'
                  )}
                  style={{
                    backgroundColor:
                      score >= level * 25 ? strengthColor : undefined,
                  }}
                />
              ))}
            </div>

            {/* Strength text */}
            <p className='text-sm' style={{ color: strengthColor }}>
              Seguridad: <span className='capitalize'>{strengthLevel}</span> (
              {score}/100)
            </p>

            {/* Error messages */}
            {errors.length > 0 && (
              <ul className='text-sm text-red-600 space-y-1'>
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

interface SecureButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rateLimitKey?: string;
  maxAttempts?: number;
  lockoutDuration?: number;
  showRemainingAttempts?: boolean;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Button with built-in rate limiting
 */
export const SecureButton = forwardRef<HTMLButtonElement, SecureButtonProps>(
  (
    {
      rateLimitKey,
      maxAttempts = 5,
      lockoutDuration = 15 * 60 * 1000,
      showRemainingAttempts = false,
      children,
      onClick,
      disabled,
      variant,
      size,
      ...remainingProps
    },
    ref
  ) => {
    // Remove any disabled property from remainingProps to prevent conflicts
    const { disabled: _, ...props } = remainingProps as any;
    const rateLimit = useRateLimit(
      rateLimitKey || 'default',
      maxAttempts,
      lockoutDuration
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!rateLimit.isAllowed) {
        e.preventDefault();
        return;
      }

      if (onClick) {
        onClick(e);
      }

      if (rateLimitKey) {
        rateLimit.checkLimit();
      }
    };

    const isDisabled = !!disabled || (rateLimitKey && !rateLimit.isAllowed);

    return (
      <div className='space-y-2'>
        <Button
          ref={ref}
          {...props}
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isDisabled}
        >
          {children}
        </Button>

        {rateLimitKey && !rateLimit.isAllowed && (
          <p className='text-sm text-red-600'>
            Demasiados intentos. Intenta de nuevo en{' '}
            {Math.ceil((rateLimit.resetTime! - Date.now()) / 1000 / 60)}{' '}
            minutos.
          </p>
        )}

        {rateLimitKey &&
          showRemainingAttempts &&
          rateLimit.isAllowed &&
          rateLimit.remainingAttempts < maxAttempts && (
            <p className='text-sm text-yellow-600'>
              {rateLimit.remainingAttempts} intentos restantes
            </p>
          )}
      </div>
    );
  }
);

SecureButton.displayName = 'SecureButton';

interface SecureTextAreaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'value'
  > {
  value: string;
  onChange: (value: string) => void;
  enableSanitization?: boolean;
  allowHTML?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * Secure textarea with sanitization and validation
 */
export const SecureTextArea = forwardRef<
  HTMLTextAreaElement,
  SecureTextAreaProps
>(
  (
    {
      value,
      onChange,
      enableSanitization = true,
      allowHTML = false,
      maxLength = 2000,
      showCharCount = true,
      className,
      ...props
    },
    ref
  ) => {
    const {
      value: inputValue,
      sanitizedValue,
      setValue,
    } = useSecureInput(
      value,
      undefined,
      allowHTML
        ? (val: string) => security.sanitizeHTML(val)
        : (val: string) => security.sanitizeText(val)
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      if (newValue.length > maxLength) return;

      setValue(newValue);
      onChange(enableSanitization ? sanitizedValue : newValue);
    };

    return (
      <div className='space-y-2'>
        <textarea
          ref={ref}
          {...props}
          value={inputValue}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        />
        {showCharCount && (
          <p className='text-sm text-gray-500 text-right'>
            {inputValue.length}/{maxLength} caracteres
          </p>
        )}
      </div>
    );
  }
);

SecureTextArea.displayName = 'SecureTextArea';

interface SecurityBadgeProps {
  level: 'low' | 'medium' | 'high';
  className?: string;
}

/**
 * Security level indicator badge
 */
export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  level,
  className,
}) => {
  const config = {
    low: { color: 'bg-red-100 text-red-800', text: 'Seguridad Baja' },
    medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Seguridad Media' },
    high: { color: 'bg-green-100 text-green-800', text: 'Seguridad Alta' },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config[level].color,
        className
      )}
    >
      {config[level].text}
    </span>
  );
};

export default {
  SecureInput,
  PasswordInput,
  SecureButton,
  SecureTextArea,
  SecurityBadge,
};
