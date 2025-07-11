// Google Drive Module Exports

// Context and Provider
export { DriveProvider, useDrive } from './context/drive-context';

// Components
export { DriveConnectButton } from './components/drive-connect-button';

// Types
export * from './types';

// Libraries
export { GoogleAuth, getGoogleAuth } from './lib/google-auth';
export { DriveClient } from './lib/drive-client';
export { FolderScanner } from './lib/folder-scanner';

// Module metadata
export const MODULE_NAME = 'drive';
export const MODULE_VERSION = '0.1.0';