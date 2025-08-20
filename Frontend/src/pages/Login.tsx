import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const LoginPage: React.FC = () => {
  const { signIn, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { setError('Datos inválidos'); return; }
    setLoading(true);
    const res = await signIn(email, password);
    if (res.error) {
      setError(res.error);
      (window as any).toast?.error(res.error, { action: 'login' });
      setLoading(false);
      return;
    }
    await refreshProfile();
    // Leer usuario actualizado tras refresh
    const session = await (window as any).supabase?.auth.getUser?.();
    const currentRole = (session?.data?.user?.user_metadata as any)?.role as string | undefined;
    const target = currentRole === 'vendedor' ? '/vendedor' : currentRole === 'admin' ? '/admin' : '/';
    (window as any).toast?.success('Bienvenido', { action: 'login' });
    navigate(target, { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] grid place-items-center relative overflow-hidden">
      {/* Decorative auth background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0.00)), url('/assert/afrique-doodle-set/7311.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="container-sm relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="card card-hover">
              <div className="card-body">
                <h1 className="text-2xl font-semibold mb-2 font-display">Bienvenido de nuevo</h1>
                <p className="opacity-80">Inicia sesión para continuar explorando artesanías auténticas.</p>
              </div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
              {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Procesando...' : 'Entrar'}
                </Button>
                <div className="text-sm text-center">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-(--color-terracotta-suave) hover:underline">Crear cuenta</Link>
                </div>
                <div className="text-sm text-center">
                  <Link to="/forgot-password" className="text-(--color-terracotta-suave) hover:underline">¿Olvidaste tu contraseña?</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

