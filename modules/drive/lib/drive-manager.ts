import { createClient } from '@postoko/database';
import type { DriveFile } from '../types';

// TODO: Update when database types are regenerated
type DbDriveFile = {
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

export class DriveManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Get available files from monitored folders
   */
  async getAvailableFiles(
    userId: string,
    folderIds?: string[]
  ): Promise<DbDriveFile[]> {
    let query = this.supabase
      .from('drive_files')
      .select('*')
      .eq('status', 'available');

    // If folderIds provided, filter by them
    if (folderIds && folderIds.length > 0) {
      query = query.in('folder_id', folderIds);
    } else {
      // Otherwise get all folders for the user
      const { data: folders } = await this.supabase
        .from('monitored_folders')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (folders && folders.length > 0) {
        const folderIdList = folders.map(f => f.id);
        query = query.in('folder_id', folderIdList);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Mark a file as scheduled
   */
  async markFileAsScheduled(fileId: string): Promise<void> {
    const { error } = await this.supabase
      .from('drive_files')
      .update({ 
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (error) {
      throw error;
    }
  }

  /**
   * Mark a file as posted
   */
  async markFileAsPosted(fileId: string): Promise<void> {
    const { error } = await this.supabase
      .from('drive_files')
      .update({ 
        status: 'posted',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('drive_files')
      .select('drive_file_id, folder_id')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      throw new Error('File not found');
    }

    // In a real implementation, this would call the Drive API
    // For now, return a placeholder
    return `/api/drive/files/${fileId}/download`;
  }
}