#!/bin/bash

echo "Starting LocalNest Development Environment..."

# Start the backend server
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start the frontend development server
echo "Starting frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 LocalNest is starting up!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    pkill -f "node.*server.js" 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait
