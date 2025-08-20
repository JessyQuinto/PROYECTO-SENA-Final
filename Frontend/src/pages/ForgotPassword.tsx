import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage('Hemos enviado un enlace de recuperación a tu correo.');
      (window as any).toast?.success('Enlace de recuperación enviado', { action: 'update' });
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el correo de recuperación');
      (window as any).toast?.error(err?.message || 'No se pudo enviar el correo de recuperación', { action: 'update' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] grid place-items-center">
      <div className="container-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="card card-hover">
              <div className="card-body">
                <h1 className="text-2xl font-semibold mb-2 font-display">Recuperar contraseña</h1>
                <p className="opacity-80">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
              </div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Recuperar contraseña</h2>
              {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
              {message && <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm">{message}</div>}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" className="input_field w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading || !email}>
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
                <div className="text-sm text-center">
                  <Link to="/login" className="text-(--color-terracotta-suave) hover:underline">Volver a iniciar sesión</Link>
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

