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
    update: { permisos: cajeroPermissions },
    create: {
      nombre: 'Cajero',
      permisos: cajeroPermissions,
    },
  });

  const rolAlmacenista = await prisma.rol.upsert({
    where: { nombre: 'Almacenista' },
    update: { permisos: almacenistaPermissions },
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
    'Preparados',
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

  // 3b. Productos base y micheladas (combos/preparados)
  const catCervezas = await prisma.categoria.findUnique({ where: { nombre: 'Cervezas' } });
  const catTequilas = await prisma.categoria.findUnique({ where: { nombre: 'Tequilas' } });
  const catPreparados = await prisma.categoria.findUnique({ where: { nombre: 'Preparados' } });

  async function upsertProductoBase({ codigoBarras, nombre, marca, categoriaId, precioCompra, precioVentaDetal, stock }) {
    return prisma.producto.upsert({
      where: { codigoBarras },
      update: {
        nombre,
        marca,
        categoriaId,
        precioCompra,
        precioVentaDetal,
        stock,
        esCombo: false,
        activo: true,
      },
      create: {
        codigoBarras,
        nombre,
        marca,
        descripcion: `Producto base para preparados y venta directa`,
        categoriaId,
        precioCompra,
        precioVentaDetal,
        stock,
        stockMinimo: 10,
        esCombo: false,
        activo: true,
      },
    });
  }

  async function upsertMicheladaCombo({ codigoBarras, nombre, descripcion, precioVentaDetal, ingredientes }) {
    let totalPrecioCompra = 0;
    for (const ing of ingredientes) {
      totalPrecioCompra += parseFloat(ing.producto.precioCompra) * ing.cantidad;
    }

    const combo = await prisma.producto.upsert({
      where: { codigoBarras },
      update: {
        nombre,
        descripcion,
        categoriaId: catPreparados.id,
        precioCompra: totalPrecioCompra,
        precioVentaDetal,
        esCombo: true,
        activo: true,
      },
      create: {
        codigoBarras,
        nombre,
        descripcion,
        categoriaId: catPreparados.id,
        precioCompra: totalPrecioCompra,
        precioVentaDetal,
        stock: 0,
        stockMinimo: 0,
        esCombo: true,
        activo: true,
      },
    });

    await prisma.comboDetalle.deleteMany({ where: { comboId: combo.id } });
    for (const ing of ingredientes) {
      await prisma.comboDetalle.create({
        data: {
          comboId: combo.id,
          productoId: ing.producto.id,
          cantidad: ing.cantidad,
        },
      });
    }

    return combo;
  }

  const cervezaAguila = await upsertProductoBase({
    codigoBarras: 'CERV-AGUILA',
    nombre: 'Cerveza Aguila',
    marca: 'Aguila',
    categoriaId: catCervezas.id,
    precioCompra: 2500,
    precioVentaDetal: 4000,
    stock: 120,
  });

  const cervezaPoker = await upsertProductoBase({
    codigoBarras: 'CERV-POKER',
    nombre: 'Cerveza Poker',
    marca: 'Poker',
    categoriaId: catCervezas.id,
    precioCompra: 2500,
    precioVentaDetal: 4000,
    stock: 80,
  });

  const tequilaShot = await upsertProductoBase({
    codigoBarras: 'TEQ-SHOT',
    nombre: 'Tequila (shot preparado)',
    marca: 'Nacional',
    categoriaId: catTequilas.id,
    precioCompra: 1500,
    precioVentaDetal: 2500,
    stock: 200,
  });

  await upsertMicheladaCombo({
    codigoBarras: 'MIC-SENCILLA',
    nombre: 'Michelada sencilla',
    descripcion: 'Michelada preparada con cerveza Aguila',
    precioVentaDetal: 6000,
    ingredientes: [{ producto: cervezaAguila, cantidad: 1 }],
  });

  await upsertMicheladaCombo({
    codigoBarras: 'MIC-ALCOHOL',
    nombre: 'Michelada con alcohol',
    descripcion: 'Michelada con cerveza Aguila y shot de tequila',
    precioVentaDetal: 8000,
    ingredientes: [
      { producto: cervezaAguila, cantidad: 1 },
      { producto: tequilaShot, cantidad: 1 },
    ],
  });

  await upsertMicheladaCombo({
    codigoBarras: 'MIC-POKER',
    nombre: 'Michelada sencilla (Poker)',
    descripcion: 'Michelada preparada con cerveza Poker',
    precioVentaDetal: 6000,
    ingredientes: [{ producto: cervezaPoker, cantidad: 1 }],
  });

  console.log('Productos base y micheladas (combos) creados.');

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
    { clave: 'logo_url', valor: '', descripcion: 'URL del logo de la licorería' },
    { clave: 'color_tema', valor: '#a67c26', descripcion: 'Color hexadecimal del tema visual' },
    {
      clave: 'metodos_pago',
      valor: JSON.stringify([
        { id: 'efectivo', label: 'Efectivo', activo: true, afectaCaja: true, requiereCambio: true, esCredito: false, esMixto: false, permiteAbono: true, protegido: true, orden: 0 },
        { id: 'tarjeta', label: 'Tarjeta (Débito/Crédito)', activo: true, afectaCaja: false, requiereCambio: false, esCredito: false, esMixto: false, permiteAbono: true, protegido: false, orden: 1 },
        { id: 'transferencia', label: 'Transferencia bancaria', activo: true, afectaCaja: false, requiereCambio: false, esCredito: false, esMixto: false, permiteAbono: true, protegido: false, orden: 2 },
        { id: 'nequi', label: 'Nequi', activo: true, afectaCaja: false, requiereCambio: false, esCredito: false, esMixto: false, permiteAbono: true, protegido: false, orden: 3 },
        { id: 'daviplata', label: 'Daviplata', activo: true, afectaCaja: false, requiereCambio: false, esCredito: false, esMixto: false, permiteAbono: true, protegido: false, orden: 4 },
        { id: 'credito', label: 'Crédito (a cuenta de cliente)', activo: true, afectaCaja: false, requiereCambio: false, esCredito: true, esMixto: false, permiteAbono: false, protegido: true, orden: 90 },
        { id: 'mixto', label: 'Pago mixto', activo: true, afectaCaja: false, requiereCambio: false, esCredito: false, esMixto: true, permiteAbono: false, protegido: true, orden: 99 },
      ]),
      descripcion: 'Métodos de pago configurables para POS y abonos',
    },
  ];

  for (const conf of configs) {
    await prisma.configuracion.upsert({
      where: { clave: conf.clave },
      update: conf.clave === 'metodos_pago' ? { valor: conf.valor } : {},
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
