import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { supabase } from '../../lib/supabaseClient';
import Icon from '@/components/ui/Icon';

interface AddressForm { id?: string; tipo: 'envio'|'facturacion'; nombre: string; telefono?: string; direccion: string; direccion2?: string; ciudad: string; departamento: string; codigo_postal?: string; es_predeterminada?: boolean }
interface PayForm { id?: string; metodo: 'tarjeta'|'contraentrega'; etiqueta: string; titular?: string; last4?: string; exp_mm?: number; exp_yy?: number; es_predeterminada?: boolean }

const ProfilesManager: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressForm[]>([]);
  const [payments, setPayments] = useState<PayForm[]>([]);
  const [addr, setAddr] = useState<AddressForm>({ tipo: 'envio', nombre: '', telefono: '', direccion: '', direccion2: '', ciudad: '', departamento: '', codigo_postal: '' });
  const [pay, setPay] = useState<PayForm>({ metodo: 'contraentrega', etiqueta: 'Contraentrega' });
  const [loading, setLoading] = useState(false);
  const [addrPage, setAddrPage] = useState(1);
  const [addrTotal, setAddrTotal] = useState(0);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const pageSize = 5;

  const load = async () => {
    if (!supabase) return;
    const session = (await supabase.auth.getSession()).data.session;
    const uid = session?.user?.id;
    if (!uid) return;
    const addrFrom = (addrPage - 1) * pageSize;
    const addrTo = addrFrom + pageSize - 1;
    const payFrom = (payPage - 1) * pageSize;
    const payTo = payFrom + pageSize - 1;

    const [addrRes, payRes] = await Promise.all([
      supabase
        .from('user_address')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .order('es_predeterminada', { ascending: false })
        .order('created_at', { ascending: false })
        .range(addrFrom, addrTo),
      supabase
        .from('user_payment_profile')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .order('es_predeterminada', { ascending: false })
        .order('created_at', { ascending: false })
        .range(payFrom, payTo),
    ]);
    setAddresses((addrRes.data || []) as any);
    setAddrTotal(addrRes.count || 0);
    setPayments((payRes.data || []) as any);
    setPayTotal(payRes.count || 0);
  };

  useEffect(() => { load(); }, []);

  const saveAddress = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      const payload: any = { ...addr, user_id: uid, es_predeterminada: !!addr.es_predeterminada };
      let savedId = addr.id;
      if (addr.id) {
        const { error } = await supabase.from('user_address').update(payload).eq('id', addr.id).eq('user_id', uid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('user_address').insert(payload).select().limit(1).single();
        if (error) throw error;
        savedId = (data as any)?.id;
      }
      if (payload.es_predeterminada) {
        // Asegurar único predeterminado por tipo
        await supabase.from('user_address')
          .update({ es_predeterminada: false })
          .eq('user_id', uid)
          .eq('tipo', payload.tipo)
          .neq('id', savedId || '00000000-0000-0000-0000-000000000000');
      }
      (window as any).toast?.success('Dirección guardada');
      setAddr({ tipo: 'envio', nombre: '', telefono: '', direccion: '', direccion2: '', ciudad: '', departamento: '', codigo_postal: '' });
      await load();
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'Error guardando dirección');
    } finally { setLoading(false); }
  };

  const editAddress = (a: AddressForm) => setAddr({ ...a });
  const deleteAddress = async (id: string) => {
    if (!supabase) return;
    if (!confirm('¿Eliminar dirección?')) return;
    const { error } = await supabase.from('user_address').delete().eq('id', id);
    if (error) { (window as any).toast?.error(error.message); return; }
    (window as any).toast?.success('Dirección eliminada');
    await load();
  };

  const savePayment = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      const payload: any = { ...pay, user_id: uid, es_predeterminada: !!pay.es_predeterminada };
      let savedId = pay.id;
      if (pay.id) {
        const { error } = await supabase.from('user_payment_profile').update(payload).eq('id', pay.id).eq('user_id', uid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('user_payment_profile').insert(payload).select().limit(1).single();
        if (error) throw error;
        savedId = (data as any)?.id;
      }
      if (payload.es_predeterminada) {
        await supabase.from('user_payment_profile')
          .update({ es_predeterminada: false })
          .eq('user_id', uid)
          .neq('id', savedId || '00000000-0000-0000-0000-000000000000');
      }
      (window as any).toast?.success('Método de pago guardado');
      setPay({ metodo: 'contraentrega', etiqueta: 'Contraentrega' });
      await load();
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'Error guardando método de pago');
    } finally { setLoading(false); }
  };

  const editPayment = (p: PayForm) => setPay({ ...p });
  const deletePayment = async (id: string) => {
    if (!supabase) return;
    if (!confirm('¿Eliminar método de pago?')) return;
    const { error } = await supabase.from('user_payment_profile').delete().eq('id', id);
    if (error) { (window as any).toast?.error(error.message); return; }
    (window as any).toast?.success('Método de pago eliminado');
    await load();
  };

  return (
    <div className="container py-8">
      <h1 className="heading-lg mb-6 flex items-center gap-3">
        <Icon category="Usuario" name="RivetIconsSettings" className="w-8 h-8" />
        Perfiles guardados
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Icon category="Carrito y checkout" name="HugeiconsMapsLocation01" className="w-5 h-5" />
              Direcciones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="input" value={addr.tipo} onChange={e=>setAddr({...addr, tipo: e.target.value as any})}>
                <option value="envio">Envío</option>
                <option value="facturacion">Facturación</option>
              </select>
              <Input placeholder="Nombre" value={addr.nombre} onChange={e=>setAddr({...addr, nombre: e.target.value})} />
              <Input placeholder="Teléfono" value={addr.telefono} onChange={e=>setAddr({...addr, telefono: e.target.value})} />
              <Input className="md:col-span-2" placeholder="Dirección" value={addr.direccion} onChange={e=>setAddr({...addr, direccion: e.target.value})} />
              <Input className="md:col-span-2" placeholder="Apto, interior, referencia" value={addr.direccion2} onChange={e=>setAddr({...addr, direccion2: e.target.value})} />
              <Input placeholder="Ciudad" value={addr.ciudad} onChange={e=>setAddr({...addr, ciudad: e.target.value})} />
              <Input placeholder="Departamento" value={addr.departamento} onChange={e=>setAddr({...addr, departamento: e.target.value})} />
              <Input placeholder="Código postal" value={addr.codigo_postal} onChange={e=>setAddr({...addr, codigo_postal: e.target.value as any})} />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!addr.es_predeterminada} onChange={e=>{
                  const next = e.target.checked;
                  if (next && addr.es_predeterminada !== true) {
                    if (!confirm('Marcar como predeterminada reemplazará la actual predeterminada. ¿Continuar?')) { return; }
                  }
                  setAddr({...addr, es_predeterminada: next});
                }} />
                Predeterminada
              </label>
              <div className="md:col-span-2 flex gap-2">
                <Button disabled={loading} onClick={saveAddress} className="flex items-center gap-2">
                  <Icon category="Vendedor" name="FaSolidEdit" className="w-4 h-4" />
                  {addr.id ? 'Actualizar' : 'Guardar'}
                </Button>
                {addr.id && <Button variant="secondary" onClick={()=>setAddr({ tipo: 'envio', nombre: '', telefono: '', direccion: '', direccion2: '', ciudad: '', departamento: '', codigo_postal: '' })} className="flex items-center gap-2">
                  <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-4 h-4" />
                  Cancelar
                </Button>}
              </div>
            </div>
            <ul className="text-sm divide-y">
              {addresses.map(a=> (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div className="truncate pr-3">
                    <span className="font-medium">[{a.tipo}]</span> {a.nombre} — {a.ciudad}, {a.departamento} {a.es_predeterminada ? <span className="badge badge-success ml-2">Default</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={()=>editAddress(a as any)} className="flex items-center gap-1">
                      <Icon category="Vendedor" name="FaSolidEdit" className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={()=>deleteAddress(a.id!)} className="flex items-center gap-1">
                      <Icon category="Vendedor" name="LineMdTrash" className="w-3 h-3" />
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-sm pt-2">
              <span>Página {addrPage} de {Math.max(1, Math.ceil(addrTotal / pageSize))}</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={addrPage<=1} onClick={()=>{ setAddrPage(p=>p-1); setTimeout(load, 0); }} className="flex items-center gap-1">
                  <Icon category="Catálogo y producto" name="WhhArrowdown" className="w-3 h-3" />
                  Anterior
                </Button>
                <Button variant="secondary" disabled={addrPage>=Math.ceil(addrTotal / pageSize)} onClick={()=>{ setAddrPage(p=>p+1); setTimeout(load, 0); }} className="flex items-center gap-1">
                  <Icon category="Catálogo y producto" name="WhhArrowup" className="w-3 h-3" />
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Icon category="Carrito y checkout" name="VaadinWallet" className="w-5 h-5" />
              Métodos de pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="input" value={pay.metodo} onChange={e=>{
                const metodo = e.target.value as any;
                setPay(prev=> ({ ...prev, metodo, etiqueta: metodo==='tarjeta' ? (prev.last4 ? `Tarjeta •••• ${prev.last4}` : 'Tarjeta') : 'Contraentrega' }));
              }}>
                <option value="tarjeta">Tarjeta</option>
                <option value="contraentrega">Contraentrega</option>
              </select>
              <Input placeholder="Etiqueta" value={pay.etiqueta || ''} onChange={e=>setPay({...pay, etiqueta: e.target.value})} />
              {pay.metodo==='tarjeta' && (
                <>
                  <Input placeholder="Titular" value={pay.titular || ''} onChange={e=>setPay({...pay, titular: e.target.value})} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Last4" value={pay.last4 || ''} onChange={e=>setPay({...pay, last4: e.target.value})} />
                    <Input placeholder="MM" value={pay.exp_mm || '' as any} onChange={e=>setPay({...pay, exp_mm: Number(e.target.value)})} />
                    <Input placeholder="YY" value={pay.exp_yy || '' as any} onChange={e=>setPay({...pay, exp_yy: Number(e.target.value)})} />
                  </div>
                </>
              )}
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!pay.es_predeterminada} onChange={e=>{
                  const next = e.target.checked;
                  if (next && pay.es_predeterminada !== true) {
                    if (!confirm('Marcar como predeterminado reemplazará el actual predeterminado. ¿Continuar?')) { return; }
                  }
                  setPay({...pay, es_predeterminada: next});
                }} />
                Predeterminada
              </label>
              <div className="md:col-span-2 flex gap-2">
                <Button disabled={loading} onClick={savePayment} className="flex items-center gap-2">
                  <Icon category="Vendedor" name="FaSolidEdit" className="w-4 h-4" />
                  {pay.id ? 'Actualizar' : 'Guardar'}
                </Button>
                {pay.id && <Button variant="secondary" onClick={()=>setPay({ metodo: 'contraentrega', etiqueta: 'Contraentrega' })} className="flex items-center gap-2">
                  <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-4 h-4" />
                  Cancelar
                </Button>}
              </div>
            </div>
            <ul className="text-sm divide-y">
              {payments.map(p=> (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <div className="truncate pr-3">
                    <span className="font-medium">[{p.metodo}]</span> {p.etiqueta} {p.es_predeterminada ? <span className="badge badge-success ml-2">Default</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={()=>editPayment(p as any)} className="flex items-center gap-1">
                      <Icon category="Vendedor" name="FaSolidEdit" className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={()=>deletePayment(p.id!)} className="flex items-center gap-1">
                      <Icon category="Vendedor" name="LineMdTrash" className="w-3 h-3" />
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-sm pt-2">
              <span>Página {payPage} de {Math.max(1, Math.ceil(payTotal / pageSize))}</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={payPage<=1} onClick={()=>{ setPayPage(p=>p-1); setTimeout(load, 0); }} className="flex items-center gap-1">
                  <Icon category="Catálogo y producto" name="WhhArrowdown" className="w-3 h-3" />
                  Anterior
                </Button>
                <Button variant="secondary" disabled={payPage>=Math.ceil(payTotal / pageSize)} onClick={()=>{ setPayPage(p=>p+1); setTimeout(load, 0); }} className="flex items-center gap-1">
                  <Icon category="Catálogo y producto" name="WhhArrowup" className="w-3 h-3" />
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilesManager;
