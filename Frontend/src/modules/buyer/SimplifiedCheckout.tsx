import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
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

interface ShippingForm {
  nombre: string;
  direccion: string;
  direccion2: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  telefono: string;
}

export default function SimplifiedCheckout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | ''>('');
  
  const [shipping, setShipping] = useState<ShippingForm>({
    nombre: '',
    direccion: '',
    direccion2: '',
    ciudad: '',
    departamento: '',
    codigoPostal: '',
    telefono: '',
  });

  // Cargar direcciones guardadas
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        if (!supabase) return;
        const session = (await supabase.auth.getSession()).data.session;
        const uid = session?.user?.id;
        if (!uid) return;

        const { data, error } = await supabase
          .from('user_address')
          .select('*')
          .eq('user_id', uid)
          .eq('tipo', 'envio')
          .order('es_predeterminada', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        const loadedAddresses = data as UserAddress[];
        setAddresses(loadedAddresses);

        // Seleccionar la dirección predeterminada si existe
        const defaultAddress = loadedAddresses.find(a => a.es_predeterminada) || loadedAddresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShipping({
            nombre: defaultAddress.nombre,
            telefono: defaultAddress.telefono || '',
            direccion: defaultAddress.direccion,
            direccion2: defaultAddress.direccion2 || '',
            ciudad: defaultAddress.ciudad,
            departamento: defaultAddress.departamento,
            codigoPostal: defaultAddress.codigo_postal || '',
          });
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };

    loadAddresses();
  }, []);

  // Actualizar formulario cuando se selecciona una dirección
  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddressId(address.id);
    setShipping({
      nombre: address.nombre,
      telefono: address.telefono || '',
      direccion: address.direccion,
      direccion2: address.direccion2 || '',
      ciudad: address.ciudad,
      departamento: address.departamento,
      codigoPostal: address.codigo_postal || '',
    });
  };

  // Manejar cambios en el formulario
  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShipping(prev => ({ ...prev, [field]: value }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!shipping.nombre.trim()) {
      alert('Por favor ingresa tu nombre completo');
      return false;
    }
    if (!shipping.direccion.trim()) {
      alert('Por favor ingresa tu dirección');
      return false;
    }
    if (!shipping.ciudad.trim()) {
      alert('Por favor ingresa tu ciudad');
      return false;
    }
    if (!shipping.departamento.trim()) {
      alert('Por favor ingresa tu departamento');
      return false;
    }
    if (!shipping.telefono.trim()) {
      alert('Por favor ingresa tu teléfono');
      return false;
    }
    if (!agree) {
      alert('Debes aceptar los términos y condiciones');
      return false;
    }
    return true;
  };

  // Procesar pedido
  const processOrder = async () => {
    if (!validateForm()) return;
    
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
            cantidad: item.cantidad,
          })),
          shipping: {
            nombre: shipping.nombre.trim(),
            direccion: shipping.direccion.trim(),
            direccion2: shipping.direccion2.trim() || undefined,
            ciudad: shipping.ciudad.trim(),
            departamento: shipping.departamento.trim(),
            codigoPostal: shipping.codigoPostal.trim() || undefined,
            telefono: shipping.telefono.trim(),
          },
          payment: {
            metodo: 'contraentrega'
          },
          simulate_payment: true
        })
      });

      const result = await response.json();
      
      if (response.ok && result.ok) {
        clear();
        navigate(`/recibo/${result.order_id}`);
      } else {
        throw new Error(result.error || 'Error al crear el pedido');
      }
    } catch (error: any) {
      console.error('Error processing order:', error);
      alert(`Error: ${error?.message || 'No se pudo crear el pedido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className='container py-8'>
        <div className='max-w-md mx-auto text-center'>
          <Card className='card-hover'>
            <CardContent className='p-8'>
              <Icon
                category='Carrito y checkout'
                name='WhhShoppingcart'
                className='w-16 h-16 text-gray-400 mx-auto mb-4'
              />
              <h2 className='text-xl font-semibold text-gray-700 mb-2'>
                Tu carrito está vacío
              </h2>
              <p className='text-gray-600 mb-6'>
                Agrega productos para comenzar tu compra
              </p>
              <Button onClick={() => navigate('/productos')} className='w-full'>
                Explorar productos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='container py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Finalizar Compra
          </h1>
          <p className='text-gray-600'>
            Completa tu pedido en pocos pasos simples
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Formulario de envío */}
          <div className='lg:col-span-2'>
            <Card className='card-hover'>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
                  <Icon
                    category='Carrito y checkout'
                    name='MdiTruckDelivery'
                    className='w-6 h-6'
                  />
                  Información de envío
                </h2>

                {/* Direcciones guardadas */}
                {addresses.length > 0 && (
                  <div className='mb-6'>
                    <h3 className='font-medium mb-3'>Usar dirección guardada</h3>
                    <div className='space-y-3'>
                      {addresses.map(address => (
                        <div
                          key={address.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === address.id
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulario de envío */}
                <div className='space-y-4'>
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
                      <label className='form-label'>Teléfono *</label>
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
                        onChange={e => handleShippingChange('direccion', e.target.value)}
                        placeholder='Dirección principal'
                      />
                    </div>
                    <div className='md:col-span-2 space-y-2'>
                      <label className='form-label'>Dirección secundaria</label>
                      <Input
                        value={shipping.direccion2}
                        onChange={e => handleShippingChange('direccion2', e.target.value)}
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
                        onChange={e => handleShippingChange('departamento', e.target.value)}
                        placeholder='Tu departamento'
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div className='lg:col-span-1'>
            <Card className='card-hover sticky top-8'>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
                  <Icon
                    category='Carrito y checkout'
                    name='VaadinWallet'
                    className='w-6 h-6'
                  />
                  Resumen del pedido
                </h2>

                <div className='space-y-4 mb-6'>
                  {items.map(item => (
                    <div key={item.productoId} className='flex items-center justify-between text-sm'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 truncate'>
                          {item.nombre}
                        </p>
                        <p className='text-gray-500'>
                          {item.cantidad} x ${item.precio.toLocaleString()}
                        </p>
                      </div>
                      <span className='font-semibold text-gray-900 ml-2'>
                        ${(item.precio * item.cantidad).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='border-t pt-4 mb-6'>
                  <div className='flex items-center justify-between text-lg font-bold'>
                    <span>Total:</span>
                    <span className='text-green-600'>${total.toLocaleString()}</span>
                  </div>
                </div>

                <div className='flex items-center space-x-2 mb-6'>
                  <Checkbox
                    id='agree'
                    checked={agree}
                    onCheckedChange={checked => setAgree(checked as boolean)}
                  />
                  <label htmlFor='agree' className='text-sm'>
                    Acepto los términos y condiciones
                  </label>
                </div>

                <Button
                  className='w-full py-3'
                  onClick={processOrder}
                  disabled={!agree || loading}
                >
                  {loading ? 'Procesando...' : 'Confirmar pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}