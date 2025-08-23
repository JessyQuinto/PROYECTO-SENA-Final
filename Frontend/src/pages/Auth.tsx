import React from 'react';
import { AuthForms } from '../modules/AuthForms';

export const AuthPage: React.FC = () => (
  <div className='min-h-[calc(100vh-120px)] grid place-items-center bg-gradient-to-br from-primary-50 to-white'>
    <div className='container-sm'>
      <div className='grid md:grid-cols-2 gap-8 items-center'>
        <div className='hidden md:block'>
          <div className='card card-hover'>
            <div className='card-body'>
              <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
                Bienvenido a Tesoros del Chocó
              </h1>
              <p className='text-gray-600'>
                Inicia sesión o crea tu cuenta para comprar artesanías o
                publicar tus productos como vendedor.
              </p>
              <ul className='mt-4 space-y-2 text-sm text-gray-600'>
                <li>• Compradores: acceden inmediatamente</li>
                <li>• Vendedores: requieren aprobación de administrador</li>
              </ul>
            </div>
          </div>
        </div>
        <div className='card card-hover'>
          <div className='card-body'>
            <AuthForms />
          </div>
        </div>
      </div>
    </div>
  </div>
);
