const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  {
    nombre: 'Club Colombia',
    marca: 'Bavaria S.A.',
    descripcion: 'Colombia\'s premium lager, first introduced in 1962. It is characterized by its golden color, refined taste, and higher quality ingredients.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Botella_de_Club_Colombia.jpg',
    categoriaId: 4, // Cervezas
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Cerveza Águila',
    marca: 'Bavaria S.A.',
    descripcion: 'The most traditional and popular classic lager in Colombia, deeply tied to national identity, carnivals, and the national soccer team.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Logo_cerveza_aguila.png',
    categoriaId: 4, // Cervezas
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Cerveza Poker',
    marca: 'Bavaria S.A.',
    descripcion: 'A highly popular, easy-drinking lager first brewed in Manizales in 1929. Its marketing heavily focuses on friendship and social gatherings.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Cerveza_Poker.png',
    categoriaId: 4, // Cervezas
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Aguardiente Antioqueño',
    marca: 'Fábrica de Licores de Antioquia',
    descripcion: 'Colombia\'s best-selling sugarcane spirit flavored with anise, famous for both its traditional red-cap version and its sugar-free blue/green-cap versions.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/AguardienteFla.jpg',
    categoriaId: 11, // Otros
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Aguardiente Néctar',
    marca: 'Empresa de Licores de Cundinamarca',
    descripcion: 'A primary competitor to Antioqueño, originating from the Cundinamarca department. Known for its smooth profile and aromatic anise notes.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_Aguardiente_Nectar.jpg',
    categoriaId: 11, // Otros
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Ron Viejo de Caldas',
    marca: 'Industria Licorera de Caldas',
    descripcion: 'The leading rum in Colombia, aged in oak barrels at high altitudes in the Andes. It is highly regarded for its deep amber color and notes of caramel, wood, and spices.',
    imagenUrl: 'https://seeklogo.com/images/R/ron-viejo-de-caldas-logo-307044-seeklogo.com.png',
    categoriaId: 1, // Rones
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Ron Medellín',
    marca: 'Fábrica de Licores de Antioquia',
    descripcion: 'A highly popular rum aged for 3, 5, 8, or 12 years. It is known for its smooth texture, woody aroma, and notes of vanilla and honey.',
    imagenUrl: 'https://seeklogo.com/images/R/ron-medellin-logo-315802-seeklogo.com.png',
    categoriaId: 1, // Rones
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Pony Malta',
    marca: 'Bavaria S.A.',
    descripcion: 'A sweet, non-alcoholic malt beverage pasteurized and carbonated, highly popular among children and athletes since 1953.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Botella_de_pony_malta.JPG',
    categoriaId: 7, // Refrescos
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Postobón Manzana',
    marca: 'Postobón S.A.',
    descripcion: 'The signature pink apple-flavored soda of Colombia\'s largest beverage corporation, widely consumed nationwide.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
    categoriaId: 7, // Refrescos
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Colombiana',
    marca: 'Postobón S.A.',
    descripcion: 'A highly traditional "kola champagne" flavored soft drink with a unique sweet, fruity taste. It is also the key ingredient for making the traditional mixed drink "refajo".',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/ColombianaPostobon.svg',
    categoriaId: 7, // Refrescos
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'botella'
  },
  {
    nombre: 'Mustang',
    marca: 'Protabaco / British American Tobacco',
    descripcion: 'Historically one of the most popular local cigarette brands in Colombia, featuring the iconic wild horse logo.',
    imagenUrl: 'https://seeklogo.com/images/M/mustang-cigarettes-logo-9CC2187428-seeklogo.com.png',
    categoriaId: 9, // Cigarrillos
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'cajetilla'
  },
  {
    nombre: 'Marlboro',
    marca: 'Philip Morris International / Coltabaco',
    descripcion: 'The globally recognized premium American cigarette brand, widely sold and manufactured locally in Colombia.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Marlboro_logo.svg',
    categoriaId: 9, // Cigarrillos
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'cajetilla'
  },
  {
    nombre: 'Bolsa de Hielo',
    marca: 'Genérico',
    descripcion: 'A standard commodity item containing ice cubes for chilling beverages or mixing drinks.',
    imagenUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Ice_cubes.jpg',
    categoriaId: 10, // Hielo
    precioCompra: 0,
    precioVentaDetal: 0,
    stock: 0,
    unidadMedida: 'bolsa'
  }
];

async function main() {
  console.log('Iniciando importación de productos colombianos...');
  const imported = [];

  for (const product of products) {
    // Check if product with the same name already exists
    const exists = await prisma.producto.findFirst({
      where: { nombre: product.nombre }
    });

    if (exists) {
      console.log(`El producto "${product.nombre}" ya existe en la base de datos (ID: ${exists.id}).`);
      imported.push(exists);
    } else {
      const created = await prisma.producto.create({
        data: {
          nombre: product.nombre,
          marca: product.marca,
          descripcion: product.descripcion,
          imagenUrl: product.imagenUrl,
          categoriaId: product.categoriaId,
          precioCompra: product.precioCompra,
          precioVentaDetal: product.precioVentaDetal,
          stock: product.stock,
          unidadMedida: product.unidadMedida,
          stockMinimo: 5,
          esCombo: false,
          activo: true
        }
      });
      console.log(`Creado producto: "${created.nombre}" (ID: ${created.id})`);
      imported.push(created);
    }
  }

  console.log('\n--- RESUMEN DE IMPORTACIÓN ---');
  console.log(`Total productos procesados: ${imported.length}`);
  console.log('PRODUCT_LIST_JSON:' + JSON.stringify(imported));
}

main()
  .catch((e) => {
    console.error('Error durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('Conexión a la base de datos cerrada de forma limpia.');
  });
