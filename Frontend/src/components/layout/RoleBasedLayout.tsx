import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

interface NavigationItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

interface NavigationGroup {
  group: string;
  groupIcon?: ReactNode;
  items: NavigationItem[];
}

interface LayoutHeaderConfig {
  title: string;
  subtitle?: string;
  headerIcon?: ReactNode;
  headerBackground?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
    height?: string;
  };
}

interface RoleBasedLayoutProps {
  header: LayoutHeaderConfig;
  navigationGroups: NavigationGroup[];
  children: ReactNode;
  className?: string;
}

const LayoutHeader: React.FC<{ config: LayoutHeaderConfig }> = ({ config }) => {
  const { title, subtitle, headerIcon, headerBackground } = config;
  
  return (
    <div className='mb-6'>
      {/* Header background for specific roles */}
      {headerBackground && (
        <div
          className={`rounded-xl mb-3 overflow-hidden ${headerBackground.height || 'h-14'}`}
          style={
            headerBackground.type === 'image'
              ? {
                  backgroundImage: headerBackground.value,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : headerBackground.type === 'gradient'
              ? { background: headerBackground.value }
              : { backgroundColor: headerBackground.value }
          }
        />
      )}
      
      <h1 className='heading-lg mb-1 flex items-center gap-3'>
        {headerIcon}
        {title}
      </h1>
      
      {subtitle && (
        <p className='text-gray-600 flex items-center gap-2'>
          <Icon
            category='Estados y Feedback'
            name='TypcnInfoLarge'
            className='w-4 h-4'
          />
          {subtitle}
        </p>
      )}
    </div>
  );
};

const NavigationSidebar: React.FC<{ 
  groups: NavigationGroup[];
  showGroupIcons?: boolean; 
}> = ({ groups, showGroupIcons = true }) => (
  <aside className='lg:col-span-3'>
    <div className='sticky top-20'>
      <div className='rounded-xl border border-(--color-border) overflow-hidden bg-white shadow-sm'>
        {groups.map(group => (
          <div key={group.group} className='py-2'>
            <div className='px-4 py-2 text-xs font-semibold tracking-wide uppercase text-gray-500 flex items-center gap-2'>
              {showGroupIcons && (
                group.groupIcon || (
                  <Icon
                    category='Navegación principal'
                    name='MdiGrid'
                    className='w-3 h-3'
                  />
                )
              )}
              {group.group}
            </div>
            <nav className='px-2 pb-2 space-y-1'>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-(--color-marfil) text-(--color-marron-cacao) shadow'
                        : 'text-gray-700 hover:bg-(--color-marfil) hover:translate-x-0.5'
                    }
                  `}
                >
                  <span className='opacity-70 group-hover:opacity-100'>
                    {item.icon}
                  </span>
                  <span className='text-sm font-medium'>{item.label}</span>
                  {item.badge && (
                    <span className='ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  </aside>
);

const MainContent: React.FC<{ children: ReactNode }> = ({ children }) => (
  <main className='lg:col-span-9'>
    <div className='rounded-xl border border-(--color-border) bg-white shadow-sm'>
      <div className='p-4 md:p-6'>{children}</div>
    </div>
  </main>
);

export const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  header,
  navigationGroups,
  children,
  className = '',
}) => {
  return (
    <div className={`container py-8 ${className}`}>
      <LayoutHeader config={header} />
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        <NavigationSidebar groups={navigationGroups} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
};

// Predefined navigation configurations for common roles
export const NavigationConfigs = {
  admin: {
    header: {
      title: 'Panel de Administración',
      subtitle: 'Gestión completa del marketplace',
      headerIcon: (
        <Icon
          category='Administrador'
          name='MdiShieldCheck'
          className='w-8 h-8'
        />
      ),
    },
    groups: [
      {
        group: 'Gestión',
        items: [
          {
            to: '/admin',
            label: 'Resumen',
            icon: (
              <Icon
                category='Navegación principal'
                name='MdiHome'
                className='w-4 h-4'
              />
            ),
            badge: 'default',
          },
          {
            to: '/admin/categorias',
            label: 'Categorías',
            icon: (
              <Icon
                category='Catálogo y producto'
                name='LucideTags'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/admin/usuarios',
            label: 'Usuarios',
            icon: (
              <Icon
                category='Administrador'
                name='TablerUsers'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/admin/moderacion',
            label: 'Moderación',
            icon: (
              <Icon
                category='Administrador'
                name='FluentGavel32Filled'
                className='w-4 h-4'
              />
            ),
          },
        ],
      },
      {
        group: 'Análisis',
        items: [
          {
            to: '/admin/metricas',
            label: 'Métricas',
            icon: (
              <Icon
                category='Administrador'
                name='SimpleIconsGoogleanalytics'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/admin/auditoria',
            label: 'Auditoría',
            icon: (
              <Icon
                category='Administrador'
                name='LucideFileClock'
                className='w-4 h-4'
              />
            ),
          },
        ],
      },
      {
        group: 'Sistema',
        items: [
          {
            to: '/admin/configuracion',
            label: 'Configuración',
            icon: (
              <Icon
                category='Usuario'
                name='RivetIconsSettings'
                className='w-4 h-4'
              />
            ),
          },
        ],
      },
    ],
  },

  buyer: {
    header: {
      title: 'Mi Cuenta',
      subtitle: 'Gestiona tus compras y preferencias',
      headerBackground: {
        type: 'image' as const,
        value: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04)), url('/assert/1/v1045-03.jpg')",
        height: 'h-14',
      },
    },
    groups: [
      {
        group: 'Compras',
        items: [
          {
            to: '/productos',
            label: 'Explorar',
            icon: (
              <Icon
                category='Catálogo y producto'
                name='LineMdSearch'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/mis-pedidos',
            label: 'Mis pedidos',
            icon: (
              <Icon
                category='Pedidos'
                name='MaterialSymbolsOrdersOutlineRounded'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/mis-calificaciones',
            label: 'Calificaciones',
            icon: (
              <Icon
                category='Catálogo y producto'
                name='LucideHeart'
                className='w-4 h-4'
              />
            ),
          },
        ],
      },
    ],
  },

  vendor: {
    header: {
      title: 'Panel de Vendedor',
      subtitle: 'Gestiona tus productos y ventas',
      headerIcon: (
        <Icon
          category='Catálogo y producto'
          name='MdiStore'
          className='w-8 h-8'
        />
      ),
    },
    groups: [
      {
        group: 'Productos',
        items: [
          {
            to: '/vendedor',
            label: 'Dashboard',
            icon: (
              <Icon
                category='Navegación principal'
                name='MdiHome'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/vendedor/productos',
            label: 'Mis Productos',
            icon: (
              <Icon
                category='Catálogo y producto'
                name='LucideTags'
                className='w-4 h-4'
              />
            ),
          },
          {
            to: '/vendedor/pedidos',
            label: 'Pedidos',
            icon: (
              <Icon
                category='Pedidos'
                name='MaterialSymbolsOrdersOutlineRounded'
                className='w-4 h-4'
              />
            ),
          },
        ],
      },
    ],
  },
};

// Convenience components for specific roles
export const AdminLayout: React.FC<{
  title?: string;
  subtitle?: string;
  children: ReactNode;
}> = ({ title, subtitle, children }) => (
  <RoleBasedLayout
    header={{
      ...NavigationConfigs.admin.header,
      ...(title && { title }),
      ...(subtitle && { subtitle }),
    }}
    navigationGroups={NavigationConfigs.admin.groups}
  >
    {children}
  </RoleBasedLayout>
);

export const BuyerLayout: React.FC<{
  title?: string;
  subtitle?: string;
  children: ReactNode;
}> = ({ title, subtitle, children }) => (
  <RoleBasedLayout
    header={{
      ...NavigationConfigs.buyer.header,
      ...(title && { title }),
      ...(subtitle && { subtitle }),
    }}
    navigationGroups={NavigationConfigs.buyer.groups}
  >
    {children}
  </RoleBasedLayout>
);

export const VendorLayout: React.FC<{
  title?: string;
  subtitle?: string;
  children: ReactNode;
}> = ({ title, subtitle, children }) => (
  <RoleBasedLayout
    header={{
      ...NavigationConfigs.vendor.header,
      ...(title && { title }),
      ...(subtitle && { subtitle }),
    }}
    navigationGroups={NavigationConfigs.vendor.groups}
  >
    {children}
  </RoleBasedLayout>
);

export type { NavigationItem, NavigationGroup, LayoutHeaderConfig, RoleBasedLayoutProps };