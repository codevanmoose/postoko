'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@postoko/auth';
import { 
  ChevronLeft, 
  ChevronRight,
  Folder,
  FolderOpen,
  RefreshCw,
  Plus,
  Home
} from 'lucide-react';

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  hasChildren?: boolean;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function AddFolderPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;
  const { user } = useAuth();
  
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Drive' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadFolders(currentFolderId);
  }, [currentFolderId]);

  const loadFolders = async (parentId: string | null) => {
    setIsLoading(true);
    try {
      const url = new URL('/api/drive/folders', window.location.origin);
      url.searchParams.set('account_id', accountId);
      if (parentId) {
        url.searchParams.set('parent_id', parentId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to load folders');

      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Load folders error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const item = breadcrumbs[index];
    setCurrentFolderId(item.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const toggleFolder = (folderId: string) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleAddFolders = async () => {
    if (selectedFolders.size === 0) return;

    setIsAdding(true);
    try {
      const folderData = Array.from(selectedFolders).map(folderId => {
        const folder = folders.find(f => f.id === folderId);
        return {
          drive_account_id: accountId,
          folder_id: folderId,
          folder_name: folder?.name || folderId,
          parent_folder_id: currentFolderId,
        };
      });

      for (const data of folderData) {
        const response = await fetch('/api/drive/folders/monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Add folder error:', error);
        }
      }

      router.push(`/settings/drive/${accountId}/folders`);
    } catch (error) {
      console.error('Add folders error:', error);
    } finally {
      setIsAdding(false);
    }
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
            Back to Monitored Folders
          </Button>
          <h1 className="text-3xl font-bold">Add Folders to Monitor</h1>
          <p className="mt-2 text-muted-foreground">
            Select folders from your Google Drive to monitor for new photos
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <button
                      onClick={() => navigateToBreadcrumb(index)}
                      className="hover:text-primary transition-colors"
                    >
                      {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadFolders(currentFolderId)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading folders...</p>
              </div>
            ) : folders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-4" />
                <p>No folders found in this location</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selectedFolders.has(folder.id)}
                      onCheckedChange={() => toggleFolder(folder.id)}
                    />
                    <button
                      onClick={() => navigateToFolder(folder)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                      <span>{folder.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFolders.size > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedFolders.size} folder{selectedFolders.size !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    onClick={handleAddFolders}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Selected Folders
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Select multiple folders to monitor them all at once</li>
            <li>Navigate into folders to explore their contents</li>
            <li>Only folders containing images will yield results</li>
            <li>Subfolders are not automatically included</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}