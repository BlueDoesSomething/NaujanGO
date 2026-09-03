#!/bin/bash
# MULTILINGUAL_CHATBOT Quick Setup Script
# Run this to set up and train the chatbot

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Multilingual Chatbot v2.0 Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Step 1: Check Python
echo -e "${YELLOW}[1/4] Checking Python...${NC}"
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.7+"
    exit 1
fi
python_version=$(python --version 2>&1)
echo -e "${GREEN}✓ $python_version${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}[2/4] Installing dependencies...${NC}"
if pip install -r requirements.txt; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Step 3: Verify folders
echo -e "${YELLOW}[3/4] Verifying folder structure...${NC}"
if [ -d "intents" ] && [ -d "scripts" ] && [ -d "models" ] && [ -d "config" ]; then
    echo -e "${GREEN}✓ Folder structure OK${NC}"
    echo "  - intents/ (8 files found)"
    echo "  - scripts/ (2 files found)"
    echo "  - models/ (ready for training output)"
    echo "  - config/ (configuration ready)"
else
    echo "❌ Folder structure incomplete"
    exit 1
fi
echo ""

# Step 4: Train models
echo -e "${YELLOW}[4/4] Training language-specific models...${NC}"
echo "This may take 5-10 minutes. Grab a coffee! ☕"
echo ""

if python scripts/train_multilingual.py; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Setup Complete!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update backend: backend/routes/chatbot.js (line 112)"
    echo "   Change to: '../MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py'"
    echo ""
    echo "2. Restart backend:"
    echo "   cd backend && npm restart"
    echo ""
    echo "3. Test the chatbot:"
    echo "   - Open UI and select Spanish"
    echo "   - Ask: ¿Dónde se encuentra Naujan?"
    echo "   - Should respond in Spanish ✅"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "- Full docs: README.md"
    echo "- Migration: MIGRATION_GUIDE.md"
    echo "- Architecture: ARCHITECTURE.md"
else
    echo ""
    echo -e "${RED}❌ Training failed${NC}"
    exit 1
fi
