import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { z } from 'zod';
import VendorLayout from './VendorLayout';
import Icon from '@/components/ui/Icon';

interface VendorStats {
  totalProductos: number;
  productosActivos: number;
  totalPedidos: number;
  ventasDelMes: number;
}

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  estado: string;
  imagen_url?: string;
  created_at: string;
}

interface Order {
  id: string;
  total: number;
  estado: string;
  created_at: string;
  comprador_email?: string;
}

interface OrderItemRowUI {
  id: string;
  order_id: string;
  producto_nombre: string;
  cantidad: number;
  enviado: boolean;
  created_at?: string;
}

const productSchema = z.object({
  nombre: z.string().min(3, 'Nombre demasiado corto'),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive('Precio debe ser positivo'),
  stock: z.coerce.number().int().min(0, 'Stock inválido'),
  categoria_id: z.string().uuid('Categoría inválida').optional().or(z.literal('')),
  imagen_url: z.string().url().optional().nullable(),
});

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRowUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'add-product' | 'config'>('products');
  const location = useLocation();
  const [categories, setCategories] = useState<{ id: string; nombre: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ id?: string; nombre: string; descripcion: string; precio: string; stock: string; categoria_id: string; imagen_file?: File | null; imagen_url?: string | null }>(
    { nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', imagen_file: null, imagen_url: null }
  );
  // Historia del producto (guardado en app_config: product_story:<productId>)
  const [story, setStory] = useState<{ historia?: string; materiales?: string; tecnica?: string; origen?: string; cuidados?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [vendorSettings, setVendorSettings] = useState<{ bio?: string; hideOOS?: boolean; defaultProductStatus?: 'activo' | 'inactivo'; notifNewOrder?: boolean; notifItemShipped?: boolean; logoUrl?: string | null }>({});
  const [cfgBio, setCfgBio] = useState('');
  const [cfgHideOOS, setCfgHideOOS] = useState(false);
  const [cfgDefaultStatus, setCfgDefaultStatus] = useState<'activo'|'inactivo'>('activo');
  const [cfgNotifNewOrder, setCfgNotifNewOrder] = useState(true);
  const [cfgNotifItemShipped, setCfgNotifItemShipped] = useState(true);
  const [cfgLogoUploading, setCfgLogoUploading] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productStatus, setProductStatus] = useState<'all'|'activo'|'inactivo'>('all');
  const [orderStatus, setOrderStatus] = useState<'all'|'pendiente'|'procesando'|'enviado'|'entregado'|'cancelado'>('all');

  useEffect(() => {
    if (user?.id) {
      loadVendorData();
      loadVendorSettings();
    }
  }, [user]);

  const loadVendorSettings = async () => {
    if (!user?.id) return;
    try {
      const key = `vendor_settings:${user.id}`;
      const { data } = await supabase.from('app_config').select('value').eq('key', key).maybeSingle();
      const v = (data?.value as any) || {};
      setVendorSettings(v);
      setCfgBio(v.bio || '');
      setCfgHideOOS(!!v.hideOOS);
      setCfgDefaultStatus(v.defaultProductStatus === 'inactivo' ? 'inactivo' : 'activo');
      setCfgNotifNewOrder(v.notifNewOrder !== false);
      setCfgNotifItemShipped(v.notifItemShipped !== false);
    } catch {}
  };

  const saveVendorSettings = async () => {
    if (!user?.id) return;
    const key = `vendor_settings:${user.id}`;
    const value = {
      bio: cfgBio,
      hideOOS: cfgHideOOS,
      defaultProductStatus: cfgDefaultStatus,
      notifNewOrder: cfgNotifNewOrder,
      notifItemShipped: cfgNotifItemShipped,
      logoUrl: vendorSettings.logoUrl || null,
    };
    await supabase.from('app_config').upsert({ key, value });
    (window as any).toast?.success('Configuración guardada', { role: 'vendedor', action: 'update' });
    setVendorSettings(value);
  };

  const uploadVendorLogo = async (file: File) => {
    if (!user?.id) return;
    try {
      setCfgLogoUploading(true);
      const path = `${user.id}/vendor-profile/logo-${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      const logoUrl = data.publicUrl;
      setVendorSettings((prev) => ({ ...prev, logoUrl }));
      (window as any).toast?.success('Logo actualizado', { role: 'vendedor', action: 'update' });
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo subir el logo', { role: 'vendedor', action: 'update' });
    } finally {
      setCfgLogoUploading(false);
    }
  };

  // Sincronizar pestañas con hash (#products, #orders, #add, #config)
  useEffect(() => {
    const h = (location.hash || '').toLowerCase();
    if (h === '#products') setActiveTab('products');
    else if (h === '#orders') setActiveTab('orders');
    else if (h === '#add') setActiveTab('add-product');
    else if (h === '#config') setActiveTab('config');
  }, [location.hash]);

  const goTab = (tab: 'products' | 'orders' | 'add-product' | 'config') => {
    setActiveTab(tab);
    const hash = tab === 'products' ? '#products' : tab === 'orders' ? '#orders' : tab === 'add-product' ? '#add' : '#config';
    try { window.location.hash = hash; } catch {}
  };

  const loadVendorData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Cargar productos del vendedor
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('vendedor_id', user.id);

      if (productosError) throw productosError;

      // Cargar pedidos del vendedor (items + orders + comprador)
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('order_items')
        .select(`
          id, cantidad, subtotal, enviado, created_at, order_id,
          orders!inner(id, total, estado, created_at, comprador_id),
          users!orders_comprador_id_fkey(email),
          producto_nombre
        `)
        .eq('vendedor_id', user.id);

      if (pedidosError) throw pedidosError;

      // Categorías
      const { data: catData } = await supabase.from('categorias').select('id,nombre').order('nombre');
      setCategories(catData || []);

      // KPIs del mes por RPC
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: kpiRows } = await supabase.rpc('kpi_mes_vendedor', { inicio: startOfMonth.toISOString() });
      const kpi = (kpiRows as any[])?.[0] || { total_ventas: 0, pedidos: 0 };

      if (productosData) {
        setProducts(productosData);
        const productosActivos = productosData.filter(p => p.estado === 'activo');
        
        setStats({
          totalProductos: productosData.length,
          productosActivos: productosActivos.length,
          totalPedidos: Number(kpi.pedidos || 0),
          ventasDelMes: Number(kpi.total_ventas || 0)
        });
      }

      if (pedidosData) {
        // Procesar pedidos agrupados
        const processedOrders = pedidosData.reduce((acc: Order[], item: any) => {
          const existingOrder = acc.find(o => o.id === item.orders.id);
          if (!existingOrder) {
            acc.push({
              id: item.orders.id,
              total: item.orders.total,
              estado: item.orders.estado,
              created_at: item.orders.created_at,
              comprador_email: item.users?.email
            });
          }
          return acc;
        }, []);
        
        setOrders(processedOrders);

        // Items (para marcar enviados)
        const items: OrderItemRowUI[] = (pedidosData as any[]).map((it: any) => ({
          id: it.id,
          order_id: it.order_id,
          producto_nombre: it.producto_nombre,
          cantidad: it.cantidad,
          enviado: !!it.enviado,
          created_at: it.created_at,
        }));
        setOrderItems(items);

        // KPIs ya aplicados por RPC arriba
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado: newStatus })
        .eq('id', productId);

      if (error) throw error;

      // Actualizar la lista local
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, estado: newStatus } : p
      ));

      // Actualizar estadísticas
      setStats(prev => {
        if (!prev) return null;
        const activeChange = newStatus === 'activo' ? 1 : -1;
        return {
          ...prev,
          productosActivos: prev.productosActivos + activeChange
        };
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Error al actualizar el estado del producto');
    }
  };

  const archiveProduct = async (productId: string, archivado: boolean) => {
    try {
      const { error } = await supabase.from('productos').update({ archivado }).eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => (archivado ? p.id !== productId : true)));
      (window as any).toast?.success(archivado ? 'Producto archivado' : 'Producto restaurado', { role: 'vendedor', action: 'update' });
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo archivar/restaurar', { role: 'vendedor', action: 'update' });
    }
  };

  const resetForm = () => { setForm({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', imagen_file: null, imagen_url: null, id: undefined }); setStory({}); };

  const uploadImageIfNeeded = async (): Promise<string | undefined> => {
    if (!form.imagen_file) return form.imagen_url || undefined;
    const file = form.imagen_file;
    const fileName = `${user!.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (upErr) { throw upErr; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.id) return;
    setSaving(true);
    try {
      const imageUrl = await uploadImageIfNeeded();
      const parsed = productSchema.safeParse({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precio: form.precio,
        stock: form.stock,
        categoria_id: parsed.data.categoria_id || undefined,
        imagen_url: imageUrl,
      });
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message || 'Datos inválidos');
        setSaving(false);
        return;
      }
      if (form.id) {
        const { error: updErr } = await supabase.from('productos').update({
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion || null,
          precio: parsed.data.precio,
          stock: parsed.data.stock,
          categoria_id: parsed.data.categoria_id || null,
          imagen_url: parsed.data.imagen_url || null,
        }).eq('id', form.id);
        if (updErr) throw updErr;
        // Guardar historia en app_config
        const storyKey = `product_story:${form.id}`;
        await supabase.from('app_config').upsert({ key: storyKey, value: {
          historia: (story.historia || '').trim() || null,
          materiales: (story.materiales || '').trim() || null,
          tecnica: (story.tecnica || '').trim() || null,
          origen: (story.origen || '').trim() || null,
          cuidados: (story.cuidados || '').trim() || null,
        }});
        (window as any).toast?.success('Producto actualizado', { role: 'vendedor', action: 'update' });
      } else {
        const { error: insErr } = await supabase.from('productos').insert({
          vendedor_id: user.id,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion || null,
          precio: parsed.data.precio,
          stock: parsed.data.stock,
          categoria_id: parsed.data.categoria_id || null,
          imagen_url: parsed.data.imagen_url || null,
          estado: 'activo'
        });
        if (insErr) throw insErr;
        (window as any).toast?.success('Producto creado', { role: 'vendedor', action: 'sale' });
      }
      await loadVendorData();
      resetForm();
      setActiveTab('products');
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el producto');
      (window as any).toast?.error(e?.message || 'No se pudo guardar el producto', { role: 'vendedor', action: 'update' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Product) => {
    setActiveTab('add-product');
    setForm({
      id: p.id,
      nombre: p.nombre,
      descripcion: '',
      precio: String(p.precio),
      stock: String(p.stock),
      categoria_id: '',
      imagen_file: null,
      imagen_url: p.imagen_url || null,
    });
    // Cargar historia
    (async () => {
      try {
        const key = `product_story:${p.id}`;
        const { data } = await supabase.from('app_config').select('value').eq('key', key).maybeSingle();
        setStory((data?.value as any) || {});
      } catch { setStory({}); }
    })();
  };

  const markItemSent = async (orderItemId: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
      if (!backendUrl || !token) throw new Error('Backend no configurado');
      const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/order-items/${orderItemId}/shipped`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || 'No se pudo marcar enviado');
      setOrderItems(prev => prev.map(it => it.id === orderItemId ? { ...it, enviado: true } : it));
      await loadVendorData();
      // Notificar envío al comprador (email "va en camino")
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        if (supaUrl && token) {
          const order = orderItems.find(o => o.id === orderItemId);
          // Buscar email comprador desde orders en memoria
          const anyOrder = orders.find(o => o.id === order?.order_id);
          const email = anyOrder?.comprador_email;
          if (email) {
            const projectRef = new URL(supaUrl).host.split('.')[0];
            await fetch(`https://${projectRef}.functions.supabase.co/order-emails`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ action: 'shipped', email, order_id: order?.order_id })
            });
          }
        }
      } catch {}
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo marcar enviado', { role: 'vendedor', action: 'ship' });
    }
  };

  if (user?.role !== 'vendedor') {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Solo los vendedores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (user.vendedor_estado !== 'aprobado') {
    return (
      <div className="container py-8">
        <div className="card max-w-2xl mx-auto">
          <div className="card-body text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta Pendiente de Aprobación</h1>
              <p className="text-gray-600 mb-4">
                Tu cuenta de vendedor está siendo revisada por nuestro equipo. Recibirás una notificación 
                por correo electrónico una vez que tu cuenta sea aprobada.
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Estado: {user.vendedor_estado}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <VendorLayout title="Panel de Vendedor" subtitle="Gestiona tus productos y ventas">

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Icon category="Catálogo y producto" name="BxsPackage" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProductos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Icon category="Catálogo y producto" name="LucideTags" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.productosActivos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Icon category="Pedidos" name="MaterialSymbolsOrdersOutlineRounded" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPedidos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                  <Icon category="Carrito y checkout" name="VaadinWallet" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.ventasDelMes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => goTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon category="Catálogo y producto" name="BxsPackage" className="w-4 h-4" />
              Mis Productos
            </button>
            <button
              onClick={() => goTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon category="Pedidos" name="MaterialSymbolsOrdersOutlineRounded" className="w-4 h-4" />
              Pedidos
            </button>
            <button
              onClick={() => goTab('add-product')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'add-product'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon category="Vendedor" name="LucideCircleFadingPlus" className="w-4 h-4" />
              Agregar Producto
            </button>
            <button
              onClick={() => goTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'config'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon category="Usuario" name="RivetIconsSettings" className="w-4 h-4" />
              Configuración
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes productos</h3>
              <p className="text-gray-500 mb-4">Comienza agregando tu primer producto.</p>
              <button
                onClick={() => setActiveTab('add-product')}
                className="btn btn-primary"
              >
                Agregar Producto
              </button>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="card card-hover">
                {product.imagen_url && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={product.imagen_url}
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.nombre}</h3>
                    <span className={`badge ${
                      product.estado === 'activo' ? 'badge-success' : 'badge-secondary'
                    }`}>
                      {product.estado}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary-600 mb-2">${product.precio}</p>
                  <p className="text-sm text-gray-500 mb-4">Stock: {product.stock} unidades</p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.estado)}
                      className={`btn-sm flex items-center gap-1 ${
                        product.estado === 'activo' ? 'btn-secondary' : 'btn-accent'
                      }`}
                    >
                      {product.estado === 'activo' ? (
                        <>
                          <Icon category="Estados y Feedback" name="IconParkOutlineSuccess" className="w-3 h-3" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-3 h-3" />
                          Activar
                        </>
                      )}
                    </button>
                    <button className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => startEdit(product)}>
                      <Icon category="Vendedor" name="FaSolidEdit" className="w-3 h-3" />
                      Editar
                    </button>
                    <button className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => archiveProduct(product.id, true)}>
                      <Icon category="Vendedor" name="LineMdTrash" className="w-3 h-3" />
                      Archivar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
            </div>
            <div className="card-body">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tienes pedidos aún</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Pedido</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-sm">{order.comprador_email}</td>
                          <td className="py-3 px-4 text-sm font-medium">${order.total}</td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              order.estado === 'entregado' ? 'badge-success' :
                              order.estado === 'enviado' ? 'badge-primary' :
                              order.estado === 'procesando' ? 'badge-warning' :
                              'badge-secondary'
                            }`}>
                              {order.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Ítems pendientes de envío</h2>
            </div>
            <div className="card-body">
              {orderItems.filter(it => !it.enviado).length === 0 ? (
                <p className="text-gray-500">No tienes ítems pendientes</p>
              ) : (
                <div className="space-y-2">
                  {orderItems.filter(it => !it.enviado).map((it) => (
                    <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{it.producto_nombre} <span className="text-sm text-gray-500">x{it.cantidad}</span></p>
                        <p className="text-xs text-gray-500">Pedido #{it.order_id.slice(0,8)}</p>
                      </div>
                      <button className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => markItemSent(it.id)}>
                        <Icon category="Pedidos" name="HugeiconsDeliveredSent" className="w-3 h-3" />
                        Marcar enviado
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'add-product' && (
        <div className="card max-w-2xl">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
          </div>
          <div className="card-body">
            {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
            <form className="space-y-6" onSubmit={handleCreateOrUpdate}>
              <div className="form-group">
                <label className="form-label">Nombre del producto</label>
                <input type="text" className="form-input" placeholder="Ej: Collar artesanal chocoano" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" placeholder="Describe tu producto..." value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.precio} onChange={(e) => setForm(f => ({ ...f, precio: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input type="number" className="form-input" placeholder="0" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.categoria_id} onChange={(e) => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                  <option value="">Seleccionar categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Imagen del producto</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <input type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, imagen_file: e.target.files?.[0] || null }))} />
                  {form.imagen_url && (
                    <div className="mt-3">
                      <img src={form.imagen_url} alt="preview" className="w-full max-h-40 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>

              {/* Historia del producto (solo disponible al editar un producto existente) */}
              {form.id && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Historia y detalles para conectar con el comprador</h3>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Historia (breve relato)</label>
                      <textarea className="form-textarea" placeholder="¿Qué inspira esta pieza? ¿Quién la hizo? ¿Qué la hace única?" value={story.historia || ''} onChange={(e)=>setStory(s=>({ ...s, historia: e.target.value }))}></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Materiales (separados por coma)</label>
                        <input type="text" className="form-input" placeholder="Iraca, Madera, Tagua" value={story.materiales || ''} onChange={(e)=>setStory(s=>({ ...s, materiales: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Técnica (separadas por coma)</label>
                        <input type="text" className="form-input" placeholder="Tejido, Tallado, Teñido natural" value={story.tecnica || ''} onChange={(e)=>setStory(s=>({ ...s, tecnica: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Origen / Comunidad</label>
                        <input type="text" className="form-input" placeholder="Istmina, Medio San Juan, Comunidad Emberá..." value={story.origen || ''} onChange={(e)=>setStory(s=>({ ...s, origen: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cuidados</label>
                        <input type="text" className="form-input" placeholder="Evitar humedad, limpiar con paño seco..." value={story.cuidados || ''} onChange={(e)=>setStory(s=>({ ...s, cuidados: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                  {saving ? (
                    <>
                      <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Icon category="Vendedor" name="LucideCircleFadingPlus" className="w-4 h-4" />
                      Guardar Producto
                    </>
                  )}
                </button>
                <button type="button" className="btn btn-outline flex items-center gap-2" onClick={() => { resetForm(); setActiveTab('products'); }}>
                  <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="card max-w-2xl">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
          </div>
          <div className="card-body space-y-6">
            <div>
              <h3 className="font-medium mb-2">Perfil del vendedor</h3>
              <div className="space-y-3">
                <label className="form-label">Biografía</label>
                <textarea className="form-textarea" value={cfgBio} onChange={(e)=>setCfgBio(e.target.value)} placeholder="Cuenta tu historia, técnicas, materiales y territorio..."></textarea>
                <div>
                  <label className="form-label">Logo / Imagen</label>
                  <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadVendorLogo(f); }} disabled={cfgLogoUploading} />
                  {vendorSettings.logoUrl && (
                    <div className="mt-2">
                      <img src={vendorSettings.logoUrl} alt="logo" className="w-24 h-24 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Preferencias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Estado por defecto al crear producto</label>
                  <select className="form-select" value={cfgDefaultStatus} onChange={(e)=>setCfgDefaultStatus(e.target.value as any)}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={cfgHideOOS} onChange={(e)=>setCfgHideOOS(e.target.checked)} />
                  Ocultar productos sin stock
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Notificaciones</h3>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={cfgNotifNewOrder} onChange={(e)=>setCfgNotifNewOrder(e.target.checked)} />
                Correo cuando ingrese un pedido nuevo
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={cfgNotifItemShipped} onChange={(e)=>setCfgNotifItemShipped(e.target.checked)} />
                Correo cuando un ítem se marque enviado
              </label>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary flex items-center gap-2" onClick={saveVendorSettings}>
                <Icon category="Estados y Feedback" name="IconParkSolidSuccess" className="w-4 h-4" />
                Guardar cambios
              </button>
              <button
                className="btn btn-danger ml-auto flex items-center gap-2"
                onClick={async () => {
                  if (!confirm('¿Eliminar tu cuenta? Esta acción es irreversible.')) return;
                  try {
                    const session = (await supabase.auth.getSession()).data.session;
                    const token = session?.access_token;
                    const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
                    if (supaUrl && token) {
                      const projectRef = new URL(supaUrl).host.split('.')[0];
                      const resp = await fetch(`https://${projectRef}.functions.supabase.co/self-account`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                      });
                      const j = await resp.json();
                      if (!resp.ok) throw new Error(j?.error || 'No se pudo eliminar');
                      (window as any).toast?.success('Cuenta eliminada', { action: 'delete' });
                      await supabase.auth.signOut();
                      window.location.href = '/';
                    }
                  } catch (e: any) {
                    (window as any).toast?.error(e?.message || 'No se pudo eliminar la cuenta', { action: 'delete' });
                  }
                }}
              >
                <Icon category="Estados y Feedback" name="BxErrorCircle" className="w-4 h-4" />
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorDashboard;
