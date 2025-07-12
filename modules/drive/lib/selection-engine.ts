import { createClient } from '@postoko/database';
import type { SelectionStrategy, SelectionFilters } from '../types';

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

export class SelectionEngine {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async selectFiles(
    userId: string,
    folderIds: string[],
    count: number,
    options?: {
      strategy?: SelectionStrategy;
      filters?: SelectionFilters;
    }
  ): Promise<DriveFile[]> {
    const { strategy = 'random', filters = {} } = options || {};

    let query = this.supabase
      .from('drive_files')
      .select('*')
      .in('folder_id', folderIds)
      .eq('status', 'available');

    // Apply filters
    if (filters.mimeTypes && filters.mimeTypes.length > 0) {
      query = query.in('mime_type', filters.mimeTypes);
    }

    if (filters.minSize) {
      query = query.gte('size', filters.minSize);
    }

    if (filters.maxSize) {
      query = query.lte('size', filters.maxSize);
    }

    // Apply strategy
    switch (strategy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'least_posted':
        // This would require a join with posting_history
        // For now, just use creation date
        query = query.order('created_at', { ascending: true });
        break;
      case 'random':
      default:
        // Postgres doesn't have a built-in random order, so we'll fetch all and randomize
        break;
    }

    const { data, error } = await query.limit(strategy === 'random' ? 100 : count);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // If random strategy, shuffle and limit
    if (strategy === 'random') {
      const shuffled = data.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    return data;
  }
}