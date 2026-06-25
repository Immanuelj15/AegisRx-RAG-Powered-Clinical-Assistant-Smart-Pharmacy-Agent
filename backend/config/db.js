const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return prisma;

  try {
    // Attempt to connect to Supabase Postgres
    await prisma.$connect();
    
    isConnected = true;
    process.env.DB_CONNECTED = 'true';
    console.log(`Prisma Connected to Supabase PostgreSQL Database!`);
    return prisma;
  } catch (error) {
    isConnected = false;
    process.env.DB_CONNECTED = 'false';
    console.error('============================================================');
    console.error(`WARNING: Prisma connection failed: ${error.message}`);
    console.error('The backend will run in Resilient Local-Memory Fallback Mode.');
    console.error('============================================================');
    return prisma;
  }
};

module.exports = { connectDB, prisma };
