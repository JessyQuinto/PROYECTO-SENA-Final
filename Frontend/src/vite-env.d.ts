/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_DEBUG_LOGGING: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  readonly VITE_ENABLE_ERROR_REPORTING: string;
  readonly VITE_ENABLE_CACHE_DEBUG: string;
  readonly VITE_ENABLE_CSP: string;
  readonly VITE_ENABLE_RATE_LIMITING: string;
  readonly VITE_MAX_FILE_SIZE_MB: string;
  readonly VITE_SESSION_TIMEOUT_HOURS: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_ENABLE_REACT_QUERY_DEVTOOLS: string;
  readonly VITE_ENABLE_HOT_RELOAD: string;
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
  readonly VITE_HOTJAR_ID: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_WEB_VITALS_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
