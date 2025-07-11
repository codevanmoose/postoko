'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Container } from '@/components/layout/container';
import { useAuth } from '@postoko/auth';
import { isValidEmail, isValidPassword } from '@postoko/utils';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Validate email
    if (!isValidEmail(email)) {
      setValidationErrors(['Please enter a valid email address']);
      return;
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      setValidationErrors(passwordValidation.errors);
      return;
    }

    try {
      await signUp({ email, password, full_name: fullName });
    } catch (err) {
      // Error is handled by auth context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is handled by auth context
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Container size="sm" className="py-24">
        <Card className="w-full p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Create your account</h1>
              <p className="text-muted-foreground">
                Start your perpetual content journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {validationErrors.length > 0 && (
                <div className="space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive">
                  {error.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="gradient"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{' '}
              </span>
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </Card>
      </Container>
    </main>
  );
}