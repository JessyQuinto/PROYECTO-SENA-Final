import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface FormValidationProps {
  value: string;
  rules: ValidationRule[];
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
}

export const FormValidation: React.FC<FormValidationProps> = ({
  value,
  rules,
  onValidationChange,
  className = ''
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const newErrors: string[] = [];
    
    rules.forEach(rule => {
      if (!rule.test(value)) {
        newErrors.push(rule.message);
      }
    });

    setErrors(newErrors);
    const newIsValid = newErrors.length === 0;
    setIsValid(newIsValid);
    
    if (onValidationChange) {
      onValidationChange(newIsValid);
    }
  }, [value, rules, onValidationChange]);

  if (value.length === 0) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {errors.map((error, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-red-600">
          <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ))}
      {isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-4 h-4" />
          <span>Campo válido</span>
        </div>
      )}
    </div>
  );
};

// Reglas de validación predefinidas
export const validationRules = {
  required: (message = 'Este campo es obligatorio'): ValidationRule => ({
    test: (value: string) => value.trim().length > 0,
    message
  }),
  
  email: (message = 'Ingresa un email válido'): ValidationRule => ({
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  phone: (message = 'Ingresa un teléfono válido'): ValidationRule => ({
    test: (value: string) => /^[\+]?[0-9\s\-\(\)]{7,}$/.test(value),
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: message || `Mínimo ${min} caracteres`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: message || `Máximo ${max} caracteres`
  }),
  
  cardNumber: (message = 'Número de tarjeta inválido'): ValidationRule => ({
    test: (value: string) => /^\d{13,19}$/.test(value.replace(/\s/g, '')),
    message
  }),
  
  cardExpiry: (message = 'Formato MM/AA'): ValidationRule => ({
    test: (value: string) => /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value),
    message
  }),
  
  cardCVC: (message = 'CVC debe tener 3-4 dígitos'): ValidationRule => ({
    test: (value: string) => /^\d{3,4}$/.test(value),
    message
  }),
  
  postalCode: (message = 'Código postal inválido'): ValidationRule => ({
    test: (value: string) => /^\d{4,6}$/.test(value),
    message
  })
};

// Hook personalizado para validación de formularios
export const useFormValidation = (initialValues: Record<string, string>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = useState(false);

  const updateValue = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const validateField = (field: string, rules: ValidationRule[]) => {
    const value = values[field];
    const fieldErrors: string[] = [];
    
    rules.forEach(rule => {
      if (!rule.test(value)) {
        fieldErrors.push(rule.message);
      }
    });

    setErrors(prev => ({ ...prev, [field]: fieldErrors }));
    return fieldErrors.length === 0;
  };

  const validateForm = (fieldRules: Record<string, ValidationRule[]>) => {
    const newErrors: Record<string, string[]> = {};
    let formIsValid = true;

    Object.keys(fieldRules).forEach(field => {
      const fieldErrors: string[] = [];
      const rules = fieldRules[field];
      const value = values[field];

      rules.forEach(rule => {
        if (!rule.test(value)) {
          fieldErrors.push(rule.message);
        }
      });

      if (fieldErrors.length > 0) {
        formIsValid = false;
      }
      newErrors[field] = fieldErrors;
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  };

  const getFieldError = (field: string): string[] => {
    return errors[field] || [];
  };

  const hasFieldError = (field: string): boolean => {
    return (errors[field] || []).length > 0;
  };

  const clearErrors = () => {
    setErrors({});
    setIsValid(false);
  };

  return {
    values,
    errors,
    isValid,
    updateValue,
    validateField,
    validateForm,
    getFieldError,
    hasFieldError,
    clearErrors
  };
};
