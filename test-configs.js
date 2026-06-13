const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const configs = await prisma.configuracion.findMany();
  console.log('Configs in database:', configs);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
