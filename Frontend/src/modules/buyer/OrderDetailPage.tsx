import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Icon from '@/components/ui/Icon';

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'procesando', label: 'Procesando' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregado', label: 'Entregado' },
];

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [shipping, setShipping] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!rootRef.current || !order) return;
    const [html2canvasMod, jsPDFMod] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const html2canvas =
      (html2canvasMod as any).default || (html2canvasMod as any);
    const JsPDFCtor = (jsPDFMod as any).jsPDF || (jsPDFMod as any).default;
    const canvas = await html2canvas(rootRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new JsPDFCtor('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = 10;
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`pedido-${String(order.id).slice(0, 8)}.pdf`);
  };

  const load = async () => {
    setLoading(true);
    const [{ data: o }, { data: s }] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, invoice_number, total, estado, created_at, order_items(id,producto_nombre,cantidad,precio_unitario,subtotal,producto_imagen_url)'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('order_shipping')
        .select('*')
        .eq('order_id', id)
        .maybeSingle(),
    ]);
    setOrder(o);
    setShipping(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading)
    return (
      <div className='container py-8'>
        <div className='flex items-center justify-center'>
          <Icon
            category='Estados y Feedback'
            name='HugeiconsReload'
            className='w-8 h-8 animate-spin'
          />
        </div>
      </div>
    );
  if (!order) return <div className='container py-8'>Pedido no encontrado</div>;

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === order.estado);
  const badgeClass = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return 'badge-success';
      case 'enviado':
        return 'badge-primary';
      case 'procesando':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className='container py-8' ref={rootRef}>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h1 className='heading-lg flex items-center gap-3'>
            <Icon
              category='Pedidos'
              name='MaterialSymbolsOrdersOutlineRounded'
              className='w-8 h-8'
            />
            Pedido {order.invoice_number || '#' + String(order.id).slice(0, 8)}
          </h1>
          <p className='text-gray-600 flex items-center gap-2'>
            <Icon
              category='Estados y Feedback'
              name='IconoirWarningSquare'
              className='w-4 h-4'
            />
            Creado: {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`badge capitalize ${badgeClass(order.estado)}`}>
            {order.estado}
          </span>
          <button
            className='btn btn-secondary flex items-center gap-2'
            onClick={downloadPdf}
          >
            <Icon
              category='Carrito y checkout'
              name='TablerDownload'
              className='w-4 h-4'
            />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 card card-hover'>
          <div className='card-body'>
            {/* Timeline */}
            <div className='mb-6'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <Icon category='Pedidos' name='GgLoadbar' className='w-5 h-5' />
                Estado del pedido
              </h3>
              <div className='flex items-center justify-between'>
                {STATUS_STEPS.map((s, idx) => (
                  <div key={s.key} className='flex-1 flex items-center'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ring-2 ring-white shadow ${idx <= currentIdx ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {idx + 1}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-1 rounded ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <div className='mt-2 flex items-center justify-between text-xs text-gray-600'>
                {STATUS_STEPS.map(s => (
                  <span key={s.key}>{s.label}</span>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className='overflow-x-auto'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <Icon
                  category='Catálogo y producto'
                  name='BxsPackage'
                  className='w-5 h-5'
                />
                Productos
              </h3>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-left text-gray-500 border-b'>
                    <th className='py-2 pr-4'>Producto</th>
                    <th className='py-2 pr-4'>Cantidad</th>
                    <th className='py-2 pr-4'>Unitario</th>
                    <th className='py-2 pr-4'>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.order_items || []).map((it: any) => (
                    <tr key={it.id} className='border-b'>
                      <td className='py-3 pr-4'>
                        <div className='flex items-center gap-3'>
                          {it.producto_imagen_url && (
                            <img
                              src={it.producto_imagen_url}
                              alt={it.producto_nombre}
                              className='w-10 h-10 object-cover rounded'
                            />
                          )}
                          <span className='font-medium'>
                            {it.producto_nombre}
                          </span>
                        </div>
                      </td>
                      <td className='py-3 pr-4'>{it.cantidad}</td>
                      <td className='py-3 pr-4'>
                        ${Number(it.precio_unitario).toLocaleString()}
                      </td>
                      <td className='py-3 pr-4 font-semibold'>
                        ${Number(it.subtotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className='card card-hover h-max'>
          <div className='card-body space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-600 flex items-center gap-2'>
                <Icon
                  category='Carrito y checkout'
                  name='VaadinWallet'
                  className='w-4 h-4'
                />
                Total
              </span>
              <span className='text-2xl font-bold text-(--color-terracotta-suave)'>
                ${Number(order.total).toLocaleString()}
              </span>
            </div>
            <div className='mt-2'>
              <h3 className='font-semibold flex items-center gap-2'>
                <Icon
                  category='Carrito y checkout'
                  name='HugeiconsMapsLocation01'
                  className='w-4 h-4'
                />
                Envío
              </h3>
              {shipping ? (
                <div className='text-sm text-gray-700'>
                  <div>{shipping.nombre}</div>
                  <div>{shipping.direccion}</div>
                  <div>{shipping.ciudad}</div>
                  <div>{shipping.telefono}</div>
                </div>
              ) : (
                <div className='text-sm text-gray-500'>
                  Sin información de envío
                </div>
              )}
              <p className='text-xs text-gray-500 mt-2'>
                Impuestos incluidos donde aplique
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
