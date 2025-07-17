#!/bin/bash

# Fix API routes to be dynamic
echo "Fixing API routes to use dynamic rendering..."

# Find all route.ts files in the API directory
find apps/web/src/app/api -name "route.ts" -type f | while read -r file; do
  # Check if the file contains requireAuth or cookies
  if grep -q -E "(requireAuth|cookies|getOptionalAuth)" "$file"; then
    # Check if it already has the dynamic export
    if ! grep -q "export const dynamic" "$file"; then
      echo "Fixing: $file"
      # Add the dynamic export after the imports
      sed -i '' '/^import/,$!b; /^$/a\
\
export const dynamic = '\''force-dynamic'\'';
' "$file"
    fi
  fi
done

echo "API routes fixed!"