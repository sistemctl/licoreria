const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.producto.findMany({
    where: {
      nombre: {
        in: [
          'Club Colombia', 'Cerveza Águila', 'Cerveza Poker',
          'Aguardiente Antioqueño', 'Aguardiente Néctar',
          'Ron Viejo de Caldas', 'Ron Medellín',
          'Pony Malta', 'Postobón Manzana', 'Colombiana',
          'Mustang', 'Marlboro', 'Bolsa de Hielo'
        ]
      }
    },
    include: { categoria: true }
  });
  
  console.log('IMPORTED PRODUCTS IN DB:');
  products.forEach(p => {
    console.log(`- ${p.nombre} [Categoría: ${p.categoria.nombre}] -> Compra: ${p.precioCompra}, Venta: ${p.precioVentaDetal}, Stock: ${p.stock}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
