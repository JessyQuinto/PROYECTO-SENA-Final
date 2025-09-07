import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import Icon from '@/components/ui/Icon';

type PaymentStep = 'resumen' | 'envio' | 'pago' | 'confirmacion';

// Interfaces que coinciden con la base de datos
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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<PaymentStep>('resumen');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  // Estados para datos de la base de datos
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [payments, setPayments] = useState<UserPaymentProfile[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | ''>('');
  const [selectedPayId, setSelectedPayId] = useState<string | ''>('');

  // Formularios
  const [shipping, setShipping] = useState<ShippingForm>({
    nombre: '',
    direccion: '',
    direccion2: '',
    ciudad: '',
    departamento: '',
    codigoPostal: '',
    telefono: '',
  });

  const [billing, setBilling] = useState<BillingForm>({
    nombre: '',
    direccion: '',
    ciudad: '',
    departamento: '',
  });

  const [card, setCard] = useState<CardForm>({
    numero: '',
    expiracion: '',
    cvv: '',
    nombre: '',
  });

  // Estados
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<
    'tarjeta' | 'contraentrega'
  >('tarjeta');

  // Cargar perfiles guardados desde la base de datos
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        if (!supabase) return;
        const session = (await supabase.auth.getSession()).data.session;
        const uid = session?.user?.id;
        if (!uid) return;

        const [addrRes, paysRes] = await Promise.all([
          supabase
            .from('user_address')
            .select('*')
            .eq('user_id', uid)
            .order('es_predeterminada', { ascending: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('user_payment_profile')
            .select('*')
            .eq('user_id', uid)
            .order('es_predeterminada', { ascending: false })
            .order('created_at', { ascending: false }),
        ]);

        const loadedAddresses = (addrRes.data || []) as UserAddress[];
        const loadedPayments = (paysRes.data || []) as UserPaymentProfile[];

        setAddresses(loadedAddresses);
        setPayments(loadedPayments);

        // Preseleccionar perfiles predeterminados
        const defShip =
          loadedAddresses.find(
            a => a.tipo === 'envio' && a.es_predeterminada
          ) || loadedAddresses.find(a => a.tipo === 'envio');
        if (defShip) {
          setSelectedShipId(defShip.id);
          setShipping({
            nombre: defShip.nombre,
            telefono: defShip.telefono || '',
            direccion: defShip.direccion,
            direccion2: defShip.direccion2 || '',
            ciudad: defShip.ciudad,
            departamento: defShip.departamento,
            codigoPostal: defShip.codigo_postal || '',
          });
        }

        const defPay =
          loadedPayments.find(p => p.es_predeterminada) || loadedPayments[0];
        if (defPay) {
          setSelectedPayId(defPay.id);
          setPaymentMethod(defPay.metodo);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    };

    loadProfiles();
  }, []);

  // Handlers
  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShipping(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: keyof BillingForm, value: string) => {
    setBilling(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field: keyof CardForm, value: string) => {
    let processedValue = value;
    
    // Formatear número de tarjeta con espacios
    if (field === 'numero') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    // Formatear fecha de expiración
    if (field === 'expiracion') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/');
    }
    
    // Limitar CVV a números
    if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '');
    }
    
    setCard(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedShipId(address.id);
    setShipping({
      nombre: address.nombre,
      direccion: address.direccion,
      direccion2: address.direccion2 || '',
      ciudad: address.ciudad,
      departamento: address.departamento,
      codigoPostal: address.codigo_postal || '',
      telefono: address.telefono || '',
    });
  };

  const handlePaymentSelect = (payment: UserPaymentProfile) => {
    setSelectedPayId(payment.id);
    setPaymentMethod(payment.metodo);
  };

  const canProceed = () => {
    if (currentStep === 'resumen') return true;
    if (currentStep === 'envio') {
      return (
        shipping.nombre &&
        shipping.direccion &&
        shipping.ciudad &&
        shipping.departamento
      );
    }
    if (currentStep === 'pago') {
      if (paymentMethod === 'tarjeta') {
        const numeroLimpio = card.numero.replace(/\s/g, '');
        return (
          numeroLimpio.length >= 13 && 
          numeroLimpio.length <= 19 &&
          card.expiracion.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/) &&
          card.cvv.length >= 3 && 
          card.cvv.length <= 4 &&
          card.nombre.trim().length > 0
        );
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
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
      if (!backendUrl) {
        throw new Error('Backend no configurado');
      }

      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/rpc/crear_pedido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            producto_id: item.productoId,
            cantidad: item.cantidad
          })),
          shipping: {
            nombre: shipping.nombre,
            direccion: shipping.direccion,
            ciudad: shipping.ciudad,
            telefono: shipping.telefono
          },
          payment: {
            metodo: paymentMethod,
            ...(paymentMethod === 'tarjeta' && {
              tarjeta: {
                numero: card.numero.replace(/\s/g, ''), // Remover espacios
                nombre: card.nombre,
                expiracion: card.expiracion,
                cvv: card.cvv
              }
            })
          },
          simulate_payment: true
        })
      });

      const result = await response.json();
      
      if (response.ok && result.ok) {
        clear();
        alert(`¡Pedido creado exitosamente! ID: ${result.order_id}`);
        // Redirigir a la página de recibo o confirmación
        navigate(`/recibo/${result.order_id}`);
      } else {
        // Mostrar error más detallado
        const errorMessage = result.error || 'Error desconocido al crear el pedido';
        const errorCode = result.code ? ` (Código: ${result.code})` : '';
        const errorDetails = result.details ? `\nDetalles: ${JSON.stringify(result.details)}` : '';
        throw new Error(`${errorMessage}${errorCode}${errorDetails}`);
      }
    } catch (error: any) {
      console.error('Error processing order:', error);
      
      // Mostrar error más amigable al usuario
      let userMessage = 'Error al procesar el pedido';
      
      if (error.message) {
        if (error.message.includes('invalid input value for enum')) {
          userMessage = 'Error interno del sistema. Por favor, inténtalo más tarde.';
        } else if (error.message.includes('stock')) {
          userMessage = 'Algunos productos no tienen stock suficiente.';
        } else if (error.message.includes('tarjeta') || error.message.includes('CVV')) {
          userMessage = error.message; // Mostrar errores de tarjeta directamente
        } else {
          userMessage = error.message;
        }
      }
      
      alert(userMessage);
    }
    setLoading(false);
  };

  // Renderizado de pasos
  const renderResumen = () => (
    <div className='card card-hover'>
      <div className='card-body'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          📋 Resumen de tu compra
        </h2>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold mb-4'>
            🛍️ Productos ({items.length})
          </h3>
          {items.map((item, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <img
                  src={item.imagenUrl || ''}
                  alt={item.nombre}
                  className='w-12 h-12 rounded object-cover'
                />
                <div>
                  <p className='font-medium'>{item.nombre}</p>
                  <p className='text-sm text-gray-600'>
                    Cantidad: {item.cantidad}
                  </p>
                </div>
              </div>
              <p className='font-semibold'>${item.precio * item.cantidad}</p>
            </div>
          ))}

          <div className='border-t pt-4'>
            <div className='flex justify-between text-lg font-bold'>
              <span>Total:</span>
              <span className='text-green-600'>${total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvio = () => (
    <div className='space-y-6'>
      {/* Direcciones guardadas */}
      {addresses.filter(a => a.tipo === 'envio').length > 0 ? (
        <div className='card card-hover'>
          <div className='card-body'>
            <h3 className='text-lg font-medium mb-4'>
              🏠 Usar dirección guardada
            </h3>
            <div className='space-y-3'>
              {addresses
                .filter(a => a.tipo === 'envio')
                .map(address => (
                  <div
                    key={address.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedShipId === address.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>{address.nombre}</p>
                        <p className='text-sm text-gray-600'>
                          {address.direccion}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {address.ciudad}, {address.departamento}
                        </p>
                        {address.telefono && (
                          <p className='text-sm text-gray-600'>
                            Tel: {address.telefono}
                          </p>
                        )}
                      </div>
                      <div className='text-right'>
                        {address.es_predeterminada && (
                          <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
                            Predeterminada
                          </span>
                        )}
                        {selectedShipId === address.id && (
                          <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2'>
                            Seleccionada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className='card card-hover'>
          <div className='card-body'>
            <div className='text-center py-4'>
              <Icon
                category='Usuario'
                name='RivetIconsSettings'
                className='w-8 h-8 text-gray-400 mx-auto mb-2'
              />
              <p className='text-gray-600 mb-2'>
                No tienes direcciones de envío guardadas
              </p>
              <p className='text-sm text-gray-500'>
                Puedes guardar direcciones en tu{' '}
                <strong>Perfil → Perfiles guardados</strong> para un checkout
                más rápido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de envío */}
      <div className='card card-hover'>
        <div className='card-body'>
          <h3 className='text-lg font-semibold mb-4'>
            📍 Nueva dirección de envío
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='form-label'>Nombre completo *</label>
              <Input
                value={shipping.nombre}
                onChange={e => handleShippingChange('nombre', e.target.value)}
                placeholder='Tu nombre completo'
              />
            </div>
            <div className='space-y-2'>
              <label className='form-label'>Teléfono</label>
              <Input
                value={shipping.telefono}
                onChange={e => handleShippingChange('telefono', e.target.value)}
                placeholder='Tu teléfono'
              />
            </div>
            <div className='md:col-span-2 space-y-2'>
              <label className='form-label'>Dirección *</label>
              <Input
                value={shipping.direccion}
                onChange={e =>
                  handleShippingChange('direccion', e.target.value)
                }
                placeholder='Dirección principal'
              />
            </div>
            <div className='md:col-span-2 space-y-2'>
              <label className='form-label'>Dirección secundaria</label>
              <Input
                value={shipping.direccion2}
                onChange={e =>
                  handleShippingChange('direccion2', e.target.value)
                }
                placeholder='Apartamento, suite, etc. (opcional)'
              />
            </div>
            <div className='space-y-2'>
              <label className='form-label'>Ciudad *</label>
              <Input
                value={shipping.ciudad}
                onChange={e => handleShippingChange('ciudad', e.target.value)}
                placeholder='Tu ciudad'
              />
            </div>
            <div className='space-y-2'>
              <label className='form-label'>Departamento *</label>
              <Input
                value={shipping.departamento}
                onChange={e =>
                  handleShippingChange('departamento', e.target.value)
                }
                placeholder='Tu departamento'
              />
            </div>
            <div className='space-y-2'>
              <label className='form-label'>Código postal</label>
              <Input
                value={shipping.codigoPostal}
                onChange={e =>
                  handleShippingChange('codigoPostal', e.target.value)
                }
                placeholder='Código postal'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className='card card-hover'>
        <div className='card-body'>
          <div className='flex items-center space-x-2 mb-4'>
            <Checkbox
              id='same-address'
              checked={useSameAddress}
              onCheckedChange={checked => setUseSameAddress(checked as boolean)}
            />
            <label htmlFor='same-address' className='text-sm font-medium'>
              Usar la misma dirección para facturación
            </label>
          </div>

          {!useSameAddress && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='form-label'>Nombre para facturación</label>
                <Input
                  value={billing.nombre}
                  onChange={e => handleBillingChange('nombre', e.target.value)}
                  placeholder='Nombre para facturación'
                />
              </div>
              <div className='md:col-span-2 space-y-2'>
                <label className='form-label'>Dirección de facturación</label>
                <Input
                  value={billing.direccion}
                  onChange={e =>
                    handleBillingChange('direccion', e.target.value)
                  }
                  placeholder='Dirección de facturación'
                />
              </div>
              <div className='space-y-2'>
                <label className='form-label'>Ciudad</label>
                <Input
                  value={billing.ciudad}
                  onChange={e => handleBillingChange('ciudad', e.target.value)}
                  placeholder='Ciudad'
                />
              </div>
              <div className='space-y-2'>
                <label className='form-label'>Departamento</label>
                <Input
                  value={billing.departamento}
                  onChange={e =>
                    handleBillingChange('departamento', e.target.value)
                  }
                  placeholder='Departamento'
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPago = () => (
    <div className='space-y-6'>
      {/* Métodos de pago guardados */}
      {payments.length > 0 ? (
        <div className='card card-hover'>
          <div className='card-body'>
            <h3 className='text-lg font-medium mb-4'>
              💳 Usar método guardado
            </h3>
            <div className='space-y-3'>
              {payments.map(payment => (
                <div
                  key={payment.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPayId === payment.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePaymentSelect(payment)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <Icon
                        category='Carrito y checkout'
                        name={
                          payment.metodo === 'tarjeta'
                            ? 'StreamlinePlumpPaymentRecieve7Solid'
                            : 'Fa6SolidTruck'
                        }
                        className='w-6 h-6'
                      />
                      <div>
                        <p className='font-medium'>{payment.etiqueta}</p>
                        <p className='text-sm text-gray-600'>
                          {payment.metodo === 'tarjeta' && payment.last4
                            ? `•••• ${payment.last4}`
                            : payment.metodo === 'contraentrega'
                              ? 'Pago contra entrega'
                              : 'Método guardado'}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      {payment.es_predeterminada && (
                        <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
                          Predeterminado
                        </span>
                      )}
                      {selectedPayId === payment.id && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2'>
                          Seleccionado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className='card card-hover'>
          <div className='card-body'>
            <div className='text-center py-4'>
              <Icon
                category='Carrito y checkout'
                name='VaadinWallet'
                className='w-8 h-8 text-gray-400 mx-auto mb-2'
              />
              <p className='text-gray-600 mb-2'>
                No tienes métodos de pago guardados
              </p>
              <p className='text-sm text-gray-500'>
                Puedes guardar métodos de pago en tu{' '}
                <strong>Perfil → Perfiles guardados</strong> para un checkout
                más rápido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selección de método */}
      <div className='card card-hover'>
        <div className='card-body'>
          <h3 className='text-lg font-semibold mb-4'>
            💳 Seleccionar método de pago
          </h3>

          <div className='space-y-4'>
            <div
              className={`select-card p-4 ${
                paymentMethod === 'tarjeta' ? 'selected' : ''
              }`}
              onClick={() => setPaymentMethod('tarjeta')}
            >
              <div className='flex items-center space-x-3'>
                <Icon
                  category='Carrito y checkout'
                  name='StreamlinePlumpPaymentRecieve7Solid'
                  className='w-6 h-6'
                />
                <div>
                  <p className='font-medium'>Tarjeta de crédito/débito</p>
                  <p className='text-sm text-gray-600'>
                    Pago seguro con tarjeta
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`select-card p-4 ${
                paymentMethod === 'contraentrega' ? 'selected' : ''
              }`}
              onClick={() => setPaymentMethod('contraentrega')}
            >
              <div className='flex items-center space-x-3'>
                <Icon
                  category='Carrito y checkout'
                  name='Fa6SolidTruck'
                  className='w-6 h-6'
                />
                <div>
                  <p className='font-medium'>Contra entrega</p>
                  <p className='text-sm text-gray-600'>
                    Paga cuando recibas tu pedido
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de tarjeta */}
          {paymentMethod === 'tarjeta' && (
            <div className='mt-6 space-y-4'>
              {/* Banner de simulación */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Icon
                    category='Estados y Feedback'
                    name='TablerInfoCircle'
                    className='w-5 h-5 text-blue-600'
                  />
                  <h4 className='font-medium text-blue-900'>Pago Simulado</h4>
                </div>
                <p className='text-sm text-blue-700'>
                  Este es un entorno de demostración. No se procesarán pagos reales.
                  Puedes usar cualquier información de tarjeta para probar el flujo.
                </p>
              </div>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='form-label'>Número de tarjeta</label>
                  <Input
                    value={card.numero}
                    onChange={e => handleCardChange('numero', e.target.value)}
                    placeholder='1234 5678 9012 3456'
                    maxLength={19} // 16 dígitos + 3 espacios
                  />
                  <p className='text-xs text-gray-500'>
                    📝 Simulación: Usa cualquier número (evita 0000 para probar errores)
                  </p>
                </div>
                <div className='space-y-2'>
                  <label className='form-label'>Nombre en la tarjeta</label>
                  <Input
                    value={card.nombre}
                    onChange={e => handleCardChange('nombre', e.target.value)}
                    placeholder='Como aparece en la tarjeta'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='form-label'>Fecha de expiración</label>
                  <Input
                    value={card.expiracion}
                    onChange={e =>
                      handleCardChange('expiracion', e.target.value)
                    }
                    placeholder='MM/AA'
                    maxLength={5} // MM/AA
                  />
                  <p className='text-xs text-gray-500'>
                    📝 Formato: MM/AA (ej: 12/25)
                  </p>
                </div>
                <div className='space-y-2'>
                  <label className='form-label'>CVV</label>
                  <Input
                    value={card.cvv}
                    onChange={e => handleCardChange('cvv', e.target.value)}
                    placeholder='123'
                    maxLength={4}
                  />
                  <p className='text-xs text-gray-500'>
                    📝 Simulación: Usa cualquier CVV (evita 000 para probar errores)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className='card card-hover'>
      <div className='card-body'>
        <div className='text-center'>
          <Icon
            category='Estados y Feedback'
            name='IconParkSolidSuccess'
            className='w-16 h-16 text-green-500 mx-auto mb-4'
          />
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            ¡Casi listo! 🎉
          </h2>
          <p className='text-gray-600 mb-6'>
            Revisa que toda la información sea correcta antes de confirmar tu
            pedido.
          </p>
        </div>

        <div className='space-y-4'>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <h3 className='font-semibold mb-2'>📦 Información de envío</h3>
            <p>{shipping.nombre}</p>
            <p className='text-sm text-gray-600'>{shipping.direccion}</p>
            <p className='text-sm text-gray-600'>
              {shipping.ciudad}, {shipping.departamento}
            </p>
          </div>

          <div className='p-4 bg-gray-50 rounded-lg'>
            <h3 className='font-semibold mb-2'>💳 Método de pago</h3>
            <p>
              {paymentMethod === 'tarjeta'
                ? 'Tarjeta de crédito/débito'
                : 'Contra entrega'}
            </p>
          </div>

          <div className='p-4 bg-gray-50 rounded-lg'>
            <h3 className='font-semibold mb-2'>💰 Total a pagar</h3>
            <p className='text-2xl font-bold text-green-600'>${total}</p>
          </div>

          <div className='flex items-center space-x-2 mt-6'>
            <Checkbox
              id='agree'
              checked={agree}
              onCheckedChange={checked => setAgree(checked as boolean)}
            />
            <label htmlFor='agree' className='text-sm'>
              Acepto los términos y condiciones de la compra
            </label>
          </div>
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
    <div className='min-h-[calc(100vh-120px)] relative overflow-hidden'>
      {/* Decorative auth background */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-12'
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className='container max-w-6xl mx-auto px-4 py-8 relative z-10'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Finalizar compra
          </h1>
          <p className='text-gray-600'>Completa tu pedido en pocos pasos</p>
        </div>

        {/* Progress bar */}
        <div className='card card-hover mb-8'>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              {(
                ['resumen', 'envio', 'pago', 'confirmacion'] as PaymentStep[]
              ).map((step, index) => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? 'bg-green-600 text-white'
                        : index <
                            [
                              'resumen',
                              'envio',
                              'pago',
                              'confirmacion',
                            ].indexOf(currentStep)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index <
                    ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(
                      currentStep
                    ) ? (
                      <Icon
                        category='Estados y Feedback'
                        name='IconParkSolidSuccess'
                        className='w-4 h-4'
                      />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep === step ||
                      index <
                        ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(
                          currentStep
                        )
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step === 'resumen' && 'Resumen'}
                    {step === 'envio' && 'Envío'}
                    {step === 'pago' && 'Pago'}
                    {step === 'confirmacion' && 'Confirmar'}
                  </span>
                  {index < 3 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        index <
                        ['resumen', 'envio', 'pago', 'confirmacion'].indexOf(
                          currentStep
                        )
                          ? 'bg-green-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>{renderStepContent()}</div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='card card-hover sticky top-8'>
              <div className='card-body'>
                <h3 className='text-lg font-semibold mb-4'>
                  🛒 Resumen de compra
                </h3>

                <div className='space-y-3 mb-4'>
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between text-sm'
                    >
                      <span className='text-gray-600'>
                        {item.nombre} x{item.cantidad}
                      </span>
                      <span className='font-medium'>
                        ${item.precio * item.cantidad}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='border-t pt-4 mb-6'>
                  <div className='flex justify-between text-lg font-bold'>
                    <span>Total:</span>
                    <span className='text-green-600'>${total}</span>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className='space-y-3'>
                  {currentStep !== 'resumen' && (
                    <Button
                      onClick={prevStep}
                      variant='outline'
                      className='w-full'
                    >
                      Atrás
                    </Button>
                  )}

                  {currentStep !== 'confirmacion' ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className='w-full'
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      onClick={processOrder}
                      disabled={!agree || loading}
                      className='w-full'
                    >
                      {loading ? 'Procesando...' : 'Confirmar pedido'}
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
