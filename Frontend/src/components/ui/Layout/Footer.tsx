import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const role = user?.role;
  const isBuyer = role === 'comprador';
  const isVendor = role === 'vendedor';
  const isAdmin = role === 'admin';

  return (
    <footer
      className={`mt-auto border-t bg-card text-card-foreground relative overflow-hidden ${className}`}
    >
      {/* Decorative pattern background */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-10 pointer-events-none'
        style={{
          backgroundImage:
            "url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className='container py-12 relative z-10'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='md:col-span-2'>
            <div className='flex items-center space-x-3 mb-4'>
              <img
                src='/logo.svg'
                alt='Tesoros Chocó'
                className='w-8 h-8 rounded-lg'
              />
              <span className='text-xl font-bold'>Tesoros Chocó</span>
            </div>
            <p className='opacity-80 mb-4 text-balance'>
              Conectando artesanos del Chocó con el mundo. Descubre productos
              únicos y auténticos hechos a mano por talentosos artesanos
              colombianos.
            </p>
            <div className='flex space-x-4'>
              <a
                href='#'
                className='opacity-80 hover:opacity-100 transition-colors'
                aria-label='Síguenos en Facebook'
              >
                <span className='sr-only'>Facebook</span>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z'
                    clipRule='evenodd'
                  />
                </svg>
              </a>
              <a
                href='#'
                className='opacity-80 hover:opacity-100 transition-colors'
                aria-label='Síguenos en Instagram'
              >
                <span className='sr-only'>Instagram</span>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.017 0H7.983C3.516 0 0 3.516 0 7.983v4.034C0 16.484 3.516 20 7.983 20h4.034C16.484 20 20 16.484 20 12.017V7.983C20 3.516 16.484 0 12.017 0zM10 15c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm5-9a1 1 0 11-2 0 1 1 0 012 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Enlaces útiles */}
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider mb-4 opacity-80'>
              Enlaces útiles
            </h3>
            <nav>
              <ul className='space-y-2'>
                <li>
                  <Link
                    to='/productos'
                    className='opacity-80 hover:opacity-100 transition-colors'
                  >
                    Productos
                  </Link>
                </li>
                {isBuyer && (
                  <>
                    <li>
                      <Link
                        to='/carrito'
                        className='opacity-80 hover:opacity-100 transition-colors'
                      >
                        Carrito
                      </Link>
                    </li>
                    <li>
                      <Link
                        to='/mis-pedidos'
                        className='opacity-80 hover:opacity-100 transition-colors'
                      >
                        Mis pedidos
                      </Link>
                    </li>
                  </>
                )}
                {!user && (
                  <>
                    <li>
                      <Link
                        to='/login'
                        className='opacity-80 hover:opacity-100 transition-colors'
                      >
                        Iniciar sesión
                      </Link>
                    </li>
                    <li>
                      <Link
                        to='/register'
                        className='opacity-80 hover:opacity-100 transition-colors'
                      >
                        Crear cuenta
                      </Link>
                    </li>
                  </>
                )}
                {isVendor && (
                  <li>
                    <Link
                      to='/vendedor'
                      className='opacity-80 hover:opacity-100 transition-colors'
                    >
                      Panel vendedor
                    </Link>
                  </li>
                )}
                {isAdmin && (
                  <li>
                    <Link
                      to='/admin'
                      className='opacity-80 hover:opacity-100 transition-colors'
                    >
                      Administración
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          {/* Soporte */}
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider mb-4 opacity-80'>
              Soporte
            </h3>
            <nav>
              <ul className='space-y-2'>
                <li>
                  <Link
                    to='/forgot-password'
                    className='opacity-80 hover:opacity-100 transition-colors'
                  >
                    Olvidé mi contraseña
                  </Link>
                </li>
                <li>
                  <Link
                    to='/reset-password'
                    className='opacity-80 hover:opacity-100 transition-colors'
                  >
                    Restablecer contraseña
                  </Link>
                </li>
                <li>
                  <Link
                    to='/verifica-tu-correo'
                    className='opacity-80 hover:opacity-100 transition-colors'
                  >
                    Verifica tu correo
                  </Link>
                </li>
                <li>
                  <Link
                    to='/auth'
                    className='opacity-80 hover:opacity-100 transition-colors'
                  >
                    Centro de cuenta
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div
          className='border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center'
          style={{
            borderColor: 'color-mix(in oklab, var(--color-marfil) 80%, black)',
          }}
        >
          <p className='text-sm opacity-80'>
            © 2025 Tesoros Chocó. Todos los derechos reservados. Proyecto SENA.
          </p>
          <p className='text-sm mt-4 md:mt-0 opacity-80'>
            Fabricado con ❤️ en el Chocó, Colombia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
