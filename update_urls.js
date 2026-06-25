const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const imageUrls = {
  'POKER LATA 330': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Cerveza_Poker.png',
  'AGUILA ORIG LATA 330ML': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Logo_cerveza_aguila.png',
  'AGUILA LIGHT LATA 330': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Logo_cerveza_aguila.png',
  'COSTEÑA LATA 330ML': 'https://bavaria.co/sites/g/files/yrakuj281/files/2019-06/costena_1.png',
  'CLUB COLOMBIA LATA 330ML': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Botella_de_Club_Colombia.jpg',
  'CORONA BOTELLA 330ML': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Corona_Extra_beer_bottle.jpg',
  'CORONITA BOTELLA 210ML': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Corona_Extra_beer_bottle.jpg',
  'CORONITA LATA': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Corona_Extra_beer_bottle.jpg',
  'HEINEKEN LATA': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Heineken_Pilsener_-_%281%29.jpg',
  'STELLA BOTELLA 300ML': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Stella_Artois_new_logo.png',
  'REDD¨S': 'https://bavaria.co/sites/g/files/yrakuj281/files/2019-06/redds_0.png',
  'COLA Y POLA LATA 330 ML': 'https://bavaria.co/sites/g/files/yrakuj281/files/2019-06/cola_y_pola_1.png',
  'BUDWEISER LATA 269ML': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Budweiser_logo.svg/512px-Budweiser_logo.svg.png',
  'LIKE SURTIDA': 'https://m.media-amazon.com/images/I/41KIfA9hY-L.jpg',
  'SMIRNOTF BOTELLA': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Smirnoff_Red_Label.jpg',
  'COCA COLA P400': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg',
  'KOLA ROMAN P400': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Kola_Roman_logo.png',
  'QUATRO P400': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'GINGER P400': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'SPRITE P400': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Sprite_logo_%282022%29.svg',
  'ELECTROLIT': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Electrolit_Logo.png',
  'GATORADE P500': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Gatorade_logo.svg',
  'BRETAÑA PERSONAL': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'AGUA CIELO P600': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Logo_Agua_Cielo.png',
  'AGUA CRISTAL 300ML': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'AGUA POOL PERSONAL': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'STELLA LATA 269ML': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Stella_Artois_new_logo.png',
  'SPEED MAX LATA': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'AGUA COS GAS PEQUEÑA': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'AGUA GAS 600ML': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg',
  'CUATES PEQUEÑOS': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Postob%C3%B3n_S._A._logo.svg'
};

async function main() {
  console.log('Iniciando actualización de URLs de imágenes...');
  
  for (const [nombre, url] of Object.entries(imageUrls)) {
    const products = await prisma.producto.findMany({
      where: {
        nombre: {
          contains: nombre
        }
      }
    });
    
    for (const product of products) {
      await prisma.producto.update({
        where: { id: product.id },
        data: { imagenUrl: url }
      });
      console.log(`Actualizado ${product.nombre} con URL de imagen.`);
    }
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
