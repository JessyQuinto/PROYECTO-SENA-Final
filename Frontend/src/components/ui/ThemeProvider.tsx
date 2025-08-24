import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  ReactNode 
} from 'react';

// Enhanced theme configuration interface
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  autoSwitchTime?: {
    lightStart: string; // e.g., "06:00"
    darkStart: string;  // e.g., "18:00"
  };
}

export interface ThemeContextValue {
  config: ThemeConfig;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setReducedMotion: (enabled: boolean) => void;
  toggleTheme: () => void;
  resetToDefaults: () => void;
  isSystemDark: boolean;
  isTransitioning: boolean;
}

const defaultConfig: ThemeConfig = {
  mode: 'system',
  accentColor: '#00a67e',
  fontSize: 'md',
  reducedMotion: false,
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Local storage helpers with error handling
const getStoredConfig = (): Partial<ThemeConfig> => {
  try {
    const stored = localStorage.getItem('theme-config');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to parse stored theme config:', error);
    return {};
  }
};

const setStoredConfig = (config: ThemeConfig): void => {
  try {
    localStorage.setItem('theme-config', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to store theme config:', error);
  }
};

// Apply theme to document
const applyTheme = (
  theme: 'light' | 'dark', 
  config: ThemeConfig, 
  isTransitioning: boolean = false
): void => {
  const root = document.documentElement;
  const body = document.body;
  
  // Add transition class for smooth switching
  if (isTransitioning) {
    body.classList.add('theme-transitioning');
  }
  
  // Remove existing theme classes
  root.classList.remove('nord-dark', 'nord-light', 'dark', 'light');
  
  // Apply new theme
  if (theme === 'dark') {
    root.classList.add('nord-dark', 'dark');
  } else {
    root.classList.add('nord-light', 'light');
  }
  
  // Apply accent color as CSS custom property
  root.style.setProperty('--color-brand-primary', config.accentColor);
  
  // Apply font size scaling
  const fontSizeScale = {
    sm: '0.875',
    md: '1',
    lg: '1.125'
  };
  root.style.setProperty('--font-size-scale', fontSizeScale[config.fontSize]);
  
  // Apply reduced motion preference
  if (config.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
  
  // Remove transition class after animation
  if (isTransitioning) {
    setTimeout(() => {
      body.classList.remove('theme-transitioning');
    }, 200);
  }
};

// Custom hook for media query detection
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    // Add listeners with fallbacks for older browsers
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
    } else {
      // Safari fallback
      mq.addListener(onChange);
    }
    
    // Set initial value
    setMatches(mq.matches);
    
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', onChange);
      } else {
        mq.removeListener(onChange);
      }
    };
  }, [query]);

  return matches;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize config from stored values
  const [config, setConfig] = useState<ThemeConfig>(() => ({
    ...defaultConfig,
    ...getStoredConfig(),
  }));
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Detect system preferences
  const isSystemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Calculate effective theme
  const effectiveTheme: 'light' | 'dark' = 
    config.mode === 'system' ? (isSystemDark ? 'dark' : 'light') : config.mode;

  // Apply theme whenever config or system preference changes
  useEffect(() => {
    applyTheme(effectiveTheme, config, isTransitioning);
  }, [effectiveTheme, config, isTransitioning]);

  // Store config changes
  useEffect(() => {
    setStoredConfig(config);
  }, [config]);

  // Update reduced motion preference based on system setting
  useEffect(() => {
    if (prefersReducedMotion && !config.reducedMotion) {
      setConfig(prev => ({ ...prev, reducedMotion: true }));
    }
  }, [prefersReducedMotion, config.reducedMotion]);

  // Theme control functions
  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    setIsTransitioning(true);
    setConfig(prev => ({ ...prev, mode }));
    setTimeout(() => setIsTransitioning(false), 200);
  }, []);

  const setAccentColor = useCallback((accentColor: string) => {
    setConfig(prev => ({ ...prev, accentColor }));
  }, []);

  const setFontSize = useCallback((fontSize: 'sm' | 'md' | 'lg') => {
    setConfig(prev => ({ ...prev, fontSize }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setConfig(prev => ({ ...prev, reducedMotion }));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsTransitioning(true);
    setConfig(prev => {
      const newMode = effectiveTheme === 'dark' ? 'light' : 'dark';
      return { ...prev, mode: newMode };
    });
    setTimeout(() => setIsTransitioning(false), 200);
  }, [effectiveTheme]);

  const resetToDefaults = useCallback(() => {
    setIsTransitioning(true);
    setConfig(defaultConfig);
    setTimeout(() => setIsTransitioning(false), 200);
  }, []);

  const contextValue: ThemeContextValue = {
    config,
    effectiveTheme,
    setThemeMode,
    setAccentColor,
    setFontSize,
    setReducedMotion,
    toggleTheme,
    resetToDefaults,
    isSystemDark,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks
export const useThemeMode = () => {
  const { effectiveTheme, setThemeMode, toggleTheme } = useTheme();
  return { theme: effectiveTheme, setTheme: setThemeMode, toggleTheme };
};

export const useThemePreferences = () => {
  const { 
    config, 
    setAccentColor, 
    setFontSize, 
    setReducedMotion, 
    resetToDefaults 
  } = useTheme();
  
  return {
    accentColor: config.accentColor,
    fontSize: config.fontSize,
    reducedMotion: config.reducedMotion,
    setAccentColor,
    setFontSize,
    setReducedMotion,
    resetToDefaults,
  };
};

export default ThemeProvider;