const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create services
  const homeCleaningService = await prisma.service.create({
    data: {
      name: 'Home Cleaning',
      description: 'Professional house cleaning services',
      category: 'Home Services',
      averagePrice: 50,
    },
  });

  const plumbingService = await prisma.service.create({
    data: {
      name: 'Plumbing',
      description: 'Expert plumbing repair and installation',
      category: 'Home Services',
      averagePrice: 80,
    },
  });

  const tutoringService = await prisma.service.create({
    data: {
      name: 'Tutoring',
      description: 'Academic support for all subjects',
      category: 'Education',
      averagePrice: 30,
    },
  });

  // Create sample users and providers
  const sarahUser = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+1234567890',
      userType: 'PROVIDER',
    },
  });

  const sarahProvider = await prisma.provider.create({
    data: {
      userId: sarahUser.id,
      rating: 4.8,
      reviews: 127,
      experience: '5 years',
      location: 'Downtown',
      hourlyRate: 25,
      bio: 'Experienced home cleaner with attention to detail',
      verified: true,
      services: {
        connect: { id: homeCleaningService.id }
      }
    },
  });

  const mikeUser = await prisma.user.create({
    data: {
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+1234567891',
      userType: 'PROVIDER',
    },
  });

  const mikeProvider = await prisma.provider.create({
    data: {
      userId: mikeUser.id,
      rating: 4.9,
      reviews: 89,
      experience: '8 years',
      location: 'Westside',
      hourlyRate: 40,
      bio: 'Licensed plumber with 8 years of experience',
      verified: true,
      services: {
        connect: { id: plumbingService.id }
      }
    },
  });

  // Create a sample customer
  const johnUser = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+1234567892',
      userType: 'CUSTOMER',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      userId: johnUser.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Sample login credentials:');
  console.log('Provider: sarah@example.com / password123');
  console.log('Provider: mike@example.com / password123');
  console.log('Customer: john@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });