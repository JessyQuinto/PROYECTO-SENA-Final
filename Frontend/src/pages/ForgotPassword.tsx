import React from 'react';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const toast = useToast();
  const { executeMutation } = useSupabase({
    showToast: true,
    toastAction: 'update',
  });

  const form = useForm<ForgotPasswordForm>({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async values => {
      const result = await executeMutation(
        () => supabase.auth.resetPasswordForEmail(values.email),
        'Email de restablecimiento enviado'
      );

      if (result !== null) {
        toast.success('Email enviado');
      }
    },
  });

  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center'>
      <div className='container-sm'>
        <div className='grid md:grid-cols-2 gap-8 items-center'>
          <div className='hidden md:block'>
            <div className='card card-hover'>
              <div className='card-body'>
                <h1 className='text-2xl font-semibold mb-2 font-display'>
                  Restablecer contraseña
                </h1>
                <p className='opacity-80'>
                  Te enviaremos un email para restablecer tu contraseña.
                </p>
              </div>
            </div>
          </div>
          <div className='card card-hover'>
            <div className='card-body'>
              <h2 className='text-xl font-semibold mb-4'>
                ¿Olvidaste tu contraseña?
              </h2>
              <form className='space-y-4' onSubmit={form.handleSubmit}>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={form.values.email}
                    onChange={e => form.setValue('email', e.target.value)}
                    onBlur={() => form.validateField('email')}
                    placeholder='tu@email.com'
                    className={form.errors.email ? 'border-red-500' : ''}
                  />
                  {form.errors.email && (
                    <p className='text-sm text-red-600'>{form.errors.email}</p>
                  )}
                </div>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={form.isSubmitting}
                >
                  {form.isSubmitting
                    ? 'Enviando…'
                    : 'Enviar email de restablecimiento'}
                </Button>
                <div className='text-sm text-center'>
                  <Link
                    to='/login'
                    className='text-(--color-terracotta-suave) hover:underline'
                  >
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

export default ForgotPasswordPage;
