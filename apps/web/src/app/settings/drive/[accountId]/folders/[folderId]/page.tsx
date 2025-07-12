'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@postoko/auth';
import { useDriveFiles, type DriveFile } from '@postoko/drive';
import { 
  ChevronLeft, 
  Image as ImageIcon,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';

const statusConfig = {
  available: { label: 'Available', color: 'default', icon: CheckCircle },
  unavailable: { label: 'Unavailable', color: 'secondary', icon: XCircle },
  scheduled: { label: 'Scheduled', color: 'blue', icon: Clock },
  posted: { label: 'Posted', color: 'purple', icon: CheckCircle },
  skipped: { label: 'Skipped', color: 'secondary', icon: XCircle },
  error: { label: 'Error', color: 'destructive', icon: XCircle },
};

export default function FolderFilesPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;
  const folderId = params.folderId as string;
  const { user } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'scheduled' | 'posted'>('all');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  
  const { 
    files, 
    loading: isLoading, 
    error,
    refresh: refreshFiles 
  } = useDriveFiles({
    folderId,
    status: statusFilter === 'all' ? undefined : statusFilter as 'available' | 'scheduled' | 'posted',
  });

  const handleDownload = async (fileId: string) => {
    try {
      // TODO: Implement file download
      const response = await fetch(`/api/drive/files/${fileId}/download`);
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handlePreview = (file: any) => {
    setSelectedFile(file);
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/settings/drive/${accountId}/folders`)}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Folders
          </Button>
          <h1 className="text-3xl font-bold">Folder Files</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage files in this monitored folder
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'available' | 'scheduled' | 'posted')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {files.length} files total
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'This folder contains no image files'
                  : `No ${statusFilter} files in this folder`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file: any) => {
              const fileStatus = file.is_available ? 'available' : 'unavailable';
              const status = statusConfig[fileStatus as keyof typeof statusConfig] || statusConfig.available;
              const StatusIcon = status.icon;
              
              return (
                <Card key={file.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3">
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePreview(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(file.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm truncate mb-2" title={file.file_name}>
                      {file.file_name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={status.color as any} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      
                      {file.posted_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {file.posted_count}x posted
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {(file.file_size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* TODO: Add pagination support */}
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <Button
              className="absolute top-4 right-4 z-10"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedFile(null)}
            >
              Close
            </Button>
            {selectedFile.download_url ? (
              <img
                src={selectedFile.download_url}
                alt={selectedFile.file_name}
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <div className="bg-card p-12 rounded-lg">
                <ImageIcon className="h-24 w-24 mx-auto text-muted-foreground" />
                <p className="mt-4 text-center">Preview not available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}