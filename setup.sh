#!/bin/bash

# Notified Backend - Quick Setup Script
# This script automates the initial setup of the Notified backend

echo "🚀 Notified Backend Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    
    # Generate JWT secrets
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        sed -i '' "s/your-refresh-token-secret-change-this/$JWT_REFRESH_SECRET/" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        sed -i "s/your-refresh-token-secret-change-this/$JWT_REFRESH_SECRET/" .env
    fi
    
    echo -e "${GREEN}✅ .env file created with secure JWT secrets${NC}"
    echo -e "${YELLOW}⚠️  Please update MongoDB URI and email settings in .env${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi
echo ""

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"
echo ""

# Check MongoDB connection
echo "🗄️  Checking MongoDB..."
echo -e "${YELLOW}ℹ️  Make sure MongoDB is running or update MONGODB_URI in .env${NC}"
echo ""

# Summary
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your MongoDB URI"
echo "2. Configure email settings in .env (optional)"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'npm start' for production"
echo ""
echo "Documentation:"
echo "- README.md - Complete API documentation"
echo "- DEPLOYMENT.md - Deployment guide"
echo "- Notified_API.postman_collection.json - Postman collection"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
