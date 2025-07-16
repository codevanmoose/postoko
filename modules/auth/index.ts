// Auth Module Exports

// Context and Provider
export { AuthProvider } from './context/auth-context';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Components
export * from './components';

// Lib
export { supabaseAuth } from './lib/supabase-auth';
// Note: API middleware (requireAuth, getOptionalAuth) should be imported directly from './lib/api-middleware' in API routes only

// Module metadata
export const MODULE_NAME = 'auth';
export const MODULE_VERSION = '0.1.0';