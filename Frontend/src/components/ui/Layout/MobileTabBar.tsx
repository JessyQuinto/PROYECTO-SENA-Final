import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useCart } from '@/modules/buyer/CartContext';
import Icon from '@/components/ui/Icon';

const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const { user, isSigningOut } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + (i.cantidad || 0), 0);

  const isActive = (path: string) => location.pathname === path;

  // Durante el cierre de sesión, comportarse como visitante para evitar parpadeos
  const effectiveUser = isSigningOut ? null : user;
  const isBuyer = effectiveUser?.role === 'comprador';
  const vendorState = (user as any)?.vendedor_estado as
    | 'aprobado'
    | 'pendiente'
    | 'rechazado'
    | undefined;
  const isVendorApproved =
    effectiveUser?.role === 'vendedor' && vendorState === 'aprobado';
  const isAdmin = effectiveUser?.role === 'admin';

  // Construcción dinámica de tabs según estado/auth/rol
  const tabs: Array<{
    path: string;
    label: string;
    icon: { category: string; name: string };
    showBadge?: boolean;
    onClick?: () => void;
  }> = [];

  // Siempre presentes: solo 2 fijos + 1 de cuenta/perfil según estado
  tabs.push({
    path: '/',
    label: 'Inicio',
    icon: { category: 'Navegación principal', name: 'MdiHome' },
  });
  tabs.push({
    path: '/productos',
    label: 'Productos',
    icon: { category: 'Navegación principal', name: 'MdiGrid' },
  });

  // Tercera pestaña: solo si hay usuario; si no hay sesión, dejamos 2 tabs (Inicio, Productos)
  if (effectiveUser) {
    if (isBuyer) {
      // Comprador: Perfil
      tabs.push({
        path: '/perfil',
        label: 'Perfil',
        icon: { category: 'Usuario', name: 'IconamoonProfileFill' },
      });
    } else if (effectiveUser.role === 'vendedor') {
      // Vendedor: Mostrar acción relevante
      if (isVendorApproved) {
        // Aprobado -> Vender (dashboard)
        tabs.push({
          path: '/vendedor',
          label: 'Vender',
          icon: { category: 'Vendedor', name: 'MaterialSymbolsDashboard' },
        });
      } else if (vendorState === 'pendiente') {
        // Pendiente -> Estado
        tabs.push({
          path: '/vendedor',
          label: 'Estado',
          icon: {
            category: 'Estados y Feedback',
            name: 'IconoirWarningSquare',
          },
        });
      } else {
        // Rechazado/sin estado -> Postularme
        tabs.push({
          path: '/auth',
          label: 'Postularme',
          icon: { category: 'Usuario', name: 'RivetIconsSettings' },
        });
      }
    } else if (isAdmin) {
      // Admin: Admin
      tabs.push({
        path: '/admin',
        label: 'Admin',
        icon: { category: 'Administrador', name: 'RivetIconsSettings' },
      });
    } else {
      // Fallback autenticado sin rol reconocido: Perfil
      tabs.push({
        path: '/perfil',
        label: 'Perfil',
        icon: { category: 'Usuario', name: 'IconamoonProfileFill' },
      });
    }
  }

  // Normalización: evitar duplicados exactos (por path+label) y recortar a 3
  const seen = new Set<string>();
  const normalized = tabs
    .filter(t => {
      const key = `${t.path}|${t.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);

  return (
    <nav
      className='mobile-tabbar md:hidden'
      role='navigation'
      aria-label='Navegación inferior'
    >
      <ul className='mobile-tabbar-list'>
        {normalized.map(t => (
          <li key={`${t.path}|${t.label}`} className='flex-1'>
            <Link
              to={t.path}
              className={`
                mobile-tabbar-item 
                touch-target-lg
                flex flex-col items-center justify-center
                gap-1.5
                px-2 py-3
                w-full h-full
                transition-all duration-200 ease-in-out
                ${isActive(t.path) 
                  ? 'text-primary bg-primary/5 scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }
                active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              `}
            >
              <div className='relative flex items-center justify-center'>
                <Icon
                  category={t.icon.category}
                  name={t.icon.name}
                  className={`
                    w-7 h-7 md:w-6 md:h-6
                    transition-all duration-200
                    ${isActive(t.path) ? 'text-primary' : 'text-current'}
                  `}
                />
                {t.showBadge && cartCount > 0 && (
                  <span
                    className='
                      absolute -top-2 -right-2
                      bg-destructive text-destructive-foreground
                      text-xs font-bold
                      min-w-[20px] h-5
                      flex items-center justify-center
                      rounded-full
                      px-1
                      shadow-sm
                      animate-pulse
                    '
                    aria-label={`${cartCount} artículos en el carrito`}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span 
                className={`
                  text-xs font-medium
                  transition-all duration-200
                  ${isActive(t.path) 
                    ? 'text-primary font-semibold' 
                    : 'text-current'
                  }
                `}
              >
                {t.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className='safe-bottom' />
    </nav>
  );
};

export default MobileTabBar;
