import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import GlobalModals from './GlobalModals';
import CookieConsent from '@/components/ui/CookieConsent';
import { useAuth } from '@/auth/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
}) => {
  const { isSigningOut } = useAuth();

  return (
    <div className='min-h-screen bg-background text-foreground relative'>
      {isSigningOut && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/80'
          aria-live='polite'
          aria-busy='true'
        >
          <div className='flex items-center gap-3 text-muted-foreground'>
            <div className='h-5 w-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin' />
            <span>Cerrando sesión…</span>
          </div>
        </div>
      )}
      <Header />
      <main className={`${className} pb-24 md:pb-0`}>
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <GlobalModals />
      <CookieConsent />
    </div>
  );
};

export default MainLayout;
