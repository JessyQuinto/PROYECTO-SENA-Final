import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const BuyerLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const nav = [
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
  ];
  return (
    <div className='container py-8'>
      <div className='mb-6'>
        <div
          className='rounded-xl h-14 mb-3 overflow-hidden'
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04)), url('/assert/1/v1045-03.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <h1 className='heading-lg mb-1'>{title}</h1>
        {subtitle && <p className='text-gray-600'>{subtitle}</p>}
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        <aside className='lg:col-span-3'>
          <div className='sticky top-20'>
            <div className='rounded-xl border border-(--color-border) overflow-hidden bg-white shadow-sm'>
              {nav.map(group => (
                <div key={group.group} className='py-2'>
                  <div className='px-4 py-2 text-xs font-semibold tracking-wide uppercase text-gray-500'>
                    {group.group}
                  </div>
                  <nav className='px-2 pb-2 space-y-1'>
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-(--color-marfil) text-(--color-marron-cacao) shadow-inner' : 'text-gray-700 hover:bg-(--color-marfil)'}`
                        }
                      >
                        <span className='opacity-70 group-hover:opacity-100'>
                          {item.icon}
                        </span>
                        <span className='text-sm font-medium'>
                          {item.label}
                        </span>
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

export default BuyerLayout;
