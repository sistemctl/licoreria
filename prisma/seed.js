require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed de base de datos...');

  // 1. Crear Roles
  const superAdminPermissions = {
    inicio: true,
    pos: true,
    inventario: true,
    categorias: true,
    combos: true,
    descuentos: true,
    ventas: true,
    compras: true,
    proveedores: true,
    clientes: true,
    creditos: true,
    devoluciones: true,
    caja: true,
    reportes: true,
    auditoria: true,
    usuarios: true,
    configuracion: true,
  };

  const adminPermissions = {
    inicio: true,
    pos: true,
    inventario: true,
    categorias: true,
    combos: true,
    descuentos: true,
    ventas: true,
    compras: true,
    proveedores: true,
    clientes: true,
    creditos: true,
    devoluciones: true,
    caja: true,
    reportes: true,
    auditoria: false, // NO ACCESO
    usuarios: false,  // NO ACCESO
    configuracion: false, // NO ACCESO
  };

  const cajeroPermissions = {
    inicio: true,
    pos: true,
    inventario: false,
    categorias: false,
    combos: false,
    descuentos: false,
    ventas: true,
    compras: false,
    proveedores: false,
    clientes: true,
    creditos: false,
    devoluciones: false,
    caja: true,
    reportes: false,
    auditoria: false,
    usuarios: false,
    configuracion: false,
  };

  const almacenistaPermissions = {
    inicio: true,
    pos: false,
    inventario: true,
    categorias: true,
    combos: true,
    descuentos: false,
    ventas: false,
    compras: true,
    proveedores: true,
    clientes: false,
    creditos: false,
    devoluciones: false,
    caja: false,
    reportes: false,
    auditoria: false,
    usuarios: false,
    configuracion: false,
  };

  const rolSuperAdmin = await prisma.rol.upsert({
    where: { nombre: 'Superadministrador' },
    update: { permisos: superAdminPermissions },
    create: {
      nombre: 'Superadministrador',
      permisos: superAdminPermissions,
    },
  });

  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: { permisos: adminPermissions },
    create: {
      nombre: 'Administrador',
      permisos: adminPermissions,
    },
  });

  const rolCajero = await prisma.rol.upsert({
    where: { nombre: 'Cajero' },
    update: {},
    create: {
      nombre: 'Cajero',
      permisos: cajeroPermissions,
    },
  });

  const rolAlmacenista = await prisma.rol.upsert({
    where: { nombre: 'Almacenista' },
    update: {},
    create: {
      nombre: 'Almacenista',
      permisos: almacenistaPermissions,
    },
  });

  console.log('Roles creados/verificados.');

  // 2. Crear Usuario Administrador (como Superadministrador)
  const passwordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      username: 'admin',
      passwordHash: passwordHash,
      rolId: rolSuperAdmin.id,
      activo: true,
    },
  });

  console.log(`Usuario administrador creado: ${adminUser.username}`);

  // 3. Crear Categorías
  const categorias = [
    'Rones',
    'Whiskys',
    'Vodkas',
    'Cervezas',
    'Vinos',
    'Tequilas',
    'Refrescos',
    'Snacks',
    'Cigarrillos',
    'Hielo',
    'Otros',
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat },
      update: {},
      create: {
        nombre: cat,
        descripcion: `Categoría para ${cat}`,
        activo: true,
      },
    });
  }

  console.log('Categorías creadas.');

  // 4. Crear Configuraciones Iniciales
  const configs = [
    { clave: 'nombre_negocio', valor: 'Mi Licorería', descripcion: 'Nombre del establecimiento' },
    { clave: 'direccion', valor: '', descripcion: 'Dirección física del negocio' },
    { clave: 'telefono', valor: '', descripcion: 'Número de teléfono de contacto' },
    { clave: 'rif_nit', valor: '', descripcion: 'RIF / NIT del negocio' },
    { clave: 'moneda_simbolo', valor: '$', descripcion: 'Símbolo de la moneda de facturación' },
    { clave: 'impuesto_porcentaje', valor: '0', descripcion: 'Porcentaje de impuesto a aplicar' },
    { clave: 'prefijo_factura', valor: 'FAC-', descripcion: 'Prefijo correlativo de facturas' },
    { clave: 'siguiente_num_factura', valor: '1', descripcion: 'Próximo número de factura a emitir' },
    { clave: 'dias_alerta_vencimiento', valor: '15', descripcion: 'Días de antelación para alertas de vencimiento' },
  ];

  for (const conf of configs) {
    await prisma.configuracion.upsert({
      where: { clave: conf.clave },
      update: {},
      create: {
        clave: conf.clave,
        valor: conf.valor,
        descripcion: conf.descripcion,
      },
    });
  }

  console.log('Configuraciones iniciales insertadas.');
  console.log('Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
