import React, { useEffect, useMemo, useState } from 'react';

type ThemePref = 'nord-dark' | 'nord-light' | 'auto';

function getInitialTheme(): ThemePref {
  try {
  const saved = localStorage.getItem('theme') as string | null;
  if (saved === 'nord-dark' || saved === 'nord-light') return saved;
  // migrate legacy 'system' to auto
  if (saved === 'system') return 'auto';
  return 'auto';
  } catch {
  return 'auto';
  }
}

function applyTheme(theme: 'nord-dark' | 'nord-light') {
  const root = document.documentElement;
  root.classList.remove('nord-dark', 'nord-light');
  if (theme === 'nord-dark') root.classList.add('nord-dark');
  if (theme === 'nord-light') root.classList.add('nord-light');
}

export const ThemeToggle: React.FC<{ className?: string }>=({ className })=>{
  const [pref, setPref] = useState<ThemePref>(getInitialTheme());

  const isDark = useMemo(()=>{
    if (typeof window === 'undefined') return false;
    if (pref === 'nord-dark') return true;
    if (pref === 'nord-light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },[pref]);

  // Apply theme and persist only for explicit preferences
  useEffect(()=>{
    const effective: 'nord-dark' | 'nord-light' = isDark ? 'nord-dark' : 'nord-light';
    applyTheme(effective);
    if (pref === 'nord-dark' || pref === 'nord-light') {
      try { localStorage.setItem('theme', pref); } catch {}
    } else {
      // auto: clear stored preference so index.html script follows system
      try { localStorage.removeItem('theme'); } catch {}
    }
  },[pref, isDark]);

  // In auto mode, react to system changes
  useEffect(()=>{
    if (pref !== 'auto' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { /* trigger re-render via state toggle */ setPref(p=>p); };
    mq.addEventListener?.('change', onChange);
    // Safari fallback
    mq.addListener?.(onChange as any);
    return () => {
      mq.removeEventListener?.('change', onChange);
      mq.removeListener?.(onChange as any);
    };
  },[pref]);

  const effectiveLabel = isDark ? 'Oscuro' : 'Claro';
  const label = `Preferencia de tema (${pref === 'auto' ? 'Automático' : effectiveLabel})`;

  const toggleLight = () => {
    // If already forced light, clicking again returns to auto
    setPref((p) => (p === 'nord-light' ? 'auto' : 'nord-light'));
  };
  const toggleDark = () => {
    // If already forced dark, clicking again returns to auto
    setPref((p) => (p === 'nord-dark' ? 'auto' : 'nord-dark'));
  };

  return (
    <div className={`theme-toggle ${className ?? ''}`} role="group" aria-label="Preferencia de tema">
      {/* Light */}
      <button
        type="button"
        title={pref === 'nord-light' ? 'Claro (clic para seguir sistema)' : 'Claro'}
        aria-pressed={pref === 'nord-light' || (pref === 'auto' && !isDark)}
        className={`seg ${(pref === 'nord-light' || (pref === 'auto' && !isDark)) ? 'active' : ''}`}
        onClick={toggleLight}
      >
  {/* Sun icon */}
  <svg className="sun-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
        <span className="sr-only">Claro</span>
      </button>
      {/* Dark */}
      <button
        type="button"
        title={pref === 'nord-dark' ? 'Oscuro (clic para seguir sistema)' : 'Oscuro'}
        aria-pressed={pref === 'nord-dark' || (pref === 'auto' && isDark)}
        className={`seg ${(pref === 'nord-dark' || (pref === 'auto' && isDark)) ? 'active' : ''}`}
        onClick={toggleDark}
      >
  {/* Moon icon */}
  <svg className="moon-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 118.646 3.646 7 7 0 0020.354 15.354z"/>
        </svg>
        <span className="sr-only">Oscuro</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
