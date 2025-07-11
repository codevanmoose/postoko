import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@postoko/database';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

/**
 * Middleware to protect API routes
 * Usage: 
 * export async function GET(req: NextRequest) {
 *   const authResult = await requireAuth(req);
 *   if (authResult instanceof NextResponse) return authResult;
 *   
 *   const { user } = authResult;
 *   // ... rest of your API logic
 * }
 */
export async function requireAuth(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return { user, session };
}

/**
 * Optional auth check for API routes
 * Returns user if authenticated, null otherwise
 */
export async function getOptionalAuth(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { user: null, session: null };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return { user, session };
}