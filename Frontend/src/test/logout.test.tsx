import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
const mockSupabase = {
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
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Test component that uses auth
const TestComponent = () => {
  const { user, signOut, loading } = useAuth();

  return (
    <div>
      <div data-testid='user-status'>
        {loading ? 'loading' : user ? `logged-in:${user.id}` : 'logged-out'}
      </div>
      <button data-testid='logout-button' onClick={signOut} disabled={loading}>
        Logout
      </button>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Logout Flow Tests', () => {
  let originalLocalStorage: Storage;
  let localStorageMock: any;
  let consoleSpy: any;

  beforeEach(() => {
    // Store original localStorage before mocking
    originalLocalStorage = global.localStorage;
    
    // Mock localStorage with proper implementation
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn() as any,
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    // Add mockImplementation to removeItem
    localStorageMock.removeItem.mockImplementation(() => {});

    // Mock Object.keys to return localStorage keys
    Object.defineProperty(localStorageMock, 'keys', {
      value: vi
        .fn()
        .mockReturnValue([
          'user_preferences',
          'cart_data_user123',
          'theme_preference',
          'sb-auth-token',
          'cookie_consent',
          'other_key',
        ]),
    });

    global.localStorage = localStorageMock;

    // Mock sessionStorage
    global.sessionStorage = {
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    // Mock Object.keys for localStorage
    global.Object.keys = vi.fn().mockImplementation(obj => {
      if (obj === localStorage) {
        return [
          'user_preferences',
          'cart_data_user123',
          'theme_preference',
          'sb-auth-token',
          'cookie_consent',
          'other_key',
        ];
      }
      return [];
    });

    // Spy on console for debugging verification
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock window events
    global.window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.localStorage = originalLocalStorage;
    consoleSpy.mockRestore();
  });

  it('should completely clear user state on logout', async () => {
    // Mock initial authenticated user
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'comprador',
    };

    // Mock auth state change to simulate logged in user
    mockSupabase.auth.onAuthStateChange.mockImplementation(callback => {
      // Simulate initial auth state with user
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
      expect(screen.getByTestId('user-status')).toHaveTextContent(
        'logged-in:user123'
      );
    });

    // Trigger logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Verify Supabase signOut was called
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();

    // Verify localStorage cleanup
    expect(localStorage.removeItem).toHaveBeenCalledWith('user_preferences');
    expect(localStorage.removeItem).toHaveBeenCalledWith('cart_data_user123');
    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-auth-token');

    // Verify sessionStorage was cleared
    expect(sessionStorage.clear).toHaveBeenCalled();

    // Verify events were dispatched
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'userLoggedOut',
      })
    );

    // Verify comprehensive logging
    expect(consoleSpy).toHaveBeenCalledWith('[AuthContext] Sign out initiated');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[AuthContext] Cleaning persistent data...'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[AuthContext] Sign out completed successfully'
    );
  });

  it('should handle logout errors gracefully', async () => {
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
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AuthContext] Error during signOut:')
    );

    // Verify emergency cleanup was attempted
    expect(consoleSpy).toHaveBeenCalledWith(
      '[AuthContext] Emergency cleanup due to error...'
    );

    // State should still be cleared despite error
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(sessionStorage.clear).toHaveBeenCalled();
  });

  it('should prevent duplicate logout calls', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const logoutButton = screen.getByTestId('logout-button');

    // Click logout multiple times rapidly
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Should only call signOut once despite multiple clicks
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('should clean up user-specific localStorage keys only', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Should remove user-specific keys
    expect(localStorage.removeItem).toHaveBeenCalledWith('user_preferences');
    expect(localStorage.removeItem).toHaveBeenCalledWith('cart_data_user123');
    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-auth-token');

    // Should NOT remove non-user keys (theme_preference, other_key should remain)
    expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_key');
  });

  it('should work when localStorage is unavailable', async () => {
    // Mock localStorage to throw errors
    (localStorage.removeItem as any).mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Should still complete logout despite localStorage errors
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AuthContext] Error removing key')
    );
  });

  it('should dispatch both storage and custom events', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    });

    // Should dispatch storage event for legacy components
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'storage' })
    );

    // Should dispatch custom logout event
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'userLoggedOut',
        detail: expect.objectContaining({
          timestamp: expect.any(Number),
        }),
      })
    );
  });
});

describe('Authentication State Persistence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not persist user state after logout', async () => {
    // Mock component that might cache user state
    const CachingComponent = () => {
      const { user } = useAuth();
      const [cachedUser, setCachedUser] = React.useState<any>(null);

      React.useEffect(() => {
        if (user) {
          setCachedUser(user);
        }
      }, [user]);

      return (
        <div>
          <div data-testid='current-user'>{user ? user.id : 'none'}</div>
          <div data-testid='cached-user'>
            {cachedUser ? cachedUser.id : 'none'}
          </div>
        </div>
      );
    };

    render(
      <TestWrapper>
        <CachingComponent />
      </TestWrapper>
    );

    // Components should properly reset their cached state
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('none');
      expect(screen.getByTestId('cached-user')).toHaveTextContent('none');
    });
  });
});
