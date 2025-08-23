import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface TopProducto {
  id: string;
  nombre: string;
  total_vendido: number;
}

interface KPIs {
  totalVentasMes: number;
  pedidosMes: number;
  ticketPromedio: number;
}

const MetricsAdmin: React.FC = () => {
  const [kpi, setKpi] = useState<KPIs | null>(null);
  const [top, setTop] = useState<TopProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const inicio = new Date(from);
    const fin = new Date(to);
    fin.setDate(fin.getDate() + 1); // inclusive to exclusive
    const offset = (page - 1) * PAGE_SIZE;
    const [{ data: kpiRows, error: e1 }, { data: topRows, error: e2 }] =
      await Promise.all([
        supabase.rpc('kpi_periodo', {
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
        }),
        supabase.rpc('top_productos_periodo', {
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          limite: PAGE_SIZE,
          desplazamiento: offset,
        }),
      ]);
    if (e1 || e2) console.error(e1?.message || e2?.message);
    const k = (kpiRows as any[])?.[0] || {
      total_ventas: 0,
      pedidos: 0,
      ticket_promedio: 0,
    };
    setKpi({
      totalVentasMes: Number(k.total_ventas || 0),
      pedidosMes: Number(k.pedidos || 0),
      ticketPromedio: Number(k.ticket_promedio || 0),
    });
    const pairs: { producto_id: string; total_vendido: number }[] =
      (topRows as any[]) || [];
    if (pairs.length > 0) {
      const ids = pairs.map(p => p.producto_id);
      const { data: productos } = await supabase
        .from('productos')
        .select('id,nombre')
        .in('id', ids);
      const byId = new Map((productos || []).map((p: any) => [p.id, p.nombre]));
      setTop(
        pairs.map(p => ({
          id: p.producto_id,
          nombre: byId.get(p.producto_id) || p.producto_id,
          total_vendido: Number(p.total_vendido || 0),
        }))
      );
    } else setTop([]);
    setLoading(false);
  }, [from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout
      title='Métricas'
      subtitle='Indicadores clave y productos top del mes'
    >
      {loading || !kpi ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='card card-hover'>
              <div className='card-body'>
                <p className='text-sm text-gray-500'>Ventas del Mes</p>
                <p className='heading-lg'>${kpi.totalVentasMes.toFixed(0)}</p>
              </div>
            </div>
            <div className='card card-hover'>
              <div className='card-body'>
                <p className='text-sm text-gray-500'>Pedidos del Mes</p>
                <p className='heading-lg'>{kpi.pedidosMes}</p>
              </div>
            </div>
            <div className='card card-hover'>
              <div className='card-body'>
                <p className='text-sm text-gray-500'>Ticket Promedio</p>
                <p className='heading-lg'>${kpi.ticketPromedio.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className='card card-hover'>
            <div className='card-header'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Top 10 productos por ventas
              </h2>
            </div>
            <div className='card-body'>
              {top.length === 0 ? (
                <p className='text-gray-500'>No hay datos este mes</p>
              ) : (
                <ul className='divide-y'>
                  {top.map(p => (
                    <li
                      key={p.id}
                      className='py-3 flex items-center justify-between'
                    >
                      <span>{p.nombre}</span>
                      <span className='font-semibold'>
                        ${p.total_vendido.toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className='flex items-center justify-between mt-4'>
                <div className='flex items-center gap-2'>
                  <label className='text-sm text-gray-600'>Desde</label>
                  <input
                    type='date'
                    className='form-input w-40'
                    value={from}
                    onChange={e => {
                      setFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                  <label className='text-sm text-gray-600'>Hasta</label>
                  <input
                    type='date'
                    className='form-input w-40'
                    value={to}
                    onChange={e => {
                      setTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    className='btn btn-outline btn-sm'
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <span className='text-sm text-gray-500'>Página {page}</span>
                  <button
                    className='btn btn-outline btn-sm'
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default MetricsAdmin;
