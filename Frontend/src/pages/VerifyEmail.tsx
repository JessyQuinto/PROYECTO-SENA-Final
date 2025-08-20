import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';

const TOTAL = 120;

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [seconds, setSeconds] = useState(TOTAL);
  const email = useMemo(() => location?.state?.email as string | undefined, [location?.state]);
  const [code, setCode] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, []);

  // Si el usuario confirma el correo y vuelve con type=signup, AuthContext ya lo redirige a /login
  // Aquí solo escuchamos sesión por si inicia sesión manualmente tras confirmar
  useEffect(() => {
    const sub = supabase?.auth.onAuthStateChange((_e: any, session: any) => {
      if (session?.user) {
        navigate('/login', { replace: true });
      }
    });
    return () => { sub?.data?.subscription?.unsubscribe?.(); };
  }, [navigate]);

  const minutes = Math.floor(seconds / 60);
  const sec = String(seconds % 60).padStart(2, '0');

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const targetEmail = email || manualEmail;
    if (!targetEmail) { setError('Ingresa tu email'); return; }
    if (!code || code.length < 6) { setError('Código inválido'); return; }
    setVerifying(true);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code,
        type: 'signup',
      });
      if (err) { setError(err.message); setVerifying(false); return; }
      if (data?.session?.user) {
        try { (window as any).toast?.success('Correo verificado. Inicia sesión.'); } catch {}
        navigate('/login', { replace: true });
      } else {
        try { (window as any).toast?.success('Correo verificado. Inicia sesión.'); } catch {}
        navigate('/login', { replace: true });
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo verificar el código');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] grid place-items-center">
      <div className="container max-w-xl">
        <div className="card card-hover">
          <div className="card-body text-center">
            <div className="mb-3 text-sm uppercase tracking-wide font-semibold text-(--color-terracotta-suave)">Verifica tu correo</div>
            <h1 className="text-2xl font-semibold mb-2 font-display">Te enviamos un enlace de confirmación</h1>
            <p className="opacity-80 mb-4">
              {email ? <>Revisa <b>{email}</b> y haz clic en “Confirmar mi cuenta”.</> : 'Revisa tu bandeja de entrada y haz clic en “Confirmar mi cuenta”.'}
            </p>
            <div className="text-4xl font-bold tabular-nums mb-2">{minutes}:{sec}</div>
            <p className="text-sm opacity-70 mb-6">Este tiempo es orientativo. El enlace de Supabase puede expirar antes según la configuración del proyecto.</p>
            <div className="flex items-center justify-center gap-3">
              <Link className="btn" to="/login">Ir a iniciar sesión</Link>
              <button className="btn-ghost" onClick={()=>window.location.reload()}>Actualizar</button>
            </div>

            {/* Verificación con código (OTP) */}
            <div className="mt-8 text-left">
              <h2 className="text-base font-semibold mb-2">¿Tienes un código de verificación?</h2>
              <p className="text-sm opacity-80 mb-4">Introduce el código que recibiste en el correo para verificar tu cuenta.</p>
              {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
              <form className="grid gap-3 md:grid-cols-3" onSubmit={handleVerifyCode}>
                {!email && (
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="verif-email">Email</Label>
                    <Input id="verif-email" type="email" placeholder="tu@email.com" value={manualEmail} onChange={(e)=>setManualEmail(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="otp">Código</Label>
                  <Input id="otp" inputMode="numeric" placeholder="123456" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} maxLength={6} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={verifying}>{verifying ? 'Verificando…' : 'Verificar'}</Button>
                </div>
              </form>
              <p className="text-xs opacity-70 mt-2">Si tu correo dice “También puedes usar este código de verificación”, cópialo aquí.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;


