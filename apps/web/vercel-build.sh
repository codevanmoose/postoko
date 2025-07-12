#!/bin/bash

# Copy over the Vercel-compatible package.json
cp package.vercel.json package.json

# Install dependencies first
npm install --legacy-peer-deps

# Install missing dependencies that modules need
npm install --legacy-peer-deps stripe@^13.0.0 @types/js-cookie@^3.0.6 googleapis@^128.0.0 crypto-js@^4.2.0 @types/crypto-js@^4.2.1

# Copy shared packages into the app
mkdir -p node_modules/@postoko

# Copy packages
cp -r ../../packages/database node_modules/@postoko/
cp -r ../../packages/types node_modules/@postoko/
cp -r ../../packages/utils node_modules/@postoko/

# Create a temporary tsconfig that resolves @ paths
cat > tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
EOF

# Copy modules and fix their imports
for module in auth settings billing drive social queue ai; do
  cp -r ../../modules/$module node_modules/@postoko/
  
  # Fix imports in TypeScript/TSX files
  find node_modules/@postoko/$module -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    # Calculate the relative path dynamically based on file depth
    rel_path=$(echo "$file" | sed 's|node_modules/@postoko/[^/]*/||')
    depth=$(echo "$rel_path" | tr '/' '\n' | grep -v '^$' | wc -l)
    
    # Build the correct number of ../
    prefix=""
    for i in $(seq 1 $((depth + 2))); do
      prefix="../$prefix"
    done
    
    # Create a temporary file
    temp_file="${file}.tmp"
    
    # Replace imports - handle both @/ and @postoko/ui patterns
    # Also fix loading-spinner -> spinner
    sed -e "s|from '@/components/ui/|from '${prefix}src/components/ui/|g" \
        -e "s|from \"@/components/ui/|from \"${prefix}src/components/ui/|g" \
        -e "s|from '@/lib/|from '${prefix}src/lib/|g" \
        -e "s|from \"@/lib/|from \"${prefix}src/lib/|g" \
        -e "s|from '@/hooks/|from '${prefix}src/hooks/|g" \
        -e "s|from \"@/hooks/|from \"${prefix}src/hooks/|g" \
        -e "s|from '@postoko/ui/components/|from '${prefix}src/components/ui/|g" \
        -e "s|from \"@postoko/ui/components/|from \"${prefix}src/components/ui/|g" \
        -e "s|/loading-spinner'|/spinner'|g" \
        -e "s|{ LoadingSpinner }|{ Spinner }|g" \
        -e "s|<LoadingSpinner|<Spinner|g" \
        "$file" > "$temp_file"
    
    # Move temp file back
    mv "$temp_file" "$file"
  done
done

# Fix app-level imports in src/app files
echo "Fixing app-level imports..."
find src/app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i \
      -e "s|from '@postoko/ui/components/|from '@/components/ui/|g" \
      -e "s|from \"@postoko/ui/components/|from \"@/components/ui/|g" \
      -e "s|/loading-spinner'|/spinner'|g" \
      -e "s|{ LoadingSpinner }|{ Spinner as LoadingSpinner }|g" \
      {} \;

# Debug: Check if files were modified
echo "Checking AI page imports before fix..."
head -10 src/app/ai/page.tsx

echo "Checking if UI components exist..."
ls -la src/components/ui/ | head -10

# Debug tsconfig resolution
echo "Current directory: $(pwd)"
echo "Checking if parent tsconfig exists..."
ls -la ../../tsconfig.json || echo "Parent tsconfig not found"

# Create a standalone tsconfig that doesn't extend
echo "Creating standalone tsconfig..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Build 
npm run build