'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';
import type {
  DriveContextValue,
  DriveAccount,
  MonitoredFolder,
  AddMonitoredFolderRequest,
  FileSelectionCriteria,
  NextFileSelection,
} from '../types';

const DriveContext = createContext<DriveContextValue | undefined>(undefined);
const supabase = createClient();

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [folders, setFolders] = useState<MonitoredFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      loadDriveData();
    } else {
      setAccounts([]);
      setFolders([]);
      setLoading(false);
    }
  }, [user]);

  const loadDriveData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('drive_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load monitored folders
      if (accountsData && accountsData.length > 0) {
        const accountIds = accountsData.map(a => a.id);
        
        const { data: foldersData, error: foldersError } = await supabase
          .from('monitored_folders')
          .select('*')
          .in('drive_account_id', accountIds)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (foldersError) throw foldersError;
        setFolders(foldersData || []);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load Drive data:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (): Promise<string> => {
    try {
      const response = await fetch('/api/drive/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uri: `${window.location.origin}/api/drive/auth/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Drive connection');
      }

      const { auth_url } = await response.json();
      return auth_url;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const disconnectAccount = async (accountId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/drive/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      await loadDriveData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const addMonitoredFolder = async (data: AddMonitoredFolderRequest): Promise<void> => {
    try {
      const response = await fetch('/api/drive/folders/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add monitored folder');
      }

      await loadDriveData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const removeMonitoredFolder = async (folderId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/drive/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove folder');
      }

      await loadDriveData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const scanFolder = async (folderId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/drive/folders/${folderId}/scan`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to scan folder');
      }

      // Refresh folder data
      await loadDriveData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const getNextFile = async (
    criteria?: FileSelectionCriteria
  ): Promise<NextFileSelection | null> => {
    try {
      const response = await fetch('/api/drive/selection/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria || {}),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to get next file');
      }

      return await response.json();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const markFileUsed = async (fileId: string): Promise<void> => {
    try {
      const response = await fetch('/api/drive/selection/mark-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark file as used');
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const blacklistFile = async (fileId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}/blacklist`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to blacklist file');
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const refreshAccounts = async (): Promise<void> => {
    await loadDriveData();
  };

  const value: DriveContextValue = {
    accounts,
    folders,
    loading,
    error,
    connectAccount,
    disconnectAccount,
    addMonitoredFolder,
    removeMonitoredFolder,
    scanFolder,
    getNextFile,
    markFileUsed,
    blacklistFile,
    refreshAccounts,
  };

  return (
    <DriveContext.Provider value={value}>
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
}