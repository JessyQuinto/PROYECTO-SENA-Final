import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// Mock toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock state cleanup
vi.mock('@/lib/stateCleanup', () => ({
  cleanupUserState: vi.fn().mockReturnValue({
    success: true,
    removedKeys: ['tc_cart_v1_user123', 'user_preferences'],
    preservedKeys: ['theme_preference'],
    errors: [],
  }),
  validateCleanup: vi.fn().mockReturnValue({ clean: true }),
  emergencyCleanup: vi.fn(),
  useCleanupListener: vi.fn(),
}));

// Import after mocks are set up
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { CartProvider, useCart } from '@/modules/buyer/CartContext';

// Test component that uses both auth and cart
const TestComponent = () => {
  const { user, signOut, loading, isSigningOut } = useAuth();
  const { items, add, clear } = useCart();

  const addTestItem = () => {
    add({
      productoId: 'test1',
      nombre: 'Test Product',
      precio: 100,
      cantidad: 1,
    });
  };

  return (
    <div>
      <div data-testid='auth-status'>
        {loading ? 'loading' : user ? `logged-in:${user.id}` : 'logged-out'}
      </div>
      <div data-testid='signing-out-status'>
        {isSigningOut ? 'signing-out' : 'not-signing-out'}
      </div>
      <div data-testid='cart-count'>{items.length}</div>
      <button data-testid='logout-button' onClick={signOut} disabled={loading}>
        Logout
      </button>
      <button data-testid='add-item-button' onClick={addTestItem}>
        Add Item
      </button>
      <button data-testid='clear-cart-button' onClick={clear}>
        Clear Cart
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Logout Anomalies Fix', () => {
  let consoleSpy: any;
  let localStorageRemoveSpy: any;
  let sessionStorageClearSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorageRemoveSpy = vi.spyOn(Storage.prototype, 'removeItem');
    sessionStorageClearSpy = vi.spyOn(Storage.prototype, 'clear');

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    localStorageRemoveSpy.mockRestore();
    sessionStorageClearSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should handle complete logout sequence without anomalies', async () => {
    // Mock initial authenticated user
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'comprador',
    };

    // Get the mocked module
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Mock auth state change to simulate logged in user
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(callback => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Wait for initial auth state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'logged-in:user123'
      );
    });

    // Add item to cart
    const addItemButton = screen.getByTestId('add-item-button');
    fireEvent.click(addItemButton);

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    // Verify signing out state is set immediately
    await waitFor(() => {
      expect(screen.getByTestId('signing-out-status')).toHaveTextContent(
        'signing-out'
      );
    });

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
      expect(screen.getByTestId('signing-out-status')).toHaveTextContent(
        'not-signing-out'
      );
    });

    // Verify cart is cleared
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    // Verify Supabase signOut was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should prevent cart operations during logout', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'comprador',
    };

    mockSupabase.auth.onAuthStateChange.mockImplementation(callback => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'logged-in:user123'
      );
    });

    // Start logout process
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    // Verify signing out state
    await waitFor(() => {
      expect(screen.getByTestId('signing-out-status')).toHaveTextContent(
        'signing-out'
      );
    });

    // Try to add item during logout - should not affect cart
    const addItemButton = screen.getByTestId('add-item-button');
    fireEvent.click(addItemButton);

    // Cart should remain empty during logout
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should handle logout errors gracefully without state corruption', async () => {
    // Mock Supabase signOut to fail
    mockSupabase.auth.signOut.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    });

    // State should still be cleared despite error
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('signing-out-status')).toHaveTextContent(
      'not-signing-out'
    );
  });

  it('should clean up cart storage keys properly', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'comprador',
    };

    mockSupabase.auth.onAuthStateChange.mockImplementation(callback => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'logged-in:user123'
      );
    });

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    });

    // Verify the state cleanup was called (mocked)
    const { cleanupUserState } = await import('@/lib/stateCleanup');
    expect(cleanupUserState).toHaveBeenCalled();
  });
});