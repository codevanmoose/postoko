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
export { requireAuth, getOptionalAuth } from './lib/api-middleware';
export type { AuthenticatedRequest } from './lib/api-middleware';

// Module metadata
export const MODULE_NAME = 'auth';
export const MODULE_VERSION = '0.1.0';