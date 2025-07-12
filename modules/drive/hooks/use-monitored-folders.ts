'use client';

import { useDrive } from '../context/drive-context';

export function useMonitoredFolders() {
  const context = useDrive();
  
  return {
    folders: context.folders,
    loading: context.loading,
    error: context.error,
    addFolder: context.addMonitoredFolder,
    removeFolder: context.removeMonitoredFolder,
    scanFolder: context.scanFolder,
    // Note: refreshFolders not available, using refreshAccounts which reloads all data
    refreshFolders: context.refreshAccounts,
  };
}