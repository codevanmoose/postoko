import { createClient } from '@postoko/database';
import { DriveClient } from './drive-client';
import type { 
  DriveAccount, 
  MonitoredFolder, 
  DriveFile, 
  GoogleDriveFile,
  ScanHistory 
} from '../types';

const supabase = createClient();

export class FolderScanner {
  private driveClient: DriveClient;
  private account: DriveAccount;
  private folder: MonitoredFolder;
  private scanId?: string;
  
  constructor(driveClient: DriveClient, account: DriveAccount, folder: MonitoredFolder) {
    this.driveClient = driveClient;
    this.account = account;
    this.folder = folder;
  }
  
  /**
   * Scan folder for files
   */
  async scan(scanType: 'manual' | 'scheduled' | 'webhook' = 'manual'): Promise<ScanHistory> {
    // Create scan history record
    const scan = await this.createScanRecord(scanType);
    this.scanId = scan.id;
    
    try {
      // Update scan status to running
      await this.updateScanStatus('running');
      
      // Get all files from Drive
      const driveFiles = await this.fetchAllFiles();
      
      // Process files
      const results = await this.processFiles(driveFiles);
      
      // Update folder counts
      await this.updateFolderCounts();
      
      // Complete scan
      const completedScan = await this.completeScan(results);
      
      return completedScan;
    } catch (error) {
      // Mark scan as failed
      await this.failScan(error as Error);
      throw error;
    }
  }
  
  /**
   * Create scan history record
   */
  private async createScanRecord(scanType: 'manual' | 'scheduled' | 'webhook'): Promise<ScanHistory> {
    const { data, error } = await supabase
      .from('scan_history')
      .insert({
        monitored_folder_id: this.folder.id,
        scan_type: scanType,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update scan status
   */
  private async updateScanStatus(status: ScanHistory['status']): Promise<void> {
    if (!this.scanId) return;
    
    await supabase
      .from('scan_history')
      .update({ status })
      .eq('id', this.scanId);
  }
  
  /**
   * Fetch all files from Drive folder
   */
  private async fetchAllFiles(): Promise<GoogleDriveFile[]> {
    const allFiles: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    
    do {
      const { files, nextPageToken } = await this.driveClient.listFiles(
        this.folder.folder_id,
        pageToken
      );
      
      allFiles.push(...files);
      pageToken = nextPageToken;
    } while (pageToken);
    
    return allFiles;
  }
  
  /**
   * Process files - add new, update existing, remove deleted
   */
  private async processFiles(driveFiles: GoogleDriveFile[]): Promise<{
    files_found: number;
    files_added: number;
    files_updated: number;
    files_removed: number;
  }> {
    const results = {
      files_found: driveFiles.length,
      files_added: 0,
      files_updated: 0,
      files_removed: 0,
    };
    
    // Get existing files from database
    const { data: existingFiles } = await supabase
      .from('drive_files')
      .select('file_id, md5_checksum')
      .eq('monitored_folder_id', this.folder.id);
    
    const existingMap = new Map(
      existingFiles?.map(f => [f.file_id, f.md5_checksum]) || []
    );
    
    // Process each Drive file
    for (const driveFile of driveFiles) {
      const existingChecksum = existingMap.get(driveFile.id);
      
      if (!existingChecksum) {
        // New file
        await this.addFile(driveFile);
        results.files_added++;
      } else if (existingChecksum !== driveFile.md5Checksum) {
        // Updated file
        await this.updateFile(driveFile);
        results.files_updated++;
      }
      
      // Remove from map to track deletions
      existingMap.delete(driveFile.id);
    }
    
    // Mark remaining files as unavailable (deleted from Drive)
    for (const [fileId] of existingMap) {
      await this.markFileUnavailable(fileId);
      results.files_removed++;
    }
    
    return results;
  }
  
  /**
   * Add new file to database
   */
  private async addFile(driveFile: GoogleDriveFile): Promise<void> {
    const fileData: Partial<DriveFile> = {
      monitored_folder_id: this.folder.id,
      file_id: driveFile.id,
      file_name: driveFile.name,
      mime_type: driveFile.mimeType,
      file_size: driveFile.size ? parseInt(driveFile.size) : undefined,
      width: driveFile.imageMediaMetadata?.width,
      height: driveFile.imageMediaMetadata?.height,
      thumbnail_url: driveFile.thumbnailLink,
      md5_checksum: driveFile.md5Checksum,
      created_time: driveFile.createdTime,
      modified_time: driveFile.modifiedTime,
      taken_time: driveFile.imageMediaMetadata?.time,
      metadata: {
        camera_make: driveFile.imageMediaMetadata?.cameraMake,
        camera_model: driveFile.imageMediaMetadata?.cameraModel,
        location: driveFile.imageMediaMetadata?.location ? {
          latitude: driveFile.imageMediaMetadata.location.latitude!,
          longitude: driveFile.imageMediaMetadata.location.longitude!,
          altitude: driveFile.imageMediaMetadata.location.altitude,
        } : undefined,
      },
      is_available: true,
      is_blacklisted: false,
      use_count: 0,
    };
    
    await supabase
      .from('drive_files')
      .insert(fileData);
  }
  
  /**
   * Update existing file
   */
  private async updateFile(driveFile: GoogleDriveFile): Promise<void> {
    const updates: Partial<DriveFile> = {
      file_name: driveFile.name,
      file_size: driveFile.size ? parseInt(driveFile.size) : undefined,
      thumbnail_url: driveFile.thumbnailLink,
      md5_checksum: driveFile.md5Checksum,
      modified_time: driveFile.modifiedTime,
      is_available: true,
    };
    
    await supabase
      .from('drive_files')
      .update(updates)
      .eq('monitored_folder_id', this.folder.id)
      .eq('file_id', driveFile.id);
  }
  
  /**
   * Mark file as unavailable
   */
  private async markFileUnavailable(fileId: string): Promise<void> {
    await supabase
      .from('drive_files')
      .update({ is_available: false })
      .eq('monitored_folder_id', this.folder.id)
      .eq('file_id', fileId);
  }
  
  /**
   * Update folder counts
   */
  private async updateFolderCounts(): Promise<void> {
    await supabase
      .from('monitored_folders')
      .update({
        last_scanned_at: new Date().toISOString(),
        next_scan_at: this.calculateNextScanTime(),
      })
      .eq('id', this.folder.id);
  }
  
  /**
   * Calculate next scan time based on settings
   */
  private calculateNextScanTime(): string {
    const scanIntervalHours = this.folder.settings.scan_interval_hours || 24;
    const nextScan = new Date();
    nextScan.setHours(nextScan.getHours() + scanIntervalHours);
    return nextScan.toISOString();
  }
  
  /**
   * Complete scan
   */
  private async completeScan(results: any): Promise<ScanHistory> {
    if (!this.scanId) throw new Error('No scan ID');
    
    const { data, error } = await supabase
      .from('scan_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(this.scanId).getTime(),
        ...results,
      })
      .eq('id', this.scanId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Mark scan as failed
   */
  private async failScan(error: Error): Promise<void> {
    if (!this.scanId) return;
    
    await supabase
      .from('scan_history')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', this.scanId);
  }
  
  /**
   * Scan all folders for an account
   */
  static async scanAccount(account: DriveAccount): Promise<void> {
    // Get all active folders for account
    const { data: folders } = await supabase
      .from('monitored_folders')
      .select('*')
      .eq('drive_account_id', account.id)
      .eq('is_active', true);
    
    if (!folders || folders.length === 0) return;
    
    // Create Drive client
    const driveClient = await DriveClient.forAccount(account);
    
    // Scan each folder
    for (const folder of folders) {
      try {
        const scanner = new FolderScanner(driveClient, account, folder);
        await scanner.scan('scheduled');
      } catch (error) {
        console.error(`Failed to scan folder ${folder.folder_name}:`, error);
      }
    }
  }
}