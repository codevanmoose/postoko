'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialAccount, PostContent } from '@postoko/social';
import { usePlatformLimits } from '@postoko/social';
import { Instagram, Twitter, LinkedIn, TikTok, Pinterest } from '@/components/icons/social-icons';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface PlatformPreviewProps {
  account: SocialAccount;
  content: PostContent;
}

// Platform icons mapping
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  pinterest: Pinterest,
  linkedin: LinkedIn,
  tiktok: TikTok,
};

export default function PlatformPreview({ account, content }: PlatformPreviewProps) {
  const { formatForPlatform } = usePlatformLimits();
  
  if (!account.platform) return null;
  
  const platformName = account.platform.name;
  const Icon = platformIcons[platformName];
  const formattedContent = formatForPlatform(platformName, content);
  const fullCaption = `${formattedContent.caption}${
    formattedContent.hashtags && formattedContent.hashtags.length > 0
      ? '\n\n' + formattedContent.hashtags.map(tag => `#${tag}`).join(' ')
      : ''
  }`;

  // Instagram Preview
  if (platformName === 'instagram') {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            <img
              src={account.profile_image_url || `https://ui-avatars.com/api/?name=${account.username}`}
              alt={account.username}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{account.username}</p>
            </div>
            <Instagram className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {formattedContent.media_urls.length > 0 && (
            <div className="relative aspect-square bg-muted">
              <img
                src={formattedContent.media_urls[0]}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
              {formattedContent.media_urls.length > 1 && (
                <Badge className="absolute top-2 right-2" variant="secondary">
                  1/{formattedContent.media_urls.length}
                </Badge>
              )}
            </div>
          )}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6" />
              <MessageCircle className="h-6 w-6" />
              <Share2 className="h-6 w-6" />
              <Bookmark className="h-6 w-6 ml-auto" />
            </div>
            <div className="space-y-1">
              <p className="text-sm whitespace-pre-wrap">{fullCaption}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Twitter Preview
  if (platformName === 'twitter') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <img
              src={account.profile_image_url || `https://ui-avatars.com/api/?name=${account.username}`}
              alt={account.username}
              className="h-12 w-12 rounded-full"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{account.display_name || account.username}</p>
                <p className="text-sm text-muted-foreground">@{account.username}</p>
                <Twitter className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
              <p className="text-sm whitespace-pre-wrap">{fullCaption}</p>
              {formattedContent.media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                  {formattedContent.media_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="aspect-video bg-muted">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-6 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <Heart className="h-5 w-5" />
                <Share2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // LinkedIn Preview
  if (platformName === 'linkedin') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-3">
            <img
              src={account.profile_image_url || `https://ui-avatars.com/api/?name=${account.username}`}
              alt={account.username}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="font-semibold">{account.display_name || account.username}</p>
              <p className="text-sm text-muted-foreground">
                {account.metadata?.headline || 'Professional'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(), { addSuffix: true })} • <LinkedIn className="h-3 w-3 inline" />
              </p>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap mb-3">{fullCaption}</p>
          {formattedContent.media_urls.length > 0 && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={formattedContent.media_urls[0]}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pinterest Preview
  if (platformName === 'pinterest') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {formattedContent.media_urls.length > 0 && (
            <div className="aspect-[2/3] bg-muted relative">
              <img
                src={formattedContent.media_urls[0]}
                alt="Pin preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Pinterest className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          )}
          <div className="p-4 space-y-2">
            <p className="font-semibold text-sm">{formattedContent.caption.split('\n')[0]}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {formattedContent.caption}
            </p>
            <div className="flex items-center gap-2">
              <img
                src={account.profile_image_url || `https://ui-avatars.com/api/?name=${account.username}`}
                alt={account.username}
                className="h-6 w-6 rounded-full"
              />
              <p className="text-xs text-muted-foreground">{account.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generic Preview
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          <p className="font-semibold">{account.platform.display_name}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <img
            src={account.profile_image_url || `https://ui-avatars.com/api/?name=${account.username}`}
            alt={account.username}
            className="h-8 w-8 rounded-full"
          />
          <p className="text-sm font-medium">@{account.username}</p>
        </div>
        <p className="text-sm whitespace-pre-wrap mb-3">{fullCaption}</p>
        {formattedContent.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {formattedContent.media_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Media ${index + 1}`}
                className="w-full aspect-square object-cover rounded"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}