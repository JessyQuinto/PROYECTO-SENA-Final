import React from 'react';
import Icon from '@/components/ui/Icon';

export const Landing: React.FC = () => {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', lineHeight: 1.4 }}>
      <h1 className='flex items-center gap-3'>
        <Icon
          category='Navegación principal'
          name='FaSolidStore'
          className='w-8 h-8'
        />
        Marketplace Demo
      </h1>
      <p className='flex items-center gap-2'>
        <Icon
          category='Estados y Feedback'
          name='TypcnInfoLarge'
          className='w-4 h-4'
        />
        Base inicial del frontend.
      </p>
      <ul className='space-y-2'>
        <li className='flex items-center gap-2'>
          <Icon
            category='Estados y Feedback'
            name='IconParkSolidSuccess'
            className='w-4 h-4'
          />
          React + Vite + TS
        </li>
        <li className='flex items-center gap-2'>
          <Icon
            category='Estados y Feedback'
            name='IconParkSolidSuccess'
            className='w-4 h-4'
          />
          Estructura modular (modules)
        </li>
        <li className='flex items-center gap-2'>
          <Icon
            category='Estados y Feedback'
            name='IconParkSolidSuccess'
            className='w-4 h-4'
          />
          Punto de entrada limpio
        </li>
      </ul>
      <p
        style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#555' }}
        className='flex items-center gap-2'
      >
        <Icon
          category='Estados y Feedback'
          name='TypcnInfoLarge'
          className='w-4 h-4'
        />
        Extiende este demo añadiendo rutas, autenticación con Supabase y
        componentes UI.
      </p>
    </main>
  );
};
