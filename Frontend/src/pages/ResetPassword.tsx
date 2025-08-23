import React from 'react';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirm: z.string()
}).refine((data) => data.password === data.confirm, {
  message: "Las contraseñas no coinciden",
  path: ["confirm"]
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { executeMutation } = useSupabase({ 
    showToast: true, 
    toastAction: 'update' 
  });

  const form = useForm<ResetPasswordForm>({
    initialValues: { password: '', confirm: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      const { error } = await executeMutation(
        () => supabase.auth.updateUser({ password: values.password }),
        'Contraseña actualizada exitosamente',
        'No se pudo actualizar la contraseña'
      );
      
      if (!error) {
        toast.success('Contraseña actualizada', { 
          message: 'Redirigiendo a login...',
          action: 'update' 
        });
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    }
  });

  return (
    <div className="min-h-[calc(100vh-120px)] grid place-items-center">
      <div className="container-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="card card-hover">
              <div className="card-body">
                <h1 className="text-2xl font-semibold mb-2 font-display">Restablecer contraseña</h1>
                <p className="opacity-80">Crea una nueva contraseña para tu cuenta.</p>
              </div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Nueva contraseña</h2>
              <form className="space-y-4" onSubmit={form.handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.values.password}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    placeholder="••••••••"
                    className={form.errors.password ? 'border-red-500' : ''}
                  />
                  {form.errors.password && (
                    <p className="text-sm text-red-600">{form.errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar contraseña</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={form.values.confirm}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    placeholder="••••••••"
                    className={form.errors.confirm ? 'border-red-500' : ''}
                  />
                  {form.errors.confirm && (
                    <p className="text-sm text-red-600">{form.errors.confirm}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={form.isSubmitting}
                >
                  {form.isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
                <div className="text-sm text-center">
                  <Link to="/login" className="text-(--color-terracotta-suave) hover:underline">
                    Volver a iniciar sesión
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

