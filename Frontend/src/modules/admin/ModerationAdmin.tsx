import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

type ProductoEstado = 'activo' | 'inactivo' | 'bloqueado';

interface ProductoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: ProductoEstado;
  imagen_url: string | null;
  created_at?: string;
  vendedor_id: string;
}

const ModerationAdmin: React.FC = () => {
  const [items, setItems] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState<ProductoEstado | 'todos'>('todos');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(p => {
      const matchQ =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q);
      const matchE = estado === 'todos' || p.estado === estado;
      return matchQ && matchE;
    });
  }, [items, query, estado]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,descripcion,estado,imagen_url,created_at,vendedor_id')
      .order('created_at', { ascending: false });
    if (error) console.error(error.message);
    setItems((data || []) as ProductoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setEstadoProducto = async (id: string, nuevo: ProductoEstado) => {
    const { error } = await supabase
      .from('productos')
      .update({ estado: nuevo })
      .eq('id', id);
    if (error) return alert(error.message);
    setItems(list =>
      list.map(p => (p.id === id ? { ...p, estado: nuevo } : p))
    );
  };

  return (
    <AdminLayout
      title='Moderación de Productos'
      subtitle='Activa, desactiva o bloquea productos que infringen reglas'
    >
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <input
            className='input-hero max-w-md'
            placeholder='Buscar por nombre o descripción...'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className='form-select w-40'
            value={estado}
            onChange={e => setEstado(e.target.value as any)}
          >
            <option value='todos'>Todos</option>
            <option value='activo'>Activo</option>
            <option value='inactivo'>Inactivo</option>
            <option value='bloqueado'>Bloqueado</option>
          </select>
        </div>
      </div>

      <div className='card card-hover'>
        <div className='card-body'>
          {loading ? (
            <p>Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className='text-gray-500'>Sin resultados</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filtered.map(p => (
                <div key={p.id} className='card card-hover overflow-hidden'>
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className='w-full h-40 object-cover'
                    />
                  ) : (
                    <div className='w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400'>
                      Sin imagen
                    </div>
                  )}
                  <div className='p-4'>
                    <p className='font-semibold text-gray-900'>{p.nombre}</p>
                    <p className='text-xs text-gray-500 truncate'>
                      {p.descripcion}
                    </p>
                    <div className='mt-3 flex items-center justify-between'>
                      <span
                        className={`badge ${p.estado === 'activo' ? 'badge-success' : p.estado === 'inactivo' ? 'badge-secondary' : 'badge-danger'}`}
                      >
                        {p.estado}
                      </span>
                      <div className='space-x-2'>
                        <button
                          className='btn btn-outline btn-sm'
                          onClick={() => setEstadoProducto(p.id, 'activo')}
                        >
                          Activar
                        </button>
                        <button
                          className='btn btn-outline btn-sm'
                          onClick={() => setEstadoProducto(p.id, 'inactivo')}
                        >
                          Inactivar
                        </button>
                        <button
                          className='btn btn-danger btn-sm'
                          onClick={() => setEstadoProducto(p.id, 'bloqueado')}
                        >
                          Bloquear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ModerationAdmin;
