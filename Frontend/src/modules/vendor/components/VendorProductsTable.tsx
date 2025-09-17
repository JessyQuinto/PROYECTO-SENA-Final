import React from 'react';
import Icon from '@/components/ui/Icon';
import type { Product } from './types';

interface Props {
  products: Product[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onEdit: (p: Product) => void;
  onToggleStatus: (id: string, estado: string) => void;
  onArchive: (id: string, archivado: boolean) => void;
  onDelete: (p: Product) => void;
  onAddClick: () => void;
}

export const VendorProductsTable: React.FC<Props> = ({
  products,
  expandedId,
  setExpandedId,
  onEdit,
  onToggleStatus,
  onArchive,
  onDelete,
  onAddClick,
}) => {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Mis Productos</h2>
        <button className="btn btn-primary flex items-center gap-2" onClick={onAddClick}>
          <Icon category="Vendedor" name="LucideCircleFadingPlus" className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>
      <div className="card-body">
        {products.length === 0 ? (
          <p className="text-gray-500">No tienes productos aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((p) => {
                  const productRating = Math.floor(Math.random() * 2) + 3; // mock 3-5
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 rounded-md object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <Icon category="Catálogo y producto" name="MynauiImage" className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${'{'}Number(p.precio).toLocaleString(){'}'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className={p.stock <= 5 ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800' : 'text-sm text-gray-900'}>
                            {p.stock <= 5 && (
                              <Icon category="Estados y Feedback" name="MdiAlertCircle" className="w-3 h-3 mr-1" />
                            )}
                            {p.stock} unidad{p.stock !== 1 ? 'es' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.estado === 'activo' ? 'bg-green-100 text-green-800' : p.estado === 'inactivo' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                            {p.estado === 'activo' ? 'Activo' : p.estado === 'inactivo' ? 'Inactivo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Icon category="Catálogo y producto" name="MdiStar" className="w-4 h-4 text-yellow-400" />
                            <span className="ml-1">{productRating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} aria-expanded={expandedId === p.id} aria-controls={`product-details-${p.id}`}>
                            {expandedId === p.id ? 'Ocultar detalles' : 'Ver detalles'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === p.id && (
                        <tr>
                          <td colSpan={6} className="px-4 pb-4" id={`product-details-${p.id}`}>
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  {p.imagen_url ? (
                                    <img src={p.imagen_url} alt={p.nombre} className="w-16 h-16 rounded-md object-cover" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center">
                                      <Icon category="Catálogo y producto" name="MynauiImage" className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">{p.nombre}</p>
                                    {p.descripcion && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{p.descripcion}</p>}
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                      <span>Precio: <span className="font-medium">${'{'}Number(p.precio).toLocaleString(){'}'}</span></span>
                                      <span>•</span>
                                      <span>Stock: <span className="font-medium">{p.stock}</span></span>
                                      <span>•</span>
                                      <span>Estado: <span className="font-medium capitalize">{p.estado}</span></span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={() => onEdit(p)} className="btn btn-outline btn-sm flex items-center gap-1" aria-label="Editar producto" title="Editar producto">
                                    <Icon category="Estados y Feedback" name="MdiPencil" className="w-4 h-4" />
                                    <span>Editar</span>
                                  </button>
                                  <button type="button" onClick={() => onToggleStatus(p.id, p.estado)} className={`btn btn-outline btn-sm flex items-center gap-1 ${p.estado === 'activo' ? 'text-orange-700 hover:text-orange-900 border-orange-300 hover:border-orange-400' : 'text-green-700 hover:text-green-900 border-green-300 hover:border-green-400'}`} aria-label={p.estado === 'activo' ? 'Desactivar producto' : 'Activar producto'} title={p.estado === 'activo' ? 'Desactivar producto' : 'Activar producto'}>
                                    <Icon category="Estados y Feedback" name={p.estado === 'activo' ? 'MdiPause' : 'MdiPlay'} className="w-4 h-4" />
                                    <span>{p.estado === 'activo' ? 'Desactivar' : 'Activar'}</span>
                                  </button>
                                  <button type="button" onClick={() => onArchive(p.id, true)} className="btn btn-outline btn-sm flex items-center gap-1 text-red-700 hover:text-red-900 border-red-300 hover:border-red-400" aria-label="Archivar producto" title="Archivar producto">
                                    <Icon category="Estados y Feedback" name="MdiArchive" className="w-4 h-4" />
                                    <span>Archivar</span>
                                  </button>
                                  <button type="button" onClick={() => onDelete(p)} className="btn btn-danger btn-sm flex items-center gap-1" aria-label="Eliminar producto" title="Eliminar producto">
                                    <Icon category="Vendedor" name="LineMdTrash" className="w-4 h-4" />
                                    <span>Eliminar</span>
                                  </button>
                                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>
                                    Cerrar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProductsTable;
