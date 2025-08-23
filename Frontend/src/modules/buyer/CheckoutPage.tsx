import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// Pasos del proceso de pago
type PaymentStep = 'resumen' | 'envio' | 'pago' | 'confirmacion';

const CheckoutPage: React.FC = () => {
  const { items, total, clear } = useCart();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('resumen');
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

  // Optimized card handlers to prevent input interruption
  const handleCardChange = useCallback((field: keyof typeof card) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setCard(prev => ({ ...prev, [field]: e.target.value }));
    };
  }, []);

  // Optimized shipping handlers to prevent input interruption
  const handleShippingChange = useCallback((field: keyof typeof shipping) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setShipping(prev => ({ ...prev, [field]: e.target.value }));
    };
  }, []);
  
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

  // Optimized select handlers (after state declarations)
  const handleShippingSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    applyShip(e.target.value);
  }, [addresses]);

  const handlePaymentSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    applyPay(e.target.value);
  }, [payments]);

  // Optimized radio and checkbox handlers
  const handlePaymentMethodChange = useCallback((method: 'tarjeta' | 'contraentrega') => {
    return () => setPaymentMethod(method);
  }, []);

  const handleSaveShipChange = useCallback((checked: boolean) => {
    setSaveShip(checked);
  }, []);

  const handleAgreeChange = useCallback((checked: boolean) => {
    setAgree(checked);
  }, []);

  const sessionEmail = useMemo(()=> (window as any).supabaseSessionEmail as string | undefined, []);

  // Apply functions (declared after state for proper dependencies)
  const applyShip = useCallback((id: string) => {
    if (!id) return;
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setShipping({
      nombre: addr.nombre,
      telefono: addr.telefono || '',
      direccion: addr.direccion,
      direccion2: addr.direccion2 || '',
      ciudad: addr.ciudad,
      departamento: addr.departamento,
      codigoPostal: addr.codigo_postal || ''
    });
  }, [addresses]);

  const applyBill = useCallback((id: string) => {
    if (!id) return;
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setBilling({
      nombre: addr.nombre,
      direccion: addr.direccion,
      ciudad: addr.ciudad,
      departamento: addr.departamento,
      codigoPostal: addr.codigo_postal || ''
    });
  }, [addresses]);

  const applyPay = useCallback((id: string) => {
    if (!id) return;
    const pay = payments.find((p) => p.id === id);
    if (!pay) return;
    setPaymentMethod(pay.metodo);
  }, [payments]);

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
        
        // Solo prefill si no hay datos ya escritos por el usuario
        if (!shipping.nombre && !shipping.direccion) {
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
        }
        
        if (!billing.nombre && !billing.direccion) {
          const defBill = addr.find((a) => a.tipo === 'facturacion' && a.es_predeterminada) || addr.find((a) => a.tipo === 'facturacion');
          if (defBill) {
            setSelectedBillId(defBill.id);
            setBilling({
              nombre: defBill.nombre,
              direccion: defBill.direccion,
              ciudad: defBill.ciudad,
              departamento: defBill.departamento,
              codigoPostal: defBill.codigo_postal || ''
            });
          }
        }
        
        const defPay = pays.find((p) => p.es_predeterminada) || pays[0];
        if (defPay) {
          setSelectedPayId(defPay.id);
          setPaymentMethod(defPay.metodo);
        }
      } catch (e) {
        console.error('Error loading profiles:', e);
      }
    })();
  }, []); // Solo se ejecuta una vez al montar el componente

  const validateStep = (step: PaymentStep): boolean => {
    switch (step) {
      case 'resumen':
        return items.length > 0;
      case 'envio':
        return shipping.nombre.trim() !== '' && 
               shipping.telefono.trim() !== '' && 
               shipping.direccion.trim() !== '' && 
               shipping.ciudad.trim() !== '' && 
               shipping.departamento.trim() !== '';
      case 'pago':
        if (paymentMethod === 'tarjeta') {
          return card.titular.trim() !== '' && 
                 card.numero.trim() !== '' && 
                 card.vencimiento.trim() !== '' && 
                 card.cvc.trim() !== '';
        }
        return true;
      case 'confirmacion':
        return agree;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep === 'resumen') setCurrentStep('envio');
    else if (currentStep === 'envio') setCurrentStep('pago');
    else if (currentStep === 'pago') setCurrentStep('confirmacion');
  };

  const prevStep = () => {
    if (currentStep === 'confirmacion') setCurrentStep('pago');
    else if (currentStep === 'pago') setCurrentStep('envio');
    else if (currentStep === 'envio') setCurrentStep('resumen');
  };

  const submit = async () => {
    if (!validateStep('confirmacion')) return;
    
    try {
      setLoading(true);
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Sesión no disponible');

      // 1) Crear pedido
      const payload = items.map(i => ({ producto_id: i.productoId, cantidad: i.cantidad }));
      const { data: orderId, error: orderErr } = await supabase.rpc('crear_pedido', { items: payload });
      if (orderErr) throw orderErr;

      // 2) Guardar direcciones si se solicitó
      if (saveShip || saveBill) {
        const uid = session.user.id;
        const toSave = [];
      if (saveShip) {
          toSave.push({
            user_id: uid,
            tipo: 'envio',
            nombre: shipping.nombre,
            telefono: shipping.telefono,
            direccion: shipping.direccion,
            direccion2: shipping.direccion2,
            ciudad: shipping.ciudad,
            departamento: shipping.departamento,
            codigo_postal: shipping.codigoPostal,
            es_predeterminada: addresses.filter(a => a.tipo === 'envio').length === 0
          });
      }
      if (saveBill && !billingSame) {
          toSave.push({
            user_id: uid,
            tipo: 'facturacion',
            nombre: billing.nombre,
            direccion: billing.direccion,
            ciudad: billing.ciudad,
            departamento: billing.departamento,
            codigo_postal: billing.codigoPostal,
            es_predeterminada: addresses.filter(a => a.tipo === 'facturacion').length === 0
          });
        }
        if (toSave.length > 0) {
          const { error: addrErr } = await supabase.from('user_address').upsert(toSave);
          if (addrErr) console.warn('Warning: could not save addresses', addrErr);
        }
      }

      // 3) Enviar email de recibo
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
      if (backendUrl) {
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        if (supaUrl) {
          const projectRef = new URL(supaUrl).host.split('.')[0];
          await fetch(`https://${projectRef}.functions.supabase.co/order-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'receipt', email: session.user.email, order_id: orderId })
          });
        }
      }

      clear();
      // Redirigir a página de confirmación
      window.location.href = `/recibo/${orderId}`;
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Componente de progreso
  const ProgressSteps = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {(['resumen', 'envio', 'pago', 'confirmacion'] as PaymentStep[]).map((step, index) => (
          <React.Fragment key={step}>
            <div className={`flex items-center ${currentStep === step ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">
                {step === 'resumen' && 'Resumen'}
                {step === 'envio' && 'Envío'}
                {step === 'pago' && 'Pago'}
                {step === 'confirmacion' && 'Confirmar'}
              </span>
        </div>
            {index < 3 && (
              <div className={`w-12 h-0.5 mx-4 ${
                currentStep === 'resumen' || currentStep === 'envio' || currentStep === 'pago' ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Paso 1: Resumen de compra
  const ResumenStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen de tu compra</h2>
        <p className="text-gray-600">Revisa los productos antes de continuar</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productoId} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {item.imagenUrl && (
                      <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                </div>
                </div>
                <p className="font-semibold">${(item.precio * item.cantidad).toLocaleString()}</p>
              </div>
            ))}
              </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-2xl text-green-600">${total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Paso 2: Datos de envío
  const EnvioStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Información de envío</h2>
        <p className="text-gray-600">¿Dónde quieres recibir tu pedido?</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Perfiles guardados */}
            {addresses.filter(a => a.tipo === 'envio').length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Usar dirección guardada</label>
                <select 
                  id="shipping-select"
                  name="shipping-select"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedShipId} 
                  onChange={handleShippingSelectChange}
                >
                  <option value="">Selecciona una dirección guardada</option>
                  {addresses.filter(a => a.tipo === 'envio').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} — {a.ciudad}, {a.departamento}
                    </option>
                          ))}
                        </select>
                      </div>
            )}

            {/* Formulario de envío */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                id="shipping-nombre"
                name="shipping-nombre"
                placeholder="Nombre completo *" 
                value={shipping.nombre} 
                onChange={handleShippingChange('nombre')} 
                className="md:col-span-2"
                autoComplete="name"
              />
              <Input 
                id="shipping-telefono"
                name="shipping-telefono"
                placeholder="Teléfono *" 
                value={shipping.telefono} 
                onChange={handleShippingChange('telefono')} 
                autoComplete="tel"
              />
              <Input 
                id="shipping-codigo-postal"
                name="shipping-codigo-postal"
                placeholder="Código postal" 
                value={shipping.codigoPostal} 
                onChange={handleShippingChange('codigoPostal')} 
                autoComplete="postal-code"
              />
              <Input 
                id="shipping-direccion"
                name="shipping-direccion"
                placeholder="Dirección *" 
                value={shipping.direccion} 
                onChange={handleShippingChange('direccion')} 
                className="md:col-span-2"
                autoComplete="street-address"
              />
              <Input 
                id="shipping-direccion2"
                name="shipping-direccion2"
                placeholder="Apartamento, interior, referencia (opcional)" 
                value={shipping.direccion2} 
                onChange={handleShippingChange('direccion2')} 
                className="md:col-span-2"
                autoComplete="address-line2"
              />
              <Input 
                id="shipping-ciudad"
                name="shipping-ciudad"
                placeholder="Ciudad *" 
                value={shipping.ciudad} 
                onChange={handleShippingChange('ciudad')} 
                autoComplete="address-level2"
              />
              <Input 
                id="shipping-departamento"
                name="shipping-departamento"
                placeholder="Departamento *" 
                value={shipping.departamento} 
                onChange={handleShippingChange('departamento')} 
                autoComplete="address-level1"
              />
            </div>

            {/* Guardar perfil */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox 
                id="save-shipping"
                checked={saveShip} 
                onCheckedChange={handleSaveShipChange} 
              />
              <label htmlFor="save-shipping" className="text-sm text-gray-600">Guardar esta dirección para futuras compras</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Paso 3: Método de pago
  const PagoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Método de pago</h2>
        <p className="text-gray-600">¿Cómo quieres pagar tu pedido?</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Métodos de pago */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Selecciona tu método de pago</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'tarjeta' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input 
                    id="payment-method-tarjeta"
                    type="radio" 
                    name="paymentMethod" 
                    className="sr-only" 
                    checked={paymentMethod === 'tarjeta'} 
                    onChange={handlePaymentMethodChange('tarjeta')} 
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Tarjeta de crédito/débito</p>
                      <p className="text-xs text-gray-500">Pago seguro y rápido</p>
                    </div>
                  </div>
                  </label>

                <label className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'contraentrega' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input 
                    id="payment-method-contraentrega"
                    type="radio" 
                    name="paymentMethod" 
                    className="sr-only" 
                    checked={paymentMethod === 'contraentrega'} 
                    onChange={handlePaymentMethodChange('contraentrega')} 
                  />
                    <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded">
                      <Icon category="Carrito y checkout" name="Fa6SolidTruck" className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Contraentrega</p>
                      <p className="text-xs text-gray-500">Paga al recibir tu pedido</p>
                    </div>
                    </div>
                  </label>
              </div>
            </div>

            {/* Formulario de tarjeta */}
            {paymentMethod === 'tarjeta' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">Información de la tarjeta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    id="card-titular"
                    name="card-titular"
                    className="md:col-span-2" 
                    placeholder="Nombre del titular *" 
                    value={card.titular} 
                    onChange={handleCardChange('titular')} 
                    autoComplete="cc-name"
                  />
                  <Input 
                    id="card-numero"
                    name="card-numero"
                    className="md:col-span-2" 
                    placeholder="Número de tarjeta *" 
                    value={card.numero} 
                    onChange={handleCardChange('numero')} 
                    autoComplete="cc-number"
                  />
                  <Input 
                    id="card-vencimiento"
                    name="card-vencimiento"
                    placeholder="MM/AA *" 
                    value={card.vencimiento} 
                    onChange={handleCardChange('vencimiento')} 
                    autoComplete="cc-exp"
                  />
                  <Input 
                    id="card-cvc"
                    name="card-cvc"
                    placeholder="CVC *" 
                    value={card.cvc} 
                    onChange={handleCardChange('cvc')} 
                    autoComplete="cc-csc"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  🔒 Tus datos están protegidos. Esta es una simulación educativa.
                </p>
                  </div>
                )}

            {/* Perfiles de pago guardados */}
            {payments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium text-gray-700">Usar método de pago guardado</label>
                <select 
                  id="payment-select"
                  name="payment-select"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedPayId} 
                  onChange={handlePaymentSelectChange}
                >
                  <option value="">Selecciona un método guardado</option>
                  {payments.map(p => (
                    <option key={p.id} value={p.id}>{p.etiqueta}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
            </CardContent>
          </Card>
    </div>
  );

  // Paso 4: Confirmación
  const ConfirmacionStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirma tu pedido</h2>
        <p className="text-gray-600">Revisa todos los detalles antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del pedido */}
          <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-5 h-5" />
              Resumen del pedido
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productoId} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span className="text-sm">{item.nombre} x{item.cantidad}</span>
                  <span className="font-medium">${(item.precio * item.cantidad).toLocaleString()}</span>
              </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-xl text-green-600">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de envío y pago */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Icon category="Carrito y checkout" name="Fa6SolidTruck" className="w-5 h-5" />
              Detalles de envío
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Destinatario:</span>
                <p className="font-medium">{shipping.nombre}</p>
              </div>
              <div>
                <span className="text-gray-600">Dirección:</span>
                <p className="font-medium">{shipping.direccion}</p>
                {shipping.direccion2 && <p className="font-medium">{shipping.direccion2}</p>}
                <p className="font-medium">{shipping.ciudad}, {shipping.departamento}</p>
                {shipping.codigoPostal && <p className="font-medium">{shipping.codigoPostal}</p>}
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <p className="font-medium">{shipping.telefono}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Icon category="Carrito y checkout" name="VaadinWallet" className="w-5 h-5" />
                Método de pago
              </h3>
              <p className="font-medium capitalize">
                {paymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Contraentrega'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Términos y condiciones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="agree-terms"
              checked={agree} 
              onCheckedChange={handleAgreeChange} 
              className="mt-1"
            />
            <div className="text-sm text-gray-600">
              <label htmlFor="agree-terms">
                <p>He leído y acepto los <a href="#" className="text-green-600 hover:underline">Términos y Condiciones</a> y la <a href="#" className="text-green-600 hover:underline">Política de Privacidad</a>.</p>
              </label>
              <p className="mt-2 text-xs text-gray-500">
                Al confirmar tu pedido, aceptas recibir comunicaciones sobre el estado de tu compra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Renderizado principal
  if (items.length === 0) {
    return (
      <div className="container py-8">
        <div className="text-center py-8">
          <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tu carrito está vacío</p>
          <div className="mt-4">
            <a href="/productos" className="btn btn-primary flex items-center gap-2 mx-auto">
              <Icon category="Catálogo y producto" name="LineMdSearch" className="w-4 h-4" />
              Explorar productos
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-lg mb-2">Finalizar compra</h1>
          <p className="text-gray-600">Completa tu pedido en pocos pasos</p>
        </div>

        {/* Progreso */}
        <ProgressSteps />

        {/* Contenido del paso actual */}
        {currentStep === 'resumen' && <ResumenStep />}
        {currentStep === 'envio' && <EnvioStep />}
        {currentStep === 'pago' && <PagoStep />}
        {currentStep === 'confirmacion' && <ConfirmacionStep />}

        {/* Navegación entre pasos */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 'resumen'}
            className="flex items-center gap-2"
          >
            <Icon category="Navegación principal" name="WhhArrowup" className="w-4 h-4 rotate-90" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            {currentStep !== 'confirmacion' ? (
              <Button 
                onClick={nextStep} 
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2"
              >
                Continuar
                <Icon category="Navegación principal" name="WhhArrowup" className="w-4 h-4 -rotate-90" />
              </Button>
            ) : (
              <Button 
                onClick={submit} 
                disabled={!validateStep('confirmacion') || loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-4 h-4 animate-spin" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-5 h-5" />
                    ¡Pagar ahora!
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;


