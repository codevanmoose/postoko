'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@postoko/auth';
import { useSocial } from '@postoko/social';
import { 
  ChevronLeft,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link2
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

// Platform-specific instructions
const platformInstructions: Record<string, string[]> = {
  instagram: [
    'Instagram requires a Business or Creator account',
    'You may need to convert your personal account',
    'Make sure your account is not private',
    'You\'ll be redirected to Instagram to authorize access',
  ],
  twitter: [
    'Twitter API access requires approval',
    'Make sure you have a Twitter Developer account',
    'You\'ll grant access to post tweets on your behalf',
    'Rate limits apply based on your API tier',
  ],
  pinterest: [
    'Pinterest requires a business account',
    'You\'ll need to select which boards to use',
    'Only image content is supported',
    'Rich Pins may be available for better engagement',
  ],
  linkedin: [
    'LinkedIn supports personal and company pages',
    'Professional content performs best',
    'You can post to your feed or company pages',
    'Article sharing is supported',
  ],
  tiktok: [
    'TikTok requires video content only',
    'You need a TikTok for Business account',
    'Videos must be between 5-180 seconds',
    'Trending sounds and hashtags boost visibility',
  ],
};

export default function ConnectPlatformPage() {
  const router = useRouter();
  const params = useParams();
  const platformName = params.platform as string;
  const { user } = useAuth();
  const { platforms, connectAccount } = useSocial();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platform = platforms.find(p => p.name === platformName);
  const Icon = platformIcons[platformName] || Link2;
  const instructions = platformInstructions[platformName] || [];

  useEffect(() => {
    // Check for OAuth error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError) {
      setError('Connection failed. Please try again.');
    }
  }, []);

  if (!platform) {
    return (
      <Container className="py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Platform not found. Please select a valid platform.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const handleConnect = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const authUrl = await connectAccount({ platform: platformName });
      // Redirect to platform OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <Container className="py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings/social')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Social Accounts
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Connect {platform.display_name}</h1>
              <p className="text-muted-foreground">
                Authorize Postoko to post content to your {platform.display_name} account
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Before You Connect</CardTitle>
            <CardDescription>
              Important information about connecting {platform.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Postoko will request the following permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Read Profile Information</p>
                  <p className="text-sm text-muted-foreground">
                    Access your username, display name, and profile picture
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Create Posts</p>
                  <p className="text-sm text-muted-foreground">
                    Post content on your behalf according to your schedule
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Manage Content</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage posts created through Postoko
                  </p>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can revoke access at any time from your {platform.display_name} settings
                or from your Postoko account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={handleConnect}
            disabled={isConnecting}
            className="min-w-[200px]"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect {platform.display_name}
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Container>
  );
}