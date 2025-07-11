'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@postoko/auth';
import { usePrivacy } from '@postoko/settings';
import { privacyLib } from '@postoko/settings';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';

export default function PrivacyPage() {
  useRequireAuth();
  const router = useRouter();
  const { privacy, updatePrivacy, loading } = usePrivacy();
  const [exportingData, setExportingData] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (loading || !privacy) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    );
  }

  const handleExportData = async () => {
    setExportingData(true);
    try {
      // In production, this would trigger a data export job
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Your data export has been initiated. You will receive an email with the download link.');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure? This action cannot be undone. Your account will be scheduled for deletion in 30 days.')) {
      // In production, this would call the delete account endpoint
      alert('Your account has been scheduled for deletion. You have 30 days to cancel this request.');
      setDeleteModalOpen(false);
    }
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    await updatePrivacy({ analytics_enabled: enabled });
  };

  const handleApiLogsToggle = async (enabled: boolean) => {
    await updatePrivacy({ show_api_logs: enabled });
  };

  const handleRetentionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updatePrivacy({ data_retention_days: parseInt(e.target.value) });
  };

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Privacy</h1>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <CardDescription>
                Control how Postoko collects and uses your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Analytics</label>
                  <p className="text-sm text-gray-500">
                    Help us improve Postoko by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={privacy.analytics_enabled}
                  onCheckedChange={handleAnalyticsToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">API Access Logs</label>
                  <p className="text-sm text-gray-500">
                    Show detailed logs of API key usage
                  </p>
                </div>
                <Switch
                  checked={privacy.show_api_logs}
                  onCheckedChange={handleApiLogsToggle}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Retention</label>
                <select
                  value={privacy.data_retention_days}
                  onChange={handleRetentionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
                  <option value="-1">Forever</option>
                </select>
                <p className="text-sm text-gray-500">
                  How long to keep your deleted posts and analytics data
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or delete your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Your Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download all your data including posts, settings, and activity history.
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={exportingData}
                  variant="outline"
                >
                  {exportingData ? 'Preparing Export...' : 'Export My Data'}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  onClick={() => setDeleteModalOpen(true)}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
              <CardDescription>
                Information about how we share data with integrated services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Google Drive:</strong> Read-only access to selected folders
                </div>
                <div>
                  <strong>Social Platforms:</strong> Post on your behalf with explicit permission
                </div>
                <div>
                  <strong>OpenAI/Replicate:</strong> Image data for AI generation (not stored)
                </div>
                <div>
                  <strong>Stripe:</strong> Payment processing (PCI compliant)
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              For more information, see our{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>.
            </p>
          </div>
        </div>

        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md">
              <h3 className="text-lg font-semibold mb-4">Delete Account</h3>
              <p className="mb-4">
                This will permanently delete your account and all associated data. 
                You will have 30 days to cancel this request.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete My Account
                </Button>
                <Button
                  onClick={() => setDeleteModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}