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
    const authKeys = allKeys.filter(key => key.includes('sb-') || key.includes('tesoros_choco_auth'));
    const cacheKeys = allKeys.filter(key => key.startsWith('tesoros_choco_'));
    const systemKeys = allKeys.filter(
      key =>
        key.includes('theme') ||
        key.includes('language') ||
        key.includes('cookie_consent')
    );

    console.log('👤 User-specific keys:', userKeys);
    console.log('🔐 Auth keys (Supabase):', authKeys);
    console.log('💾 Cache keys:', cacheKeys);
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
      key.includes('supabase') ||
      key.includes('tesoros_choco_auth') ||
      key.startsWith('tesoros_choco_')
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

  // Clear cache manager if available
  if (window.__CACHE_MANAGER__) {
    window.__CACHE_MANAGER__.clear();
    console.log('💾 Cache manager cleared');
  }

  // Clear service worker cache
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.startsWith('tesoros-choco-')) {
          caches.delete(cacheName);
          console.log(`🗑️ Service worker cache cleared: ${cacheName}`);
        }
      });
    });
  }

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

// === CACHE DEBUGGING SCRIPTS ===

/**
 * Debug cache manager functionality
 */
function debugCacheManager() {
  console.log('=== CACHE MANAGER DEBUG ===');

  if (!window.__CACHE_MANAGER__) {
    console.error('❌ Cache manager not found');
    return;
  }

  try {
    const cache = window.__CACHE_MANAGER__;
    const stats = cache.getStats();
    
    console.log('📊 Cache manager stats:', stats);
    
    // Test cache operations
    const testKey = 'debug_test_key';
    const testData = { test: 'data', timestamp: Date.now() };
    
    console.log('🧪 Testing cache operations...');
    
    // Test set
    cache.set(testKey, testData, 60000); // 1 minute TTL
    console.log('✅ Cache set test: PASSED');
    
    // Test get
    const retrieved = cache.get(testKey);
    if (retrieved && retrieved.test === testData.test) {
      console.log('✅ Cache get test: PASSED');
    } else {
      console.log('❌ Cache get test: FAILED');
    }
    
    // Test delete
    cache.delete(testKey);
    const afterDelete = cache.get(testKey);
    if (afterDelete === null) {
      console.log('✅ Cache delete test: PASSED');
    } else {
      console.log('❌ Cache delete test: FAILED');
    }
    
    // Show current cache state
    const finalStats = cache.getStats();
    console.log('📊 Final cache stats:', finalStats);
    
  } catch (error) {
    console.error('❌ Cache manager debug failed:', error);
  }

  console.log('=== END CACHE MANAGER DEBUG ===\n');
}

/**
 * Debug service worker cache
 */
async function debugServiceWorkerCache() {
  console.log('=== SERVICE WORKER CACHE DEBUG ===');

  if (!('caches' in window)) {
    console.error('❌ Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.log('📦 Available caches:', cacheNames);
    
    const tesorosCaches = cacheNames.filter(name => name.startsWith('tesoros-choco-'));
    console.log('🎯 Tesoros Chocó caches:', tesorosCaches);
    
    for (const cacheName of tesorosCaches) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      console.log(`📋 ${cacheName}: ${keys.length} items`);
      
      // Show first few items
      keys.slice(0, 3).forEach(key => {
        console.log(`  - ${key.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Service worker cache debug failed:', error);
  }

  console.log('=== END SERVICE WORKER CACHE DEBUG ===\n');
}

/**
 * Emergency cache cleanup using app functions
 */
function emergencyCacheCleanup() {
  console.log('=== EMERGENCY CACHE CLEANUP ===');
  
  if (window.__EMERGENCY_CLEANUP__) {
    console.log('🚨 Using app emergency cleanup functions...');
    window.__EMERGENCY_CLEANUP__.clearAllCache();
  } else {
    console.log('⚠️ App emergency functions not available, using manual cleanup...');
    forceCleanUserData();
  }
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

// === USAGE INSTRUCTIONS ===
console.log(`
🔧 DEBUG SCRIPTS LOADED
=======================

Available functions:
• debugLocalStorage() - Audit localStorage keys and test functionality
• debugLogoutSequence() - Monitor logout process and storage changes
• forceCleanUserData() - Emergency cleanup of all user data
• debugCacheManager() - Test cache manager functionality
• debugServiceWorkerCache() - Debug service worker cache
• emergencyCacheCleanup() - Use app emergency cleanup functions
• debugCookieConsent() - Test cookie consent localStorage functionality
• resetCookieConsent() - Reset consent to show banner again
• testCookieButtons() - Test cookie consent button functionality
• debugComponentState() - Monitor component re-renders and DOM changes

Quick test sequence:
1. debugLocalStorage() - Check current state
2. debugCacheManager() - Test cache functionality
3. debugServiceWorkerCache() - Check service worker cache
4. Login to your app
5. debugLogoutSequence() - Then click logout
6. resetCookieConsent() - Test cookie banner
7. testCookieButtons() - Test button functionality

For emergency cleanup: emergencyCacheCleanup()

Keyboard shortcut: Ctrl+Shift+R for emergency cleanup
`);
