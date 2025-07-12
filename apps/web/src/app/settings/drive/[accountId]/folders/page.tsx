'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@postoko/auth';
import { useMonitoredFolders } from '@postoko/drive';
import { 
  ChevronLeft, 
  FolderPlus, 
  Trash2, 
  RefreshCw, 
  Pause, 
  Play,
  FolderOpen,
  FileImage,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function FoldersPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;
  const { user } = useAuth();
  const { 
    folders, 
    isLoading, 
    refreshFolders,
    updateFolder,
    removeFolder,
    scanFolder
  } = useMonitoredFolders(accountId);
  const [scanning, setScanning] = useState<string | null>(null);

  const handleScan = async (folderId: string) => {
    setScanning(folderId);
    try {
      await scanFolder(folderId);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(null);
    }
  };

  const handleToggleActive = async (folderId: string, isActive: boolean) => {
    try {
      await updateFolder(folderId, { is_active: !isActive });
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleRemove = async (folderId: string) => {
    if (!confirm('Are you sure you want to stop monitoring this folder?')) {
      return;
    }
    
    try {
      await removeFolder(folderId);
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings/drive')}
              className="mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Drive Settings
            </Button>
            <h1 className="text-3xl font-bold">Monitored Folders</h1>
            <p className="mt-2 text-muted-foreground">
              Manage which folders Postoko monitors for new content
            </p>
          </div>
          <Button onClick={() => router.push(`/settings/drive/${accountId}/folders/add`)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Add Folder
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading folders...</p>
            </CardContent>
          </Card>
        ) : folders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No folders monitored yet</h3>
              <p className="text-muted-foreground mb-4">
                Add folders from your Google Drive to start importing photos
              </p>
              <Button onClick={() => router.push(`/settings/drive/${accountId}/folders/add`)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add Your First Folder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {folders.map((folder) => (
              <Card key={folder.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        {folder.folder_name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {folder.folder_path}
                      </CardDescription>
                    </div>
                    <Badge variant={folder.is_active ? 'default' : 'secondary'}>
                      {folder.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{folder.file_counts.total}</strong> files
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>{folder.file_counts.available}</strong> available
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        <strong>{folder.file_counts.scheduled}</strong> scheduled
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">
                        <strong>{folder.file_counts.posted}</strong> posted
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScan(folder.id)}
                      disabled={scanning === folder.id}
                    >
                      {scanning === folder.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Scan Now
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(folder.id, folder.is_active)}
                    >
                      {folder.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/settings/drive/${accountId}/folders/${folder.id}`)}
                    >
                      View Files
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(folder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {folder.last_scanned_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last scanned: {new Date(folder.last_scanned_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}