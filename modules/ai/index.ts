// AI Module - Main exports

// Types
export * from './types';

// Core libraries
export { OpenAIClient } from './lib/openai-client';
export { CaptionGenerator } from './lib/caption-generator';
export { ImageGenerator } from './lib/image-generator';
export { TemplateEngine } from './lib/template-engine';

// Context and hooks (to be implemented)
// export { AIProvider, useAI } from './context/ai-context';
// export { useAIGeneration } from './hooks/use-ai-generation';
// export { useTemplates } from './hooks/use-templates';
// export { useBrandVoices } from './hooks/use-brand-voices';

// Components (to be implemented)
// export { CaptionGenerator as CaptionGeneratorComponent } from './components/caption-generator';
// export { ImageGenerator as ImageGeneratorComponent } from './components/image-generator';
// export { TemplateSelector } from './components/template-selector';
// export { BrandVoiceSelector } from './components/brand-voice-selector';