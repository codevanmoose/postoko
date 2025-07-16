'use client';

import React, { useState } from 'react';
import { QueueItem } from '../types';
import { Button } from '../../../apps/web/src/components/ui/button';
import { useQueue } from '../context/queue-context';
import { useSocial } from '@postoko/social';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Edit,
  Trash,
  RefreshCw,
  Image,
  FileText,
  Sparkles
} from 'lucide-react';

interface QueueItemCardProps {
  item: QueueItem;
}

export function QueueItemCard({ item }: QueueItemCardProps) {
  const { updateQueueItem, removeFromQueue, retryFailedItem } = useQueue();
  const { accounts: socialAccounts } = useSocial();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(item.caption || '');

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (item.status) {
      case 'pending':
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
      case 'scheduled':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'processing':
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'posted':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-100' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  // Get content type icon
  const getContentIcon = () => {
    switch (item.content_type) {
      case 'drive_file':
        return Image;
      case 'ai_generated':
        return Sparkles;
      case 'manual':
        return FileText;
      default:
        return FileText;
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const ContentIcon = getContentIcon();

  // Get platform names
  const platforms = item.social_account_ids
    .map(id => socialAccounts.find(acc => acc.id === id))
    .filter(Boolean)
    .map(acc => acc!.platform?.display_name || 'Unknown');

  const handleSaveEdit = async () => {
    try {
      await updateQueueItem(item.id, { caption: editCaption });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update caption:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this item from the queue?')) {
      try {
        await removeFromQueue(item.id);
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    }
  };

  const handleRetry = async () => {
    try {
      await retryFailedItem(item.id);
    } catch (error) {
      console.error('Failed to retry item:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Status and time */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${statusDisplay.bg}`}>
            <StatusIcon className={`h-5 w-5 ${statusDisplay.color}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ContentIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(item.scheduled_for), 'h:mm a')}
              </span>
              <span className="text-xs text-gray-500">
                {item.status}
              </span>
            </div>

            {/* Caption */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditCaption(item.caption || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.caption || 'No caption'}
              </p>
            )}

            {/* Platforms and hashtags */}
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                {platforms.map((platform, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              
              {item.hashtags && item.hashtags.length > 0 && (
                <div className="text-gray-500">
                  {item.hashtags.length} hashtags
                </div>
              )}
            </div>

            {/* Error message for failed items */}
            {item.status === 'failed' && item.error_message && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                {item.error_message}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {item.status !== 'posted' && item.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Caption
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash className="h-4 w-4" />
                      Remove
                    </button>
                  </>
                )}
                
                {item.status === 'failed' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleRetry();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}