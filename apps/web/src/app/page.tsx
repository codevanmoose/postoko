import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Container size="md" className="py-24">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold gradient-text animate-fade-in">
              Postoko
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground animate-slide-in-from-bottom">
              Drop your photo. We'll post it. Daily.
            </p>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
            The world's first perpetual content engine that combines Google Drive simplicity 
            with intelligent image generation to create an infinite posting loop.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-in-from-bottom animation-delay-300">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/signup">
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Login
              </Link>
            </Button>
          </div>
          
          <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center animate-fade-in animation-delay-400">
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">∞</div>
              <p className="text-sm text-muted-foreground">Infinite Content</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">24/7</div>
              <p className="text-sm text-muted-foreground">Always Posting</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">AI</div>
              <p className="text-sm text-muted-foreground">Smart Generation</p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}