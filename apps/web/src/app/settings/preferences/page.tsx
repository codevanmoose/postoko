'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@postoko/auth';
import { usePreferences } from '@postoko/settings';
import { ThemeSelector } from '@postoko/settings/components/theme-selector';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function PreferencesPage() {
  useRequireAuth();
  const router = useRouter();
  const { preferences, updatePreferences, loading } = usePreferences();
  const [saving, setSaving] = useState(false);

  if (loading || !preferences) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    );
  }

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSaving(true);
    try {
      await updatePreferences({ language: e.target.value });
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSaving(true);
    try {
      await updatePreferences({ timezone: e.target.value });
    } finally {
      setSaving(false);
    }
  };

  const handleDensityChange = async (density: 'compact' | 'comfortable' | 'spacious') => {
    setSaving(true);
    try {
      await updatePreferences({ ui_density: density });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Preferences</h1>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Postoko looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelector />
              
              <div className="space-y-2">
                <Label>UI Density</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => handleDensityChange(density)}
                      disabled={saving}
                      className={`
                        p-3 rounded-lg border-2 capitalize transition-all
                        ${preferences.ui_density === density
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }
                      `}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={handleLanguageChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={handleTimezoneChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {saving && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
              Saving...
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}