import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthState } from '../../hooks/useAuthState';
import { useAuth } from '../../auth/AuthContext';

// Mock de useAuth
vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useAuthState Hook', () => {
  const mockAuthContext = {
    user: { id: 'user123', email: 'test@example.com', role: 'comprador' },
    loading: false,
    isSigningOut: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    redirectUserByRole: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return auth context values', () => {
    const result = useAuthState();
    
    expect(result).toEqual(mockAuthContext);
    expect(useAuth).toHaveBeenCalledTimes(1);
  });

  it('should call useAuth function', () => {
    useAuthState();
    
    expect(useAuth).toHaveBeenCalled();
  });

  it('should return correct user data', () => {
    const result = useAuthState();
    
    expect(result.user).toEqual(mockAuthContext.user);
    expect(result.user?.id).toBe('user123');
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.role).toBe('comprador');
  });

  it('should return correct loading state', () => {
    const result = useAuthState();
    
    expect(result.loading).toBe(false);
  });

  it('should return correct isSigningOut state', () => {
    const result = useAuthState();
    
    expect(result.isSigningOut).toBe(false);
  });

  it('should have auth functions', () => {
    const result = useAuthState();
    
    expect(typeof result.signIn).toBe('function');
    expect(typeof result.signUp).toBe('function');
    expect(typeof result.signOut).toBe('function');
    expect(typeof result.refreshProfile).toBe('function');
    expect(typeof result.redirectUserByRole).toBe('function');
  });
});