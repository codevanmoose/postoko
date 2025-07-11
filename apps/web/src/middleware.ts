import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@postoko/database/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Skip middleware for API routes (they handle auth internally)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Create Supabase client with cookies
  const supabase = createClient(request);
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect logic
  if (isProtectedRoute && !session) {
    // User is not authenticated, redirect to login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  if (isAuthRoute && session) {
    // User is authenticated, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (OAuth callback)
     * - auth/reset-password (password reset)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/callback|auth/reset-password).*)',
  ],
};