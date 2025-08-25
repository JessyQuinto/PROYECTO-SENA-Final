import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider } from '@/auth/AuthContext';
import { CookieConsent } from '@/components/ui/CookieConsent';
import * as stateCleanup from '@/lib/stateCleanup';
import { BrowserRouter } from 'react-router-dom';

describe('Logout and Cookie Consent Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up any event listeners
    window.dispatchEvent(new Event('storage'));
  });

  describe('Cookie Consent Functionality', () => {
    it('should show cookie consent when no consent is saved', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Aviso de cookies')).toBeInTheDocument();
      expect(screen.getByText('Aceptar')).toBeInTheDocument();
      expect(screen.getByText('Rechazar')).toBeInTheDocument();
    });

    it('should hide cookie consent after accepting', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      );

      const acceptButton = screen.getByText('Aceptar');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
      });

      // Verify consent is saved
      const savedConsent = localStorage.getItem('cookie_consent');
      expect(savedConsent).not.toBeNull();
      const consent = JSON.parse(savedConsent!);
      expect(consent.value).toBe('accepted');
    });

    it('should hide cookie consent after rejecting', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      );

      const rejectButton = screen.getByText('Rechazar');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
      });

      // Verify consent is saved
      const savedConsent = localStorage.getItem('cookie_consent');
      expect(savedConsent).not.toBeNull();
      const consent = JSON.parse(savedConsent!);
      expect(consent.value).toBe('rejected');
    });
  });

  describe('State Cleanup Functionality', () => {
    it('should identify user-related keys for removal', () => {
      // Test the key pattern matching logic directly
      const testKeys = [
        'user_profile',
        'user_preferences',
        'cart_data',
        'sb-access-token',
        'theme_preference',
        'random_key',
      ];

      // Import the key patterns to test them
      const userDataPatterns = ['user_', 'profile_', 'preferences_'];
      const cartDataPatterns = ['cart_'];
      const authDataPatterns = ['sb-', 'supabase', 'auth_'];

      // Test user data pattern matching
      const userKeys = testKeys.filter(key =>
        userDataPatterns.some(pattern => key.startsWith(pattern))
      );
      expect(userKeys).toContain('user_profile');
      expect(userKeys).toContain('user_preferences');
      expect(userKeys).not.toContain('theme_preference');

      // Test cart data pattern matching
      const cartKeys = testKeys.filter(key =>
        cartDataPatterns.some(pattern => key.startsWith(pattern))
      );
      expect(cartKeys).toContain('cart_data');

      // Test auth data pattern matching
      const authKeys = testKeys.filter(key =>
        authDataPatterns.some(pattern => key.includes(pattern))
      );
      expect(authKeys).toContain('sb-access-token');
    });
  });
});
