const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });
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
