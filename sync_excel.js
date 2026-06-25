const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const workbook = xlsx.readFile('/home/ubuntu/Descargas/EXCEL LICORERA A.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  // The actual data starts from index 2 (row 3 in Excel)
  const productsToSync = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const nombre = row['__EMPTY'];
    const precioCompra = row['__EMPTY_2'];
    const precioVentaDetal = row['__EMPTY_4'];
    const cantidad = row['__EMPTY_1'];

    if (nombre && !isNaN(precioCompra) && !isNaN(precioVentaDetal)) {
      productsToSync.push({
        nombre: nombre.trim(),
        precioCompra: parseFloat(precioCompra),
        precioVentaDetal: parseFloat(precioVentaDetal),
        stock: cantidad ? parseInt(cantidad) : 0,
      });
    }
  }

  console.log(`Found ${productsToSync.length} products to sync.`);

  for (const product of productsToSync) {
    const existing = await prisma.producto.findFirst({
      where: { nombre: product.nombre }
    });

    if (existing) {
      console.log(`Updating ${product.nombre}...`);
      await prisma.producto.update({
        where: { id: existing.id },
        data: {
          precioCompra: product.precioCompra,
          precioVentaDetal: product.precioVentaDetal,
          stock: existing.stock + product.stock,
        }
      });
    } else {
      console.log(`Creating ${product.nombre}...`);
      await prisma.producto.create({
        data: {
          nombre: product.nombre,
          precioCompra: product.precioCompra,
          precioVentaDetal: product.precioVentaDetal,
          stock: product.stock,
          marca: 'Desconocida', // Or handle if known
          descripcion: product.nombre,
          categoriaId: 11, // Otros by default
          unidadMedida: 'unidad',
          stockMinimo: 5,
          esCombo: false,
          activo: true
        }
      });
    }
  }
  
  console.log('Sincronización completada.');
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
