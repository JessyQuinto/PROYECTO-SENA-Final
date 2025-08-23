import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ title, subtitle, children }) => {
  const nav = [
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
  ];

  return (
    <div className='container py-8'>
      <div className='mb-6'>
        <h1 className='heading-lg mb-1 flex items-center gap-3'>
          <Icon
            category='Administrador'
            name='MdiShieldCheck'
            className='w-8 h-8'
          />
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
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        <aside className='lg:col-span-3'>
          <div className='sticky top-20'>
            <div className='rounded-xl border border-(--color-border) overflow-hidden bg-white shadow-sm'>
              {nav.map(group => (
                <div key={group.group} className='py-2'>
                  <div className='px-4 py-2 text-xs font-semibold tracking-wide uppercase text-gray-500 flex items-center gap-2'>
                    <Icon
                      category='Navegación principal'
                      name='MdiGrid'
                      className='w-3 h-3'
                    />
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
                        <span className='text-sm font-medium'>
                          {item.label}
                        </span>
                        {item.to === '/admin' && (
                          <span className='ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
                            default
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
        <main className='lg:col-span-9'>
          <div className='rounded-xl border border-(--color-border) bg-white shadow-sm'>
            <div className='p-4 md:p-6'>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
