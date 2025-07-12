'use client';

import { useDrive } from '../context/drive-context';

export function useDriveAccounts() {
  const context = useDrive();
  
  return {
    accounts: context.accounts,
    loading: context.loading,
    error: context.error,
    refreshAccounts: context.refreshAccounts,
    connectAccount: async () => {
      // Initiate OAuth flow
      window.location.href = '/api/drive/auth/connect';
    },
    disconnectAccount: context.disconnectAccount,
  };
}