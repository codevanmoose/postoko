'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@postoko/auth';
import { useSocial, useSocialAccounts } from '@postoko/social';
import { 
  Music2,
  Link2,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Instagram, Twitter, LinkedIn, TikTok, Pinterest } from '@/components/icons/social-icons';

// Platform icons mapping
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  pinterest: Pinterest,
  linkedin: LinkedIn,
  tiktok: TikTok,
};

export default function SocialAccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { platforms, isLoading: platformsLoading } = useSocial();
  const { accountsByPlatform, isLoading: accountsLoading, disconnectAccount } = useSocialAccounts();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const isLoading = platformsLoading || accountsLoading;

  const handleConnect = (platformName: string) => {
    router.push(`/settings/social/connect/${platformName}`);
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${accountName}?`)) {
      return;
    }

    setDisconnecting(accountId);
    try {
      await disconnectAccount(accountId);
      setMessage({
        type: 'success',
        text: `${accountName} disconnected successfully`,
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to disconnect account. Please try again.',
      });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Social Media Accounts</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your social media accounts to start posting your content
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => {
              const Icon = platformIcons[platform.name] || Link2;
              const connectedAccounts = accountsByPlatform[platform.name] || [];
              const isConnected = connectedAccounts.length > 0;

              return (
                <Card key={platform.id} className={isConnected ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                          <CardDescription className="text-sm">
                            {isConnected 
                              ? `${connectedAccounts.length} account${connectedAccounts.length > 1 ? 's' : ''} connected`
                              : 'Not connected'
                            }
                          </CardDescription>
                        </div>
                      </div>
                      {isConnected && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="space-y-3">
                        {connectedAccounts.map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              {account.profile_image_url && (
                                <img
                                  src={account.profile_image_url}
                                  alt={account.username}
                                  className="h-8 w-8 rounded-full"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">@{account.username}</p>
                                {account.display_name && (
                                  <p className="text-xs text-muted-foreground">{account.display_name}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnect(account.id, `@${account.username}`)}
                              disabled={disconnecting === account.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleConnect(platform.name)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Account
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(platform.name)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Connect {platform.display_name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>
              What you can do with each connected platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">📷 Instagram</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Feed posts with images</li>
                    <li>• Stories (coming soon)</li>
                    <li>• Reels (coming soon)</li>
                    <li>• Up to 2200 characters</li>
                    <li>• 30 hashtags maximum</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🐦 Twitter/X</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tweets with media</li>
                    <li>• Thread support</li>
                    <li>• 280 character limit</li>
                    <li>• Up to 4 images</li>
                    <li>• Video support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📌 Pinterest</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Create pins</li>
                    <li>• Board selection</li>
                    <li>• 500 character descriptions</li>
                    <li>• Image only (JPG, PNG)</li>
                    <li>• 2:3 aspect ratio optimal</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">💼 LinkedIn</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Professional posts</li>
                    <li>• Article sharing</li>
                    <li>• 3000 character limit</li>
                    <li>• Image and video support</li>
                    <li>• Business hours posting</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/settings/social/templates')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
        </div>
      </div>
    </Container>
  );
}