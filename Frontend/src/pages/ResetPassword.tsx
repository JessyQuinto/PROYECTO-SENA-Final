import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!password || password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Contraseña actualizada. Redirigiendo a login…');
      (window as any).toast?.success('Contraseña actualizada', { action: 'update' });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña');
      (window as any).toast?.error(err?.message || 'No se pudo actualizar la contraseña', { action: 'update' });
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
                <h1 className="text-2xl font-semibold mb-2 font-display">Restablecer contraseña</h1>
                <p className="opacity-80">Crea una nueva contraseña para tu cuenta.</p>
              </div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Nueva contraseña</h2>
              {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
              {message && <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm">{message}</div>}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <input id="password" type="password" className="input_field w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm">Confirmar contraseña</label>
                  <input id="confirm" type="password" className="input_field w-full" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Actualizando…' : 'Actualizar contraseña'}
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

export default ResetPasswordPage;

