import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getGoogleAuth } from './google-auth';
import type { DriveAccount, GoogleDriveFile, GoogleDriveFolder } from '../types';

export class DriveClient {
  private drive: drive_v3.Drive;
  private account: DriveAccount;
  
  constructor(account: DriveAccount, authClient: OAuth2Client) {
    this.account = account;
    this.drive = google.drive({ version: 'v3', auth: authClient });
  }
  
  /**
   * Create Drive client for account
   */
  static async forAccount(account: DriveAccount): Promise<DriveClient> {
    const googleAuth = getGoogleAuth();
    const authClient = await googleAuth.getAuthenticatedClient(account);
    return new DriveClient(account, authClient);
  }
  
  /**
   * List folders
   */
  async listFolders(parentId?: string): Promise<GoogleDriveFolder[]> {
    const query = [
      "mimeType='application/vnd.google-apps.folder'",
      "trashed=false",
    ];
    
    if (parentId) {
      query.push(`'${parentId}' in parents`);
    }
    
    const response = await this.drive.files.list({
      q: query.join(' and '),
      fields: 'files(id,name,parents)',
      orderBy: 'name',
      pageSize: 100,
    });
    
    return response.data.files as GoogleDriveFolder[];
  }
  
  /**
   * Get folder by ID
   */
  async getFolder(folderId: string): Promise<GoogleDriveFolder> {
    const response = await this.drive.files.get({
      fileId: folderId,
      fields: 'id,name,parents',
    });
    
    return response.data as GoogleDriveFolder;
  }
  
  /**
   * Get folder path
   */
  async getFolderPath(folderId: string): Promise<string> {
    const path: string[] = [];
    let currentId = folderId;
    
    while (currentId) {
      try {
        const folder = await this.getFolder(currentId);
        path.unshift(folder.name);
        currentId = folder.parents?.[0] || '';
      } catch (error) {
        break; // Stop if we can't access parent
      }
    }
    
    return path.join('/');
  }
  
  /**
   * List files in folder
   */
  async listFiles(
    folderId: string,
    pageToken?: string
  ): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    const supportedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    
    const query = [
      `'${folderId}' in parents`,
      'trashed=false',
      `(${supportedMimeTypes.map(mt => `mimeType='${mt}'`).join(' or ')})`,
    ];
    
    const response = await this.drive.files.list({
      q: query.join(' and '),
      fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,imageMediaMetadata,parents,md5Checksum)',
      pageSize: 100,
      pageToken,
    });
    
    return {
      files: response.data.files as GoogleDriveFile[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }
  
  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,imageMediaMetadata,parents,md5Checksum',
    });
    
    return response.data as GoogleDriveFile;
  }
  
  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    return Buffer.from(response.data as ArrayBuffer);
  }
  
  /**
   * Get download URL
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    const file = await this.getFile(fileId);
    
    if (file.webContentLink) {
      return file.webContentLink;
    }
    
    // Generate temporary download URL
    const authClient = await getGoogleAuth().getAuthenticatedClient(this.account);
    const token = await authClient.getAccessToken();
    
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token.token}`;
  }
  
  /**
   * Check if folder has subfolders
   */
  async hasSubfolders(folderId: string): Promise<boolean> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
    });
    
    return (response.data.files?.length || 0) > 0;
  }
  
  /**
   * Get folder tree
   */
  async getFolderTree(
    parentId?: string,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) return [];
    
    const folders = await this.listFolders(parentId);
    
    const tree = await Promise.all(
      folders.map(async (folder) => ({
        id: folder.id,
        name: folder.name,
        children: await this.getFolderTree(folder.id, maxDepth, currentDepth + 1),
      }))
    );
    
    return tree;
  }
  
  /**
   * Search files
   */
  async searchFiles(
    query: string,
    folderId?: string
  ): Promise<GoogleDriveFile[]> {
    const searchQuery = [
      `name contains '${query}'`,
      'trashed=false',
    ];
    
    if (folderId) {
      searchQuery.push(`'${folderId}' in parents`);
    }
    
    const response = await this.drive.files.list({
      q: searchQuery.join(' and '),
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,imageMediaMetadata,parents,md5Checksum)',
      pageSize: 50,
    });
    
    return response.data.files as GoogleDriveFile[];
  }
  
  /**
   * Get storage quota
   */
  async getStorageQuota(): Promise<{
    usage: number;
    limit: number;
    usageInDrive: number;
    usageInDriveTrash: number;
  }> {
    const response = await this.drive.about.get({
      fields: 'storageQuota',
    });
    
    const quota = response.data.storageQuota!;
    
    return {
      usage: parseInt(quota.usage || '0'),
      limit: parseInt(quota.limit || '0'),
      usageInDrive: parseInt(quota.usageInDrive || '0'),
      usageInDriveTrash: parseInt(quota.usageInDriveTrash || '0'),
    };
  }
  
  /**
   * Watch folder for changes (using push notifications)
   */
  async watchFolder(
    folderId: string,
    webhookUrl: string
  ): Promise<string> {
    // Note: This requires domain verification and HTTPS webhook URL
    const response = await this.drive.files.watch({
      fileId: folderId,
      requestBody: {
        id: `folder-${folderId}-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
        expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(), // 7 days
      },
    });
    
    return response.data.id!;
  }
}