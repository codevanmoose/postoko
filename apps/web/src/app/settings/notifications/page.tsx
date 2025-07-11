'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@postoko/auth';
import { useNotifications } from '@postoko/settings';
import { NotificationToggle } from '@postoko/settings/components/notification-toggle';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function NotificationsPage() {
  useRequireAuth();
  const router = useRouter();
  const { notifications, loading } = useNotifications();
  const [testingSent, setTestingSent] = useState(false);

  if (loading || !notifications) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    );
  }

  const handleTestNotification = async () => {
    setTestingSent(true);
    // In production, this would call an API endpoint
    setTimeout(() => setTestingSent(false), 3000);
  };

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose which emails you'd like to receive from Postoko
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <NotificationToggle
                field="email_marketing"
                label="Marketing & Updates"
                description="New features, tips, and product announcements"
              />
              
              <NotificationToggle
                field="email_product_updates"
                label="Product Updates"
                description="Important updates about Postoko service"
              />
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Posting Notifications</h4>
                
                <NotificationToggle
                  field="email_posting_success"
                  label="Successful Posts"
                  description="Get notified when your content is posted successfully"
                />
                
                <NotificationToggle
                  field="email_posting_failure"
                  label="Failed Posts"
                  description="Get alerted when a post fails (recommended)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Real-time notifications in your browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <NotificationToggle
                field="push_enabled"
                label="Enable Push Notifications"
                description="Allow Postoko to send you browser notifications"
              />
              
              {notifications.push_enabled && (
                <div className="pl-6 space-y-1 mt-4">
                  <NotificationToggle
                    field="push_posting_success"
                    label="Successful Posts"
                    description="Real-time alerts for successful posts"
                  />
                  
                  <NotificationToggle
                    field="push_posting_failure"
                    label="Failed Posts"
                    description="Immediate alerts for failed posts"
                  />
                  
                  <NotificationToggle
                    field="sound_effects"
                    label="Sound Effects"
                    description="Play sounds for notifications"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send a test notification to verify your settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleTestNotification}
                disabled={testingSent}
                variant="outline"
              >
                {testingSent ? 'Test Sent!' : 'Send Test Notification'}
              </Button>
            </CardContent>
          </Card>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              Note: Security notifications (like new login alerts) cannot be disabled 
              and will always be sent to your registered email address.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}