#!/bin/bash

# DeFolio Installation Script
# This script sets up the DeFolio project for development

set -e

echo "🚀 DeFolio Installation Script"
echo "================================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.template .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your API keys:"
    echo "   - ENVIO_API_KEY (from https://envio.dev)"
    echo "   - AVAIL_NEXUS_API_KEY (from https://availproject.org)"
    echo "   - OPENAI_API_KEY (optional, from https://platform.openai.com)"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Type check
echo "🔍 Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

# Success message
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Documentation:"
echo "- Quick start: QUICKSTART.md"
echo "- Full docs: README.md"
echo "- API reference: docs/API_REFERENCE.md"
echo ""
echo "Happy building! 🚀"

