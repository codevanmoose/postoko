import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold gradient-text">
          Postoko
        </h1>
        <p className="text-2xl text-muted-foreground">
          Drop your photo. We'll post it. Daily.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The world's first perpetual content engine that combines Google Drive simplicity 
          with intelligent image generation to create an infinite posting loop.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link 
            href="/signup" 
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}