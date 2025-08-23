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
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // Saved profiles
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [payments, setPayments] = useState<UserPaymentProfile[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | ''>('');
  const [selectedBillId, setSelectedBillId] = useState<string | ''>('');
  const [selectedPayId, setSelectedPayId] = useState<string | ''>('');

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
        const defPay = pays.find((p) => p.es_predeterminada) || pays[0];
        if (defPay) {
          setSelectedPayId(defPay.id);
          setPaymentMethod(defPay.metodo);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    })();
  }, []);

  const handleShippingChange = (field: keyof typeof shipping, value: string) => {
    setShipping(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: keyof typeof billing, value: string) => {
    setBilling(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field: keyof typeof card, value: string) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (address: UserAddress) => {
    if (address.tipo === 'envio') {
      setSelectedShipId(address.id);
      setShipping({
        nombre: address.nombre,
        telefono: address.telefono || '',
        direccion: address.direccion,
        direccion2: address.direccion2 || '',
        ciudad: address.ciudad,
        departamento: address.departamento,
        codigoPostal: address.codigo_postal || ''
      });
    } else {
      setSelectedBillId(address.id);
      setBilling({
        nombre: address.nombre,
        direccion: address.direccion,
        ciudad: address.ciudad,
        departamento: address.departamento,
        codigoPostal: address.codigo_postal || ''
      });
    }
  };

  const handlePaymentSelect = (payment: UserPaymentProfile) => {
    setSelectedPayId(payment.id);
    setPaymentMethod(payment.metodo);
  };

  const canProceed = () => {
    if (currentStep === 'resumen') return true;
    if (currentStep === 'envio') {
      return shipping.nombre && shipping.direccion && shipping.ciudad && shipping.departamento;
    }
    if (currentStep === 'pago') {
      if (paymentMethod === 'tarjeta') {
        return card.titular && card.numero && card.vencimiento && card.cvc;
      }
      return true; // Contraentrega no requiere validación
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 'resumen') setCurrentStep('envio');
    else if (currentStep === 'envio') setCurrentStep('pago');
    else if (currentStep === 'pago') setCurrentStep('confirmacion');
  };

  const prevStep = () => {
    if (currentStep === 'envio') setCurrentStep('resumen');
    else if (currentStep === 'pago') setCurrentStep('envio');
    else if (currentStep === 'confirmacion') setCurrentStep('pago');
  };

  const processOrder = async () => {
    if (!agree) return;
    setLoading(true);
    try {
      // Aquí iría la lógica de procesamiento del pedido
      // Por ahora solo simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Redirigir a confirmación o recibo
    } catch (error) {
      console.error('Error processing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResumen = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Resumen de tu compra</h2>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Productos ({items.length})</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                                 <img src={item.imagenUrl || ''} alt={item.nombre} className="w-12 h-12 rounded object-cover" />
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                </div>
              </div>
              <p className="font-semibold">${item.precio * item.cantidad}</p>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-green-600">${total}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvio = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Información de envío</h2>
      
      {/* Direcciones guardadas */}
      {addresses.filter(a => a.tipo === 'envio').length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Usar dirección guardada</h3>
          {addresses.filter(a => a.tipo === 'envio').map((address) => (
            <div
              key={address.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedShipId === address.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAddressSelect(address)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{address.nombre}</p>
                  <p className="text-sm text-gray-600">{address.direccion}</p>
                  <p className="text-sm text-gray-600">{address.ciudad}, {address.departamento}</p>
                </div>
                {address.es_predeterminada && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Predeterminada</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de envío */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Nueva dirección de envío</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <Input
              value={shipping.nombre}
              onChange={(e) => handleShippingChange('nombre', e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <Input
              value={shipping.telefono}
              onChange={(e) => handleShippingChange('telefono', e.target.value)}
              placeholder="Tu teléfono"
              className="w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
            <Input
              value={shipping.direccion}
              onChange={(e) => handleShippingChange('direccion', e.target.value)}
              placeholder="Dirección principal"
              className="w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección secundaria</label>
            <Input
              value={shipping.direccion2}
              onChange={(e) => handleShippingChange('direccion2', e.target.value)}
              placeholder="Apartamento, suite, etc. (opcional)"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
            <Input
              value={shipping.ciudad}
              onChange={(e) => handleShippingChange('ciudad', e.target.value)}
              placeholder="Ciudad"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
            <Input
              value={shipping.departamento}
              onChange={(e) => handleShippingChange('departamento', e.target.value)}
              placeholder="Departamento"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
            <Input
              value={shipping.codigoPostal}
              onChange={(e) => handleShippingChange('codigoPostal', e.target.value)}
              placeholder="Código postal"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="billingSame"
            checked={billingSame}
            onCheckedChange={(checked) => setBillingSame(checked as boolean)}
          />
          <label htmlFor="billingSame" className="text-sm font-medium">
            Usar la misma dirección para facturación
          </label>
        </div>

        {!billingSame && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre para facturación</label>
              <Input
                value={billing.nombre}
                onChange={(e) => handleBillingChange('nombre', e.target.value)}
                placeholder="Nombre para facturación"
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de facturación</label>
              <Input
                value={billing.direccion}
                onChange={(e) => handleBillingChange('direccion', e.target.value)}
                placeholder="Dirección de facturación"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <Input
                value={billing.ciudad}
                onChange={(e) => handleBillingChange('ciudad', e.target.value)}
                placeholder="Ciudad"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <Input
                value={billing.departamento}
                onChange={(e) => handleBillingChange('departamento', e.target.value)}
                placeholder="Departamento"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPago = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Método de pago</h2>
      
      {/* Métodos de pago guardados */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Usar método guardado</h3>
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPayId === payment.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePaymentSelect(payment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon category="Carrito y checkout" name={payment.metodo === 'tarjeta' ? 'StreamlinePlumpPaymentRecieve7Solid' : 'Fa6SolidTruck'} className="w-6 h-6" />
                  <div>
                    <p className="font-medium">{payment.etiqueta}</p>
                    <p className="text-sm text-gray-600">
                      {payment.metodo === 'tarjeta' ? `•••• ${payment.last4}` : 'Contra entrega'}
                    </p>
                  </div>
                </div>
                {payment.es_predeterminada && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Predeterminado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selección de método */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Seleccionar método de pago</h3>
        
        <div className="space-y-3">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'tarjeta' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            onClick={() => setPaymentMethod('tarjeta')}
          >
            <div className="flex items-center space-x-3">
                             <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-6 h-6" />
              <div>
                <p className="font-medium">Tarjeta de crédito/débito</p>
                <p className="text-sm text-gray-600">Pago seguro con tarjeta</p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'contraentrega' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            onClick={() => setPaymentMethod('contraentrega')}
          >
            <div className="flex items-center space-x-3">
                             <Icon category="Carrito y checkout" name="Fa6SolidTruck" className="w-6 h-6" />
              <div>
                <p className="font-medium">Contra entrega</p>
                <p className="text-sm text-gray-600">Paga cuando recibas tu pedido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de tarjeta */}
        {paymentMethod === 'tarjeta' && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titular de la tarjeta</label>
              <Input
                value={card.titular}
                onChange={(e) => handleCardChange('titular', e.target.value)}
                placeholder="Nombre del titular"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
              <Input
                value={card.numero}
                onChange={(e) => handleCardChange('numero', e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                <Input
                  value={card.vencimiento}
                  onChange={(e) => handleCardChange('vencimiento', e.target.value)}
                  placeholder="MM/AA"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <Input
                  value={card.cvc}
                  onChange={(e) => handleCardChange('cvc', e.target.value)}
                  placeholder="123"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Confirmar pedido</h2>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
                     <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">¡Casi listo!</h3>
            <p className="text-green-700">Revisa los detalles de tu pedido antes de confirmar</p>
          </div>
        </div>
      </div>

      {/* Resumen del pedido */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen del pedido</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Dirección de envío</h4>
            <p className="text-gray-600">{shipping.nombre}</p>
            <p className="text-gray-600">{shipping.direccion}</p>
            <p className="text-gray-600">{shipping.ciudad}, {shipping.departamento}</p>
          </div>
          
          {!billingSame && (
            <div>
              <h4 className="font-medium text-gray-900">Dirección de facturación</h4>
              <p className="text-gray-600">{billing.nombre}</p>
              <p className="text-gray-600">{billing.direccion}</p>
              <p className="text-gray-600">{billing.ciudad}, {billing.departamento}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-900">Método de pago</h4>
            <p className="text-gray-600">
              {paymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Contra entrega'}
            </p>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total a pagar:</span>
              <span className="text-green-600">${total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="agree"
            checked={agree}
                         onCheckedChange={(checked) => setAgree(checked as boolean)}
          />
          <label htmlFor="agree" className="text-sm text-gray-700">
            Acepto los <a href="#" className="text-green-600 hover:underline">términos y condiciones</a> y la{' '}
            <a href="#" className="text-green-600 hover:underline">política de privacidad</a>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'resumen':
        return renderResumen();
      case 'envio':
        return renderEnvio();
      case 'pago':
        return renderPago();
      case 'confirmacion':
        return renderConfirmacion();
      default:
        return renderResumen();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar compra</h1>
          <p className="text-gray-600">Completa tu pedido en pocos pasos</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['resumen', 'envio', 'pago', 'confirmacion'] as PaymentStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === step
                    ? 'border-green-500 bg-green-500 text-white'
                    : index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                                     {index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep) ? (
                     <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-4 h-4" />
                   ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Resumen</span>
            <span>Envío</span>
            <span>Pago</span>
            <span>Confirmar</span>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {renderStepContent()}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Resumen de compra</h3>
                  
                  <div className="space-y-3 mb-4">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.nombre} x{item.cantidad}</span>
                        <span>${item.precio * item.cantidad}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${total}</span>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="mt-6 space-y-3">
                    {currentStep !== 'resumen' && (
                      <Button
                        onClick={prevStep}
                        variant="outline"
                        className="w-full"
                      >
                        Atrás
                      </Button>
                    )}
                    
                    {currentStep !== 'confirmacion' ? (
                      <Button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        onClick={processOrder}
                        disabled={!agree || loading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Procesando...' : 'Confirmar pedido'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;


