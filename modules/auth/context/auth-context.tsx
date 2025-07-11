'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthContextValue, AuthError, SignInCredentials, SignUpCredentials, User } from '../types';
import { supabaseAuth } from '../lib/supabase-auth';
import { createClient } from '@postoko/database';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check for existing session
    supabaseAuth.getSession().then((session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const { user } = await supabaseAuth.signUp(credentials);
      
      if (user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: credentials.email,
            full_name: credentials.full_name,
          });

        if (profileError) throw profileError;
        
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError({ message: err.message || 'Failed to sign up' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setError(null);
      setLoading(true);
      
      await supabaseAuth.signIn(credentials);
      router.push('/dashboard');
    } catch (err: any) {
      setError({ message: err.message || 'Failed to sign in' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      await supabaseAuth.signInWithGoogle();
    } catch (err: any) {
      setError({ message: err.message || 'Failed to sign in with Google' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      await supabaseAuth.signOut();
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (err: any) {
      setError({ message: err.message || 'Failed to sign out' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      await supabaseAuth.resetPassword(email);
    } catch (err: any) {
      setError({ message: err.message || 'Failed to send reset email' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      setLoading(true);
      
      await supabaseAuth.updatePassword(newPassword);
    } catch (err: any) {
      setError({ message: err.message || 'Failed to update password' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      setLoading(true);
      
      if (!user) throw new Error('No user logged in');
      
      await supabaseAuth.updateProfile(user.id, data);
      setUser({ ...user, ...data });
    } catch (err: any) {
      setError({ message: err.message || 'Failed to update profile' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      setError(null);
      const newSession = await supabaseAuth.refreshSession();
      setSession(newSession);
    } catch (err: any) {
      setError({ message: err.message || 'Failed to refresh session' });
      throw err;
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}