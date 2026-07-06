#!/bin/bash
# Quick Start Script - سكريبت البدء السريع

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   PeopleOS ATS CV Builder - Backend Quick Start          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 16.0.0 or higher"
    echo "📥 Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found! (Required for production)"
    echo "📥 Download from: https://dev.mysql.com/downloads/mysql/"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

echo ""
echo "📋 Checking .env file..."

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found! Creating template..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=peopleos_db

# Server Configuration
NODE_ENV=development
SERVER_PORT=5000
SERVER_HOST=127.0.0.1

# CORS Configuration
CORS_ORIGIN=https://peopleos.online
ALLOW_CREDENTIALS=true

# Security
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
EOF
    echo "✅ Template .env created"
    echo "🔧 Please edit .env with your database credentials"
    exit 0
fi

echo "✅ .env file exists"

echo ""
echo "🚀 Ready to start! Run one of these commands:"
echo ""
echo "   Development (with auto-reload):"
echo "   $ npm run dev"
echo ""
echo "   Production:"
echo "   $ npm start"
echo ""
echo "   Using Docker:"
echo "   $ docker-compose up"
echo ""
