import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { getDepartamentos, getCiudades } from '../lib/geo';

const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  // Unificar formulario (sin pasos)
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({ email: '', nombre: '', password: '', confirmPassword: '' });
  const [extra, setExtra] = useState({ telefono: '', ciudad: '', departamento: '', confirmInfo: false });
  const departamentos = getDepartamentos();
  const ciudades = getCiudades(extra.departamento as any);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);

    const validation = signupSchema.safeParse(form);
    const fieldErrors: Record<string, string> = {};
    if (!validation.success) {
      validation.error?.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
    }
    if (!form.nombre) fieldErrors['nombre'] = 'El nombre es obligatorio';
    if (!extra.telefono) fieldErrors['telefono'] = 'El teléfono es obligatorio';
    if (!extra.ciudad) fieldErrors['ciudad'] = 'La ciudad es obligatoria';
    if (!extra.departamento) fieldErrors['departamento'] = 'El departamento es obligatorio';
    if (!extra.confirmInfo) fieldErrors['confirmInfo'] = 'Debes confirmar que la información es verdadera';
    if (!acceptedTerms) fieldErrors['terms'] = 'Debes aceptar los términos y condiciones';
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);
    const res = await signUp(form.email, form.password, role, {
      nombre: form.nombre,
      telefono: extra.telefono,
      ciudad: extra.ciudad,
      departamento: extra.departamento,
      acceptedTerms,
    });
    if (res.error) {
      setErrors({ general: res.error });
      (window as any).toast?.error(res.error, { action: 'register' });
      setLoading(false);
      return;
    }
    setSuccess('Registro exitoso. Revisa tu correo para confirmar.');
    setLoading(false);
    // Redirigir a pantalla de verificación con countdown
    navigate('/verifica-tu-correo', { replace: true, state: { email: form.email } });
  };

  // Aviso post-registro sin pasos
  useEffect(() => {
    const sub = supabase?.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) navigate('/login', { replace: true });
    });
    return () => { sub?.data?.subscription?.unsubscribe?.(); };
  }, [navigate]);

  return (
    <div className="min-h-[calc(100vh-120px)] grid place-items-center relative overflow-hidden">
      {/* Decorative auth background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-12"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="container max-w-5xl relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="hidden md:block md:col-span-1">
            <div className="card card-hover">
              <div className="card-body">
                <h1 className="text-2xl font-semibold mb-2 font-display">Crea tu cuenta</h1>
                <p className="opacity-80">Únete como comprador o vendedor y forma parte de esta comunidad.</p>
              </div>
            </div>
          </div>
          <div className="card card-hover md:col-span-2">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Registro</h2>
              {errors.general && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{errors.general}</div>}
              {success && <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

              <form className="space-y-6" onSubmit={onSubmit}>
                  {/* Paso 1: Selección de Rol con cards */}
                  <div>
                    <label className="form-label mb-2">Elige tu tipo de cuenta</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`select-card p-5 ${role==='comprador' ? 'selected' : ''}`}
                        onClick={() => setRole('comprador')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-md">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">Comprador</h3>
                            <p className="text-sm text-gray-600">Navega el catálogo, añade al carrito y compra artesanías.</p>
                          </div>
                          {role==='comprador' && <span className="badge badge-success">Seleccionado</span>}
                        </div>
                      </div>
                      <div
                        className={`select-card p-5 ${role==='vendedor' ? 'selected' : ''}`}
                        onClick={() => setRole('vendedor')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-md">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-2l-2-2H8L6 5H4a2 2 0 00-2 2v6m18 0a2 2 0 01-2 2H4a2 2 0 01-2-2m18 0v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">Vendedor</h3>
                            <p className="text-sm text-gray-600">Publica productos, gestiona pedidos y ventas. Requiere aprobación.</p>
                          </div>
                          {role==='vendedor' && <span className="badge badge-success">Seleccionado</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} placeholder="Tu nombre completo" />
                    {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="tu@email.com" />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="••••••••" />
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar contraseña</Label>
                    <Input id="confirm" type="password" value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input id="telefono" value={extra.telefono} onChange={e=>setExtra({...extra, telefono: e.target.value})} placeholder="300 000 0000" />
                      {errors.telefono && <span className="error-text">{errors.telefono}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departamento">Departamento</Label>
                      <select
                        id="departamento"
                        className="form-select"
                        value={extra.departamento}
                        onChange={(e)=>{
                          const dep = e.target.value;
                          setExtra(prev=>({ ...prev, departamento: dep, ciudad: '' }));
                        }}
                      >
                        <option value="">Selecciona un departamento</option>
                        {departamentos.map((dep)=> (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                      {errors.departamento && <span className="error-text">{errors.departamento}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <select
                        id="ciudad"
                        className="form-select"
                        value={extra.ciudad}
                        onChange={(e)=> setExtra(prev=>({ ...prev, ciudad: e.target.value }))}
                        disabled={!extra.departamento}
                      >
                        <option value="">Selecciona una ciudad</option>
                        {ciudades.map((c)=> (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.ciudad && <span className="error-text">{errors.ciudad}</span>}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={extra.confirmInfo} onCheckedChange={(v)=>setExtra({...extra, confirmInfo: Boolean(v)})} />
                    Confirmo que la información es verdadera
                  </label>
                  {errors.confirmInfo && <span className="error-text">{errors.confirmInfo}</span>}
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={acceptedTerms} onCheckedChange={(v)=>setAcceptedTerms(Boolean(v))} />
                    Acepto los <a className="text-(--color-terracotta-suave) hover:underline" href="/terminos" target="_blank" rel="noreferrer">términos y condiciones</a>
                  </label>
                  {errors.terms && <span className="error-text">{errors.terms}</span>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    Crear cuenta
                  </Button>
                  <div className="text-sm text-center">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-(--color-terracotta-suave) hover:underline">Inicia sesión</Link>
                  </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

