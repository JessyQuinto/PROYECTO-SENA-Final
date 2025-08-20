import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Icon from '@/components/ui/Icon';

const OrderReceiptPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  const downloadPdf = async () => {
    if (!receiptRef.current || !order) return;
    const element = receiptRef.current;
    const [html2canvasMod, jsPDFMod] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const html2canvas = (html2canvasMod as any).default || (html2canvasMod as any);
    const JsPDFCtor = (jsPDFMod as any).jsPDF || (jsPDFMod as any).default;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
  const pdf = new JsPDFCtor('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = { width: canvas.width, height: canvas.height };
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = 10; // top padding
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    const filename = `recibo-${order.invoice_number || String(order.id).slice(0,8)}.pdf`;
    pdf.save(filename);
  };

  const resendEmail = async () => {
    if (!order) return;
    try {
      setSending(true);
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const email = session?.user?.email;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
      if (!token || !supaUrl || !email) throw new Error('Sesión no disponible');
      const projectRef = new URL(supaUrl).host.split('.')[0];
      const resp = await fetch(`https://${projectRef}.functions.supabase.co/order-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'receipt', email, order_id: order.id })
      });
      if (!resp.ok) throw new Error('No se pudo enviar el correo');
      (window as any).toast?.success('Recibo enviado a tu correo');
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo enviar el correo');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data }, { data: ship }] = await Promise.all([
        supabase
        .from('orders')
        .select(`id,total,estado,created_at,comprador_id,invoice_number,
          order_items(id,cantidad,precio_unitario,subtotal,producto_nombre,producto_imagen_url),
          users!orders_comprador_id_fkey(email)
        `)
        .eq('id', id)
        .maybeSingle(),
        supabase.from('order_shipping').select('*').eq('order_id', id).maybeSingle()
      ]);
      setOrder(data); setShipping(ship);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="container py-8">
      <div className="flex items-center justify-center">
        <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-8 h-8 animate-spin" />
      </div>
    </div>
  );
  if (!order) return <div className="container py-8">Pedido no encontrado</div>;

  const created = new Date(order.created_at);
  const items = order.order_items || [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-lg flex items-center gap-3">
            <Icon category="Carrito y checkout" name="TablerDownload" className="w-8 h-8" />
            Recibo de compra
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Icon category="Estados y Feedback" name="IconoirWarningSquare" className="w-4 h-4" />
            Pedido {order.invoice_number || ('#'+String(order.id).slice(0,8))} · {created.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/pedido/${order.id}`} className="btn btn-primary flex items-center gap-2">
            <Icon category="Catálogo y producto" name="LineMdSearch" className="w-4 h-4" />
            Ver detalle
          </Link>
          <button onClick={downloadPdf} className="btn btn-secondary flex items-center gap-2">
            <Icon category="Carrito y checkout" name="TablerDownload" className="w-4 h-4" />
            Descargar PDF
          </button>
          <button onClick={() => window.print()} className="btn btn-outline flex items-center gap-2">
            <Icon category="Archivos e imagenes" name="StreamlineInterfaceDownloadButton2ArrowBottomDownDownloadInternetNetworkServerUpload" className="w-4 h-4" />
            Imprimir
          </button>
          <button onClick={resendEmail} disabled={sending} className="btn btn-outline flex items-center gap-2">
            <Icon category="Autenticacion" name="MdiMail" className="w-4 h-4" />
            {sending ? 'Enviando…' : 'Reenviar correo'}
          </button>
        </div>
      </div>

      <div ref={receiptRef} id="receiptRoot" className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3">
        <div className="lg:col-span-2 card card-hover">
          <div className="card-body">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Icon category="Navegación principal" name="FaSolidStore" className="w-6 h-6" />
                  Tesoros Chocó
                </h2>
                <p className="text-sm text-gray-500">Recibo electrónico</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500 flex items-center gap-1">
                  <Icon category="Pedidos" name="CarbonPendingFilled" className="w-3 h-3" />
                  Estado
                </p>
                <p className="font-semibold capitalize">{order.estado}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon category="Catálogo y producto" name="BxsPackage" className="w-5 h-5" />
                Productos
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Producto</th>
                    <th className="py-2 pr-4">Cantidad</th>
                    <th className="py-2 pr-4">Unitario</th>
                    <th className="py-2 pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any) => (
                    <tr key={it.id} className="border-b">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {it.producto_imagen_url && (
                            <img src={it.producto_imagen_url} alt={it.producto_nombre} className="w-10 h-10 object-cover rounded" />
                          )}
                          <span className="font-medium">{it.producto_nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{it.cantidad}</td>
                      <td className="py-3 pr-4">${Number(it.precio_unitario).toLocaleString()}</td>
                      <td className="py-3 pr-4 font-semibold">${Number(it.subtotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card card-hover h-max">
          <div className="card-body space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon category="Autenticacion" name="MdiMail" className="w-4 h-4" />
                Correo comprador
              </span>
              <span className="font-medium">{order.users?.email}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-600 flex items-center gap-2">
                <Icon category="Carrito y checkout" name="HugeiconsMapsLocation01" className="w-4 h-4" />
                Envío
              </div>
              {shipping ? (
                <div className="text-gray-800">
                  <div>{shipping.nombre}</div>
                  <div>{shipping.direccion}</div>
                  <div>{shipping.ciudad}</div>
                  <div>{shipping.telefono}</div>
                </div>
              ) : (
                <div className="text-gray-500">Sin información de envío</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon category="Catálogo y producto" name="BxsPackage" className="w-4 h-4" />
                Artículos
              </span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon category="Carrito y checkout" name="VaadinWallet" className="w-4 h-4" />
                Total
              </span>
              <span className="text-2xl font-bold text-(--color-terracotta-suave)">${Number(order.total).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Icon category="Estados y Feedback" name="TypcnInfoLarge" className="w-3 h-3" />
              Este es un comprobante electrónico generado para el flujo educativo. Conserva este número de pedido para consultas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptPage;


