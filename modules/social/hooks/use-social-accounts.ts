import { useCallback } from 'react';
import { useSocial } from '../context/social-context';
import { SocialAccount } from '../types';

export function useSocialAccounts(platformName?: string) {
  const { accounts, isLoading, refreshAccounts, disconnectAccount } = useSocial();

  // Filter accounts by platform if specified
  const filteredAccounts = platformName
    ? accounts.filter(acc => acc.platform?.name === platformName)
    : accounts;

  // Group accounts by platform
  const accountsByPlatform = useCallback(() => {
    const grouped: Record<string, SocialAccount[]> = {};
    
    accounts.forEach(account => {
      const platform = account.platform?.name || 'unknown';
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push(account);
    });

    return grouped;
  }, [accounts]);

  // Check if a platform is connected
  const isPlatformConnected = useCallback((platform: string) => {
    return accounts.some(acc => acc.platform?.name === platform && acc.is_active);
  }, [accounts]);

  // Get account by ID
  const getAccount = useCallback((accountId: string) => {
    return accounts.find(acc => acc.id === accountId);
  }, [accounts]);

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    accountsByPlatform: accountsByPlatform(),
    isLoading,
    refreshAccounts,
    disconnectAccount,
    isPlatformConnected,
    getAccount,
  };
}