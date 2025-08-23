import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface CategoriaRow {
  id: string;
  nombre: string;
  slug: string | null;
  descripcion: string | null;
  created_at?: string;
}

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const CategoriesAdmin: React.FC = () => {
  const [items, setItems] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<{
    id?: string;
    nombre: string;
    slug: string;
    descripcion: string;
  }>({ nombre: '', slug: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading categorias', error.message);
    } else {
      setItems(data as CategoriaRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onChangeNombre = (nombre: string) => {
    const newSlug = form.id ? form.slug : slugify(nombre);
    setForm(f => ({ ...f, nombre, slug: newSlug }));
  };

  const resetForm = () => setForm({ nombre: '', slug: '', descripcion: '' });

  const save = async () => {
    if (!form.nombre.trim()) {
      alert('Nombre requerido');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase
          .from('categorias')
          .update({
            nombre: form.nombre.trim(),
            slug: form.slug.trim(),
            descripcion: form.descripcion.trim() || null,
          })
          .eq('id', form.id);
        if (error) throw error;
      } else {
        const payload = {
          nombre: form.nombre.trim(),
          slug: form.slug.trim(),
          descripcion: form.descripcion.trim() || null,
        };
        const { error } = await supabase.from('categorias').insert(payload);
        if (error) throw error;
      }
      await load();
      resetForm();
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'Error guardando categoría', {
        role: 'admin',
        action: 'update',
      });
    } finally {
      setSaving(false);
    }
  };

  const edit = (c: CategoriaRow) => {
    setForm({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug || '',
      descripcion: c.descripcion || '',
    });
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar categoría?')) return;
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      (window as any).toast?.error(error.message, {
        role: 'admin',
        action: 'delete',
      });
    } else {
      setItems(list => list.filter(x => x.id !== id));
      (window as any).toast?.success('Categoría eliminada', {
        role: 'admin',
        action: 'delete',
      });
    }
  };

  return (
    <AdminLayout
      title='Categorías'
      subtitle='Crea, edita y elimina categorías del catálogo'
    >
      <div className='mb-6 flex items-center justify-between'>
        <input
          className='input-hero max-w-md'
          placeholder='Buscar categoría por nombre o slug...'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='card card-hover lg:col-span-1'>
          <div className='card-header'>
            <h2 className='text-lg font-semibold text-gray-900'>
              {form.id ? 'Editar' : 'Nueva'} categoría
            </h2>
          </div>
          <div className='card-body space-y-4'>
            <div>
              <label className='label'>Nombre</label>
              <input
                className='input'
                value={form.nombre}
                onChange={e => onChangeNombre(e.target.value)}
              />
            </div>
            <div>
              <label className='label'>Slug</label>
              <input
                className='input'
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div>
              <label className='label'>Descripción</label>
              <textarea
                className='textarea'
                value={form.descripcion}
                onChange={e =>
                  setForm(f => ({ ...f, descripcion: e.target.value }))
                }
              />
            </div>
            <div className='flex space-x-2'>
              <button
                className='btn btn-primary'
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              {form.id && (
                <button className='btn btn-outline' onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className='card card-hover lg:col-span-2'>
          <div className='card-header'>
            <h2 className='text-lg font-semibold text-gray-900'>Listado</h2>
          </div>
          <div className='card-body'>
            {loading ? (
              <p>Cargando...</p>
            ) : filtered.length === 0 ? (
              <p className='text-gray-500'>Sin resultados</p>
            ) : (
              <div className='divide-y'>
                {filtered.map(c => (
                  <div
                    key={c.id}
                    className='py-3 flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>{c.nombre}</p>
                      <p className='text-sm text-gray-500'>/{c.slug}</p>
                    </div>
                    <div className='flex space-x-2'>
                      <button
                        className='btn btn-outline btn-sm'
                        onClick={() => edit(c)}
                      >
                        Editar
                      </button>
                      <button
                        className='btn btn-danger btn-sm'
                        onClick={() => remove(c.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CategoriesAdmin;
