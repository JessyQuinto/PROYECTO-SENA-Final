import { useState, useRef } from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import Icon from '@/components/ui/Icon';

type PaymentStep = 'resumen' | 'envio' | 'pago' | 'confirmacion';

interface Address {
  id: string;
  nombre: string;
  direccion: string;
  direccion2?: string;
  ciudad: string;
  departamento: string;
  codigoPostal?: string;
  telefono?: string;
  esPredeterminada: boolean;
}

interface PaymentMethod {
  id: string;
  etiqueta: string;
  tipo: 'tarjeta' | 'contraentrega';
  esPredeterminado: boolean;
}

interface ShippingForm {
  nombre: string;
  direccion: string;
  direccion2: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  telefono: string;
}

interface BillingForm {
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
}

interface CardForm {
  numero: string;
  expiracion: string;
  cvv: string;
  nombre: string;
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('resumen');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  
  // Formularios
  const [shipping, setShipping] = useState<ShippingForm>({
    nombre: '',
    direccion: '',
    direccion2: '',
    ciudad: '',
    departamento: '',
    codigoPostal: '',
    telefono: ''
  });
  
  const [billing, setBilling] = useState<BillingForm>({
    nombre: '',
    direccion: '',
    ciudad: '',
    departamento: ''
  });
  
  const [card, setCard] = useState<CardForm>({
    numero: '',
    expiracion: '',
    cvv: '',
    nombre: ''
  });
  
  // Estados
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'contraentrega'>('tarjeta');
  
  // Perfiles guardados (simulados)
  const savedAddresses: Address[] = [
    {
      id: '1',
      nombre: 'Juan Pérez',
      direccion: 'Calle 123 #45-67',
      ciudad: 'Quibdó',
      departamento: 'Chocó',
      codigoPostal: '270001',
      telefono: '3001234567',
      esPredeterminada: true
    }
  ];
  
  const savedPayments: PaymentMethod[] = [
    {
      id: '1',
      etiqueta: 'Visa ****1234',
      tipo: 'tarjeta',
      esPredeterminado: true
    }
  ];

  // Handlers
  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShipping(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: keyof BillingForm, value: string) => {
    setBilling(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field: keyof CardForm, value: string) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (address: Address) => {
    setShipping({
      nombre: address.nombre,
      direccion: address.direccion,
      direccion2: address.direccion2 || '',
      ciudad: address.ciudad,
      departamento: address.departamento,
      codigoPostal: address.codigoPostal || '',
      telefono: address.telefono || ''
    });
  };

  const handlePaymentSelect = (payment: PaymentMethod) => {
    setPaymentMethod(payment.tipo);
  };

  const canProceed = () => {
    if (currentStep === 'resumen') return true;
    if (currentStep === 'envio') {
      return shipping.nombre && shipping.direccion && shipping.ciudad && shipping.departamento;
    }
    if (currentStep === 'pago') {
      if (paymentMethod === 'tarjeta') {
        return card.numero && card.expiracion && card.cvv && card.nombre;
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
    if (currentStep === 'confirmacion') setCurrentStep('pago');
    else if (currentStep === 'pago') setCurrentStep('envio');
    else if (currentStep === 'envio') setCurrentStep('resumen');
  };

  const processOrder = async () => {
    setLoading(true);
    
    // Simular procesamiento
    setTimeout(() => {
      setLoading(false);
      alert('¡Pedido procesado exitosamente! 🎉');
      clear();
      // Aquí redirigirías a la página de confirmación
    }, 2000);
  };

  // Renderizado de pasos
  const renderResumen = () => (
    <div className="form-card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Resumen de tu compra</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">🛍️ Productos ({items.length})</h3>
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="summary-total">${total}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvio = () => (
    <div className="space-y-6">
      {/* Direcciones guardadas */}
      {savedAddresses.length > 0 && (
        <div className="form-card">
          <h3 className="text-lg font-medium mb-4">🏠 Usar dirección guardada</h3>
          <div className="space-y-3">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{address.nombre}</p>
                    <p className="text-sm text-gray-600">{address.direccion}</p>
                    <p className="text-sm text-gray-600">{address.ciudad}, {address.departamento}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Predeterminada</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de envío */}
      <div className="form-card">
        <h3>📍 Nueva dirección de envío</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nombre completo *</label>
            <Input
              value={shipping.nombre}
              onChange={(e) => handleShippingChange('nombre', e.target.value)}
              placeholder="Tu nombre completo"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Teléfono</label>
            <Input
              value={shipping.telefono}
              onChange={(e) => handleShippingChange('telefono', e.target.value)}
              placeholder="Tu teléfono"
              className="form-input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Dirección *</label>
            <Input
              value={shipping.direccion}
              onChange={(e) => handleShippingChange('direccion', e.target.value)}
              placeholder="Dirección principal"
              className="form-input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Dirección secundaria</label>
            <Input
              value={shipping.direccion2}
              onChange={(e) => handleShippingChange('direccion2', e.target.value)}
              placeholder="Apartamento, suite, etc. (opcional)"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Ciudad *</label>
            <Input
              value={shipping.ciudad}
              onChange={(e) => handleShippingChange('ciudad', e.target.value)}
              placeholder="Tu ciudad"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Departamento *</label>
            <Input
              value={shipping.departamento}
              onChange={(e) => handleShippingChange('departamento', e.target.value)}
              placeholder="Tu departamento"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Código postal</label>
            <Input
              value={shipping.codigoPostal}
              onChange={(e) => handleShippingChange('codigoPostal', e.target.value)}
              placeholder="Código postal"
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className="form-card">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="same-address"
            checked={useSameAddress}
            onCheckedChange={(checked) => setUseSameAddress(checked as boolean)}
          />
          <label htmlFor="same-address" className="text-sm font-medium">
            Usar la misma dirección para facturación
          </label>
        </div>
        
        {!useSameAddress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre para facturación</label>
              <Input
                value={billing.nombre}
                onChange={(e) => handleBillingChange('nombre', e.target.value)}
                placeholder="Nombre para facturación"
                className="form-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Dirección de facturación</label>
              <Input
                value={billing.direccion}
                onChange={(e) => handleBillingChange('direccion', e.target.value)}
                placeholder="Dirección de facturación"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Ciudad</label>
              <Input
                value={billing.ciudad}
                onChange={(e) => handleBillingChange('ciudad', e.target.value)}
                placeholder="Ciudad"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Departamento</label>
              <Input
                value={billing.departamento}
                onChange={(e) => handleBillingChange('departamento', e.target.value)}
                placeholder="Departamento"
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPago = () => (
    <div className="space-y-6">
      {/* Métodos de pago guardados */}
      {savedPayments.length > 0 && (
        <div className="form-card">
          <h3 className="text-lg font-medium mb-4">💳 Usar método guardado</h3>
          <div className="space-y-3">
            {savedPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => handlePaymentSelect(payment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-6 h-6" />
                    <div>
                      <p className="font-medium">{payment.etiqueta}</p>
                      <p className="text-sm text-gray-600">Método guardado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Predeterminado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selección de método */}
      <div className="form-card">
        <h3>💳 Seleccionar método de pago</h3>
        
        <div className="space-y-4">
          <div
            className={`selection-card ${
              paymentMethod === 'tarjeta' ? 'selected' : ''
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
            className={`selection-card ${
              paymentMethod === 'contraentrega' ? 'selected' : ''
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Número de tarjeta</label>
                <Input
                  value={card.numero}
                  onChange={(e) => handleCardChange('numero', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Nombre en la tarjeta</label>
                <Input
                  value={card.nombre}
                  onChange={(e) => handleCardChange('nombre', e.target.value)}
                  placeholder="Como aparece en la tarjeta"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Fecha de expiración</label>
                <Input
                  value={card.expiracion}
                  onChange={(e) => handleCardChange('expiracion', e.target.value)}
                  placeholder="MM/AA"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">CVV</label>
                <Input
                  value={card.cvv}
                  onChange={(e) => handleCardChange('cvv', e.target.value)}
                  placeholder="123"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className="form-card">
      <div className="text-center">
        <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Casi listo! 🎉</h2>
        <p className="text-gray-600 mb-6">
          Revisa que toda la información sea correcta antes de confirmar tu pedido.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">📦 Información de envío</h3>
          <p>{shipping.nombre}</p>
          <p className="text-sm text-gray-600">{shipping.direccion}</p>
          <p className="text-sm text-gray-600">{shipping.ciudad}, {shipping.departamento}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">💳 Método de pago</h3>
          <p>{paymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Contra entrega'}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">💰 Total a pagar</h3>
          <p className="text-2xl font-bold text-green-600">${total}</p>
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="agree"
            checked={agree}
            onCheckedChange={(checked) => setAgree(checked as boolean)}
          />
          <label htmlFor="agree" className="text-sm">
            Acepto los términos y condiciones de la compra
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
    <div className="checkout-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar compra</h1>
          <p className="text-gray-600">Completa tu pedido en pocos pasos</p>
        </div>

        {/* Progress bar */}
        <div className="payment-progress mb-8">
          <div className="flex items-center justify-between">
            {(['resumen', 'envio', 'pago', 'confirmacion'] as PaymentStep[]).map((step, index) => (
              <div key={step} className="payment-step">
                <div className={`payment-step-circle ${
                  currentStep === step
                    ? 'active'
                    : index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep)
                    ? 'completed'
                    : 'pending'
                }`}>
                  {index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep) ? (
                     <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-5 h-5" />
                   ) : (
                     index + 1
                   )}
                </div>
                <span className={`payment-step-label ${
                  currentStep === step || index < ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(currentStep)
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}>
                  {step === 'resumen' && 'Resumen'}
                  {step === 'envio' && 'Envío'}
                  {step === 'pago' && 'Pago'}
                  {step === 'confirmacion' && 'Confirmar'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {renderStepContent()}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="cart-summary">
              <div className="summary-card">
                <h3 className="summary-header">🛒 Resumen de compra</h3>
                
                <div className="space-y-3 mb-4">
                  {items.map((item, index) => (
                    <div key={index} className="summary-item">
                      <span className="text-gray-600">{item.nombre} x{item.cantidad}</span>
                      <span>${item.precio * item.cantidad}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="summary-total">${total}</span>
                  </div>
                </div>
                
                {/* Navigation buttons */}
                <div className="mt-6 space-y-3">
                  {currentStep !== 'resumen' && (
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="btn-secondary w-full"
                    >
                      Atrás
                    </Button>
                  )}
                  
                  {currentStep !== 'confirmacion' ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="btn-primary-large w-full"
                    >
                      Continuar ✨
                    </Button>
                  ) : (
                    <Button
                      onClick={processOrder}
                      disabled={!agree || loading}
                      className="btn-primary-large w-full"
                    >
                      {loading ? '⏳ Procesando...' : '🚀 ¡Confirmar pedido!'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


