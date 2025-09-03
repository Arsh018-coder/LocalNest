#!/bin/bash

echo "🚀 Starting LocalNest with Docker..."

# Build images and start the database service
docker-compose build
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations and seed
echo "🗄️  Setting up database..."
docker-compose run --rm backend npm install
docker-compose run --rm backend npx prisma migrate dev --name init
docker-compose run --rm backend npx prisma generate
docker-compose run --rm backend npm run db:seed

# Start all services
echo "🎉 Starting all services..."
docker-compose up

echo ""
echo "🎉 LocalNest is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Database: postgresql://localnest:localnest123@localhost:5432/localnest_db"
echo ""
echo "Press Ctrl+C to stop all services"