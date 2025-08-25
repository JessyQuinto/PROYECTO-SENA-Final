import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onError?: (errors: Record<string, string>) => void;
}

export const useForm = <T extends Record<string, any>>(
  options: UseFormOptions<T>
) => {
  const { initialValues, validationSchema, onSubmit, onError } = options;

  // Inicializar estado del formulario
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const state: Partial<FormState<T>> = {};
    Object.keys(initialValues).forEach(key => {
      state[key as keyof T] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      };
    });
    return state as FormState<T>;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Obtener valores actuales del formulario
  const values = useMemo(() => {
    const currentValues: Partial<T> = {};
    Object.keys(formState).forEach(key => {
      currentValues[key as keyof T] = formState[key as keyof T].value;
    });
    return currentValues as T;
  }, [formState]);

  // Obtener errores del formulario
  const errors = useMemo(() => {
    const currentErrors: Record<string, string> = {};
    Object.keys(formState).forEach(key => {
      const field = formState[key as keyof T];
      if (field.error) {
        currentErrors[key] = field.error;
      }
    });
    return currentErrors;
  }, [formState]);

  // Actualizar valor de un campo
  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        error: undefined, // Limpiar error al cambiar valor
      },
    }));
  }, []);

  // Marcar campo como tocado
  const setTouched = useCallback((field: keyof T, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched,
      },
    }));
  }, []);

  // Validar un campo específico
  const validateField = useCallback(
    (field: keyof T): boolean => {
      if (!validationSchema) return true;

      try {
        validationSchema.parse(values);
        setFormState(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            error: undefined,
          },
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(e =>
            e.path.includes(field as string)
          );
          if (fieldError) {
            setFormState(prev => ({
              ...prev,
              [field]: {
                ...prev[field],
                error: fieldError.message,
              },
            }));
            return false;
          }
        }
        return true;
      }
    },
    [validationSchema, values]
  );

  // Validar todo el formulario
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      // Limpiar todos los errores
      setFormState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          newState[key as keyof T] = {
            ...newState[key as keyof T],
            error: undefined,
          };
        });
        return newState;
      });
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(e => {
          const field = e.path[0] as string;
          newErrors[field] = e.message;
        });

        // Actualizar estado con errores
        setFormState(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            newState[key as keyof T] = {
              ...newState[key as keyof T],
              error: newErrors[key] || undefined,
            };
          });
          return newState;
        });

        setIsValid(false);
        onError?.(newErrors);
        return false;
      }
      return false;
    }
  }, [validationSchema, values, onError]);

  // Manejar cambio de campo
  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValue(field, value);
      // No marcar como touched en cada cambio, solo en blur
    },
    [setValue]
  );

  // Manejar blur de campo
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched(field, true);
      // Validar en blur solo si el campo tiene contenido
      const fieldValue = values[field];
      if (
        fieldValue &&
        typeof fieldValue === 'string' &&
        fieldValue.trim() !== ''
      ) {
        validateField(field);
      }
    },
    [setTouched, validateField, values]
  );

  // Enviar formulario
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setSubmitAttempted(true);

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, onSubmit, values]
  );

  // Resetear formulario
  const reset = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof T] = {
          value: initialValues[key as keyof T],
          error: undefined,
          touched: false,
        };
      });
      return newState;
    });
    setIsValid(true);
    setIsSubmitting(false);
    setSubmitAttempted(false);
  }, [initialValues]);

  // Obtener estado de un campo específico
  const getFieldState = useCallback(
    (field: keyof T) => {
      return formState[field];
    },
    [formState]
  );

  // Verificar si un campo tiene error y debe mostrarse
  const hasError = useCallback(
    (field: keyof T): boolean => {
      const fieldState = formState[field];
      return !!(
        fieldState &&
        fieldState.error &&
        (submitAttempted || fieldState.touched)
      );
    },
    [formState, submitAttempted]
  );

  // Verificar si un campo ha sido tocado
  const isTouched = useCallback(
    (field: keyof T): boolean => {
      return formState[field].touched;
    },
    [formState]
  );

  // Helpers para props de formulario
  const getFormProps = useCallback(
    () => ({
      onSubmit: handleSubmit,
      noValidate: true,
    }),
    [handleSubmit]
  );

  const getInputProps = useCallback(
    (field: keyof T) => ({
      value: (values && values[field]) || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(field, e.target.value as T[keyof T]);
      },
      onBlur: () => handleBlur(field),
      'aria-invalid': hasError(field),
      'aria-describedby': hasError(field)
        ? `${String(field)}-error`
        : undefined,
    }),
    [values, handleChange, handleBlur, hasError]
  );

  return {
    // Estado
    values,
    errors,
    isValid,
    isSubmitting,
    submitAttempted,

    // Acciones
    setValue,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    reset,

    // Utilidades
    getFieldState,
    hasError,
    isTouched,
    getFormProps,
    getInputProps,
  };
};
