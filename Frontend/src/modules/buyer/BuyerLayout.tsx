import React from 'react';
import { BuyerLayout as UnifiedBuyerLayout } from '@/components/layout/RoleBasedLayout';

const BuyerLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <UnifiedBuyerLayout title={title} subtitle={subtitle}>
      {children}
    </UnifiedBuyerLayout>
  );
};

export default BuyerLayout;
