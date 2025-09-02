import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthState } from '@/hooks/useAuthState';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useAuthState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the result from useAuth hook', () => {
    const mockAuthResult = {
      user: { id: '1', email: 'test@example.com' },
      signOut: vi.fn(),
      loading: false,
    };

    mockUseAuth.mockReturnValue(mockAuthResult);

    const { result } = renderHook(() => useAuthState());

    expect(result.current).toBe(mockAuthResult);
    expect(mockUseAuth).toHaveBeenCalledTimes(1);
  });

  it('handles different auth states', () => {
    // Test authenticated state
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@example.com' },
      signOut: vi.fn(),
      loading: false,
    });

    const { result: authResult } = renderHook(() => useAuthState());
    expect(authResult.current.user).toBeDefined();
    expect(authResult.current.loading).toBe(false);

    // Test unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false,
    });

    const { result: unauthResult } = renderHook(() => useAuthState());
    expect(unauthResult.current.user).toBeNull();
    expect(unauthResult.current.loading).toBe(false);

    // Test loading state
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: true,
    });

    const { result: loadingResult } = renderHook(() => useAuthState());
    expect(loadingResult.current.loading).toBe(true);
  });

  it('provides signOut function', () => {
    const mockSignOut = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      signOut: mockSignOut,
      loading: false,
    });

    const { result } = renderHook(() => useAuthState());

    expect(typeof result.current.signOut).toBe('function');
    expect(result.current.signOut).toBe(mockSignOut);
  });

  it('maintains consistent reference when re-rendering', () => {
    const mockAuthResult = {
      user: { id: '1', email: 'test@example.com' },
      signOut: vi.fn(),
      loading: false,
    };

    mockUseAuth.mockReturnValue(mockAuthResult);

    const { result, rerender } = renderHook(() => useAuthState());

    const firstResult = result.current;
    rerender();

    expect(result.current).toBe(firstResult);
    expect(mockUseAuth).toHaveBeenCalledTimes(2);
  });

  it('handles undefined auth context gracefully', () => {
    mockUseAuth.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthState());

    expect(result.current).toBeUndefined();
  });

  it('works with different user types', () => {
    const adminUser = {
      id: '1',
      email: 'admin@example.com',
    };

    mockUseAuth.mockReturnValue({
      user: adminUser,
      signOut: vi.fn(),
      loading: false,
    });

    const { result } = renderHook(() => useAuthState());

    expect(result.current.user).toEqual(adminUser);
    expect(result.current.user?.email).toBe('admin@example.com');
  });
});
