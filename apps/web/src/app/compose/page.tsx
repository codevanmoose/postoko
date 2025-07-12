'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useRequireAuth } from '@postoko/auth';
import { useSocial, useSocialAccounts, usePostTemplates, usePlatformLimits } from '@postoko/social';
import { useDriveFiles } from '@postoko/drive';
import { 
  Send,
  Clock,
  Image as ImageIcon,
  Type,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  X
} from 'lucide-react';
import { Instagram, Twitter, LinkedIn, TikTok, Pinterest } from '@/components/icons/social-icons';
import MediaSelector from '@/components/compose/media-selector';
import PlatformPreview from '@/components/compose/platform-preview';
import SchedulePicker from '@/components/compose/schedule-picker';

// Platform icons mapping
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  pinterest: Pinterest,
  linkedin: LinkedIn,
  tiktok: TikTok,
};

export default function ComposePage() {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { platforms, createPost } = useSocial();
  const { accounts, accountsByPlatform } = useSocialAccounts();
  const { templates, applyTemplate } = usePostTemplates();
  const { validateContent, formatForPlatform, getCharacterCount } = usePlatformLimits();
  
  // State
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);

  // Check if user has any connected accounts
  const hasAccounts = accounts.length > 0;

  // Get selected accounts with platform info
  const selectedAccountsWithPlatform = accounts.filter(acc => 
    selectedAccounts.has(acc.id)
  );

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  // Add hashtag
  const addHashtag = () => {
    if (!currentHashtag.trim()) return;
    
    const tag = currentHashtag.trim().replace(/^#/, '');
    setHashtags([...hashtags, tag]);
    setCurrentHashtag('');
  };

  // Remove hashtag
  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  // Apply template
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const appliedCaption = applyTemplate(template, caption);
    setCaption(appliedCaption);
    setSelectedTemplate(templateId);

    // Add template hashtags if any
    if (template.hashtag_sets && template.hashtag_sets.length > 0) {
      const randomSet = template.hashtag_sets[
        Math.floor(Math.random() * template.hashtag_sets.length)
      ];
      setHashtags([...hashtags, ...randomSet]);
    }
  };

  // Validate before posting
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (selectedAccounts.size === 0) {
      newErrors.accounts = 'Please select at least one account to post to';
    }

    if (!caption.trim() && selectedMedia.length === 0) {
      newErrors.content = 'Please add some content or media';
    }

    if (scheduleMode === 'schedule' && !scheduleDate) {
      newErrors.schedule = 'Please select a date and time';
    }

    // Validate content for each platform
    selectedAccountsWithPlatform.forEach(account => {
      if (account.platform) {
        const validation = validateContent(account.platform.name, {
          caption,
          media_urls: selectedMedia,
          hashtags,
        });
        
        if (!validation.valid) {
          validation.errors.forEach(error => {
            newErrors[`${account.platform.name}_${error}`] = error;
          });
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle post creation
  const handlePost = async () => {
    if (!validate()) return;

    setIsPosting(true);
    try {
      const results = await createPost({
        account_ids: Array.from(selectedAccounts),
        content: {
          caption,
          media_urls: selectedMedia,
          hashtags,
        },
        schedule_at: scheduleMode === 'schedule' && scheduleDate 
          ? scheduleDate.toISOString() 
          : undefined,
        template_id: selectedTemplate || undefined,
      });

      // Check results
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        setErrors({
          post: `Failed to post to ${failures.length} platform(s)`,
        });
      } else {
        // Success - redirect to dashboard or success page
        router.push('/dashboard?posted=true');
      }
    } catch (error: any) {
      setErrors({
        post: error.message || 'Failed to create post',
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (!hasAccounts) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Social Accounts Connected</h2>
            <p className="text-muted-foreground mb-6">
              Connect your social media accounts to start posting
            </p>
            <Button onClick={() => router.push('/settings/social')}>
              Connect Accounts
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create Post</h1>
            <p className="text-muted-foreground">
              Compose and schedule your content across multiple platforms
            </p>
          </div>

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Platforms</CardTitle>
              <CardDescription>
                Choose which accounts to post to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(accountsByPlatform).map(([platformName, platformAccounts]) => {
                  const platform = platforms.find(p => p.name === platformName);
                  const Icon = platformIcons[platformName];
                  
                  return (
                    <div key={platformName} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {Icon && <Icon className="h-4 w-4" />}
                        {platform?.display_name || platformName}
                      </div>
                      <div className="grid gap-2">
                        {platformAccounts.map(account => (
                          <label
                            key={account.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedAccounts.has(account.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccounts.has(account.id)}
                              onChange={() => toggleAccount(account.id)}
                              className="sr-only"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              {account.profile_image_url && (
                                <img
                                  src={account.profile_image_url}
                                  alt={account.username}
                                  className="h-8 w-8 rounded-full"
                                />
                              )}
                              <div>
                                <p className="font-medium">@{account.username}</p>
                                {account.display_name && (
                                  <p className="text-xs text-muted-foreground">{account.display_name}</p>
                                )}
                              </div>
                            </div>
                            {selectedAccounts.has(account.id) && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.accounts && (
                <p className="text-sm text-red-500 mt-2">{errors.accounts}</p>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Write your caption and add media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              {templates.length > 0 && (
                <div>
                  <Label>Template (Optional)</Label>
                  <select
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                    value={selectedTemplate || ''}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                  >
                    <option value="">No template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Caption */}
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="What's on your mind?"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
                
                {/* Character counts for selected platforms */}
                {selectedAccountsWithPlatform.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedAccountsWithPlatform.map(account => {
                      if (!account.platform) return null;
                      const charCount = getCharacterCount(account.platform.name, caption);
                      return (
                        <div key={account.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            @{account.username}
                          </span>
                          <span className={charCount.percentage > 90 ? 'text-red-500' : 'text-muted-foreground'}>
                            {charCount.current} / {charCount.limit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div>
                <Label>Hashtags</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Add hashtag"
                    value={currentHashtag}
                    onChange={(e) => setCurrentHashtag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHashtag();
                      }
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addHashtag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashtags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeHashtag(index)}
                    >
                      #{tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Media Selection */}
              <div>
                <Label>Media</Label>
                <MediaSelector
                  selectedMedia={selectedMedia}
                  onMediaChange={setSelectedMedia}
                  maxItems={4}
                />
              </div>

              {errors.content && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.content}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Post now or schedule for later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={scheduleMode} onValueChange={(v) => setScheduleMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="now">
                    <Send className="h-4 w-4 mr-2" />
                    Post Now
                  </TabsTrigger>
                  <TabsTrigger value="schedule">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="schedule">
                  <SchedulePicker
                    value={scheduleDate}
                    onChange={setScheduleDate}
                    minDate={new Date()}
                  />
                  {errors.schedule && (
                    <p className="text-sm text-red-500 mt-2">{errors.schedule}</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before posting
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={isPosting || selectedAccounts.size === 0}
              className="flex-1"
            >
              {isPosting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {scheduleMode === 'now' ? 'Posting...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  {scheduleMode === 'now' ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Now
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Post
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show
                </>
              )}
            </Button>
          </div>

          {showPreview && selectedAccountsWithPlatform.length > 0 && (
            <div className="space-y-4">
              {selectedAccountsWithPlatform.map(account => (
                <PlatformPreview
                  key={account.id}
                  account={account}
                  content={{
                    caption,
                    media_urls: selectedMedia,
                    hashtags,
                  }}
                />
              ))}
            </div>
          )}

          {showPreview && selectedAccountsWithPlatform.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select accounts to see preview
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}