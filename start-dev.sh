#!/bin/bash
# Quick start script for SIGEM-AO mobile with Expo

echo "🚀 Starting SIGEM-AO Mobile & Backend..."
echo "IP: 192.168.0.201"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g expo-cli
fi

echo "✅ Verified: npm and expo-cli available"
echo ""

# Start backend in background
echo "🔧 Starting backend on port 4001..."
cd backend
npm run dev &
BACKEND_PID=$!
sleep 3

# Start frontend in background
echo "🌐 Starting frontend on port 5173..."
cd ../
npm run dev &
FRONTEND_PID=$!
sleep 3

# Start mobile
echo "📱 Starting Expo Go mobile app..."
cd mobile
echo ""
echo "=========================================="
echo "Scan the QR code with Expo Go app!"
echo "IP: 192.168.0.201"
echo "=========================================="
echo ""

npm start

# Cleanup
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
