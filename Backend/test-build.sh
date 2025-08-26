#!/bin/bash

echo "🧪 Testing Backend build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Backend directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building optimized version..."
npm run build:optimized

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output:"
    ls -la dist/
    
    echo "🧪 Testing start script..."
    if [ -f "dist/index.optimized.js" ]; then
        echo "✅ index.optimized.js found - build completed successfully!"
    else
        echo "❌ index.optimized.js not found - build may have failed"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 All tests passed! The build should work in GitHub Actions."
