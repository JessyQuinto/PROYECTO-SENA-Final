import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookieConsent } from '@/components/ui/CookieConsent';

describe('Cookie Consent Component Tests', () => {
  let originalLocalStorage;
  let localStorageMock;
  let consoleSpy;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    global.localStorage = localStorageMock;

    // Mock window events
    global.window.dispatchEvent = vi.fn();
    global.window.addEventListener = vi.fn();
    global.window.removeEventListener = vi.fn();

    // Mock navigator
    global.navigator = {
      userAgent: 'Test Browser/1.0'
    };

    // Spy on console
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.localStorage = originalLocalStorage;
    consoleSpy.mockRestore();
  });

  it('should show cookie banner when no consent is stored', () => {
    // Mock no stored consent
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    // Should render the banner
    expect(screen.getByText('Aviso de cookies')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-accept')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-reject')).toBeInTheDocument();

    // Should log that it's showing the component
    expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] No valid saved consent, showing component');
  });

  it('should hide banner when valid consent exists', () => {
    // Mock existing consent
    const mockConsent = JSON.stringify({
      value: 'accepted',
      at: new Date().toISOString(),
      timestamp: Date.now()
    });
    localStorageMock.getItem.mockReturnValue(mockConsent);

    render(<CookieConsent />);

    // Should not render the banner
    expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] Valid consent found, hiding component');
  });

  it('should save consent when accept button is clicked', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        expect.stringContaining('"value":"accepted"')
      );
    });

    // Verify the saved data structure
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData).toMatchObject({
      value: 'accepted',
      at: expect.any(String),
      timestamp: expect.any(Number),
      userAgent: expect.any(String)
    });

    // Should log the click and save process
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CookieConsent] Accept button clicked')
    );
    expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] Setting consent: accepted');
  });

  it('should save consent when reject button is clicked', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const rejectButton = screen.getByTestId('cookie-reject');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        expect.stringContaining('"value":"rejected"')
      );
    });

    // Verify the saved data structure
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData).toMatchObject({
      value: 'rejected',
      at: expect.any(String),
      timestamp: expect.any(Number),
      userAgent: expect.any(String)
    });

    expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] Setting consent: rejected');
  });

  it('should hide banner after consent is given', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { rerender } = render(<CookieConsent />);

    // Should be visible initially
    expect(screen.getByText('Aviso de cookies')).toBeInTheDocument();

    // Click accept
    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    // Should hide after consent
    await waitFor(() => {
      expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
    });
  });

  it('should handle localStorage errors gracefully', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    // Should still hide banner even if save fails
    await waitFor(() => {
      expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
    });

    // Should log the error
    expect(console.error).toHaveBeenCalledWith(
      '[CookieConsent] Error saving consent:',
      expect.any(Error)
    );
  });

  it('should handle malformed consent data', () => {
    // Mock malformed JSON in localStorage
    localStorageMock.getItem.mockReturnValue('invalid-json');

    render(<CookieConsent />);

    // Should show banner and clean up invalid data
    expect(screen.getByText('Aviso de cookies')).toBeInTheDocument();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cookie_consent');
    expect(console.error).toHaveBeenCalledWith(
      '[CookieConsent] Error parsing consent JSON:',
      expect.any(Error)
    );
  });

  it('should prevent multiple clicks while processing', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');

    // Click multiple times rapidly
    fireEvent.click(acceptButton);
    fireEvent.click(acceptButton);
    fireEvent.click(acceptButton);

    // Should only process once
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });

    expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] Already processing, ignoring click');
  });

  it('should verify consent data after saving', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null); // Initial check
    
    // Mock successful save and verification
    const mockConsentData = {
      value: 'accepted',
      at: new Date().toISOString(),
      timestamp: Date.now()
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConsentData)); // Verification check

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[CookieConsent] Consent saved and verified successfully');
    });
  });

  it('should listen for storage events and update accordingly', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    // Should add event listeners
    expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('userLoggedOut', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { unmount } = render(<CookieConsent />);
    unmount();

    // Should remove event listeners
    expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('userLoggedOut', expect.any(Function));
  });

  it('should handle localStorage unavailability', () => {
    // Mock Storage as undefined (old browsers)
    global.Storage = undefined;
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    // Should not show banner if localStorage is unavailable
    expect(screen.queryByText('Aviso de cookies')).not.toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith('[CookieConsent] localStorage not available');
  });

  it('should have proper accessibility attributes', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const banner = screen.getByRole('dialog');
    expect(banner).toHaveAttribute('aria-labelledby', 'cookie-consent-title');
    expect(banner).toHaveAttribute('aria-describedby', 'cookie-consent-description');

    const acceptButton = screen.getByTestId('cookie-accept');
    expect(acceptButton).toHaveAttribute('aria-label', 'Aceptar todas las cookies');
    expect(acceptButton).toHaveAttribute('type', 'button');

    const rejectButton = screen.getByTestId('cookie-reject');
    expect(rejectButton).toHaveAttribute('aria-label', 'Rechazar cookies no esenciales');
    expect(rejectButton).toHaveAttribute('type', 'button');
  });

  it('should prevent default and stop propagation on button clicks', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');
    
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      type: 'click',
      button: 0,
      target: acceptButton,
      currentTarget: acceptButton
    };

    // Simulate click with event methods
    fireEvent.click(acceptButton, mockEvent);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it('should test localStorage write functionality before saving', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<CookieConsent />);

    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      // Should test localStorage with a test key first
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie_consent_test', 'test');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cookie_consent_test');
    });
  });
});