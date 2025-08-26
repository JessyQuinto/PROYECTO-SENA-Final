import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import GlobalModals from './GlobalModals';
import CookieConsent from '@/components/ui/CookieConsent';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className='min-h-screen bg-background text-foreground relative'>
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
