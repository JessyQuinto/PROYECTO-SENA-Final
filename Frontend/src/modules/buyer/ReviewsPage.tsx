import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '@/components/ui/Icon';

// MVP: lista de pedidos entregados y formulario por item para calificar

const ReviewsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('order_items')
      .select(
        'id, producto_id, producto_nombre, order_id, orders!inner(id, estado), evaluaciones(id)'
      )
      .eq('orders.estado', 'entregado');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (it: any, puntuacion: number, comentario: string) => {
    try {
      const { error } = await supabase.from('evaluaciones').insert({
        comprador_id: (await supabase.auth.getUser()).data.user?.id,
        producto_id: it.producto_id,
        order_item_id: it.id,
        puntuacion,
        comentario: comentario || null,
      });
      if (error) throw error;
      await load();
      alert('¡Gracias por tu calificación!');
    } catch (e: any) {
      alert(e?.message || 'No se pudo enviar la calificación');
    }
  };

  return (
    <div className='container py-8'>
      <h1 className='heading-lg mb-6 flex items-center gap-3'>
        <Icon
          category='Catálogo y producto'
          name='LucideHeart'
          className='w-8 h-8'
        />
        Calificar compras
      </h1>
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Icon
            category='Estados y Feedback'
            name='HugeiconsReload'
            className='w-6 h-6 animate-spin'
          />
          <span className='ml-2'>Cargando...</span>
        </div>
      ) : items.length === 0 ? (
        <div className='card'>
          <div className='card-body text-center text-gray-600'>
            <Icon
              category='Catálogo y producto'
              name='LucideHeart'
              className='w-16 h-16 mx-auto mb-4 text-gray-400'
            />
            No tienes compras entregadas por calificar
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          {items.map(it => (
            <RateCard key={it.id} item={it} onSubmit={submit} />
          ))}
        </div>
      )}
    </div>
  );
};

const RateCard: React.FC<{
  item: any;
  onSubmit: (it: any, puntuacion: number, comentario: string) => void;
}> = ({ item, onSubmit }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const already = item.evaluaciones && item.evaluaciones.length > 0;
  return (
    <div className='card'>
      <div className='card-body flex items-center justify-between gap-3'>
        <div>
          <p className='font-medium flex items-center gap-2'>
            <Icon
              category='Catálogo y producto'
              name='BxsPackage'
              className='w-4 h-4'
            />
            {item.producto_nombre}
          </p>
          <p className='text-sm text-gray-500 flex items-center gap-2'>
            <Icon
              category='Pedidos'
              name='MaterialSymbolsOrdersOutlineRounded'
              className='w-3 h-3'
            />
            Pedido #{item.order_id?.slice(0, 8)}
          </p>
        </div>
        {already ? (
          <span className='badge badge-secondary flex items-center gap-1'>
            <Icon
              category='Estados y Feedback'
              name='IconParkSolidSuccess'
              className='w-3 h-3'
            />
            Ya calificado
          </span>
        ) : (
          <div className='flex items-center gap-2'>
            <select
              className='form-select w-28'
              value={score}
              onChange={e => setScore(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map(s => (
                <option key={s} value={s}>
                  {s} estrellas
                </option>
              ))}
            </select>
            <input
              className='form-input'
              placeholder='Comentario (opcional)'
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button
              className='btn btn-primary flex items-center gap-2'
              onClick={() => onSubmit(item, score, comment)}
            >
              <Icon
                category='Catálogo y producto'
                name='LucideHeart'
                className='w-4 h-4'
              />
              Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
