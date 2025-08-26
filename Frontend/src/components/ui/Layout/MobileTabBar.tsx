import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useCart } from '@/modules/buyer/CartContext';
import Icon from '@/components/ui/Icon';

const MobileTabBar: React.FC = () => {
  const location = useLocation();
  // 🔑 USAR EL HOOK UNIFICADO para estado consistente
  const { user } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + (i.cantidad || 0), 0);

  const isActive = (path: string) => location.pathname === path;

  // During state transitions, behave as visitor to avoid flickers
  const effectiveUser = user;
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
      className='mobile-tabbar md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50'
      aria-label='Navegación móvil'
    >
      <div className='flex items-center justify-around h-16 px-2'>
        {normalized.map((tab, index) => (
          <Link
            key={index}
            to={tab.path}
            onClick={tab.onClick}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-2 py-1 text-xs font-medium transition-colors ${
              isActive(tab.path)
                ? 'text-primary bg-primary/10 rounded-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg'
            }`}
            aria-current={isActive(tab.path) ? 'page' : undefined}
          >
            <Icon
              category={tab.icon.category}
              name={tab.icon.name}
              className='h-5 w-5 mb-1'
            />
            <span className='text-center leading-tight'>{tab.label}</span>
            {tab.showBadge && cartCount > 0 && (
              <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground'>
                {cartCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileTabBar;
