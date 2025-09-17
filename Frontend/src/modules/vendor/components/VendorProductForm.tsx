import React from 'react';
import Icon from '@/components/ui/Icon';

interface Category { id: string; nombre: string }

interface Props {
  form: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: string;
    stock: string;
    categoria_id: string;
    imagen_file?: File | null;
    imagen_url?: string | null;
  };
  setForm: (updater: (prev: any) => any) => void;
  categories: Category[];
  saving: boolean;
  error: string | null;
  story: { historia?: string; materiales?: string; tecnica?: string; origen?: string; cuidados?: string };
  setStory: (updater: (prev: any) => any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const VendorProductForm: React.FC<Props> = ({ form, setForm, categories, saving, error, story, setStory, onSubmit, onCancel }) => {
  return (
    <div className='card max-w-2xl'>
      <div className='card-header'>
        <h2 className='text-lg font-semibold text-gray-900'>
          {form.id ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
      </div>
      <div className='card-body'>
        {error && (
          <div className='mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm'>
            {error}
          </div>
        )}
        <form className='space-y-6' onSubmit={onSubmit}>
          <div className='form-group'>
            <label className='form-label'>Nombre del producto</label>
            <input type='text' className='form-input' placeholder='Ej: Collar artesanal chocoano' value={form.nombre} onChange={e => setForm((f: any) => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className='form-group'>
            <label className='form-label'>Descripción</label>
            <textarea className='form-textarea' placeholder='Describe tu producto...' value={form.descripcion} onChange={e => setForm((f: any) => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='form-group'>
              <label className='form-label'>Precio</label>
              <input type='number' className='form-input' placeholder='0.00' value={form.precio} onChange={e => setForm((f: any) => ({ ...f, precio: e.target.value }))} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Stock</label>
              <input type='number' className='form-input' placeholder='0' value={form.stock} onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))} />
            </div>
          </div>
          <div className='form-group'>
            <label className='form-label'>Categoría</label>
            <select className='form-select' value={form.categoria_id} onChange={e => setForm((f: any) => ({ ...f, categoria_id: e.target.value }))}>
              <option value=''>Seleccionar categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className='form-group'>
            <label className='form-label'>Imagen del producto</label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <svg className='w-8 h-8 text-gray-400 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
              </svg>
              <input type='file' accept='image/*' onChange={e => setForm((f: any) => ({ ...f, imagen_file: e.target.files?.[0] || null }))} />
              {form.imagen_url && (
                <div className='mt-3'>
                  <img src={form.imagen_url} alt='preview' className='w-full max-h-40 object-cover rounded' />
                </div>
              )}
            </div>
          </div>
          {form.id && (
            <div className='border-t pt-4'>
              <h3 className='font-medium mb-3'>Historia y detalles para conectar con el comprador</h3>
              <div className='space-y-4'>
                <div className='form-group'>
                  <label className='form-label'>Historia (breve relato)</label>
                  <textarea className='form-textarea' placeholder='¿Qué inspira esta pieza? ¿Quién la hizo? ¿Qué la hace única?' value={story.historia || ''} onChange={e => setStory((s: any) => ({ ...s, historia: e.target.value }))} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='form-group'>
                    <label className='form-label'>Materiales (separados por coma)</label>
                    <input type='text' className='form-input' placeholder='Iraca, Madera, Tagua' value={story.materiales || ''} onChange={e => setStory((s: any) => ({ ...s, materiales: e.target.value }))} />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Técnica (separadas por coma)</label>
                    <input type='text' className='form-input' placeholder='Tejido, Tallado, Teñido natural' value={story.tecnica || ''} onChange={e => setStory((s: any) => ({ ...s, tecnica: e.target.value }))} />
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='form-group'>
                    <label className='form-label'>Origen / Comunidad</label>
                    <input type='text' className='form-input' placeholder='Istmina, Medio San Juan, Comunidad Emberá...' value={story.origen || ''} onChange={e => setStory((s: any) => ({ ...s, origen: e.target.value }))} />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Cuidados</label>
                    <input type='text' className='form-input' placeholder='Evitar humedad, limpiar con paño seco...' value={story.cuidados || ''} onChange={e => setStory((s: any) => ({ ...s, cuidados: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className='flex space-x-4'>
            <button type='submit' className='btn btn-primary flex items-center gap-2' disabled={saving}>
              {saving ? (
                <>
                  <Icon category='Estados y Feedback' name='HugeiconsReload' className='w-4 h-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Icon category='Vendedor' name='LucideCircleFadingPlus' className='w-4 h-4' />
                  Guardar Producto
                </>
              )}
            </button>
            <button type='button' className='btn btn-outline flex items-center gap-2' onClick={onCancel}>
              <Icon category='Estados y Feedback' name='BxErrorCircle' className='w-4 h-4' />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorProductForm;
