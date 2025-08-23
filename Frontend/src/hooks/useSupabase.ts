import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from './useToast';

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface UseSupabaseOptions {
  showToast?: boolean;
  toastAction?: string;
  toastRole?: 'admin' | 'vendedor' | 'comprador';
}

export const useSupabase = (options: UseSupabaseOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SupabaseError | null>(null);
  const toast = useToast();

  const { showToast = true, toastAction, toastRole } = options;

  const handleError = useCallback((error: any, context?: string): SupabaseError => {
    const errorMessage = error?.message || 'Error desconocido';
    const errorDetails = error?.details || '';
    const errorHint = error?.hint || '';
    const errorCode = error?.code || '';

    const supabaseError: SupabaseError = {
      message: errorMessage,
      details: errorDetails,
      hint: errorHint,
      code: errorCode
    };

    setError(supabaseError);

    if (showToast) {
      toast.error(errorMessage, { 
        action: toastAction as any, 
        role: toastRole 
      });
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[Supabase Error] ${context || 'Operation'}:`, error);
    }

    return supabaseError;
  }, [showToast, toastAction, toastRole, toast]);

  const executeQuery = useCallback(async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await queryFn();

      if (error) {
        handleError(error, context);
        return null;
      }

      return data;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const executeMutation = useCallback(async <T>(
    mutationFn: () => Promise<{ data: T | null; error: any }>,
    context?: string,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await mutationFn();

      if (error) {
        handleError(error, context);
        return null;
      }

      if (successMessage && showToast) {
        toast.success(successMessage, { 
          action: toastAction as any, 
          role: toastRole 
        });
      }

      return data;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, showToast, toastAction, toastRole, toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeQuery,
    executeMutation,
    clearError,
    supabase
  };
};
