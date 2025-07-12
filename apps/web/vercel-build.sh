#!/bin/bash

# Copy over the Vercel-compatible package.json
cp package.vercel.json package.json

# Install dependencies first
npm install --legacy-peer-deps

# Install missing dependencies that modules need
npm install --legacy-peer-deps stripe@^13.0.0 @types/js-cookie@^3.0.6

# Copy shared packages into the app
mkdir -p node_modules/@postoko

# Copy packages
cp -r ../../packages/database node_modules/@postoko/
cp -r ../../packages/types node_modules/@postoko/
cp -r ../../packages/utils node_modules/@postoko/

# Copy modules but fix imports first
for module in auth settings billing drive social queue ai; do
  cp -r ../../modules/$module node_modules/@postoko/
  
  # Fix imports in the copied module files
  find node_modules/@postoko/$module -name "*.ts" -o -name "*.tsx" | while read file; do
    # Replace @/components imports with relative paths
    sed -i "s|'@/components/ui/|'../../../src/components/ui/|g" "$file"
    sed -i "s|\"@/components/ui/|\"../../../src/components/ui/|g" "$file"
  done
done

# Build
npm run build