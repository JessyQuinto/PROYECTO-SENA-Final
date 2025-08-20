import React from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import Icon from '@/components/ui/Icon';

const CartPage: React.FC = () => {
  const { items, total, update, remove, clear } = useCart();
  const navigate = useNavigate();

  const checkout = async () => {
    if (items.length === 0) return;
    try {
      const payload = items.map(i => ({ producto_id: i.productoId, cantidad: i.cantidad }));
      const { data, error } = await supabase.rpc('crear_pedido', { items: payload });
      if (error) throw error;
      // Simular pasarela de pago (éxito)
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
      if (backendUrl) {
        const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/payments/simulate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data, approved: true })
        });
        if (!resp.ok) {
          let msg = 'Error simulando pago';
          try { const j = await resp.json(); msg = j?.error || msg; } catch {}
          throw new Error(msg);
        }
      }
      clear();
      alert('Compra realizada. Pedido: ' + data);
    } catch (e: any) {
      alert(e?.message || 'No se pudo crear el pedido');
    }
  };

  return (
    <div className="container py-8">
      <h1 className="heading-lg mb-6 flex items-center gap-3">
        <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-8 h-8" />
        Tu Carrito
      </h1>
      {items.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tu carrito está vacío</p>
            <div className="mt-4">
              <Link to="/productos" className="btn btn-primary flex items-center gap-2 mx-auto">
                <Icon category="Catálogo y producto" name="LineMdSearch" className="w-4 h-4" />
                Explorar productos
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => (
              <Card key={i.productoId} className="card-hover">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-gray-100 overflow-hidden rounded">
                      {i.imagenUrl ? (
                        <img src={i.imagenUrl} alt={i.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Icon category="Catálogo y producto" name="MynauiImage" className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{i.nombre}</p>
                      <p className="text-sm text-gray-500">${i.precio.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center border rounded-lg">
                      <button aria-label="-" className="px-2 py-1 text-sm hover:bg-gray-50 flex items-center" onClick={()=>update(i.productoId, Math.max(1, i.cantidad-1))}>
                        <Icon category="Catálogo y producto" name="WhhArrowdown" className="w-3 h-3" />
                      </button>
                      <input type="number" className="w-16 text-center text-sm outline-none" min={1} max={i.stock ?? 9999} value={i.cantidad} onChange={(e)=>update(i.productoId, Math.max(1, Math.min(Number(e.target.value||1), i.stock ?? 9999)))} />
                      <button aria-label="+" className="px-2 py-1 text-sm hover:bg-gray-50 flex items-center" onClick={()=>update(i.productoId, Math.min(i.cantidad+1, i.stock ?? 9999))}>
                        <Icon category="Catálogo y producto" name="WhhArrowup" className="w-3 h-3" />
                      </button>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=>remove(i.productoId)} className="flex items-center gap-1">
                      <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-3 h-3" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card className="card-hover">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Icon category="Carrito y checkout" name="VaadinWallet" className="w-4 h-4" />
                    Total
                  </span>
                  <span className="text-2xl font-bold text-(--color-terracotta-suave)">${total.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">Impuestos incluidos donde aplique</div>
                <div className="grid grid-cols-1 gap-2">
                  <Button className="w-full flex items-center justify-center gap-2" onClick={() => navigate('/checkout')}>
                    <Icon category="Carrito y checkout" name="StreamlinePlumpPaymentRecieve7Solid" className="w-4 h-4" />
                    Ir al checkout
                  </Button>
                  <Link to="/productos" className="btn btn-outline text-center flex items-center justify-center gap-2">
                    <Icon category="Catálogo y producto" name="LineMdSearch" className="w-4 h-4" />
                    Seguir comprando
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;


