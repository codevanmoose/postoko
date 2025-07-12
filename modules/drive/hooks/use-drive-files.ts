'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@postoko/database';
import type { DriveFile } from '../types';

interface UseDriveFilesOptions {
  folderId?: string;
  status?: 'available' | 'scheduled' | 'posted';
  limit?: number;
}

export function useDriveFiles(options: UseDriveFilesOptions = {}) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadFiles();
  }, [options.folderId, options.status, options.limit]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('drive_files')
        .select('*');

      if (options.folderId) {
        query = query.eq('monitored_folder_id', options.folderId);
      }

      if (options.status) {
        if (options.status === 'available') {
          query = query.eq('is_available', true).eq('is_blacklisted', false);
        } else if (options.status === 'scheduled' || options.status === 'posted') {
          // TODO: Implement status tracking for scheduled/posted files
          query = query.eq('is_available', true);
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      // Cast to DriveFile[] since database types are incomplete
      setFiles((data as DriveFile[]) || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    files,
    loading,
    error,
    refresh: loadFiles,
  };
}