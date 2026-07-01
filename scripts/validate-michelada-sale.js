/**
 * Valida que vender una michelada descuente la cerveza del inventario.
 * Uso: node scripts/validate-michelada-sale.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const michelada = await prisma.producto.findUnique({
    where: { codigoBarras: 'MIC-SENCILLA' },
    include: {
      comboComoCombo: {
        include: { producto: true },
      },
    },
  });

  if (!michelada) {
    throw new Error('No se encontró el combo MIC-SENCILLA. Ejecuta: npx prisma db seed');
  }

  const ingrediente = michelada.comboComoCombo[0]?.producto;
  if (!ingrediente) {
    throw new Error('La michelada sencilla no tiene ingredientes configurados.');
  }

  const stockAntes = ingrediente.stock;
  const cantidadVenta = 1;

  await prisma.$transaction(async (tx) => {
    for (const combDet of michelada.comboComoCombo) {
      const ingProd = await tx.producto.findUnique({ where: { id: combDet.productoId } });
      const cantRequerida = combDet.cantidad * cantidadVenta;

      if (!ingProd || ingProd.stock < cantRequerida) {
        throw new Error(
          `Stock insuficiente para "${ingProd?.nombre}" (requerido: ${cantRequerida}, disponible: ${ingProd?.stock || 0})`
        );
      }

      await tx.producto.update({
        where: { id: combDet.productoId },
        data: { stock: { decrement: cantRequerida } },
      });
    }
  });

  const ingredienteDespues = await prisma.producto.findUnique({
    where: { id: ingrediente.id },
  });

  const esperado = stockAntes - cantidadVenta;
  if (ingredienteDespues.stock !== esperado) {
    throw new Error(
      `Stock incorrecto. Antes: ${stockAntes}, después: ${ingredienteDespues.stock}, esperado: ${esperado}`
    );
  }

  await prisma.producto.update({
    where: { id: ingrediente.id },
    data: { stock: stockAntes },
  });

  console.log('OK: venta simulada de michelada descuenta inventario correctamente.');
  console.log(`  Combo: ${michelada.nombre}`);
  console.log(`  Ingrediente: ${ingrediente.nombre}`);
  console.log(`  Stock: ${stockAntes} -> ${esperado} (restaurado a ${stockAntes})`);
}

main()
  .catch((error) => {
    console.error('FALLÓ validación:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
