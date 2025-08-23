import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';
import { CacheManagementPanel } from '@/components/cache/CacheProvider';

const AdminSettings: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [from, setFrom] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: notif }, { data: sender }] = await Promise.all([
      supabase
        .from('app_config')
        .select('value')
        .eq('key', 'notify_vendor_email_enabled')
        .maybeSingle(),
      supabase
        .from('app_config')
        .select('value')
        .eq('key', 'notify_from')
        .maybeSingle(),
    ]);
    setEnabled(notif?.value?.enabled ?? true);
    setFrom(
      sender?.value?.from ?? 'Tesoros Chocó <notificaciones@tu-dominio.com>'
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('app_config').upsert([
      { key: 'notify_vendor_email_enabled', value: { enabled } },
      { key: 'notify_from', value: { from } },
    ]);
    setSaving(false);
  };

  return (
    <AdminLayout
      title='Configuración'
      subtitle='Ajustes de aplicación y rendimiento'
    >
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className='space-y-6'>
          {/* Notificaciones */}
          <div className='card'>
            <div className='card-header'>
              <h3 className='card-title'>Notificaciones por Email</h3>
            </div>
            <div className='card-body space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium text-gray-900'>
                    Notificar por email al aprobar/rechazar vendedores
                  </p>
                  <p className='text-gray-500 text-sm'>
                    Usa Brevo vía Edge Function segura
                  </p>
                </div>
                <label className='inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only'
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                  />
                  <span
                    className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 transition ${enabled ? 'bg-green-500' : ''}`}
                  >
                    <span
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition ${enabled ? 'translate-x-5' : ''}`}
                    ></span>
                  </span>
                </label>
              </div>
              <div>
                <label className='label'>Remitente (from)</label>
                <input
                  className='input'
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  placeholder='Tesoros Chocó <notificaciones@tu-dominio.com>'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Configura un remitente verificado en Brevo, por ejemplo:
                  "Tesoros Chocó &lt;notificaciones@tu-dominio.com&gt;".
                </p>
              </div>
            </div>
            <div className='card-footer'>
              <button className='btn-cta' onClick={save} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Cache Management */}
          <CacheManagementPanel />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
