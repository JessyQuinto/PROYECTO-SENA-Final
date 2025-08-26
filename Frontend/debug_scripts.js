/**
 * Debug Scripts for Logout and Cookie Consent Issues
 * Copy and paste these functions into your browser console to debug issues
 */

// === LOGOUT DEBUGGING SCRIPTS ===

/**
 * Test localStorage functionality and audit current keys
 */
function debugLocalStorage() {
  console.log('=== LOCALSTORAGE DEBUG AUDIT ===');

  try {
    // Test basic localStorage functionality
    localStorage.setItem('test_key', 'test_value');
    const testValue = localStorage.getItem('test_key');
    localStorage.removeItem('test_key');

    if (testValue === 'test_value') {
      console.log('✅ localStorage basic functionality: OK');
    } else {
      console.error('❌ localStorage basic functionality: FAILED');
      return;
    }

    // Audit all current keys
    const allKeys = Object.keys(localStorage);
    console.log('📦 Current localStorage keys:', allKeys);

    // Categorize keys
    const userKeys = allKeys.filter(
      key =>
        key.includes('user_') ||
        key.includes('cart_') ||
        key.includes('profile_') ||
        key.includes('preferences_')
    );
    const authKeys = allKeys.filter(key => key.includes('sb-'));
    const systemKeys = allKeys.filter(
      key =>
        key.includes('theme') ||
        key.includes('language') ||
        key.includes('cookie_consent')
    );

    console.log('👤 User-specific keys:', userKeys);
    console.log('🔐 Auth keys (Supabase):', authKeys);
    console.log('⚙️ System keys:', systemKeys);

    // Show key values (truncated for security)
    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      const displayValue =
        value && value.length > 50 ? value.substring(0, 50) + '...' : value;
      console.log(`  ${key}: ${displayValue}`);
    });
  } catch (error) {
    console.error('❌ localStorage error:', error);
  }

  console.log('=== END LOCALSTORAGE AUDIT ===\n');
}

/**
 * Simulate logout and track what happens to storage
 */
function debugLogoutSequence() {
  console.log('=== LOGOUT SEQUENCE DEBUG ===');

  // Record state before logout
  const beforeKeys = Object.keys(localStorage);
  console.log('📋 localStorage keys BEFORE logout:', beforeKeys);

  // Listen for storage events
  const storageListener = e => {
    console.log('🔔 Storage event detected:', {
      key: e.key,
      oldValue: e.oldValue?.substring(0, 50),
      newValue: e.newValue?.substring(0, 50),
      url: e.url,
    });
  };

  const customListener = e => {
    console.log('🔔 Custom logout event detected:', e.detail);
  };

  window.addEventListener('storage', storageListener);
  window.addEventListener('userLoggedOut', customListener);

  // Trigger logout if user is logged in
  if (window.useAuth) {
    console.log('🚪 Triggering logout...');
    // Note: This assumes you have access to the auth context
    // In reality, you'd click the logout button in the UI
    console.log('⚠️ Please click the logout button in the UI to test');
  } else {
    console.log(
      '⚠️ No auth context found. Please click logout button manually.'
    );
  }

  // Check after a delay
  setTimeout(() => {
    const afterKeys = Object.keys(localStorage);
    console.log('📋 localStorage keys AFTER logout:', afterKeys);

    const removedKeys = beforeKeys.filter(key => !afterKeys.includes(key));
    const persistentKeys = beforeKeys.filter(key => afterKeys.includes(key));
    const newKeys = afterKeys.filter(key => !beforeKeys.includes(key));

    console.log('🗑️ Keys removed during logout:', removedKeys);
    console.log('📌 Keys that persisted:', persistentKeys);
    console.log('🆕 New keys after logout:', newKeys);

    // Clean up listeners
    window.removeEventListener('storage', storageListener);
    window.removeEventListener('userLoggedOut', customListener);

    console.log('=== END LOGOUT SEQUENCE DEBUG ===\n');
  }, 3000);
}

/**
 * Force clean all user-related data (emergency cleanup)
 */
function forceCleanUserData() {
  console.log('=== FORCE CLEANING USER DATA ===');

  const beforeCount = Object.keys(localStorage).length;

  // Remove all user-related keys
  const keysToRemove = Object.keys(localStorage).filter(
    key =>
      key.includes('user_') ||
      key.includes('cart_') ||
      key.includes('profile_') ||
      key.includes('preferences_') ||
      key.includes('sb-') ||
      key.includes('supabase')
  );

  console.log('🗑️ Removing keys:', keysToRemove);

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
    } catch (e) {
      console.error(`❌ Failed to remove ${key}:`, e);
    }
  });

  // Clear session storage
  sessionStorage.clear();
  console.log('🧹 SessionStorage cleared');

  // Dispatch events
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(
    new CustomEvent('userLoggedOut', {
      detail: { timestamp: Date.now(), forced: true },
    })
  );
  console.log('📢 Storage events dispatched');

  const afterCount = Object.keys(localStorage).length;
  console.log(`📊 Cleanup complete: ${beforeCount} → ${afterCount} keys`);

  console.log('=== END FORCE CLEAN ===\n');
}

// === COOKIE CONSENT DEBUGGING SCRIPTS ===

/**
 * Test cookie consent localStorage functionality
 */
function debugCookieConsent() {
  console.log('=== COOKIE CONSENT DEBUG ===');

  const COOKIE_KEY = 'cookie_consent';

  // Check current state
  const currentConsent = localStorage.getItem(COOKIE_KEY);
  console.log('🍪 Current cookie consent:', currentConsent);

  if (currentConsent) {
    try {
      const parsed = JSON.parse(currentConsent);
      console.log('📋 Parsed consent data:', parsed);
    } catch (e) {
      console.error('❌ Error parsing consent:', e);
    }
  }

  // Test writing consent
  console.log('✏️ Testing consent write...');
  try {
    const testConsent = {
      value: 'test',
      at: new Date().toISOString(),
      timestamp: Date.now(),
    };

    localStorage.setItem(COOKIE_KEY, JSON.stringify(testConsent));
    console.log('✅ Test consent write: SUCCESS');

    // Verify read
    const readBack = localStorage.getItem(COOKIE_KEY);
    const parsed = JSON.parse(readBack);

    if (parsed.value === 'test') {
      console.log('✅ Test consent read: SUCCESS');
    } else {
      console.error('❌ Test consent read: FAILED');
    }

    // Clean up test
    localStorage.removeItem(COOKIE_KEY);
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.error('❌ Cookie consent test failed:', error);
  }

  console.log('=== END COOKIE CONSENT DEBUG ===\n');
}

/**
 * Reset cookie consent to force banner to show
 */
function resetCookieConsent() {
  console.log('🔄 Resetting cookie consent...');

  try {
    localStorage.removeItem('cookie_consent');
    console.log('✅ Cookie consent removed from localStorage');

    // Dispatch storage event to notify components
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'cookie_consent',
        oldValue: 'some_value',
        newValue: null,
        url: window.location.href,
      })
    );
    console.log('📢 Storage event dispatched');

    // Force page refresh to show banner
    setTimeout(() => {
      console.log('🔄 Refreshing page to show cookie banner...');
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error resetting cookie consent:', error);
  }
}

/**
 * Test cookie consent button functionality
 */
function testCookieButtons() {
  console.log('=== TESTING COOKIE BUTTONS ===');

  // Find cookie consent buttons
  const acceptButton = document.querySelector('[data-testid="cookie-accept"]');
  const rejectButton = document.querySelector('[data-testid="cookie-reject"]');

  console.log('🔍 Accept button found:', !!acceptButton);
  console.log('🔍 Reject button found:', !!rejectButton);

  if (acceptButton) {
    console.log('📍 Accept button details:', {
      tagName: acceptButton.tagName,
      disabled: acceptButton.disabled,
      classList: Array.from(acceptButton.classList),
      style: acceptButton.style.cssText,
      onclick: !!acceptButton.onclick,
    });
  }

  if (rejectButton) {
    console.log('📍 Reject button details:', {
      tagName: rejectButton.tagName,
      disabled: rejectButton.disabled,
      classList: Array.from(rejectButton.classList),
      style: rejectButton.style.cssText,
      onclick: !!rejectButton.onclick,
    });
  }

  // Test button click simulation
  if (acceptButton && !acceptButton.disabled) {
    console.log('🖱️ Testing accept button click...');

    // Add event listener to track the click
    const clickHandler = e => {
      console.log('✅ Accept button click detected:', e);
      console.log('📊 Event details:', {
        type: e.type,
        button: e.button,
        target: e.target.tagName,
        defaultPrevented: e.defaultPrevented,
      });
    };

    acceptButton.addEventListener('click', clickHandler, { once: true });

    // Simulate click
    setTimeout(() => {
      acceptButton.click();
      console.log('🖱️ Accept button click simulated');
    }, 500);
  }

  console.log('=== END COOKIE BUTTON TEST ===\n');
}

// === COMPONENT STATE DEBUGGING ===

/**
 * Debug component re-render behavior
 */
function debugComponentState() {
  console.log('=== COMPONENT STATE DEBUG ===');

  // Check if React DevTools is available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
  } else {
    console.log(
      '⚠️ React DevTools not detected - install for better debugging'
    );
  }

  // Monitor DOM changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        const removedNodes = Array.from(mutation.removedNodes);

        if (addedNodes.length > 0 || removedNodes.length > 0) {
          console.log('🔄 DOM change detected:', {
            target: mutation.target.tagName,
            added: addedNodes.length,
            removed: removedNodes.length,
          });
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('👁️ DOM observer started - watching for component changes');

  // Stop observer after 30 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('⏹️ DOM observer stopped');
  }, 30000);

  console.log('=== END COMPONENT STATE DEBUG ===\n');
}

// === DEBUG FUNCTIONS AVAILABLE ===
// Run these in the browser console to debug various issues

// 🔑 AUTH & LOGOUT DEBUGGING
window.debugLogoutSequence = debugLogoutSequence;        // Debug logout sequence and storage
window.debugAuthStateChanges = debugAuthStateChanges;    // Monitor auth state changes
window.verifyNoFlickering = verifyNoFlickering;          // Verify no flickering during logout
window.forceCleanUserData = forceCleanUserData;          // Force clean all user data

// 🍪 COOKIE & STORAGE DEBUGGING
window.debugLocalStorage = debugLocalStorage;            // Audit localStorage contents
window.debugCookieConsent = debugCookieConsent;          // Debug cookie consent issues
window.debugStorageEvents = debugStorageEvents;          // Monitor storage events

// 📱 APP DEBUGGING
window.debugAppState = debugAppState;                    // Check app configuration
window.debugThemeSystem = debugThemeSystem;              // Debug theme switching
window.debugServiceWorker = debugServiceWorker;          // Check service worker status

console.log('🔧 Debug functions loaded. Available commands:');
console.log('  - debugLogoutSequence()     - Debug logout sequence');
console.log('  - debugAuthStateChanges()   - Monitor auth state changes');
console.log('  - verifyNoFlickering()      - Verify no flickering');
console.log('  - forceCleanUserData()      - Force clean user data');
console.log('  - debugLocalStorage()       - Audit localStorage');
console.log('  - debugCookieConsent()      - Debug cookie consent');
console.log('  - debugAppState()           - Check app config');
console.log('  - debugThemeSystem()        - Debug theme system');
console.log('  - debugServiceWorker()      - Check SW status');
console.log('');
console.log('💡 Tip: Use debugLogoutSequence() before clicking logout to monitor the process');
console.log('💡 Tip: Use verifyNoFlickering() to detect any UI flickering during logout');
