'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth, useAuth } from '@postoko/auth';
import { apiKeysLib } from '@postoko/settings';
import type { APIKey, CreateAPIKeyDTO } from '@postoko/settings';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function APIKeysPage() {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null);
  
  // Form state
  const [keyName, setKeyName] = useState('');
  const [permissions, setPermissions] = useState({ read: true, write: false });
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadAPIKeys();
    }
  }, [user]);

  const loadAPIKeys = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const apiKeys = await apiKeysLib.getAPIKeys(user.id);
      setKeys(apiKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !keyName.trim()) return;

    try {
      setCreating(true);
      const createData: CreateAPIKeyDTO = {
        name: keyName,
        permissions,
        expires_in_days: expiresInDays || undefined,
      };
      
      const response = await apiKeysLib.createAPIKey(user.id, createData);
      
      // Show the key to the user (only time it's visible)
      setNewKeyData({ key: response.key, name: response.name });
      setShowCreateForm(false);
      
      // Reload keys
      await loadAPIKeys();
      
      // Reset form
      setKeyName('');
      setPermissions({ read: true, write: false });
      setExpiresInDays(null);
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      try {
        await apiKeysLib.deleteAPIKey(user.id, keyId);
        await loadAPIKeys();
      } catch (error) {
        console.error('Failed to delete API key:', error);
        alert('Failed to delete API key');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">API Keys</h1>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back
          </Button>
        </div>

        {newKeyData && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle>New API Key Created</CardTitle>
              <CardDescription>
                Make sure to copy your API key now. You won't be able to see it again!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <p className="font-medium">{newKeyData.name}</p>
                </div>
                <div>
                  <Label>API Key</Label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm break-all">
                      {newKeyData.key}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(newKeyData.key)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setNewKeyData(null)}
                  variant="outline"
                  className="w-full"
                >
                  I've saved my key
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Manage API keys for accessing Postoko programmatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No API keys yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-gray-500">
                        {key.key_prefix}... • Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </p>
                      <p className="text-xs">
                        Permissions: {key.permissions.read && 'Read'} {key.permissions.write && '• Write'}
                        {key.expires_at && ` • Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-6"
                disabled={keys.length >= 10}
              >
                {keys.length >= 10 ? 'Maximum keys reached (10)' : 'Create New Key'}
              </Button>
            )}

            {showCreateForm && (
              <form onSubmit={handleCreateKey} className="mt-6 space-y-4 border-t pt-6">
                <div>
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="My API Key"
                    required
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.read}
                        onChange={(e) => setPermissions({ ...permissions, read: e.target.checked })}
                      />
                      <span>Read access</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.write}
                        onChange={(e) => setPermissions({ ...permissions, write: e.target.checked })}
                      />
                      <span>Write access</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expires">Expiration (optional)</Label>
                  <select
                    id="expires"
                    value={expiresInDays || ''}
                    onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Never expires</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Key'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Using Your API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto text-sm">
{`// Example API request
fetch('https://api.postoko.com/v1/posts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}