import { createClient } from '@postoko/database';
import type { Database } from '@postoko/database';
import type { SelectionStrategy, SelectionFilters } from '../types';

type DriveFile = Database['public']['Tables']['drive_files']['Row'];

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