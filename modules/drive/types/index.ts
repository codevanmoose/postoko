// Google Drive Types
export interface DriveAccount {
  id: string;
  user_id: string;
  google_account_id: string;
  email: string;
  display_name?: string;
  access_token?: string; // Encrypted in DB
  refresh_token?: string; // Encrypted in DB
  token_expires_at?: string;
  scopes: string[];
  is_active: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MonitoredFolder {
  id: string;
  drive_account_id: string;
  folder_id: string;
  folder_name: string;
  folder_path?: string;
  parent_folder_id?: string;
  is_active: boolean;
  priority: number;
  last_scanned_at?: string;
  next_scan_at?: string;
  total_files: number;
  available_files: number;
  settings: FolderSettings;
  created_at: string;
  updated_at: string;
}

export interface FolderSettings {
  exclude_subfolders?: boolean;
  file_extensions?: string[];
  min_file_size?: number;
  max_file_size?: number;
  scan_interval_hours?: number;
}

export interface DriveFile {
  id: string;
  monitored_folder_id: string;
  file_id: string;
  file_name: string;
  mime_type: string;
  file_size?: number;
  width?: number;
  height?: number;
  thumbnail_url?: string;
  download_url?: string;
  md5_checksum?: string;
  created_time?: string;
  modified_time?: string;
  taken_time?: string;
  metadata: FileMetadata;
  is_available: boolean;
  is_blacklisted: boolean;
  last_used_at?: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  description?: string;
  camera_make?: string;
  camera_model?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  tags?: string[];
  ai_description?: string;
  has_faces?: boolean;
  is_screenshot?: boolean;
}

export interface FileCache {
  id: string;
  drive_file_id: string;
  cache_key: string;
  storage_path: string;
  file_size?: number;
  mime_type?: string;
  is_thumbnail: boolean;
  expires_at?: string;
  last_accessed_at: string;
  access_count: number;
  created_at: string;
}

export interface ScanHistory {
  id: string;
  monitored_folder_id: string;
  scan_type: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed';
  files_found: number;
  files_added: number;
  files_updated: number;
  files_removed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

// API Types
export interface ConnectDriveRequest {
  redirect_uri: string;
}

export interface ConnectDriveResponse {
  auth_url: string;
}

export interface DriveAuthCallback {
  code: string;
  state?: string;
}

export interface AddMonitoredFolderRequest {
  drive_account_id: string;
  folder_id: string;
  folder_name: string;
  folder_path?: string;
  parent_folder_id?: string;
  priority?: number;
  settings?: FolderSettings;
}

export interface FileSelectionCriteria {
  folder_priorities?: Record<string, number>;
  chronological?: boolean;
  allow_repeats?: boolean;
  minimum_gap_days?: number;
  exclude_blacklisted?: boolean;
  mime_types?: string[];
  min_resolution?: { width: number; height: number };
}

export interface NextFileSelection {
  file: DriveFile;
  folder: MonitoredFolder;
  reason: string;
  alternatives: DriveFile[];
}

// Context Types
export interface DriveContextValue {
  accounts: DriveAccount[];
  folders: MonitoredFolder[];
  loading: boolean;
  error: Error | null;
  connectAccount: () => Promise<string>;
  disconnectAccount: (accountId: string) => Promise<void>;
  addMonitoredFolder: (data: AddMonitoredFolderRequest) => Promise<void>;
  removeMonitoredFolder: (folderId: string) => Promise<void>;
  scanFolder: (folderId: string) => Promise<void>;
  getNextFile: (criteria?: FileSelectionCriteria) => Promise<NextFileSelection | null>;
  markFileUsed: (fileId: string) => Promise<void>;
  blacklistFile: (fileId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

// Google API Types
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
    location?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
    time?: string;
    cameraMake?: string;
    cameraModel?: string;
  };
  parents?: string[];
  md5Checksum?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

// Selection Engine Types
export type SelectionStrategy = 'random' | 'oldest' | 'newest' | 'least_posted';

export interface SelectionFilters {
  mimeTypes?: string[];
  minSize?: number;
  maxSize?: number;
  excludeUsedWithin?: number; // days
}

export interface SelectionScore {
  file_id: string;
  score: number;
  factors: {
    folder_priority: number;
    time_since_use: number;
    seasonal_relevance: number;
    randomness: number;
  };
}

// Cache Types
export interface CachePolicy {
  thumbnails: { ttl: number; maxSize: number };
  full_images: { ttl: number; maxSize: number };
  metadata: { ttl: number };
}

// Storage Quotas (by subscription tier)
export const STORAGE_QUOTAS = {
  free: 1 * 1024 * 1024 * 1024, // 1GB
  pro: 10 * 1024 * 1024 * 1024, // 10GB
  enterprise: 100 * 1024 * 1024 * 1024, // 100GB
} as const;

// Google Drive Scopes
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
] as const;