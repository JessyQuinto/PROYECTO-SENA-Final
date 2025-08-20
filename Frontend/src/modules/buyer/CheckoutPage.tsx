import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import Icon from '@/components/ui/Icon';

interface UserAddress {
  id: string;
  tipo: 'envio' | 'facturacion';
  nombre: string;
  telefono?: string | null;
  direccion: string;
  direccion2?: string | null;
  ciudad: string;
  departamento: string;
  codigo_postal?: string | null;
  es_predeterminada: boolean;
}

interface UserPaymentProfile {
  id: string;
  metodo: 'tarjeta' | 'contraentrega';
  etiqueta: string;
  titular?: string | null;
  last4?: string | null;
  exp_mm?: number | null;
  exp_yy?: number | null;
  es_predeterminada: boolean;
}

const CheckoutPage: React.FC = () => {
  const { items, total, clear } = useCart();
  const [shipping, setShipping] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    direccion2: '',
    ciudad: '',
    departamento: '',
    codigoPostal: ''
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({
    nombre: '', direccion: '', ciudad: '', departamento: '', codigoPostal: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'contraentrega'>('tarjeta');
  const [card, setCard] = useState({ titular: '', numero: '', vencimiento: '', cvc: '' });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // Saved profiles
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [payments, setPayments] = useState<UserPaymentProfile[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | ''>('');
  const [selectedBillId, setSelectedBillId] = useState<string | ''>('');
  const [selectedPayId, setSelectedPayId] = useState<string | ''>('');
  const [saveShip, setSaveShip] = useState(false);
  const [saveBill, setSaveBill] = useState(false);
  const [savePay, setSavePay] = useState(false);

  const sessionEmail = useMemo(()=> (window as any).supabaseSessionEmail as string | undefined, []);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) return;
        const session = (await supabase.auth.getSession()).data.session;
        const uid = session?.user?.id;
        if (!uid) return;
        const addrRes = await supabase
          .from('user_address')
          .select('*')
          .eq('user_id', uid)
          .order('es_predeterminada', { ascending: false })
          .order('created_at', { ascending: false });
        const paysRes = await supabase
          .from('user_payment_profile')
          .select('*')
          .eq('user_id', uid)
          .order('es_predeterminada', { ascending: false })
          .order('created_at', { ascending: false });
        const addr = (addrRes.data || []) as UserAddress[];
        const pays = (paysRes.data || []) as UserPaymentProfile[];
        setAddresses(addr);
        setPayments(pays);
        // Prefill defaults
        const defShip = addr.find((a) => a.tipo === 'envio' && a.es_predeterminada) || addr.find((a) => a.tipo === 'envio');
        if (defShip) {
          setSelectedShipId(defShip.id);
          setShipping({
            nombre: defShip.nombre,
            telefono: defShip.telefono || '',
            direccion: defShip.direccion,
            direccion2: defShip.direccion2 || '',
            ciudad: defShip.ciudad,
            departamento: defShip.departamento,
            codigoPostal: defShip.codigo_postal || ''
          });
        }
        const defPay = pays.find((p) => p.es_predeterminada) || pays[0];
        if (defPay) {
          setSelectedPayId(defPay.id);
          setPaymentMethod(defPay.metodo);
        }
      } catch (e) {
        console.warn('[checkout] load profiles error', e);
      }
    })();
  }, []);

  const submit = async () => {
    if (items.length === 0) { (window as any).toast?.error('Carrito vacío', { role: 'comprador', action: 'purchase' }); return; }
    if (!shipping.nombre || !shipping.telefono || !shipping.direccion || !shipping.ciudad || !shipping.departamento || !shipping.codigoPostal) {
      (window as any).toast?.error('Completa datos de envío (nombre, teléfono, dirección, ciudad, departamento, código postal)', { role: 'comprador', action: 'purchase' });
      return;
    }
    if (!billingSame) {
      if (!billing.nombre || !billing.direccion || !billing.ciudad || !billing.departamento || !billing.codigoPostal) {
        (window as any).toast?.error('Completa datos de facturación', { role: 'comprador', action: 'purchase' });
        return;
      }
    }
    if (paymentMethod === 'tarjeta') {
      const num = card.numero.replace(/\s+/g,'');
      const exp = card.vencimiento.trim();
      const cvc = card.cvc.trim();
      if (!card.titular || num.length < 13 || num.length > 19 || !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp) || !(cvc.length===3 || cvc.length===4)) {
        (window as any).toast?.error('Revisa los datos de la tarjeta (titular, número, vencimiento MM/YY, CVC)', { role: 'comprador', action: 'purchase' });
        return;
      }
    }
    if (!agree) { (window as any).toast?.error('Debes aceptar términos y política de privacidad', { role: 'comprador', action: 'purchase' }); return; }
    setLoading(true);
    try {
      // Guardar perfiles seleccionados/nuevos si el usuario lo pidió
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');

      const mutations: Promise<any>[] = [];
      if (saveShip) {
        mutations.push(
          supabase.from('user_address').insert({
            user_id: uid,
            tipo: 'envio',
            nombre: shipping.nombre,
            telefono: shipping.telefono,
            direccion: shipping.direccion,
            direccion2: shipping.direccion2 || null,
            ciudad: shipping.ciudad,
            departamento: shipping.departamento,
            codigo_postal: shipping.codigoPostal,
            es_predeterminada: addresses.filter(a => a.tipo==='envio').length === 0
          })
        );
      }
      if (saveBill && !billingSame) {
        mutations.push(
          supabase.from('user_address').insert({
            user_id: uid,
            tipo: 'facturacion',
            nombre: billing.nombre,
            telefono: null,
            direccion: billing.direccion,
            direccion2: null,
            ciudad: billing.ciudad,
            departamento: billing.departamento,
            codigo_postal: billing.codigoPostal,
            es_predeterminada: addresses.filter(a => a.tipo==='facturacion').length === 0
          })
        );
      }
      if (savePay) {
        const num = card.numero.replace(/\s+/g,'');
        const last4 = paymentMethod==='tarjeta' && num.length >= 4 ? num.slice(-4) : null;
        const exp = card.vencimiento.split('/') || [];
        const exp_mm = Number(exp[0]) || null;
        const exp_yy = Number(exp[1]) || null;
        const etiqueta = paymentMethod === 'tarjeta' ? `Tarjeta •••• ${last4 || ''}` : 'Contraentrega';
        mutations.push(
          supabase.from('user_payment_profile').insert({
            user_id: uid,
            metodo: paymentMethod,
            etiqueta,
            titular: paymentMethod==='tarjeta' ? card.titular : null,
            last4,
            exp_mm: paymentMethod==='tarjeta' ? exp_mm : null,
            exp_yy: paymentMethod==='tarjeta' ? exp_yy : null,
            es_predeterminada: payments.length === 0
          })
        );
      }
      if (mutations.length) {
        await Promise.allSettled(mutations);
      }

      const payload = items.map(i => ({ producto_id: i.productoId, cantidad: i.cantidad }));
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
      if (!backendUrl) throw new Error('Backend no configurado');
      const token = session?.access_token;
      const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/rpc/crear_pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: payload,
          shipping: {
            nombre: shipping.nombre,
            direccion: [shipping.direccion, shipping.direccion2].filter(Boolean).join(', '),
            ciudad: `${shipping.ciudad} (${shipping.departamento}) ${shipping.codigoPostal}`,
            telefono: shipping.telefono
          },
          simulate_payment: paymentMethod === 'tarjeta'
        })
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || 'Error creando pedido');
      const orderId = j.order_id;
      // Enviar recibo por email
      try {
        const session2 = (await supabase.auth.getSession()).data.session;
        const token2 = session2?.access_token;
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        const email = session2?.user?.email;
        if (supaUrl && token2 && email) {
          const projectRef = new URL(supaUrl).host.split('.')[0];
          await fetch(`https://${projectRef}.functions.supabase.co/order-emails`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
            body: JSON.stringify({ action: 'receipt', email, order_id: orderId })
          });
        }
      } catch {}
      clear();
      (window as any).toast?.success('Compra realizada', { role: 'comprador', action: 'purchase' });
      window.location.href = `/recibo/${orderId}`;
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'Error en el checkout', { role: 'comprador', action: 'purchase' });
    } finally {
      setLoading(false);
    }
  };

  // Helpers to apply selected profiles
  const applyShip = (id: string) => {
    setSelectedShipId(id);
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setShipping({
        nombre: addr.nombre,
        telefono: addr.telefono || '',
        direccion: addr.direccion,
        direccion2: addr.direccion2 || '',
        ciudad: addr.ciudad,
        departamento: addr.departamento,
        codigoPostal: addr.codigo_postal || ''
      });
    }
  };
  const applyBill = (id: string) => {
    setSelectedBillId(id);
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setBilling({
        nombre: addr.nombre,
        direccion: addr.direccion,
        ciudad: addr.ciudad,
        departamento: addr.departamento,
        codigoPostal: addr.codigo_postal || ''
      });
    }
  };
  const applyPay = (id: string) => {
    setSelectedPayId(id);
    const p = payments.find(x => x.id === id);
    if (!p) return;
    setPaymentMethod(p.metodo);
    if (p.metodo === 'tarjeta') {
      // Solo preselección de método; no guardamos números completos por seguridad
      setCard(c => ({ ...c, titular: p.titular || '' }));
    }
  };

  return (
    <div className="container py-8">
      <h1 className="heading-lg mb-6 flex items-center gap-3">
        <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-8 h-8" />
        Checkout
      </h1>
      {/* Decorative strip */}
      <div
        className="rounded-xl h-10 mb-6 overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {items.length === 0 ? (
        <div className="text-center py-8">
          <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p>Tu carrito está vacío</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon category="Carrito y checkout" name="Fa6SolidTruck" className="w-5 h-5" />
                  Datos de envío
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="form-label mb-1 text-sm">Perfiles guardados</label>
                    <select className="input w-full" value={selectedShipId} onChange={e=>applyShip(e.target.value)}>
                      <option value="">Selecciona un perfil (opcional)</option>
                      {addresses.filter(a=>a.tipo==='envio').map(a=> (
                        <option key={a.id} value={a.id}>{a.nombre} — {a.ciudad}, {a.departamento}</option>
                      ))}
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <Checkbox checked={saveShip} onCheckedChange={v=>setSaveShip(!!v)} />
                    Guardar como perfil de envío
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Nombre completo" value={shipping.nombre} onChange={(e)=>setShipping({ ...shipping, nombre: e.target.value })} />
                  <Input placeholder="Teléfono" value={shipping.telefono} onChange={(e)=>setShipping({ ...shipping, telefono: e.target.value })} />
                  <Input className="md:col-span-2" placeholder="Dirección" value={shipping.direccion} onChange={(e)=>setShipping({ ...shipping, direccion: e.target.value })} />
                  <Input className="md:col-span-2" placeholder="Apto, interior, referencia (opcional)" value={shipping.direccion2} onChange={(e)=>setShipping({ ...shipping, direccion2: e.target.value })} />
                  <Input placeholder="Ciudad" value={shipping.ciudad} onChange={(e)=>setShipping({ ...shipping, ciudad: e.target.value })} />
                  <Input placeholder="Departamento" value={shipping.departamento} onChange={(e)=>setShipping({ ...shipping, departamento: e.target.value })} />
                  <Input placeholder="Código postal" value={shipping.codigoPostal} onChange={(e)=>setShipping({ ...shipping, codigoPostal: e.target.value })} />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon category="Carrito y checkout" name="HugeiconsMapsLocation01" className="w-5 h-5" />
                  Datos de facturación
                </h2>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={billingSame} onCheckedChange={(v)=>setBillingSame(!!v)} />
                  <span>Usar los mismos datos de envío</span>
                </label>
                {!billingSame && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="form-label mb-1 text-sm">Perfiles guardados</label>
                        <select className="input w-full" value={selectedBillId} onChange={e=>applyBill(e.target.value)}>
                          <option value="">Selecciona un perfil (opcional)</option>
                          {addresses.filter(a=>a.tipo==='facturacion').map(a=> (
                            <option key={a.id} value={a.id}>{a.nombre} — {a.ciudad}, {a.departamento}</option>
                          ))}
                        </select>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <Checkbox checked={saveBill} onCheckedChange={v=>setSaveBill(!!v)} />
                        Guardar como perfil de facturación
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Nombre completo" value={billing.nombre} onChange={(e)=>setBilling({ ...billing, nombre: e.target.value })} />
                      <Input className="md:col-span-2" placeholder="Dirección" value={billing.direccion} onChange={(e)=>setBilling({ ...billing, direccion: e.target.value })} />
                      <Input placeholder="Ciudad" value={billing.ciudad} onChange={(e)=>setBilling({ ...billing, ciudad: e.target.value })} />
                      <Input placeholder="Departamento" value={billing.departamento} onChange={(e)=>setBilling({ ...billing, departamento: e.target.value })} />
                      <Input placeholder="Código postal" value={billing.codigoPostal} onChange={(e)=>setBilling({ ...billing, codigoPostal: e.target.value })} />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon category="Carrito y checkout" name="VaadinWallet" className="w-5 h-5" />
                  Método de pago
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="form-label mb-1 text-sm">Perfiles guardados</label>
                    <select className="input w-full" value={selectedPayId} onChange={e=>applyPay(e.target.value)}>
                      <option value="">Selecciona un perfil (opcional)</option>
                      {payments.map(p => (
                        <option key={p.id} value={p.id}>{p.etiqueta}</option>
                      ))}
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <Checkbox checked={savePay} onCheckedChange={v=>setSavePay(!!v)} />
                    Guardar como perfil de pago
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`select-card p-4 ${paymentMethod==='tarjeta'?'selected':''}`}>
                    <input type="radio" name="pay" className="sr-only" checked={paymentMethod==='tarjeta'} onChange={()=>setPaymentMethod('tarjeta')} />
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Icon category="Carrito y checkout" name="VaadinWallet" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Tarjeta (simulado)</p>
                        <p className="text-xs text-gray-500">Validaremos formato y simularemos aprobación</p>
                      </div>
                    </div>
                  </label>
                  <label className={`select-card p-4 ${paymentMethod==='contraentrega'?'selected':''}`}>
                    <input type="radio" name="pay" className="sr-only" checked={paymentMethod==='contraentrega'} onChange={()=>setPaymentMethod('contraentrega')} />
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Icon category="Carrito y checkout" name="Fa6SolidTruck" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Contraentrega</p>
                        <p className="text-xs text-gray-500">Paga al recibir (simulado)</p>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'tarjeta' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input className="md:col-span-2" placeholder="Titular de la tarjeta" value={card.titular} onChange={(e)=>setCard({ ...card, titular: e.target.value })} />
                    <Input placeholder="Número de tarjeta" value={card.numero} onChange={(e)=>setCard({ ...card, numero: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Vencimiento (MM/YY)" value={card.vencimiento} onChange={(e)=>setCard({ ...card, vencimiento: e.target.value })} />
                      <Input placeholder="CVC" value={card.cvc} onChange={(e)=>setCard({ ...card, cvc: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={agree} onCheckedChange={(v)=>setAgree(!!v)} />
                <span>He leído y acepto los Términos y la Política de Privacidad</span>
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-5 h-5" />
                Resumen
              </h2>
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/afrique-doodle-set/7311.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <p className="text-sm opacity-80">Gracias por confiar en nuestros artesanos. Revisa tu resumen antes de pagar.</p>
              </div>
              <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                {items.map(i => (
                  <li key={i.productoId} className="flex items-center justify-between">
                    <span className="truncate">{i.nombre} x{i.cantidad}</span>
                    <span>${(i.precio*i.cantidad).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Icon category="Carrito y checkout" name="HugeiconsMapsLocation01" className="w-3 h-3" />
                  Envío a: {shipping.direccion}{shipping.direccion2?`, ${shipping.direccion2}`:''}
                </div>
                <div>{shipping.ciudad}{shipping.departamento?`, ${shipping.departamento}`:''} {shipping.codigoPostal}</div>
                <div>Contacto: {shipping.telefono}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <Icon category="Carrito y checkout" name="VaadinWallet" className="w-4 h-4" />
                  Total
                </span>
                <span className="text-2xl font-bold text-(--color-terracotta-suave)">${total.toLocaleString()}</span>
              </div>
              <Button className="w-full flex items-center justify-center gap-2" disabled={loading} onClick={submit}>
                {loading ? (
                  <>
                    <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-4 h-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-4 h-4" />
                    Pagar ahora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;


