import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import Icon from '@/components/ui/Icon';
import { useUserProfile, AddressSelector, PaymentSelector } from './UserProfileManager';

const UserProfileSettings: React.FC = () => {
  const { 
    addresses, 
    payments, 
    loading, 
    loadProfiles, 
    saveAddress, 
    savePayment, 
    deleteAddress, 
    deletePayment, 
    setDefaultAddress, 
    setDefaultPayment 
  } = useUserProfile();
  
  const [activeTab, setActiveTab] = useState<'addresses' | 'payments'>('addresses');
  
  const [addressForm, setAddressForm] = useState({
    id: '',
    tipo: 'envio' as 'envio' | 'facturacion',
    nombre: '',
    telefono: '',
    direccion: '',
    direccion2: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    es_predeterminada: false
  });
  
  const [paymentForm, setPaymentForm] = useState({
    id: '',
    metodo: 'contraentrega' as 'tarjeta' | 'contraentrega',
    etiqueta: 'Contraentrega',
    titular: '',
    last4: '',
    exp_mm: '',
    exp_yy: '',
    es_predeterminada: false
  });
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Cargar perfiles al montar el componente
  useEffect(() => {
    loadProfiles();
  }, []);

  // Manejar cambios en el formulario de dirección
  const handleAddressChange = (field: string, value: string | boolean) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambios en el formulario de pago
  const handlePaymentChange = (field: string, value: string | boolean) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  // Resetear formulario de dirección
  const resetAddressForm = () => {
    setAddressForm({
      id: '',
      tipo: 'envio',
      nombre: '',
      telefono: '',
      direccion: '',
      direccion2: '',
      ciudad: '',
      departamento: '',
      codigo_postal: '',
      es_predeterminada: false
    });
    setIsEditingAddress(false);
  };

  // Resetear formulario de pago
  const resetPaymentForm = () => {
    setPaymentForm({
      id: '',
      metodo: 'contraentrega',
      etiqueta: 'Contraentrega',
      titular: '',
      last4: '',
      exp_mm: '',
      exp_yy: '',
      es_predeterminada: false
    });
    setIsEditingPayment(false);
  };

  // Editar dirección
  const handleEditAddress = (address: any) => {
    setAddressForm({
      ...address,
      exp_mm: address.exp_mm?.toString() || '',
      exp_yy: address.exp_yy?.toString() || ''
    });
    setIsEditingAddress(true);
    setActiveTab('addresses');
  };

  // Editar método de pago
  const handleEditPayment = (payment: any) => {
    setPaymentForm({
      ...payment,
      exp_mm: payment.exp_mm?.toString() || '',
      exp_yy: payment.exp_yy?.toString() || ''
    });
    setIsEditingPayment(true);
    setActiveTab('payments');
  };

  // Guardar dirección
  const handleSaveAddress = async () => {
    const result = await saveAddress({
      ...addressForm,
      es_predeterminada: addressForm.es_predeterminada
    });
    
    if (result.success) {
      (window as any).toast?.success('Dirección guardada correctamente');
      resetAddressForm();
    } else {
      (window as any).toast?.error(result.error || 'Error al guardar la dirección');
    }
  };

  // Guardar método de pago
  const handleSavePayment = async () => {
    const result = await savePayment({
      ...paymentForm,
      exp_mm: paymentForm.exp_mm ? Number(paymentForm.exp_mm) : undefined,
      exp_yy: paymentForm.exp_yy ? Number(paymentForm.exp_yy) : undefined,
      es_predeterminada: paymentForm.es_predeterminada
    });
    
    if (result.success) {
      (window as any).toast?.success('Método de pago guardado correctamente');
      resetPaymentForm();
    } else {
      (window as any).toast?.error(result.error || 'Error al guardar el método de pago');
    }
  };

  // Eliminar dirección
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return;
    
    const result = await deleteAddress(id);
    if (result.success) {
      (window as any).toast?.success('Dirección eliminada correctamente');
    } else {
      (window as any).toast?.error(result.error || 'Error al eliminar la dirección');
    }
  };

  // Eliminar método de pago
  const handleDeletePayment = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este método de pago?')) return;
    
    const result = await deletePayment(id);
    if (result.success) {
      (window as any).toast?.success('Método de pago eliminado correctamente');
    } else {
      (window as any).toast?.error(result.error || 'Error al eliminar el método de pago');
    }
  };

  // Establecer dirección como predeterminada
  const handleSetDefaultAddress = async (id: string, tipo: 'envio' | 'facturacion') => {
    const result = await setDefaultAddress(id, tipo);
    if (result.success) {
      (window as any).toast?.success('Dirección establecida como predeterminada');
    } else {
      (window as any).toast?.error(result.error || 'Error al establecer dirección predeterminada');
    }
  };

  // Establecer método de pago como predeterminado
  const handleSetDefaultPayment = async (id: string) => {
    const result = await setDefaultPayment(id);
    if (result.success) {
      (window as any).toast?.success('Método de pago establecido como predeterminado');
    } else {
      (window as any).toast?.error(result.error || 'Error al establecer método de pago predeterminado');
    }
  };

  return (
    <div className='container py-8'>
      <h1 className='heading-lg mb-6 flex items-center gap-3'>
        <Icon
          category='Usuario'
          name='RivetIconsSettings'
          className='w-8 h-8'
        />
        Perfiles guardados
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Formulario de direcciones */}
        <Card>
          <CardContent className='p-6 space-y-4'>
            <h2 className='font-semibold flex items-center gap-2'>
              <Icon
                category='Carrito y checkout'
                name='HugeiconsMapsLocation01'
                className='w-5 h-5'
              />
              Direcciones
            </h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <select
                className='input'
                value={addressForm.tipo}
                onChange={e => handleAddressChange('tipo', e.target.value as 'envio' | 'facturacion')}
              >
                <option value='envio'>Envío</option>
                <option value='facturacion'>Facturación</option>
              </select>
              <Input
                placeholder='Nombre'
                value={addressForm.nombre}
                onChange={e => handleAddressChange('nombre', e.target.value)}
                autoComplete='name'
              />
              <Input
                placeholder='Teléfono'
                value={addressForm.telefono}
                onChange={e => handleAddressChange('telefono', e.target.value)}
                autoComplete='tel'
              />
              <Input
                className='md:col-span-2'
                placeholder='Dirección'
                value={addressForm.direccion}
                onChange={e => handleAddressChange('direccion', e.target.value)}
                autoComplete='street-address'
              />
              <Input
                className='md:col-span-2'
                placeholder='Apto, interior, referencia'
                value={addressForm.direccion2}
                onChange={e => handleAddressChange('direccion2', e.target.value)}
                autoComplete='address-line2'
              />
              <Input
                placeholder='Ciudad'
                value={addressForm.ciudad}
                onChange={e => handleAddressChange('ciudad', e.target.value)}
                autoComplete='address-level2'
              />
              <Input
                placeholder='Departamento'
                value={addressForm.departamento}
                onChange={e => handleAddressChange('departamento', e.target.value)}
                autoComplete='address-level1'
              />
              <Input
                placeholder='Código postal'
                value={addressForm.codigo_postal}
                onChange={e => handleAddressChange('codigo_postal', e.target.value)}
                autoComplete='postal-code'
              />
              <label className='inline-flex items-center gap-2 text-sm md:col-span-2'>
                <input
                  type='checkbox'
                  checked={addressForm.es_predeterminada}
                  onChange={e => handleAddressChange('es_predeterminada', e.target.checked)}
                />
                Predeterminada
              </label>
              <div className='md:col-span-2 flex gap-2'>
                <Button
                  onClick={handleSaveAddress}
                  className='flex items-center gap-2'
                >
                  <Icon
                    category='Vendedor'
                    name='FaSolidEdit'
                    className='w-4 h-4'
                  />
                  {isEditingAddress ? 'Actualizar' : 'Guardar'}
                </Button>
                {isEditingAddress && (
                  <Button
                    variant='secondary'
                    onClick={resetAddressForm}
                    className='flex items-center gap-2'
                  >
                    <Icon
                      category='Estados y Feedback'
                      name='BxErrorCircle'
                      className='w-4 h-4'
                    />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            
            <div className='border-t pt-4'>
              <h3 className='font-medium mb-3'>Direcciones guardadas</h3>
              {loading ? (
                <div className='text-center py-4'>
                  <div className='inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500'></div>
                  <p className='text-sm text-gray-600 mt-2'>Cargando direcciones...</p>
                </div>
              ) : (
                <AddressSelector 
                  addresses={addresses} 
                  onSelect={() => {}}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de métodos de pago */}
        <Card>
          <CardContent className='p-6 space-y-4'>
            <h2 className='font-semibold flex items-center gap-2'>
              <Icon
                category='Carrito y checkout'
                name='VaadinWallet'
                className='w-5 h-5'
              />
              Métodos de pago
            </h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <select
                className='input'
                value={paymentForm.metodo}
                onChange={e => {
                  const metodo = e.target.value as 'tarjeta' | 'contraentrega';
                  handlePaymentChange('metodo', metodo);
                  handlePaymentChange('etiqueta', 
                    metodo === 'tarjeta' 
                      ? (paymentForm.last4 ? `Tarjeta •••• ${paymentForm.last4}` : 'Tarjeta')
                      : 'Contraentrega'
                  );
                }}
              >
                <option value='tarjeta'>Tarjeta</option>
                <option value='contraentrega'>Contraentrega</option>
              </select>
              <Input
                placeholder='Etiqueta'
                value={paymentForm.etiqueta}
                onChange={e => handlePaymentChange('etiqueta', e.target.value)}
              />
              {paymentForm.metodo === 'tarjeta' && (
                <>
                  <Input
                    placeholder='Titular'
                    value={paymentForm.titular}
                    onChange={e => handlePaymentChange('titular', e.target.value)}
                    autoComplete='cc-name'
                  />
                  <div className='grid grid-cols-3 gap-3'>
                    <Input
                      placeholder='Last4'
                      value={paymentForm.last4}
                      onChange={e => handlePaymentChange('last4', e.target.value)}
                    />
                    <Input
                      placeholder='MM'
                      value={paymentForm.exp_mm}
                      onChange={e => handlePaymentChange('exp_mm', e.target.value)}
                      autoComplete='cc-exp-month'
                    />
                    <Input
                      placeholder='YY'
                      value={paymentForm.exp_yy}
                      onChange={e => handlePaymentChange('exp_yy', e.target.value)}
                      autoComplete='cc-exp-year'
                    />
                  </div>
                </>
              )}
              <label className='inline-flex items-center gap-2 text-sm md:col-span-2'>
                <input
                  type='checkbox'
                  checked={paymentForm.es_predeterminada}
                  onChange={e => handlePaymentChange('es_predeterminada', e.target.checked)}
                />
                Predeterminada
              </label>
              <div className='md:col-span-2 flex gap-2'>
                <Button
                  onClick={handleSavePayment}
                  className='flex items-center gap-2'
                >
                  <Icon
                    category='Vendedor'
                    name='FaSolidEdit'
                    className='w-4 h-4'
                  />
                  {isEditingPayment ? 'Actualizar' : 'Guardar'}
                </Button>
                {isEditingPayment && (
                  <Button
                    variant='secondary'
                    onClick={resetPaymentForm}
                    className='flex items-center gap-2'
                  >
                    <Icon
                      category='Estados y Feedback'
                      name='BxErrorCircle'
                      className='w-4 h-4'
                    />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            
            <div className='border-t pt-4'>
              <h3 className='font-medium mb-3'>Métodos de pago guardados</h3>
              {loading ? (
                <div className='text-center py-4'>
                  <div className='inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500'></div>
                  <p className='text-sm text-gray-600 mt-2'>Cargando métodos de pago...</p>
                </div>
              ) : (
                <PaymentSelector 
                  payments={payments} 
                  onSelect={() => {}}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                  onSetDefault={handleSetDefaultPayment}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileSettings;