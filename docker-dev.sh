#!/bin/bash

echo "🚀 Starting LocalNest with Docker..."

# Build and start services
docker-compose up --build -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations and seed
echo "🗄️  Setting up database..."
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
cd ..

# Start all services
echo "🎉 Starting all services..."
docker-compose up --build

echo ""
echo "🎉 LocalNest is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Database: postgresql://localnest:localnest123@localhost:5432/localnest_db"
echo ""
echo "Press Ctrl+C to stop all services"