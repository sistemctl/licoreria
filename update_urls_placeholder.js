const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando actualización a URLs funcionales (placeholders con nombre)...');
  
  const products = await prisma.producto.findMany();
  
  for (const product of products) {
    // Generar URL válida de placeholder con el nombre del producto
    const encodedName = encodeURIComponent(product.nombre);
    const placeholderUrl = `https://placehold.co/400x400/f8f9fa/212529?text=${encodedName}`;
    
    await prisma.producto.update({
      where: { id: product.id },
      data: { imagenUrl: placeholderUrl }
    });
    console.log(`Actualizado ${product.nombre}`);
  }
  
  console.log('Actualización completada.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
