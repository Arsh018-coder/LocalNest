#!/bin/bash

echo "🚀 Starting LocalNest locally with PostgreSQL in Docker..."

# Start only PostgreSQL in Docker
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Setup database
echo "🗄️  Setting up database..."
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed

# Start backend
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo "⚛️  Starting frontend development server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 LocalNest is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Database: postgresql://localnest:localnest123@localhost:5432/localnest_db"
echo "Prisma Studio: npm run db:studio (in backend folder)"
echo ""
echo "Press Ctrl+C to stop servers"

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