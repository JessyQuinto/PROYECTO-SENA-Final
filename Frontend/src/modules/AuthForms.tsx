import React, { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const AuthForms: React.FC = () => {
  const { signIn, signUp, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parse = loginSchema.safeParse({ email, password });
    if (!parse.success) { setError('Datos inválidos'); return; }
    setLoading(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password, role);
    if (res.error) {
      setError(res.error);
    } else {
      if (mode === 'signup') {
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      } else {
        setSuccess('¡Bienvenido! Redirigiendo...');
      }
      setTimeout(() => {
        const target = (user?.role === 'vendedor') ? '/vendedor' : '/';
        navigate(target, { replace: true });
      }, 600);
    }
    setLoading(false);
  };

  if (user) {
    return (
      <div className="card">
        <div className="card-body space-y-3">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Icon category="Autenticacion" name="MdiEyeLock" className="w-4 h-4" />
            Sesión activa: <span className="font-medium">{user.email}</span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="badge badge-primary flex items-center gap-1">
              <Icon category="Usuario" name="MaterialSymbolsShieldLocked" className="w-3 h-3" />
              Rol: {user.role || '—'}
            </span>
            {user.role === 'vendedor' && user.vendedor_estado !== 'aprobado' && (
              <span className="badge badge-warning flex items-center gap-1">
                <Icon category="Estados y Feedback" name="MaterialSymbolsWarning" className="w-3 h-3" />
                Vendedor: {user.vendedor_estado}
              </span>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/')}>
              <Icon category="Navegación principal" name="MdiHome" className="w-4 h-4" />
              Ir al inicio
            </button>
            <button className="btn-outline flex items-center gap-2" onClick={() => signOut()}>
              <Icon category="Autenticacion" name="MajesticonsLogout" className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="mb-6 inline-flex rounded-lg border border-gray-200 p-1 bg-white">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${mode==='login' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Icon category="Autenticacion" name="OouiLogInLtr" className="w-4 h-4" />
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${mode==='signup' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Icon category="Autenticacion" name="TdesignLogin" className="w-4 h-4" />
          Crear cuenta
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm flex items-center gap-2">
          <Icon category="Estados y Feedback" name="BxsErrorAlt" className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm flex items-center gap-2">
          <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-4 h-4" />
          {success}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label flex items-center gap-2" htmlFor="role">
              <Icon category="Usuario" name="MaterialSymbolsShieldLocked" className="w-4 h-4" />
              Tipo de cuenta
            </label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as any)} className="form-select">
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label flex items-center gap-2" htmlFor="email">
            <Icon category="Autenticacion" name="MdiMail" className="w-4 h-4" />
            Email
          </label>
          <input id="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} className="form-input" />
        </div>

        <div className="form-group">
          <label className="form-label flex items-center gap-2" htmlFor="password">
            <Icon category="Autenticacion" name="MdiEyeLock" className="w-4 h-4" />
            Contraseña
          </label>
          <input id="password" placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-input" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Icon category="Autenticacion" name={mode === 'login' ? 'OouiLogInLtr' : 'TdesignLogin'} className="w-4 h-4" />
              {mode==='login' ? 'Entrar' : 'Registrar'}
            </>
          )}
        </button>

        <button type="button" onClick={()=> setMode(m => m==='login' ? 'signup':'login')} className="w-full text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2">
          <Icon category="Autenticacion" name={mode === 'login' ? 'TdesignLogin' : 'OouiLogInLtr'} className="w-4 h-4" />
          {mode==='login' ? '¿No tienes cuenta? Crear cuenta' : 'Ya tengo cuenta'}
        </button>
      </form>
    </div>
  );
};
