import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface AuditRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  old_values: any | null;
  new_values: any | null;
}

const PAGE_SIZE = 20;

const AuditLogAdmin: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      const matchEntity =
        entity === 'all' || r.entity.toLowerCase() === entity.toLowerCase();
      const matchQ =
        !q ||
        r.action.toLowerCase().includes(q) ||
        (r.entity_id || '').toLowerCase().includes(q);
      return matchEntity && matchQ;
    });
  }, [rows, query, entity]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_log')
      .select(
        'id,actor_id,action,entity,entity_id,created_at,old_values,new_values'
      )
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) console.error(error.message);
    setRows((data || []) as AuditRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout title='Auditoría' subtitle='Registro de acciones críticas'>
      <div className='mb-4 flex items-center gap-2'>
        <input
          className='input-hero max-w-md'
          placeholder='Buscar por acción o entidad_id...'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className='form-select w-48'
          value={entity}
          onChange={e => {
            setPage(1);
            setEntity(e.target.value);
          }}
        >
          <option value='all'>Todas</option>
          <option value='users'>users</option>
          <option value='productos'>productos</option>
          <option value='orders'>orders</option>
          <option value='order_items'>order_items</option>
        </select>
      </div>

      <div className='card card-hover'>
        <div className='card-body overflow-x-auto'>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-500'>
                  <th className='py-2 pr-4'>Fecha</th>
                  <th className='py-2 pr-4'>Acción</th>
                  <th className='py-2 pr-4'>Entidad</th>
                  <th className='py-2 pr-4'>Entidad ID</th>
                  <th className='py-2 pr-4'>Actor</th>
                  <th className='py-2'>Diff</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} className='border-t align-top'>
                    <td className='py-2 pr-4 whitespace-nowrap'>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className='py-2 pr-4'>{r.action}</td>
                    <td className='py-2 pr-4'>{r.entity}</td>
                    <td className='py-2 pr-4 font-mono text-xs break-all'>
                      {r.entity_id}
                    </td>
                    <td className='py-2 pr-4 text-xs'>{r.actor_id || '-'}</td>
                    <td className='py-2'>
                      <details>
                        <summary className='cursor-pointer text-(--color-marron-cacao)'>
                          Ver cambios
                        </summary>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mt-2'>
                          <pre className='bg-gray-50 p-2 rounded text-xs overflow-auto'>
                            {JSON.stringify(r.old_values, null, 2)}
                          </pre>
                          <pre className='bg-gray-50 p-2 rounded text-xs overflow-auto'>
                            {JSON.stringify(r.new_values, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className='card-footer flex items-center justify-between'>
          <button
            className='btn btn-outline'
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </button>
          <span className='text-sm text-gray-500'>Página {page}</span>
          <button
            className='btn btn-outline'
            disabled={page * PAGE_SIZE >= filtered.length}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogAdmin;
