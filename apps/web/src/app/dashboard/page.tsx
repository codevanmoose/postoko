'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, ProtectedRoute } from '@postoko/auth';
import { Plus, CheckCircle, Calendar, Sparkles, Image, Settings, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

function DashboardContentInner() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const posted = searchParams.get('posted') === 'true';

  useEffect(() => {
    if (posted) {
      // Clear the query param after showing the message
      setTimeout(() => {
        router.replace('/dashboard');
      }, 5000);
    }
  }, [posted, router]);

  return (
    <main className="min-h-screen">
      <Container className="py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="space-x-4">
            <Button onClick={() => router.push('/compose')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">Profile</Button>
            </Link>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
        
        {posted && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your post has been successfully created!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Scheduled Posts</h3>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Posts This Week</h3>
                  <p className="text-2xl font-bold text-green-600">18</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">AI Generations</h3>
                  <p className="text-2xl font-bold text-purple-600">47</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Failed Posts</h3>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-3 grid-cols-2">
                <Link href="/compose">
                  <Button className="w-full h-16 flex flex-col gap-1">
                    <Image className="h-5 w-5" />
                    <span className="text-sm">Create Post</span>
                  </Button>
                </Link>
                
                <Link href="/ai">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm">AI Studio</span>
                  </Button>
                </Link>
                
                <Link href="/queue">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">Queue</span>
                  </Button>
                </Link>
                
                <Link href="/settings">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                    <Settings className="h-5 w-5" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Post published to Instagram</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI caption generated</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">3 posts scheduled for tomorrow</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">🚀 Welcome to Postoko!</h2>
            <p className="text-gray-600 mb-4">
              Your AI-powered social media automation is ready. Signed in as: {user?.email}
            </p>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium mb-2">1. Connect Platforms</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Link your social media accounts to start posting
                </p>
                <Link href="/settings/social">
                  <Button size="sm" variant="outline">Connect Now</Button>
                </Link>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium mb-2">2. Add Content Source</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Connect Google Drive for automatic content selection
                </p>
                <Link href="/settings/drive">
                  <Button size="sm" variant="outline">Setup Drive</Button>
                </Link>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium mb-2">3. Create Schedule</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Set up automated posting schedules
                </p>
                <Link href="/queue">
                  <Button size="sm" variant="outline">Create Schedule</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function DashboardContent() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <Container className="flex items-center justify-center min-h-screen">
          <Spinner />
        </Container>
      </main>
    }>
      <DashboardContentInner />
    </Suspense>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}