const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const updates = [
    { name: 'POKER', url: '/images/poker_beer.jpg' },
    { name: 'COSTEÑA', url: '/images/costena_beer.jpg' },
    { name: 'CLUB COLOMBIA', url: '/images/club_colombia.jpg' },
    { name: 'CORONA', url: '/images/corona_beer.jpg' },
    { name: 'HEINEKEN', url: '/images/heineken_beer.jpg' },
    { name: 'STELLA', url: '/images/stella_artois.jpg' },
    { name: 'SMIRNO', url: '/images/smirnoff.jpg' },
    { name: 'COCA COLA', url: '/images/coca_cola.jpg' },
    { name: 'AGUA', url: '/images/water_bottle.jpg' },
    { name: 'SPEED MAX', url: '/images/energy_drink.jpg' },
    { name: 'GATORADE', url: '/images/energy_drink.jpg' },
    { name: 'ELECTROLIT', url: '/images/energy_drink.jpg' },
    { name: 'AGUILA', url: '/images/aguila_beer.jpg' }
  ];

  for (const update of updates) {
    const res = await prisma.producto.updateMany({
      where: { nombre: { contains: update.name, mode: 'insensitive' } },
      data: { imagenUrl: update.url }
    });
    console.log(`Updated ${update.name}: ${res.count} products.`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
