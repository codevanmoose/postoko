import { createClient } from '@postoko/database';

// TODO: Update when database types are regenerated
type FileCache = {
  id: string;
  file_id: string;
  storage_url: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export class CacheManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async getCachedUrl(fileId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('file_cache')
      .select('storage_url, expires_at')
      .eq('file_id', fileId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (expiresAt < now) {
      // Cache expired, delete it
      await this.supabase
        .from('file_cache')
        .delete()
        .eq('file_id', fileId);
      return null;
    }

    return data.storage_url;
  }

  async setCachedUrl(
    fileId: string,
    storageUrl: string,
    expiresInHours: number = 24
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { error } = await this.supabase
      .from('file_cache')
      .upsert({
        file_id: fileId,
        storage_url: storageUrl,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }
  }

  async cleanExpiredCache(): Promise<void> {
    const { error } = await this.supabase
      .from('file_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw error;
    }
  }
}