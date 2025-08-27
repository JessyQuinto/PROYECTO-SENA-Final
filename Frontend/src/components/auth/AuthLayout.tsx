import React, { ReactNode } from 'react';

interface FeatureItem {
  icon: ReactNode;
  text: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  features: FeatureItem[];
  children: ReactNode;
}

const AuthBackground: React.FC = () => (
  <div
    aria-hidden
    className='absolute inset-0 opacity-12'
    style={{
      backgroundImage:
        "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  />
);

const AuthSidebar: React.FC<{
  title: string;
  description: string;
  features: FeatureItem[];
}> = ({ title, description, features }) => (
  <div className='hidden md:block md:col-span-1'>
    <div className='card card-hover'>
      <div className='card-body'>
        <h2 className='card-title text-2xl mb-4'>{title}</h2>
        <p className='opacity-80 mb-6'>{description}</p>
        <div className='space-y-4'>
          {features.map((feature, index) => (
            <div key={index} className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                {feature.icon}
              </div>
              <span className='text-sm'>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AuthFormContainer: React.FC<{
  subtitle: string;
  children: ReactNode;
}> = ({ subtitle, children }) => (
  <div className='md:col-span-2'>
    <div className='card card-hover'>
      <div className='card-body'>
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold mb-2'>{subtitle}</h1>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  description,
  features,
  children,
}) => {
  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center relative overflow-hidden'>
      <AuthBackground />
      <div className='container max-w-5xl relative z-10'>
        <div className='grid md:grid-cols-3 gap-8 items-start'>
          <AuthSidebar title={title} description={description} features={features} />
          <AuthFormContainer subtitle={subtitle}>{children}</AuthFormContainer>
        </div>
      </div>
    </div>
  );
};

// Common feature icons for reuse
export const AuthIcons = {
  checkCircle: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  ),
  shoppingBag: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
      />
    </svg>
  ),
  heart: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
      />
    </svg>
  ),
  mapPin: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      />
    </svg>
  ),
  user: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      />
    </svg>
  ),
  building: (
    <svg
      className='w-4 h-4 text-primary'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      />
    </svg>
  ),
};

// Predefined feature sets for common use cases
export const AuthFeatureSets = {
  login: [
    { icon: AuthIcons.checkCircle, text: 'Acceso rápido a tu perfil' },
    { icon: AuthIcons.shoppingBag, text: 'Gestiona tus pedidos' },
    { icon: AuthIcons.heart, text: 'Favoritos y listas personalizadas' },
  ],
  register: [
    { icon: AuthIcons.checkCircle, text: 'Acceso inmediato a productos únicos' },
    { icon: AuthIcons.mapPin, text: 'Apoya a artesanos locales' },
    { icon: AuthIcons.heart, text: 'Productos con historia y autenticidad' },
  ],
};