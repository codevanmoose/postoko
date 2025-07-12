import { createClient } from '@postoko/database';
import { DriveManager } from '@postoko/drive/server';
import { 
  ContentSelectionResult,
  SourceConfig,
  SourceType
} from '../types';

export class ContentSelector {
  private supabase = createClient();
  private driveManager = new DriveManager();

  // Select content based on source configuration
  async selectContent(
    userId: string,
    sourceType: SourceType,
    sourceConfig: SourceConfig
  ): Promise<ContentSelectionResult | null> {
    switch (sourceType) {
      case 'drive_folders':
        return this.selectFromDrive(userId, sourceConfig);
      case 'ai_prompt':
        return this.selectFromAI(userId, sourceConfig);
      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }
  }

  // Select content from Google Drive
  private async selectFromDrive(
    userId: string,
    config: SourceConfig
  ): Promise<ContentSelectionResult | null> {
    if (!config.folder_ids || config.folder_ids.length === 0) {
      throw new Error('No folders specified for content selection');
    }

    // Get available files from specified folders
    const files = await this.getAvailableFiles(userId, config.folder_ids, config.filters);
    
    if (files.length === 0) {
      return null;
    }

    // Apply selection strategy
    const selectedFile = await this.applySelectionStrategy(
      files,
      config.selection_strategy || 'random'
    );

    if (!selectedFile) {
      return null;
    }

    // Get recently posted files to avoid duplicates
    const recentlyPosted = await this.getRecentlyPostedFiles(userId, 30);
    
    // Skip if recently posted
    if (recentlyPosted.has(selectedFile.id)) {
      // Try to find another file
      const alternativeFiles = files.filter(f => !recentlyPosted.has(f.id));
      if (alternativeFiles.length > 0) {
        const alternativeFile = await this.applySelectionStrategy(
          alternativeFiles,
          config.selection_strategy || 'random'
        );
        if (alternativeFile) {
          return this.createDriveContentResult(alternativeFile);
        }
      }
      return null;
    }

    return this.createDriveContentResult(selectedFile);
  }

  // Select content using AI generation
  private async selectFromAI(
    userId: string,
    config: SourceConfig
  ): Promise<ContentSelectionResult | null> {
    // AI content generation will be implemented in the AI module
    // For now, return null
    return null;
  }

  // Get available files from folders
  private async getAvailableFiles(
    userId: string,
    folderIds: string[],
    filters?: SourceConfig['filters']
  ) {
    let query = this.supabase
      .from('drive_files')
      .select('*')
      .eq('user_id', userId)
      .in('folder_id', folderIds)
      .eq('is_folder', false);

    // Apply filters
    if (filters?.mime_types && filters.mime_types.length > 0) {
      query = query.in('mime_type', filters.mime_types);
    }

    if (filters?.min_size) {
      query = query.gte('size', filters.min_size);
    }

    if (filters?.max_size) {
      query = query.lte('size', filters.max_size);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Apply selection strategy
  private async applySelectionStrategy(
    files: any[],
    strategy: string
  ): Promise<any | null> {
    if (files.length === 0) return null;

    switch (strategy) {
      case 'random':
        return files[Math.floor(Math.random() * files.length)];
      
      case 'oldest':
        return files.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];
      
      case 'newest':
        return files.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      
      default:
        return files[0];
    }
  }

  // Get recently posted files
  private async getRecentlyPostedFiles(
    userId: string,
    days: number
  ): Promise<Set<string>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('queue_items')
      .select('content_id')
      .eq('user_id', userId)
      .eq('content_type', 'drive_file')
      .eq('status', 'posted')
      .gte('posted_at', startDate.toISOString())
      .not('content_id', 'is', null);

    if (error) throw error;

    return new Set((data || []).map(item => item.content_id));
  }

  // Create content result from Drive file
  private createDriveContentResult(file: any): ContentSelectionResult {
    // Determine if file is image or video
    const isImage = file.mime_type?.startsWith('image/');
    const isVideo = file.mime_type?.startsWith('video/');

    return {
      content_id: file.id,
      content_type: 'drive_file',
      media_urls: [file.download_url || file.web_view_link],
      suggested_caption: file.description || file.name?.replace(/\.[^/.]+$/, ''),
      suggested_hashtags: this.generateHashtags(file.name, file.description),
    };
  }

  // Generate hashtags from filename and description
  private generateHashtags(filename?: string, description?: string): string[] {
    const hashtags: string[] = [];
    
    // Extract words from filename (remove extension)
    if (filename) {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const words = nameWithoutExt
        .split(/[\s\-_]+/)
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase());
      
      hashtags.push(...words.slice(0, 3).map(w => `#${w}`));
    }

    // Extract hashtags from description
    if (description) {
      const existingHashtags = description.match(/#\w+/g) || [];
      hashtags.push(...existingHashtags.slice(0, 5));
    }

    // Remove duplicates
    return [...new Set(hashtags)].slice(0, 10);
  }

  // Check if content is available for posting
  async isContentAvailable(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<boolean> {
    try {
      if (contentType === 'drive_file') {
        const { data, error } = await this.supabase
          .from('drive_files')
          .select('id, trashed')
          .eq('id', contentId)
          .eq('user_id', userId)
          .single();

        return !error && data && !data.trashed;
      }

      // For other content types
      return true;
    } catch {
      return false;
    }
  }

  // Get content metadata
  async getContentMetadata(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<Record<string, any> | null> {
    if (contentType === 'drive_file') {
      const { data, error } = await this.supabase
        .from('drive_files')
        .select('*')
        .eq('id', contentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        name: data.name,
        mime_type: data.mime_type,
        size: data.size,
        download_url: data.download_url,
        web_view_link: data.web_view_link,
        thumbnail_url: data.thumbnail_url,
      };
    }

    return null;
  }

  // Get content usage statistics
  async getContentUsageStats(
    userId: string,
    folderIds?: string[]
  ): Promise<{
    total_files: number;
    posted_files: number;
    available_files: number;
    last_posted_date?: string;
  }> {
    // Get total files
    let filesQuery = this.supabase
      .from('drive_files')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_folder', false);

    if (folderIds && folderIds.length > 0) {
      filesQuery = filesQuery.in('folder_id', folderIds);
    }

    const { count: totalFiles } = await filesQuery;

    // Get posted files
    const { data: postedData } = await this.supabase
      .from('queue_items')
      .select('content_id, posted_at')
      .eq('user_id', userId)
      .eq('content_type', 'drive_file')
      .eq('status', 'posted')
      .not('content_id', 'is', null)
      .order('posted_at', { ascending: false });

    const postedIds = new Set((postedData || []).map(item => item.content_id));
    const lastPostedDate = postedData?.[0]?.posted_at;

    return {
      total_files: totalFiles || 0,
      posted_files: postedIds.size,
      available_files: (totalFiles || 0) - postedIds.size,
      last_posted_date: lastPostedDate,
    };
  }
}