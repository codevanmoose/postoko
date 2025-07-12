'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft,
  Plus,
  X,
  Hash,
  Type,
  RefreshCw,
  Save
} from 'lucide-react';
import { useSocial, usePostTemplates, usePlatformLimits } from '@postoko/social';

export default function NewTemplatePage() {
  const router = useRouter();
  const { platforms } = useSocial();
  const { createTemplate } = usePostTemplates();
  const { getCharacterCount } = usePlatformLimits();
  
  const [name, setName] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [captionTemplate, setCaptionTemplate] = useState('');
  const [hashtagSets, setHashtagSets] = useState<string[][]>([[]]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPlatform = platforms.find(p => p.id === platformId);
  const charCount = selectedPlatform 
    ? getCharacterCount(selectedPlatform.name, captionTemplate)
    : { current: 0, limit: 0, remaining: 0, percentage: 0 };

  const handleAddHashtag = (setIndex: number) => {
    if (!currentHashtag.trim()) return;
    
    const tag = currentHashtag.trim().replace(/^#/, '');
    const newSets = [...hashtagSets];
    newSets[setIndex] = [...newSets[setIndex], tag];
    setHashtagSets(newSets);
    setCurrentHashtag('');
  };

  const handleRemoveHashtag = (setIndex: number, tagIndex: number) => {
    const newSets = [...hashtagSets];
    newSets[setIndex] = newSets[setIndex].filter((_, i) => i !== tagIndex);
    setHashtagSets(newSets);
  };

  const handleAddHashtagSet = () => {
    setHashtagSets([...hashtagSets, []]);
  };

  const handleRemoveHashtagSet = (index: number) => {
    setHashtagSets(hashtagSets.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!platformId) {
      newErrors.platform = 'Please select a platform';
    }
    
    if (!captionTemplate.trim()) {
      newErrors.caption = 'Caption template is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      await createTemplate({
        name,
        platform_id: platformId,
        caption_template: captionTemplate,
        hashtag_sets: hashtagSets.filter(set => set.length > 0),
        is_default: isDefault,
        user_id: '', // Will be set by context
      });
      
      router.push('/settings/social/templates');
    } catch (error) {
      console.error('Create template error:', error);
      setErrors({ submit: 'Failed to create template. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container className="py-8 max-w-3xl">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings/social/templates')}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Templates
          </Button>
          <h1 className="text-3xl font-bold">Create Template</h1>
          <p className="mt-2 text-muted-foreground">
            Create a reusable template for consistent posting
          </p>
        </div>

        {errors.submit && (
          <div className="p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {errors.submit}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Daily Photo Post"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platformId} onValueChange={setPlatformId}>
                <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-red-500 mt-1">{errors.platform}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="default">Set as default template</Label>
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caption Template</CardTitle>
            <CardDescription>
              Use variables like {'{caption}'}, {'{date}'}, {'{time}'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="e.g., {caption}&#10;&#10;📸 Shot on {date}&#10;&#10;#photography #dailyphoto"
                value={captionTemplate}
                onChange={(e) => setCaptionTemplate(e.target.value)}
                rows={6}
                className={errors.caption ? 'border-red-500' : ''}
              />
              {errors.caption && (
                <p className="text-sm text-red-500 mt-1">{errors.caption}</p>
              )}
              
              {selectedPlatform && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={`${charCount.percentage > 90 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {charCount.current} / {charCount.limit} characters
                  </span>
                  {charCount.percentage > 90 && (
                    <span className="text-red-500">
                      {charCount.remaining < 0 ? 'Exceeds limit!' : `${charCount.remaining} left`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hashtag Sets</CardTitle>
                <CardDescription>
                  Create multiple sets to rotate hashtags
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddHashtagSet}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hashtagSets.map((set, setIndex) => (
              <div key={setIndex} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Set {setIndex + 1}</Label>
                  {hashtagSets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHashtagSet(setIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add hashtag (without #)"
                    value={setIndex === hashtagSets.length - 1 ? currentHashtag : ''}
                    onChange={(e) => setCurrentHashtag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHashtag(setIndex);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleAddHashtag(setIndex)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {set.map((tag, tagIndex) => (
                    <Badge
                      key={tagIndex}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveHashtag(setIndex, tagIndex)}
                    >
                      #{tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/settings/social/templates')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Template
              </>
            )}
          </Button>
        </div>
      </div>
    </Container>
  );
}