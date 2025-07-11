# Google Drive Module Specification

## Overview
The Google Drive module enables users to connect their Google Drive accounts and monitor specific folders for images. It provides intelligent file selection, caching, and tracking to ensure a steady stream of content for social media posting.

## Features

### 1. Google Drive Authentication
- **OAuth 2.0 Integration**
  - Secure authentication flow
  - Minimal permission scopes (read-only)
  - Token refresh handling
  - Multiple account support
  
- **Permission Scopes**
  - `drive.readonly` - Read access to files
  - `drive.metadata.readonly` - Read file metadata
  - `drive.photos.readonly` - Access to Google Photos (optional)

### 2. Folder Management
- **Folder Selection**
  - Browse Drive folder structure
  - Select multiple folders to monitor
  - Exclude specific subfolders
  - Set folder priorities
  
- **Folder Monitoring**
  - Periodic scanning for new files
  - Change detection via Drive API
  - Webhook support for real-time updates
  - Folder statistics and insights

### 3. File Processing
- **Supported Formats**
  - Images: JPEG, PNG, WebP, HEIC
  - Maximum file size: 50MB
  - Minimum resolution: 800x800
  
- **Metadata Extraction**
  - EXIF data (camera, location, date)
  - Google Photos metadata
  - AI-generated descriptions
  - Face detection for privacy

### 4. Content Selection
- **Smart Selection Algorithm**
  - Chronological ordering
  - Random selection option
  - Seasonal awareness
  - Duplicate detection
  - Previously posted tracking
  
- **Selection Rules**
  - Minimum time between reposts
  - Blacklist specific files
  - Prioritize by metadata
  - Fair distribution across folders

### 5. File Management
- **Caching Strategy**
  - Local cache for performance
  - Thumbnail generation
  - Lazy loading full images
  - Cache expiration policies
  
- **Download Management**
  - Concurrent download limits
  - Retry logic for failures
  - Bandwidth optimization
  - Progress tracking

## Database Schema

### drive_accounts table
```sql
CREATE TABLE drive_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, google_account_id)
);
```

### monitored_folders table
```sql
CREATE TABLE monitored_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_account_id UUID NOT NULL REFERENCES drive_accounts(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_path TEXT,
  parent_folder_id TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  next_scan_at TIMESTAMP WITH TIME ZONE,
  total_files INTEGER DEFAULT 0,
  available_files INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drive_account_id, folder_id)
);
```

### drive_files table
```sql
CREATE TABLE drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitored_folder_id UUID NOT NULL REFERENCES monitored_folders(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,
  download_url TEXT,
  md5_checksum TEXT,
  created_time TIMESTAMP WITH TIME ZONE,
  modified_time TIMESTAMP WITH TIME ZONE,
  taken_time TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  is_blacklisted BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(monitored_folder_id, file_id)
);
```

### file_cache table
```sql
CREATE TABLE file_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_file_id UUID NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_thumbnail BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### scan_history table
```sql
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitored_folder_id UUID NOT NULL REFERENCES monitored_folders(id) ON DELETE CASCADE,
  scan_type TEXT CHECK (scan_type IN ('manual', 'scheduled', 'webhook')),
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  files_found INTEGER DEFAULT 0,
  files_added INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  files_removed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);
```

## API Endpoints

### Authentication
- `POST /api/drive/auth/connect` - Initiate OAuth flow
- `GET /api/drive/auth/callback` - OAuth callback handler
- `POST /api/drive/auth/disconnect` - Disconnect Drive account
- `POST /api/drive/auth/refresh` - Manually refresh tokens

### Account Management
- `GET /api/drive/accounts` - List connected accounts
- `GET /api/drive/accounts/:id` - Get account details
- `PATCH /api/drive/accounts/:id` - Update account settings
- `DELETE /api/drive/accounts/:id` - Remove account

### Folder Management
- `GET /api/drive/folders` - List folders from Drive
- `POST /api/drive/folders/monitor` - Add folder to monitoring
- `GET /api/drive/folders/monitored` - List monitored folders
- `PATCH /api/drive/folders/:id` - Update folder settings
- `DELETE /api/drive/folders/:id` - Stop monitoring folder
- `POST /api/drive/folders/:id/scan` - Manually scan folder

### File Management
- `GET /api/drive/files` - List available files
- `GET /api/drive/files/:id` - Get file details
- `POST /api/drive/files/:id/blacklist` - Blacklist a file
- `GET /api/drive/files/:id/download` - Download file
- `GET /api/drive/files/:id/thumbnail` - Get thumbnail

### Selection
- `GET /api/drive/selection/next` - Get next file to post
- `POST /api/drive/selection/mark-used` - Mark file as used
- `GET /api/drive/selection/history` - Get selection history

## Module Structure
```
modules/drive/
├── package.json
├── index.ts
├── types/
│   └── index.ts
├── lib/
│   ├── google-auth.ts
│   ├── drive-client.ts
│   ├── folder-scanner.ts
│   ├── file-processor.ts
│   ├── selection-engine.ts
│   └── cache-manager.ts
├── hooks/
│   ├── use-drive-accounts.ts
│   ├── use-monitored-folders.ts
│   └── use-drive-files.ts
├── components/
│   ├── drive-connect-button.tsx
│   ├── folder-browser.tsx
│   ├── folder-card.tsx
│   ├── file-grid.tsx
│   └── storage-meter.tsx
└── context/
    └── drive-context.tsx
```

## Integration Points

### With Auth Module
- Use authenticated user for Drive account association
- Respect user permissions and tier limits

### With Billing Module
- Check storage limits based on subscription tier
- Track API usage for rate limiting
- Restrict number of monitored folders by tier

### With Queue Module
- Provide files for queue population
- Track file usage to prevent rapid repeats
- Support priority-based selection

### With AI Module
- Extract text from images for caption generation
- Analyze image content for hashtag suggestions
- Detect faces for privacy protection

## Security Considerations
- Encrypt OAuth tokens at rest
- Use minimal permission scopes
- Implement token refresh before expiration
- Rate limit API calls to respect Google quotas
- Validate file types and sizes
- Scan for inappropriate content
- Respect user privacy settings
- Implement secure file caching

## Google Drive API Quotas
- **Queries per day**: 1,000,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 10,000

### Rate Limiting Strategy
- Implement exponential backoff
- Cache API responses
- Batch API requests where possible
- Use push notifications for changes

## Selection Algorithm

```typescript
interface SelectionCriteria {
  folder_priority: number;
  time_since_last_use: number;
  seasonal_relevance: number;
  randomness_factor: number;
  user_preferences: {
    chronological: boolean;
    allow_repeats: boolean;
    minimum_gap_days: number;
  };
}

// Selection priority formula
score = (folder_priority * 0.3) + 
        (time_since_last_use * 0.4) + 
        (seasonal_relevance * 0.2) + 
        (randomness * 0.1);
```

## Caching Strategy

### Cache Levels
1. **Database Cache** - File metadata and URLs
2. **Redis Cache** - Hot data and selection queue
3. **Local Storage** - Thumbnails and recent files
4. **CDN** - Processed images ready for posting

### Cache Policies
- Thumbnails: 30 days
- Full images: 7 days
- Metadata: 24 hours
- LRU eviction for storage limits

## Error Handling
- Graceful degradation if Drive is unavailable
- Retry failed scans with exponential backoff
- Clear error messages for auth issues
- Fallback to cached data when possible
- Alert users to quota limits
- Handle file deletions gracefully

## Testing Requirements
- Unit tests for selection algorithm
- Integration tests with Drive API
- Mock Drive API for development
- Test token refresh flow
- Test large folder handling (10k+ files)
- Performance tests for file scanning
- Cache hit ratio monitoring

## Performance Considerations
- Paginate folder contents (100 files per page)
- Implement virtual scrolling for file browser
- Lazy load thumbnails
- Background scanning with progress updates
- Optimize database queries with indexes
- Use connection pooling for API calls

## Future Enhancements
- Support for other cloud storage (Dropbox, OneDrive)
- Smart album detection
- Face grouping for consistent posting
- Location-based categorization
- Automatic folder organization
- Bulk operations UI
- Advanced search and filters