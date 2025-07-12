'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Hash,
  Type,
  Link2
} from 'lucide-react';
import { Instagram, Twitter, LinkedIn, TikTok, Pinterest } from '@/components/icons/social-icons';
import { useSocial, usePostTemplates } from '@postoko/social';

// Platform icons mapping
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  pinterest: Pinterest,
  linkedin: LinkedIn,
  tiktok: TikTok,
};

export default function TemplatesPage() {
  const router = useRouter();
  const { platforms } = useSocial();
  const { templates, deleteTemplate, setDefaultTemplate } = usePostTemplates();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const filteredTemplates = selectedPlatform === 'all' 
    ? templates 
    : templates.filter(t => t.platform_id === selectedPlatform);

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Delete template error:', error);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultTemplate(templateId);
    } catch (error) {
      console.error('Set default template error:', error);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings/social')}
              className="mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Social Accounts
            </Button>
            <h1 className="text-3xl font-bold">Post Templates</h1>
            <p className="mt-2 text-muted-foreground">
              Create reusable templates for consistent posting across platforms
            </p>
          </div>
          <Button onClick={() => router.push('/settings/social/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedPlatform === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('all')}
          >
            All Platforms
          </Button>
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.name] || Link2;
            return (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {platform.display_name}
              </Button>
            );
          })}
        </div>

        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Type className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create templates to maintain consistent posting across your social accounts
              </p>
              <Button onClick={() => router.push('/settings/social/templates/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map((template) => {
              const platform = platforms.find(p => p.id === template.platform_id);
              const Icon = platform ? platformIcons[platform.name] || Link2 : Link2;

              return (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.is_default && (
                            <Badge variant="secondary">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {platform?.display_name || 'Unknown Platform'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        {!template.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template.id)}
                            title="Set as default"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/settings/social/templates/${template.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id, template.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.caption_template && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1 flex items-center gap-1">
                          <Type className="h-4 w-4" />
                          Caption Template
                        </p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {template.caption_template.length > 100
                            ? template.caption_template.substring(0, 100) + '...'
                            : template.caption_template}
                        </p>
                      </div>
                    )}
                    
                    {template.hashtag_sets && template.hashtag_sets.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-1">
                          <Hash className="h-4 w-4" />
                          Hashtag Sets ({template.hashtag_sets.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.hashtag_sets[0].slice(0, 5).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {template.hashtag_sets[0].length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.hashtag_sets[0].length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Template Variables</CardTitle>
            <CardDescription>
              Use these variables in your templates for dynamic content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{'{caption}'}</code>
                <p className="text-sm text-muted-foreground mt-1">
                  The main caption text for your post
                </p>
              </div>
              <div>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{'{date}'}</code>
                <p className="text-sm text-muted-foreground mt-1">
                  Current date when the post is created
                </p>
              </div>
              <div>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{'{time}'}</code>
                <p className="text-sm text-muted-foreground mt-1">
                  Current time when the post is created
                </p>
              </div>
              <div>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{'{hashtags}'}</code>
                <p className="text-sm text-muted-foreground mt-1">
                  Random hashtag set from your template
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}