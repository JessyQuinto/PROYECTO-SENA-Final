import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useCart } from '@/modules/buyer/CartContext';
import { Button } from '@/components/ui/shadcn/button';
import Icon from '@/components/ui/Icon';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { items, total, remove, update } = useCart();
  const cartCount = items.reduce((sum, i) => sum + (i.cantidad || 0), 0);
  const [showCart, setShowCart] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', label: 'Inicio', public: true },
    { path: '/productos', label: 'Productos', public: true },
    { path: '/perfil', label: 'Mi perfil', roles: ['comprador'] },
    { 
      path: '/vendedor', 
      label: 'Panel Vendedor', 
      roles: ['vendedor'],
      requireApproval: true 
    },
    { 
      path: '/admin', 
      label: 'Administración', 
      roles: ['admin'] 
    },
  ];

  const visibleNavItems = navigationItems.filter(item => {
    if (item.public) return true;
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role || '')) return false;
    if (item.requireApproval && user.role === 'vendedor' && user.vendedor_estado !== 'aprobado') return false;
    return true;
  });

  const userInitial = useMemo(() => {
    if (!user?.email) return 'U';
    const c = user.email.trim()[0]?.toUpperCase();
    return /[A-Z]/.test(c) ? c : 'U';
  }, [user?.email]);

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b shadow-sm relative">
        {/* Decorative tribal pattern background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 pointer-events-none z-0"
          style={{
            backgroundImage: "url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container relative z-10">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-xl font-extrabold text-(--color-marron-cacao) tracking-tight"
            >
              <img src="/logo.svg" alt="Tesoros Chocó" className="w-9 h-9 rounded-xl shadow-md" />
              <span className="hidden sm:block">Tesoros Chocó</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const active = isActivePage(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${active ? 'nav-link-active font-semibold' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* Cart icon: solo compradores autenticados */}
              {(user?.role === 'comprador') && (
                <div className="relative ml-2">
                  <button
                    type="button"
                    aria-label="Abrir carrito"
                    onClick={() => setShowCart(v => !v)}
                    className="px-3 py-2 rounded-lg hover:bg-(--color-marfil) transition-colors"
                  >
                    <Icon category="Navegación principal" name="WhhShoppingbag" className="w-5 h-5 opacity-80" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full shadow">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  {showCart && (
                    <div className="absolute right-0 mt-2 w-96 bg-white glass rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b bg-gray-50/60">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Tu carrito</p>
                            <p className="text-base font-semibold">{cartCount} artículo{cartCount!==1?'s':''}</p>
                          </div>
                          <button
                            aria-label="Cerrar carrito"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setShowCart(false)}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-auto divide-y">
                        {items.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-500">
                            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
                            </div>
                            Tu carrito está vacío.
                          </div>
                        ) : (
                          items.map(i => (
                            <div key={i.productoId} className="p-4 flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {i.imagenUrl ? (
                                  <img src={i.imagenUrl} alt={i.nombre} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">—</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{i.nombre}</p>
                                <div className="mt-1 flex items-center gap-3">
                                  <div className="inline-flex items-center border rounded-lg">
                                    <button aria-label="Disminuir" className="px-2 py-1 text-sm hover:bg-gray-50" onClick={()=>update(i.productoId, Math.max(1, (i.cantidad-1)))}>-</button>
                                    <input
                                      aria-label="Cantidad"
                                      type="number"
                                      className="w-12 text-center text-sm outline-none"
                                      min={1}
                                      max={i.stock ?? 9999}
                                      value={i.cantidad}
                                      onChange={(e)=>update(i.productoId, Math.max(1, Math.min(Number(e.target.value||1), i.stock ?? 9999)))}
                                    />
                                    <button aria-label="Aumentar" className="px-2 py-1 text-sm hover:bg-gray-50" onClick={()=>update(i.productoId, Math.min((i.cantidad+1), i.stock ?? 9999))}>+</button>
                                  </div>
                                  <span className="text-sm font-semibold text-(--color-terracotta-suave)">${(i.precio * i.cantidad).toLocaleString()}</span>
                                </div>
                              </div>
                              <button aria-label="Quitar del carrito" className="p-2 text-gray-400 hover:text-red-600" onClick={() => remove(i.productoId)}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-4 border-t bg-gray-50/60">
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-600">Total</span>
                          <span className="text-lg font-bold text-(--color-marron-cacao)">${total.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/carrito" onClick={() => setShowCart(false)} className="btn btn-outline text-center">Ver carrito</Link>
                          <Link to="/checkout" onClick={() => setShowCart(false)} className="btn btn-primary text-center">Pagar ahora</Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle: hide on small screens (moves to mobile menu) */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-sm font-medium text-(--color-marron-cacao)">{user.nombre || user.email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-80 capitalize text-(--color-marron-cacao)">{user.role}</span>
                      {user.role === 'vendedor' && (
                        <span className={`badge text-[10px] ${user.vendedor_estado === 'aprobado' ? 'badge-success' : user.vendedor_estado === 'pendiente' ? 'badge-warning' : 'badge-danger'}`}>{user.vendedor_estado}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-(--color-terracotta-suave) text-white flex items-center justify-center text-sm font-bold select-none">
                    {userInitial}
                  </div>
                  {/* Logout icon always visible */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="p-2 rounded-lg hover:bg-(--color-marfil) nav-auth-icon"
                    aria-label="Salir"
                    title="Salir"
                  >
                    <Icon category="Autenticacion" name="OouiLogInRtl" className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Desktop buttons */}
                  <Link to="/login" className="hidden sm:block">
                    <Button variant="secondary">Iniciar sesión</Button>
                  </Link>
                  <Link to="/register" className="hidden sm:block">
                    <Button>Crear cuenta</Button>
                  </Link>
                  {/* Mobile icon links */}
                  <Link to="/login" className="sm:hidden p-2 rounded-lg hover:bg-(--color-marfil) nav-auth-icon" aria-label="Iniciar sesión">
                    <Icon category="Autenticacion" name="OouiLogInLtr" className="w-6 h-6" />
                  </Link>
                  <Link to="/register" className="sm:hidden p-2 rounded-lg hover:bg-(--color-marfil) nav-auth-icon" aria-label="Crear cuenta">
                    <Icon category="Usuario" name="IconamoonProfileFill" className="w-6 h-6" />
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors text-(--color-marron-cacao) hover:bg-(--color-marfil)"
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                title={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-(--color-card) border-(--color-border)">
              <div className="px-3 pt-3 pb-4 space-y-2">
                {/* Theme toggle in mobile menu */}
                <div className="flex items-center justify-between px-1 py-1">
                  <span className="text-sm text-gray-600">Tema</span>
                  <ThemeToggle />
                </div>
                {(user?.role === 'comprador') && (
                  <Link to="/carrito" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-full text-base transition-colors hover:bg-gray-100">
                    Carrito {cartCount > 0 && <span className="ml-2 badge badge-danger">{cartCount}</span>}
                  </Link>
                )}
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-full text-base transition-colors ${isActivePage(item.path) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-100'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <div className="pt-3 border-t mt-3 border-(--color-border) flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-(--color-terracotta-suave) text-white flex items-center justify-center text-sm font-bold">{userInitial}</div>
                      <div>
                        <div className="text-sm font-medium text-(--color-marron-cacao)">{user.email}</div>
                        <div className="text-xs opacity-80 capitalize text-(--color-marron-cacao)">{user.role}</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}>Salir</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modal de auth eliminado: ahora hay páginas dedicadas /login y /register */}
    </>
  );
};

export default Navbar;
