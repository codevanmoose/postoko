'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@postoko/database';

// TODO: Update when database types are regenerated
type DriveFile = {
  id: string;
  folder_id: string;
  drive_file_id: string;
  name: string;
  mime_type: string;
  size: number;
  md5_checksum: string;
  created_time: string;
  modified_time: string;
  thumbnail_url: string | null;
  download_url: string | null;
  status: 'available' | 'scheduled' | 'posted';
  post_count: number;
  last_posted_at: string | null;
  created_at: string;
  updated_at: string;
};

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
        query = query.eq('folder_id', options.folderId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setFiles(data || []);
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