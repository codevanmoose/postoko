-- Google Drive Module Tables

-- First, ensure we have uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drive Accounts
CREATE TABLE IF NOT EXISTS drive_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT, -- Will be encrypted via RLS
  refresh_token TEXT, -- Will be encrypted via RLS
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, google_account_id)
);

-- Monitored Folders
CREATE TABLE IF NOT EXISTS monitored_folders (
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

-- Drive Files
CREATE TABLE IF NOT EXISTS drive_files (
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

-- File Cache
CREATE TABLE IF NOT EXISTS file_cache (
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

-- Scan History
CREATE TABLE IF NOT EXISTS scan_history (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drive_accounts_user_id ON drive_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_accounts_google_id ON drive_accounts(google_account_id);
CREATE INDEX IF NOT EXISTS idx_monitored_folders_account_id ON monitored_folders(drive_account_id);
CREATE INDEX IF NOT EXISTS idx_monitored_folders_active ON monitored_folders(is_active);
CREATE INDEX IF NOT EXISTS idx_drive_files_folder_id ON drive_files(monitored_folder_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_available ON drive_files(is_available, is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_drive_files_last_used ON drive_files(last_used_at);
CREATE INDEX IF NOT EXISTS idx_file_cache_drive_file_id ON file_cache(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_file_cache_expires_at ON file_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_folder_id ON scan_history(monitored_folder_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_status ON scan_history(status);

-- Update triggers
CREATE TRIGGER update_drive_accounts_updated_at BEFORE UPDATE ON drive_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitored_folders_updated_at BEFORE UPDATE ON monitored_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_files_updated_at BEFORE UPDATE ON drive_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update folder file counts
CREATE OR REPLACE FUNCTION update_folder_file_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE monitored_folders
    SET 
      total_files = (
        SELECT COUNT(*) 
        FROM drive_files 
        WHERE monitored_folder_id = NEW.monitored_folder_id
      ),
      available_files = (
        SELECT COUNT(*) 
        FROM drive_files 
        WHERE monitored_folder_id = NEW.monitored_folder_id 
        AND is_available = true 
        AND is_blacklisted = false
      )
    WHERE id = NEW.monitored_folder_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE monitored_folders
    SET 
      total_files = (
        SELECT COUNT(*) 
        FROM drive_files 
        WHERE monitored_folder_id = OLD.monitored_folder_id
      ),
      available_files = (
        SELECT COUNT(*) 
        FROM drive_files 
        WHERE monitored_folder_id = OLD.monitored_folder_id 
        AND is_available = true 
        AND is_blacklisted = false
      )
    WHERE id = OLD.monitored_folder_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating file counts
CREATE TRIGGER update_folder_counts_on_file_change
AFTER INSERT OR UPDATE OR DELETE ON drive_files
FOR EACH ROW EXECUTE FUNCTION update_folder_file_counts();

-- Function to mark file as used
CREATE OR REPLACE FUNCTION mark_file_as_used(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE drive_files
  SET 
    last_used_at = NOW(),
    use_count = use_count + 1
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE drive_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and manage their own drive accounts
CREATE POLICY "Users can view own drive accounts" ON drive_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drive accounts" ON drive_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access folders from their accounts
CREATE POLICY "Users can view own folders" ON monitored_folders
  FOR SELECT USING (
    drive_account_id IN (
      SELECT id FROM drive_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own folders" ON monitored_folders
  FOR ALL USING (
    drive_account_id IN (
      SELECT id FROM drive_accounts WHERE user_id = auth.uid()
    )
  );

-- Users can only access files from their folders
CREATE POLICY "Users can view own files" ON drive_files
  FOR SELECT USING (
    monitored_folder_id IN (
      SELECT mf.id FROM monitored_folders mf
      JOIN drive_accounts da ON mf.drive_account_id = da.id
      WHERE da.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own files" ON drive_files
  FOR ALL USING (
    monitored_folder_id IN (
      SELECT mf.id FROM monitored_folders mf
      JOIN drive_accounts da ON mf.drive_account_id = da.id
      WHERE da.user_id = auth.uid()
    )
  );

-- Cache policies
CREATE POLICY "Users can view own cache" ON file_cache
  FOR SELECT USING (
    drive_file_id IN (
      SELECT df.id FROM drive_files df
      JOIN monitored_folders mf ON df.monitored_folder_id = mf.id
      JOIN drive_accounts da ON mf.drive_account_id = da.id
      WHERE da.user_id = auth.uid()
    )
  );

-- Scan history policies
CREATE POLICY "Users can view own scan history" ON scan_history
  FOR SELECT USING (
    monitored_folder_id IN (
      SELECT mf.id FROM monitored_folders mf
      JOIN drive_accounts da ON mf.drive_account_id = da.id
      WHERE da.user_id = auth.uid()
    )
  );

-- Service role policies for cache and scan management
CREATE POLICY "Service role can manage cache" ON file_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage scan history" ON scan_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');