import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import GlobalModals from './GlobalModals';
import CookieConsent from '@/components/ui/CookieConsent';
import { useAuth } from '@/auth/AuthContext';
import { SkipNavigation, MainContent } from '@/components/ui/Accessibility';
import { LoadingPageSkeleton } from '@/components/ui/Skeleton';

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
      <SkipNavigation />
      
      {isSigningOut && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
          aria-live='polite'
          aria-busy='true'
          role='status'
        >
          <div className='flex flex-col items-center gap-4 text-center p-6 bg-card rounded-lg shadow-lg border'>
            <div className='h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin' />
            <div>
              <p className='text-lg font-medium text-foreground'>Cerrando sesión</p>
              <p className='text-sm text-muted-foreground'>Por favor espera...</p>
            </div>
          </div>
        </div>
      )}
      
      <Header />
      
      <MainContent className={`${className} pb-20 md:pb-0 px-4 md:px-6 lg:px-8`}>
        <div className='max-w-screen-2xl mx-auto w-full'>
          {children}
        </div>
      </MainContent>
      
      <Footer />
      <MobileTabBar />
      <GlobalModals />
      <CookieConsent />
    </div>
  );
};

export default MainLayout;
