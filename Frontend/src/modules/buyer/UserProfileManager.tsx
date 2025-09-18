import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import Icon from '@/components/ui/Icon';

// Interfaces para los perfiles
export interface UserAddress {
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
  created_at?: string;
}

export interface UserPaymentProfile {
  id: string;
  metodo: 'tarjeta' | 'contraentrega';
  etiqueta: string;
  titular?: string | null;
  last4?: string | null;
  exp_mm?: number | null;
  exp_yy?: number | null;
  es_predeterminada: boolean;
  created_at?: string;
}

// Tipos para formularios
interface AddressForm {
  id?: string;
  tipo: 'envio' | 'facturacion';
  nombre: string;
  telefono?: string;
  direccion: string;
  direccion2?: string;
  ciudad: string;
  departamento: string;
  codigo_postal?: string;
  es_predeterminada?: boolean;
}

interface PaymentForm {
  id?: string;
  metodo: 'tarjeta' | 'contraentrega';
  etiqueta: string;
  titular?: string;
  last4?: string;
  exp_mm?: number;
  exp_yy?: number;
  es_predeterminada?: boolean;
}

// Hook para gestionar perfiles de usuario
export const useUserProfile = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [payments, setPayments] = useState<UserPaymentProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar perfiles
  const loadProfiles = useCallback(async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) return;

      const [addrRes, payRes] = await Promise.all([
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

      setAddresses((addrRes.data || []) as UserAddress[]);
      setPayments((payRes.data || []) as UserPaymentProfile[]);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar dirección
  const saveAddress = async (address: AddressForm) => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      
      const payload: any = {
        ...address,
        user_id: uid,
        es_predeterminada: !!address.es_predeterminada,
      };
      
      let savedId = address.id;
      if (address.id) {
        const { error } = await supabase
          .from('user_address')
          .update(payload)
          .eq('id', address.id)
          .eq('user_id', uid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('user_address')
          .insert(payload)
          .select()
          .limit(1)
          .single();
        if (error) throw error;
        savedId = (data as any)?.id;
      }
      
      // Asegurar único predeterminado por tipo
      if (payload.es_predeterminada) {
        await supabase
          .from('user_address')
          .update({ es_predeterminada: false })
          .eq('user_id', uid)
          .eq('tipo', payload.tipo)
          .neq('id', savedId || '00000000-0000-0000-0000-000000000000');
      }
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Guardar método de pago
  const savePayment = async (payment: PaymentForm) => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      
      const payload: any = {
        ...payment,
        user_id: uid,
        es_predeterminada: !!payment.es_predeterminada,
      };
      
      let savedId = payment.id;
      if (payment.id) {
        const { error } = await supabase
          .from('user_payment_profile')
          .update(payload)
          .eq('id', payment.id)
          .eq('user_id', uid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('user_payment_profile')
          .insert(payload)
          .select()
          .limit(1)
          .single();
        if (error) throw error;
        savedId = (data as any)?.id;
      }
      
      // Asegurar único predeterminado
      if (payload.es_predeterminada) {
        await supabase
          .from('user_payment_profile')
          .update({ es_predeterminada: false })
          .eq('user_id', uid)
          .neq('id', savedId || '00000000-0000-0000-0000-000000000000');
      }
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Eliminar dirección
  const deleteAddress = async (id: string) => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const { error } = await supabase.from('user_address').delete().eq('id', id);
      if (error) throw error;
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Eliminar método de pago
  const deletePayment = async (id: string) => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const { error } = await supabase.from('user_payment_profile').delete().eq('id', id);
      if (error) throw error;
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Establecer dirección como predeterminada
  const setDefaultAddress = async (id: string, tipo: 'envio' | 'facturacion') => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      
      // Primero desactivar todas las direcciones predeterminadas del mismo tipo
      await supabase
        .from('user_address')
        .update({ es_predeterminada: false })
        .eq('user_id', uid)
        .eq('tipo', tipo);
      
      // Luego establecer esta como predeterminada
      const { error } = await supabase
        .from('user_address')
        .update({ es_predeterminada: true })
        .eq('id', id)
        .eq('user_id', uid);
      
      if (error) throw error;
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Establecer método de pago como predeterminado
  const setDefaultPayment = async (id: string) => {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sesión no disponible');
      
      // Primero desactivar todos los métodos de pago predeterminados
      await supabase
        .from('user_payment_profile')
        .update({ es_predeterminada: false })
        .eq('user_id', uid);
      
      // Luego establecer este como predeterminado
      const { error } = await supabase
        .from('user_payment_profile')
        .update({ es_predeterminada: true })
        .eq('id', id)
        .eq('user_id', uid);
      
      if (error) throw error;
      
      await loadProfiles();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
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
  };
};

// Componente para seleccionar dirección
export const AddressSelector: React.FC<{
  addresses: UserAddress[];
  selectedId?: string;
  onSelect: (address: UserAddress) => void;
  onEdit?: (address: UserAddress) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string, tipo: 'envio' | 'facturacion') => void;
}> = ({ addresses, selectedId, onSelect, onEdit, onDelete, onSetDefault }) => {
  if (addresses.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Icon
          category="Usuario"
          name="RivetIconsSettings"
          className="w-8 h-8 mx-auto mb-2 text-gray-400"
        />
        <p>No tienes direcciones guardadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map(address => (
        <div
          key={address.id}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            selectedId === address.id
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(address)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{address.nombre}</p>
              <p className="text-sm text-gray-600">
                {address.direccion}
              </p>
              <p className="text-sm text-gray-600">
                {address.ciudad}, {address.departamento}
              </p>
              {address.telefono && (
                <p className="text-sm text-gray-600">
                  Tel: {address.telefono}
                </p>
              )}
            </div>
            <div className="text-right">
              {address.es_predeterminada && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Predeterminada
                </span>
              )}
              {selectedId === address.id && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                  Seleccionada
                </span>
              )}
            </div>
          </div>
          
          {(onEdit || onDelete || onSetDefault) && (
            <div className="flex justify-end space-x-2 mt-2">
              {onSetDefault && !address.es_predeterminada && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault(address.id, address.tipo);
                  }}
                >
                  Predeterminada
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(address);
                  }}
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(address.id);
                  }}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Componente para seleccionar método de pago
export const PaymentSelector: React.FC<{
  payments: UserPaymentProfile[];
  selectedId?: string;
  onSelect: (payment: UserPaymentProfile) => void;
  onEdit?: (payment: UserPaymentProfile) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}> = ({ payments, selectedId, onSelect, onEdit, onDelete, onSetDefault }) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Icon
          category="Carrito y checkout"
          name="VaadinWallet"
          className="w-8 h-8 mx-auto mb-2 text-gray-400"
        />
        <p>No tienes métodos de pago guardados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map(payment => (
        <div
          key={payment.id}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            selectedId === payment.id
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(payment)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon
                category="Carrito y checkout"
                name={
                  payment.metodo === 'tarjeta'
                    ? 'StreamlinePlumpPaymentRecieve7Solid'
                    : 'Fa6SolidTruck'
                }
                className="w-6 h-6"
              />
              <div>
                <p className="font-medium">{payment.etiqueta}</p>
                <p className="text-sm text-gray-600">
                  {payment.metodo === 'tarjeta' && payment.last4
                    ? `•••• ${payment.last4}`
                    : payment.metodo === 'contraentrega'
                      ? 'Pago contra entrega'
                      : 'Método guardado'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {payment.es_predeterminada && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Predeterminado
                </span>
              )}
              {selectedId === payment.id && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                  Seleccionado
                </span>
              )}
            </div>
          </div>
          
          {(onEdit || onDelete || onSetDefault) && (
            <div className="flex justify-end space-x-2 mt-2">
              {onSetDefault && !payment.es_predeterminada && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault(payment.id);
                  }}
                >
                  Predeterminado
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(payment);
                  }}
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(payment.id);
                  }}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};