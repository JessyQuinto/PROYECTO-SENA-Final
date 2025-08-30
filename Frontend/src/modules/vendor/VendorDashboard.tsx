import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToastWithAuth } from '@/hooks/useToast';
import VendorLayout from './VendorLayout';
import { VendorStatusBanner } from '@/components/vendor/VendorStatusBanner';
import { VendorStatusNotification } from '@/components/vendor/VendorStatusNotification';
import { useVendorStatusListener } from '@/hooks/useVendorStatusListener';
import Icon from '@/components/ui/Icon';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  estado: 'activo' | 'inactivo' | 'bloqueado';
  imagen_url?: string;
  created_at: string;
}

interface Order {
  id: string;
  total: number;
  estado: string;
  created_at: string;
  order_items: Array<{
    id: string;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    enviado: boolean;
  }>;
}

interface VendorStats {
  totalProductos: number;
  productosActivos: number;
  totalVentas: number;
  pedidosPendientes: number;
}

const VendorDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'products' | 'orders' | 'add' | 'config'>('dashboard');
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria_id: '',
  });
  const [categories, setCategories] = useState<Array<{ id: string; nombre: string }>>([]);
  const [saving, setSaving] = useState(false);
  const { success: toastSuccess, error: toastError } = useToastWithAuth();

  // Hook para escuchar cambios de estado de vendedor
  useVendorStatusListener();

  useEffect(() => {
    loadDashboardData();
    loadCategories();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar productos del vendedor
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Cargar pedidos del vendedor
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          estado,
          created_at,
          order_items!inner(
            id,
            producto_nombre,
            cantidad,
            precio_unitario,
            enviado,
            vendedor_id
          )
        `)
        .eq('order_items.vendedor_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setProducts(productsData || []);
      setOrders(ordersData || []);

      // Calcular estadísticas
      const productosActivos = (productsData || []).filter(p => p.estado === 'activo').length;
      const totalVentas = (ordersData || []).reduce((sum, order) => sum + Number(order.total), 0);
      const pedidosPendientes = (ordersData || []).filter(o => o.estado === 'pendiente').length;

      setStats({
        totalProductos: (productsData || []).length,
        productosActivos,
        totalVentas,
        pedidosPendientes,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toastError('Error al cargar datos del dashboard', {
        role: 'vendedor',
        action: 'update',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createProduct = async () => {
    if (!newProduct.nombre || !newProduct.precio || !newProduct.stock) {
      toastError('Completa todos los campos obligatorios', {
        role: 'vendedor',
        action: 'update',
      });
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: newProduct.nombre,
          descripcion: newProduct.descripcion || null,
          precio: Number(newProduct.precio),
          stock: Number(newProduct.stock),
          categoria_id: newProduct.categoria_id || null,
          estado: 'activo',
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      setNewProduct({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria_id: '',
      });

      toastSuccess('Producto creado exitosamente', {
        role: 'vendedor',
        action: 'update',
      });

      setActiveSection('products');
    } catch (error) {
      console.error('Error creating product:', error);
      toastError('Error al crear producto', {
        role: 'vendedor',
        action: 'update',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProductStatus = async (productId: string, estado: 'activo' | 'inactivo') => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, estado } : p))
      );

      toastSuccess(`Producto ${estado}`, {
        role: 'vendedor',
        action: 'update',
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toastError('Error al actualizar producto', {
        role: 'vendedor',
        action: 'update',
      });
    }
  };

  const markAsShipped = async (orderItemId: string) => {
    try {
      const { error } = await supabase.rpc('marcar_item_enviado', {
        p_order_item_id: orderItemId,
      });

      if (error) throw error;

      // Actualizar estado local
      setOrders(prev =>
        prev.map(order => ({
          ...order,
          order_items: order.order_items.map(item =>
            item.id === orderItemId ? { ...item, enviado: true } : item
          ),
        }))
      );

      toastSuccess('Producto marcado como enviado', {
        role: 'vendedor',
        action: 'ship',
      });
    } catch (error) {
      console.error('Error marking as shipped:', error);
      toastError('Error al marcar como enviado', {
        role: 'vendedor',
        action: 'ship',
      });
    }
  };

  const renderDashboard = () => (
    <div className='space-y-6'>
      <VendorStatusBanner />

      {/* Estadísticas */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center'>
              <div className='p-3 rounded-lg bg-blue-100 text-blue-600'>
                <Icon
                  category='Catálogo y producto'
                  name='BxsPackage'
                  className='w-6 h-6'
                />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Total Productos
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.totalProductos}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center'>
              <div className='p-3 rounded-lg bg-green-100 text-green-600'>
                <Icon
                  category='Estados y Feedback'
                  name='IconParkSolidSuccess'
                  className='w-6 h-6'
                />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Productos Activos
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.productosActivos}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center'>
              <div className='p-3 rounded-lg bg-purple-100 text-purple-600'>
                <Icon
                  category='Carrito y checkout'
                  name='VaadinWallet'
                  className='w-6 h-6'
                />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Total Ventas
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${stats.totalVentas.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center'>
              <div className='p-3 rounded-lg bg-yellow-100 text-yellow-600'>
                <Icon
                  category='Pedidos'
                  name='CarbonPendingFilled'
                  className='w-6 h-6'
                />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Pedidos Pendientes
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.pedidosPendientes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de actividad reciente */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold mb-4'>Productos Recientes</h3>
          {products.slice(0, 5).map(product => (
            <div key={product.id} className='flex items-center justify-between py-2 border-b last:border-b-0'>
              <div>
                <p className='font-medium'>{product.nombre}</p>
                <p className='text-sm text-gray-500'>${product.precio}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.estado === 'activo' ? 'bg-green-100 text-green-800' :
                product.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {product.estado}
              </span>
            </div>
          ))}
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold mb-4'>Pedidos Recientes</h3>
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className='flex items-center justify-between py-2 border-b last:border-b-0'>
              <div>
                <p className='font-medium'>#{order.id.slice(0, 8)}</p>
                <p className='text-sm text-gray-500'>${Number(order.total).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                order.estado === 'enviado' ? 'bg-blue-100 text-blue-800' :
                order.estado === 'procesando' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Mis Productos</h2>
        <button
          onClick={() => setActiveSection('add')}
          className='bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2'
        >
          <Icon
            category='Vendedor'
            name='LucideCircleFadingPlus'
            className='w-4 h-4'
          />
          Agregar Producto
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {products.map(product => (
          <div key={product.id} className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <div className='aspect-square bg-gray-100 flex items-center justify-center'>
              {product.imagen_url ? (
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  className='w-full h-full object-cover'
                />
              ) : (
                <Icon
                  category='Catálogo y producto'
                  name='MynauiImage'
                  className='w-12 h-12 text-gray-400'
                />
              )}
            </div>
            <div className='p-4'>
              <h3 className='font-semibold mb-2'>{product.nombre}</h3>
              <div className='flex items-center justify-between mb-3'>
                <span className='text-lg font-bold text-primary'>
                  ${product.precio.toLocaleString()}
                </span>
                <span className='text-sm text-gray-500'>
                  Stock: {product.stock}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.estado === 'activo' ? 'bg-green-100 text-green-800' :
                  product.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.estado}
                </span>
                <div className='flex gap-2'>
                  {product.estado === 'activo' ? (
                    <button
                      onClick={() => updateProductStatus(product.id, 'inactivo')}
                      className='text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors'
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => updateProductStatus(product.id, 'activo')}
                      className='text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors'
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Pedidos</h2>
      
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Pedido
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Productos
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Total
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Estado
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='space-y-1'>
                      {order.order_items.map(item => (
                        <div key={item.id} className='text-sm'>
                          <span className='font-medium'>{item.producto_nombre}</span>
                          <span className='text-gray-500 ml-2'>x{item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>
                      ${Number(order.total).toLocaleString()}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                      order.estado === 'enviado' ? 'bg-blue-100 text-blue-800' :
                      order.estado === 'procesando' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.estado}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='space-y-2'>
                      {order.order_items.map(item => (
                        <div key={item.id} className='flex items-center gap-2'>
                          <span className='text-xs text-gray-500 truncate max-w-24'>
                            {item.producto_nombre}
                          </span>
                          {!item.enviado && order.estado === 'procesando' && (
                            <button
                              onClick={() => markAsShipped(item.id)}
                              className='text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors'
                            >
                              Marcar enviado
                            </button>
                          )}
                          {item.enviado && (
                            <span className='text-xs px-2 py-1 bg-green-100 text-green-800 rounded'>
                              Enviado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAddProduct = () => (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Agregar Nuevo Producto</h2>
      
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nombre del producto *
              </label>
              <input
                type='text'
                value={newProduct.nombre}
                onChange={e => setNewProduct(prev => ({ ...prev, nombre: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary'
                placeholder='Ej: Canasta tejida a mano'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Descripción
              </label>
              <textarea
                value={newProduct.descripcion}
                onChange={e => setNewProduct(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary'
                placeholder='Describe tu producto, materiales y técnicas utilizadas...'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Categoría
              </label>
              <select
                value={newProduct.categoria_id}
                onChange={e => setNewProduct(prev => ({ ...prev, categoria_id: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary'
              >
                <option value=''>Seleccionar categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Precio *
              </label>
              <input
                type='number'
                value={newProduct.precio}
                onChange={e => setNewProduct(prev => ({ ...prev, precio: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary'
                placeholder='0'
                min='0'
                step='0.01'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Stock *
              </label>
              <input
                type='number'
                value={newProduct.stock}
                onChange={e => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary'
                placeholder='0'
                min='0'
                step='1'
              />
            </div>

            <div className='pt-4'>
              <button
                onClick={createProduct}
                disabled={saving}
                className='w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {saving ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icon
                      category='Estados y Feedback'
                      name='IconParkSolidSuccess'
                      className='w-4 h-4'
                    />
                    Crear Producto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Configuración</h2>
      
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <p className='text-gray-600'>
          Configuración del vendedor próximamente disponible.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <VendorLayout title='Panel de Vendedor' subtitle='Cargando...'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <>
      <VendorLayout
        title='Panel de Vendedor'
        subtitle='Gestiona tus productos y ventas'
      >
        {/* Navigation tabs */}
        <div className='mb-6 border-b border-gray-200'>
          <nav className='flex space-x-8'>
            {[
              { key: 'dashboard', label: 'Dashboard', icon: 'MdiHome' },
              { key: 'products', label: 'Productos', icon: 'BxsPackage' },
              { key: 'orders', label: 'Pedidos', icon: 'MaterialSymbolsOrdersOutlineRounded' },
              { key: 'add', label: 'Agregar', icon: 'LucideCircleFadingPlus' },
              { key: 'config', label: 'Configuración', icon: 'RivetIconsSettings' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeSection === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  category={tab.key === 'dashboard' ? 'Navegación principal' : 
                           tab.key === 'products' ? 'Catálogo y producto' :
                           tab.key === 'orders' ? 'Pedidos' :
                           tab.key === 'add' ? 'Vendedor' : 'Usuario'}
                  name={tab.icon}
                  className='w-4 h-4'
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active section */}
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'products' && renderProducts()}
        {activeSection === 'orders' && renderOrders()}
        {activeSection === 'add' && renderAddProduct()}
        {activeSection === 'config' && renderConfig()}
      </VendorLayout>

      {/* Notificaciones de estado */}
      <VendorStatusNotification />
    </>
  );
};

export default VendorDashboard;