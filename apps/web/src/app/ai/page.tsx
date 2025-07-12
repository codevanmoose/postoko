'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner as LoadingSpinner } from '@/components/ui/spinner';
import { Sparkles, Image, Type, Zap } from 'lucide-react';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<'caption' | 'image'>('caption');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Caption generation
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);

  // Image generation
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('vivid');
  const [size, setSize] = useState('1024x1024');

  const generateCaption = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          content_description: description,
          target_platforms: platforms,
          include_hashtags: true,
          include_cta: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate caption');

      const data = await response.json();
      setResult(JSON.stringify(data.generation.result, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult('Error generating caption');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          size,
          quality: 'standard',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      setResult(JSON.stringify(data.generation.result, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult('Error generating image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Content Studio
          </h1>
          <p className="text-gray-600 mt-1">
            Generate engaging captions and stunning visuals with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('caption')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  ${activeTab === 'caption' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Type className="h-4 w-4" />
                Caption Generator
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  ${activeTab === 'image' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Image className="h-4 w-4" />
                Image Generator
              </button>
            </div>

            {/* Caption Generator */}
            {activeTab === 'caption' && (
              <div className="bg-white rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Generate Caption</h2>
                
                <div>
                  <Label htmlFor="image-url">Image URL (Optional)</Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Content Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Describe what your post is about..."
                  />
                </div>

                <div>
                  <Label>Target Platforms</Label>
                  <div className="flex gap-2 mt-2">
                    {['instagram', 'twitter', 'linkedin', 'pinterest'].map(platform => (
                      <label key={platform} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlatforms([...platforms, platform]);
                            } else {
                              setPlatforms(platforms.filter(p => p !== platform));
                            }
                          }}
                        />
                        <span className="text-sm capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={generateCaption} 
                  disabled={loading || !description}
                  className="w-full gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Zap className="h-4 w-4" />}
                  Generate Caption
                </Button>
              </div>
            )}

            {/* Image Generator */}
            {activeTab === 'image' && (
              <div className="bg-white rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Generate Image</h2>
                
                <div>
                  <Label htmlFor="prompt">Image Prompt</Label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="A beautiful sunset over mountains with vibrant colors..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="style">Style</Label>
                    <select
                      id="style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="vivid">Vivid</option>
                      <option value="natural">Natural</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="size">Size</Label>
                    <select
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="1024x1024">Square (1024x1024)</option>
                      <option value="1792x1024">Landscape (1792x1024)</option>
                      <option value="1024x1792">Portrait (1024x1792)</option>
                    </select>
                  </div>
                </div>

                <Button 
                  onClick={generateImage} 
                  disabled={loading || !prompt}
                  className="w-full gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Zap className="h-4 w-4" />}
                  Generate Image
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Generated Content</h2>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-500 mt-2">Generating content...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                    {result}
                  </pre>
                  <Button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    variant="outline"
                    size="sm"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Generate content to see results here</p>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-500">Captions Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-gray-500">Images Created</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}