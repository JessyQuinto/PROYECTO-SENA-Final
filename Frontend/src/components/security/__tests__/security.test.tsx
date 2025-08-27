import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { AdminRouteGuard, BuyerRouteGuard, VendorRouteGuard } from '../index';

// Mock del hook useAuth
const mockUseAuth = {
  user: null,
  loading: false,
  signOut: jest.fn(),
};

jest.mock('@/auth/AuthContext', () => ({
  ...jest.requireActual('@/auth/AuthContext'),
  useAuth: () => mockUseAuth,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Security Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AdminRouteGuard', () => {
    it('should redirect non-admin users', () => {
      mockUseAuth.user = { role: 'comprador' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <AdminRouteGuard>
            <div>Admin Content</div>
          </AdminRouteGuard>
        </TestWrapper>
      );

      // Debería redirigir, no mostrar contenido
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should show content for admin users', () => {
      mockUseAuth.user = { role: 'admin' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <AdminRouteGuard>
            <div>Admin Content</div>
          </AdminRouteGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  describe('BuyerRouteGuard', () => {
    it('should redirect non-buyer users', () => {
      mockUseAuth.user = { role: 'vendedor' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <BuyerRouteGuard>
            <div>Buyer Content</div>
          </BuyerRouteGuard>
        </TestWrapper>
      );

      expect(screen.queryByText('Buyer Content')).not.toBeInTheDocument();
    });

    it('should show content for buyer users', () => {
      mockUseAuth.user = { role: 'comprador' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <BuyerRouteGuard>
            <div>Buyer Content</div>
          </BuyerRouteGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Buyer Content')).toBeInTheDocument();
    });
  });

  describe('VendorRouteGuard', () => {
    it('should redirect non-vendor users', () => {
      mockUseAuth.user = { role: 'comprador' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <VendorRouteGuard>
            <div>Vendor Content</div>
          </VendorRouteGuard>
        </TestWrapper>
      );

      expect(screen.queryByText('Vendor Content')).not.toBeInTheDocument();
    });

    it('should show pending status for pending vendors', () => {
      mockUseAuth.user = { role: 'vendedor', vendedor_estado: 'pendiente' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <VendorRouteGuard requireApproval={true}>
            <div>Vendor Content</div>
          </VendorRouteGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Cuenta en revisión')).toBeInTheDocument();
      expect(screen.queryByText('Vendor Content')).not.toBeInTheDocument();
    });

    it('should show content for approved vendors', () => {
      mockUseAuth.user = { role: 'vendedor', vendedor_estado: 'aprobado' };
      mockUseAuth.loading = false;

      render(
        <TestWrapper>
          <VendorRouteGuard requireApproval={true}>
            <div>Vendor Content</div>
          </VendorRouteGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Vendor Content')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading', () => {
      mockUseAuth.user = null;
      mockUseAuth.loading = true;

      render(
        <TestWrapper>
          <AdminRouteGuard>
            <div>Content</div>
          </AdminRouteGuard>
        </TestWrapper>
      );

      // Debería mostrar spinner de loading
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

