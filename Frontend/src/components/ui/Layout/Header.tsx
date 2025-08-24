import React from 'react';
import Navbar from '@/components/ui/Layout/Navbar';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`sticky top-0 z-50 ${className}`}>
      <Navbar />
    </header>
  );
};

export default Header;