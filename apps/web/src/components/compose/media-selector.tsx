'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDriveFiles } from '@postoko/drive';
import { 
  Image as ImageIcon,
  Plus,
  X,
  Folder,
  RefreshCw,
  Check
} from 'lucide-react';

interface MediaSelectorProps {
  selectedMedia: string[];
  onMediaChange: (media: string[]) => void;
  maxItems?: number;
}

export default function MediaSelector({ 
  selectedMedia, 
  onMediaChange,
  maxItems = 4 
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { files, loading: isLoading, refresh: refreshFiles } = useDriveFiles({
    folderId: selectedFolder || undefined,
    status: 'available',
  });

  const toggleMedia = (mediaUrl: string) => {
    if (selectedMedia.includes(mediaUrl)) {
      onMediaChange(selectedMedia.filter(url => url !== mediaUrl));
    } else if (selectedMedia.length < maxItems) {
      onMediaChange([...selectedMedia, mediaUrl]);
    }
  };

  const removeMedia = (mediaUrl: string) => {
    onMediaChange(selectedMedia.filter(url => url !== mediaUrl));
  };

  if (!isOpen) {
    return (
      <div className="space-y-3">
        {selectedMedia.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {selectedMedia.map((mediaUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={mediaUrl}
                  alt={`Selected ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  onClick={() => removeMedia(mediaUrl)}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {selectedMedia.length > 0 ? 'Change Media' : 'Add Media'}
        </Button>
        
        {selectedMedia.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {selectedMedia.length} of {maxItems} selected
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Select Media</h3>
            <p className="text-sm text-muted-foreground">
              Choose up to {maxItems} images from your Google Drive
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No images found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure you have scanned your Google Drive folders
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((file: any) => {
                const isSelected = selectedMedia.includes(file.download_url || file.thumbnail_url || '');
                const isDisabled = !isSelected && selectedMedia.length >= maxItems;
                
                return (
                  <button
                    key={file.id}
                    onClick={() => toggleMedia(file.download_url || file.thumbnail_url || '')}
                    disabled={isDisabled}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : isDisabled
                        ? 'border-transparent opacity-50 cursor-not-allowed'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="p-2 bg-primary rounded-full">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                      <p className="text-xs text-white truncate">{file.file_name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
        
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedMedia.length} of {maxItems} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              disabled={selectedMedia.length === 0}
            >
              Use Selected
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}