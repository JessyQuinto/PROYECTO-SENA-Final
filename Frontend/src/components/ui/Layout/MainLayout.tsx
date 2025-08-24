import React from 'react';
import Header from '@/components/ui/Layout/Header';
import Footer from '@/components/ui/Layout/Footer';
import MobileTabBar from '@/components/ui/Layout/MobileTabBar';
import GlobalModals from '@/components/ui/Layout/GlobalModals';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header />
      <main className={`${className} animate-in pb-24 md:pb-0`}>
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <GlobalModals />
    </div>
  );
};

export default MainLayout;
