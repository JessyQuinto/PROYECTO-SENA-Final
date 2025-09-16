import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useForm } from '@/hooks/useForm';
import { useToastWithAuth } from '@/hooks/useToast';
import { useRateLimit } from '@/hooks/useSecurity';
import { AuthFeatureSets } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import Icon from '@/components/ui/Icon';

// validation handled inline in submit handler

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastWithAuth();
  const rateLimit = useRateLimit('login', 5, 15 * 60 * 1000); // 5 intentos por 15 minutos

  // Obtener mensaje informativo del estado de navegación
  const infoMessage = location.state?.message;
  const returnTo = location.state?.returnTo;

  const form = useForm<FormData>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async values => {
      // Validación manual simple
      if (!values.email) {
        toast.error('El correo electrónico es obligatorio', {
          action: 'login',
        });
        return;
      }
      if (!values.password) {
        toast.error('La contraseña es obligatoria', { action: 'login' });
        return;
      }

      if (!rateLimit.checkLimit()) {
        toast.error(
          'Demasiados intentos de inicio de sesión. Intenta más tarde.',
          {
            action: 'login',
          }
        );
        return;
      }

      // ✅ MEJORADO: Pasar opciones de redirección al signIn
      const result = await signIn(values.email, values.password, {
        returnTo: returnTo
      });
      
      if (result.error) {
        toast.error(result.error, {
          action: 'login',
        });
        return;
      }

      // Limpiar rate limit en login exitoso
      rateLimit.clearLimit();
      toast.success('Inicio de sesión exitoso', {
        action: 'login',
      });
    },
  });

return (
  <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gradient-to-b from-muted/30 to-background">
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg animate-fade-in">
      
      {/* Card principal */}
      <div className="bg-card shadow-xl rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          Iniciar Sesión
        </h1>
        <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
          Accede a tu cuenta para continuar
        </p>

        {infoMessage && (
          <Alert variant="info" className="mb-4">
            <Icon name="LucideInfo" className="w-4 h-4" />
            <AlertDescription className="text-sm">{infoMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...form.getInputProps("email")}
              className={`mt-1 h-12 rounded-xl text-sm ${form.hasError("email") ? "border-red-500" : ""}`}
            />
            {form.hasError("email") && (
              <p className="text-red-500 text-xs mt-1">{form.getFieldState("email").error}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.getInputProps("password")}
              className={`mt-1 h-12 rounded-xl text-sm ${form.hasError("password") ? "border-red-500" : ""}`}
            />
            {form.hasError("password") && (
              <p className="text-red-500 text-xs mt-1">{form.getFieldState("password").error}</p>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={form.isSubmitting || loading}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition"
          >
            {form.isSubmitting || loading ? "Iniciando..." : "Iniciar sesión"}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-xs text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);

};

export default LoginPage;
