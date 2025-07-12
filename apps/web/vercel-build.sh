#!/bin/bash

# Copy over the Vercel-compatible package.json
cp package.vercel.json package.json

# Copy shared packages into the app
mkdir -p node_modules/@postoko

# Copy packages
cp -r ../../packages/database node_modules/@postoko/
cp -r ../../packages/types node_modules/@postoko/
cp -r ../../packages/utils node_modules/@postoko/

# Copy modules
cp -r ../../modules/auth node_modules/@postoko/
cp -r ../../modules/settings node_modules/@postoko/
cp -r ../../modules/billing node_modules/@postoko/
cp -r ../../modules/drive node_modules/@postoko/
cp -r ../../modules/social node_modules/@postoko/
cp -r ../../modules/queue node_modules/@postoko/
cp -r ../../modules/ai node_modules/@postoko/

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build