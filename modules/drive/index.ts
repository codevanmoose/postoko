// Google Drive Module Exports

// Context and Provider
export { DriveProvider, useDrive } from './context/drive-context';

// Hooks
export { useDriveAccounts } from './hooks/use-drive-accounts';
export { useMonitoredFolders } from './hooks/use-monitored-folders';
export { useDriveFiles } from './hooks/use-drive-files';

// Components
export { DriveConnectButton } from './components/drive-connect-button';

// Types
export * from './types';

// Module metadata
export const MODULE_NAME = 'drive';
export const MODULE_VERSION = '0.1.0';

// Note: Server-side libraries (GoogleAuth, DriveClient, etc.) are available
// via '@postoko/drive/server' to avoid importing Node.js dependencies in the browser