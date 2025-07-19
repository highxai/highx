#!/bin/bash

# Run tests
echo "🧪 Running tests..."
bun run test
if [ $? -ne 0 ]; then
  echo "❌ Test failed"
  exit 1
fi

# Run build
echo "🔧 Building project..."
bun run project:build
if [ $? -ne 0 ]; then
  echo "❌ Failed to build"
  exit 1
fi

# Copy assets from src/templates to dist/templates
echo "📁 Copying templates..."
mkdir -p dist/templates
cp -r src/templates/* dist/templates/

echo "✅ Done!"

