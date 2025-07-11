'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@postoko/database';
import { useAuth } from '@postoko/auth';
import { 
  SocialAccount, 
  SocialPlatform, 
  PostTemplate,
  ConnectAccountRequest,
  PostRequest,
  PostResult
} from '../types';
import { OAuthManager } from '../lib/oauth-manager';
import { PlatformFactory } from '../lib/platform-factory';

interface SocialContextType {
  platforms: SocialPlatform[];
  accounts: SocialAccount[];
  templates: PostTemplate[];
  isLoading: boolean;
  connectAccount: (request: ConnectAccountRequest) => Promise<string>;
  disconnectAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  createPost: (request: PostRequest) => Promise<PostResult[]>;
  createTemplate: (template: Omit<PostTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<PostTemplate>;
  updateTemplate: (id: string, updates: Partial<PostTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getOptimalPostingTimes: (accountIds: string[]) => Promise<Date[]>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const oauthManager = new OAuthManager();

  // Load platforms
  useEffect(() => {
    async function loadPlatforms() {
      const { data, error } = await supabase
        .from('social_platforms')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (!error && data) {
        setPlatforms(data);
      }
    }

    loadPlatforms();
  }, []);

  // Load accounts and templates
  const loadUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load accounts
      const { data: accountsData } = await supabase
        .from('social_accounts')
        .select('*, platform:social_platforms(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (accountsData) {
        setAccounts(accountsData);
      }

      // Load templates
      const { data: templatesData } = await supabase
        .from('post_templates')
        .select('*, platform:social_platforms(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (templatesData) {
        setTemplates(templatesData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const connectAccount = async (request: ConnectAccountRequest): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const redirectUri = request.redirect_uri || `${window.location.origin}/api/social/auth/callback`;
    const authUrl = await oauthManager.generateAuthUrl(
      user.id,
      request.platform,
      redirectUri
    );

    return authUrl;
  };

  const disconnectAccount = async (accountId: string) => {
    await oauthManager.disconnectAccount(accountId);
    await loadUserData();
  };

  const refreshAccounts = async () => {
    await loadUserData();
  };

  const createPost = async (request: PostRequest): Promise<PostResult[]> => {
    const accountsToPost = accounts.filter(acc => 
      request.account_ids.includes(acc.id)
    );

    if (accountsToPost.length === 0) {
      throw new Error('No valid accounts selected');
    }

    // Apply template if specified
    let content = request.content;
    if (request.template_id) {
      const template = templates.find(t => t.id === request.template_id);
      if (template && template.caption_template) {
        content = {
          ...content,
          caption: template.caption_template.replace('{caption}', content.caption),
        };
        
        // Add template hashtags if not already present
        if (template.hashtag_sets && template.hashtag_sets.length > 0) {
          const randomSet = template.hashtag_sets[
            Math.floor(Math.random() * template.hashtag_sets.length)
          ];
          content.hashtags = [...(content.hashtags || []), ...randomSet];
        }
      }
    }

    // Post to all selected platforms
    const results = await PlatformFactory.postToMultiplePlatforms(
      accountsToPost,
      content
    );

    return results.map(r => r.result);
  };

  const createTemplate = async (
    template: Omit<PostTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PostTemplate> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('post_templates')
      .insert({
        ...template,
        user_id: user.id,
      })
      .select('*, platform:social_platforms(*)')
      .single();

    if (error) throw error;
    
    setTemplates([...templates, data]);
    return data;
  };

  const updateTemplate = async (id: string, updates: Partial<PostTemplate>) => {
    const { error } = await supabase
      .from('post_templates')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await loadUserData();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('post_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setTemplates(templates.filter(t => t.id !== id));
  };

  const getOptimalPostingTimes = async (accountIds: string[]): Promise<Date[]> => {
    const selectedAccounts = accounts.filter(acc => accountIds.includes(acc.id));
    const allTimes: Date[] = [];

    for (const account of selectedAccounts) {
      if (account.platform) {
        const platform = PlatformFactory.getPlatform(account.platform.name);
        const times = await platform.getOptimalPostingTimes(account);
        allTimes.push(...times);
      }
    }

    // Remove duplicates and sort
    const uniqueTimes = Array.from(new Set(allTimes.map(t => t.getTime())))
      .map(time => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());

    return uniqueTimes;
  };

  const value: SocialContextType = {
    platforms,
    accounts,
    templates,
    isLoading,
    connectAccount,
    disconnectAccount,
    refreshAccounts,
    createPost,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getOptimalPostingTimes,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within SocialProvider');
  }
  return context;
}