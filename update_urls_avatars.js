const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando actualización a ui-avatars.com (100% confiable sin bloqueos CORS)...');
  
  const products = await prisma.producto.findMany();
  
  for (const product of products) {
    const encodedName = encodeURIComponent(product.nombre);
    // Usar ui-avatars que nunca bloquea y genera imágenes en base64 o PNG puro seguro
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=400&bold=true&format=svg`;
    
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
