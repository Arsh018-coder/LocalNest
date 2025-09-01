# LocalNest - Service Platform

A full-stack service platform connecting local service providers with customers.

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Containerization**: Docker & Docker Compose

## Quick Start

### Option 1: Full Docker Setup (Recommended)

```bash
# Start everything with Docker
./docker-dev.sh
```

### Option 2: Local Development with Docker Database

```bash
# Start with local servers and Docker database
./local-dev.sh
```

### Option 3: Manual Setup

1. **Start PostgreSQL**
   ```bash
   docker-compose up -d postgres
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npx prisma generate
   npm run db:seed
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Available Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: postgresql://localnest:localnest123@localhost:5432/localnest_db
- **Prisma Studio**: `npm run db:studio` (in backend folder)

## API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create new service

### Providers
- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get provider by ID
- `GET /api/providers/service/:serviceId` - Get providers by service
- `POST /api/providers` - Create new provider

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id/status` - Update booking status

## Database Management

```bash
cd backend

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://localnest:localnest123@localhost:5432/localnest_db"
NODE_ENV=development
PORT=5000
```

## Project Structure

```
LocalNest/
├── backend/
│   ├── lib/
│   │   └── prisma.js          # Database connection
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js           # Sample data
│   ├── routes/
│   │   ├── services.js       # Service endpoints
│   │   ├── providers.js      # Provider endpoints
│   │   └── bookings.js       # Booking endpoints
│   ├── .env                  # Environment variables
│   ├── server.js             # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml        # Docker services
├── docker-dev.sh            # Full Docker setup
└── local-dev.sh             # Local development script
```

## Development Tips

- Use `docker-compose logs -f [service]` to view logs
- Database changes require running `npx prisma migrate dev`
- Frontend hot-reloads automatically
- Backend restarts automatically with nodemon

## Stopping Services

- **Docker**: `docker-compose down`
- **Local**: `Ctrl+C` in terminal running the script