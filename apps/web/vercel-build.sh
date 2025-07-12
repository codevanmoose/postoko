#!/bin/bash

# Copy over the Vercel-compatible package.json
cp package.vercel.json package.json

# Install dependencies first
npm install --legacy-peer-deps

# Install missing dependencies that modules need
npm install --legacy-peer-deps stripe@^13.0.0 @types/js-cookie@^3.0.6 googleapis@^128.0.0

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
    # Create a temporary file
    temp_file="${file}.tmp"
    
    # Count the depth from node_modules/@postoko/[module]/... to get correct relative path
    depth=$(echo "$file" | sed 's|node_modules/@postoko/||' | tr '/' '\n' | wc -l)
    depth=$((depth - 1))
    
    # Build the relative path prefix
    prefix=""
    for i in $(seq 1 $depth); do
      prefix="../$prefix"
    done
    
    # Replace imports
    sed -e "s|from '@/components/ui/|from '${prefix}src/components/ui/|g" \
        -e "s|from \"@/components/ui/|from \"${prefix}src/components/ui/|g" \
        -e "s|from '@/lib/|from '${prefix}src/lib/|g" \
        -e "s|from \"@/lib/|from \"${prefix}src/lib/|g" \
        -e "s|from '@/hooks/|from '${prefix}src/hooks/|g" \
        -e "s|from \"@/hooks/|from \"${prefix}src/hooks/|g" \
        "$file" > "$temp_file"
    
    # Move temp file back
    mv "$temp_file" "$file"
  done
done

# Build with the custom tsconfig
npm run build