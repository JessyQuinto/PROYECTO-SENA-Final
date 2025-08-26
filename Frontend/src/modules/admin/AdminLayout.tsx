import React from 'react';
import { AdminLayout as UnifiedAdminLayout } from '@/components/layout/RoleBasedLayout';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ title, subtitle, children }) => {
  return (
    <UnifiedAdminLayout title={title} subtitle={subtitle}>
      {children}
    </UnifiedAdminLayout>
  );
};

export default AdminLayout;
