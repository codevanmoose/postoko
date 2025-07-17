#\!/bin/bash
set -e

echo "Starting Postoko build for Vercel..."

# Install dependencies if not already installed
if [ \! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the web app with environment variable to disable file tracing
echo "Building web app..."
export NEXT_PRIVATE_STANDALONE=true
npm run build -- --filter=@postoko/web

echo "Build completed successfully\!"
