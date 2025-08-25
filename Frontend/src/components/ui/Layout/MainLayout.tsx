import React, { useMemo } from 'react';
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
  const { isSigningOut, loading } = useAuth();

  // Memoized loading overlay to prevent unnecessary re-renders
  const loadingOverlay = useMemo(() => {
    if (!isSigningOut) return null;
    
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
        aria-live='polite'
        aria-busy='true'
      >
        <div className='flex items-center gap-3 text-muted-foreground bg-background/90 p-4 rounded-lg shadow-lg border'>
          <div className='h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
          <span className='font-medium'>Cerrando sesión…</span>
        </div>
      </div>
    );
  }, [isSigningOut]);

  // Don't render children while loading to prevent flash
  if (loading) {
    return (
      <div className='min-h-screen bg-background text-foreground relative'>
        <Header />
        <main className={`${className} pb-24 md:pb-0 flex items-center justify-center`}>
          <div className='flex items-center gap-3 text-muted-foreground'>
            <div className='h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin' />
            <span className='text-lg'>Cargando aplicación…</span>
          </div>
        </main>
        <Footer />
        <MobileTabBar />
        <GlobalModals />
        <CookieConsent />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background text-foreground relative'>
      {loadingOverlay}
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
