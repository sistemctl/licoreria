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

  const productsToSync = [];
  // Data starts at index 2 (row 3)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    let nombre = row['__EMPTY'];
    let precioCompra = parseFloat(row['__EMPTY_2']);
    let precioVentaDetal = parseFloat(row['__EMPTY_4']);
    let cantidad = parseInt(row['__EMPTY_1']);

    if (nombre && typeof nombre === 'string') {
      nombre = nombre.trim();
      if (!nombre) continue;

      precioCompra = isNaN(precioCompra) ? 0 : precioCompra;
      precioVentaDetal = isNaN(precioVentaDetal) ? 0 : precioVentaDetal;
      cantidad = isNaN(cantidad) ? 0 : cantidad;

      productsToSync.push({
        nombre,
        precioCompra,
        precioVentaDetal,
        stock: cantidad,
      });
    }
  }

  console.log(`Found ${productsToSync.length} valid product rows in Excel.`);
  let added = 0;
  let skipped = 0;

  for (const product of productsToSync) {
    const existing = await prisma.producto.findFirst({
      where: { nombre: product.nombre }
    });

    if (existing) {
      console.log(`Saltando (ya existe): ${product.nombre}`);
      skipped++;
    } else {
      console.log(`Creando nuevo: ${product.nombre}`);
      await prisma.producto.create({
        data: {
          nombre: product.nombre,
          precioCompra: product.precioCompra,
          precioVentaDetal: product.precioVentaDetal,
          stock: product.stock,
          marca: 'Desconocida',
          descripcion: product.nombre,
          categoriaId: 11, // Otros
          unidadMedida: 'unidad',
          stockMinimo: 5,
          esCombo: false,
          activo: true
        }
      });
      added++;
    }
  }
  
  console.log(`Sincronización completada. Nuevos añadidos: ${added}. Omitidos (ya existían): ${skipped}.`);
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
