'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useAuth } from '@postoko/auth';
import { useDriveAccounts } from '@postoko/drive';
import { FolderOpen, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function DriveSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { accounts, isLoading, refreshAccounts, disconnectAccount } = useDriveAccounts();
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for OAuth callback messages
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setMessage({ type: 'success', text: 'Google Drive connected successfully!' });
      refreshAccounts();
      // Clear URL params
      router.replace('/settings/drive');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'You denied access to Google Drive',
        invalid_request: 'Invalid request. Please try again.',
        invalid_state: 'Invalid state. Please try again.',
        connection_failed: 'Failed to connect to Google Drive',
        server_error: 'Server error. Please try again later.',
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'An error occurred' 
      });
      // Clear URL params
      router.replace('/settings/drive');
    }
  }, [searchParams, router, refreshAccounts]);

  const handleConnect = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    try {
      const response = await fetch('/api/drive/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const { auth_url } = await response.json();
      window.location.href = auth_url;
    } catch (error) {
      console.error('Connection error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to connect to Google Drive. Please try again.' 
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this Google Drive account?')) {
      return;
    }

    try {
      await disconnectAccount(accountId);
      setMessage({ 
        type: 'success', 
        text: 'Google Drive account disconnected successfully.' 
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to disconnect account. Please try again.' 
      });
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Google Drive Integration</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your Google Drive to automatically import photos for posting
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
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading connected accounts...</p>
            </CardContent>
          </Card>
        ) : accounts.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.user_name}</CardTitle>
                      <CardDescription>{account.email}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/settings/drive/${account.id}/folders`)}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Manage Folders
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>Connected on {new Date(account.created_at).toLocaleDateString()}</p>
                    <p>Last synced: {account.last_refresh_at 
                      ? new Date(account.last_refresh_at).toLocaleString()
                      : 'Never'
                    }</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect another Google Drive account to access more photos
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Add Another Account'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connect Google Drive</CardTitle>
              <CardDescription>
                Grant Postoko access to your Google Drive photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>🔒 We only request read-only access to your files</p>
                  <p>📁 You choose which folders to monitor</p>
                  <p>🖼️ Only image files will be imported</p>
                  <p>🔄 Automatic syncing keeps your content fresh</p>
                </div>
                
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Google Drive'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}