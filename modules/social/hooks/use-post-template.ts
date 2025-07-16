'use client';

import { useCallback } from 'react';
import { useSocial } from '../context/social-context';
import { PostTemplate } from '../types';

export function usePostTemplates(platformId?: string) {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useSocial();

  // Filter templates by platform if specified
  const filteredTemplates = platformId
    ? templates.filter(t => t.platform_id === platformId)
    : templates;

  // Get default template for a platform
  const getDefaultTemplate = useCallback((platformId: string): PostTemplate | undefined => {
    return templates.find(t => t.platform_id === platformId && t.is_default);
  }, [templates]);

  // Set default template
  const setDefaultTemplate = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Remove default from other templates of same platform
    const updates = templates
      .filter(t => t.platform_id === template.platform_id && t.is_default && t.id !== templateId)
      .map(t => updateTemplate(t.id, { is_default: false }));

    await Promise.all(updates);
    
    // Set this template as default
    await updateTemplate(templateId, { is_default: true });
  }, [templates, updateTemplate]);

  // Apply template to content
  const applyTemplate = useCallback((template: PostTemplate, caption: string): string => {
    if (!template.caption_template) return caption;
    
    return template.caption_template
      .replace('{caption}', caption)
      .replace('{date}', new Date().toLocaleDateString())
      .replace('{time}', new Date().toLocaleTimeString());
  }, []);

  // Get random hashtag set from template
  const getRandomHashtags = useCallback((template: PostTemplate): string[] => {
    if (!template.hashtag_sets || template.hashtag_sets.length === 0) {
      return [];
    }

    const randomIndex = Math.floor(Math.random() * template.hashtag_sets.length);
    return template.hashtag_sets[randomIndex] || [];
  }, []);

  return {
    templates: filteredTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getDefaultTemplate,
    setDefaultTemplate,
    applyTemplate,
    getRandomHashtags,
  };
}