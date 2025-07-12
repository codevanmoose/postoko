#!/bin/bash

# Replace workspace:* with file: protocol for Vercel compatibility
echo "Preparing for Vercel build..."

# Find all package.json files and replace workspace:* with file: paths
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i.bak 's/"workspace:\*"/"file:..\/..\/packages\/\*"/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i.bak 's/"@postoko\/database": "file:..\/..\/packages\/\*"/"@postoko\/database": "file:..\/..\/packages\/database"/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i.bak 's/"@postoko\/types": "file:..\/..\/packages\/\*"/"@postoko\/types": "file:..\/..\/packages\/types"/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i.bak 's/"@postoko\/utils": "file:..\/..\/packages\/\*"/"@postoko\/utils": "file:..\/..\/packages\/utils"/g' {} \;

# Clean up backup files
find . -name "*.bak" -delete

# Install dependencies
npm install --legacy-peer-deps

# Build the web app
cd apps/web && npm run build