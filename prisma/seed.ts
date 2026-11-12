/* Datos de ejemplo: categorías, 20 productos con variantes e imágenes, y un usuario admin. */
import { Gender, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CLOTHING = ['XS', 'S', 'M', 'L', 'XL'];
const SHOES = ['25', '25.5', '26', '26.5', '27', '27.5', '28', '29'];
const COLORS: Record<string, string> = {
  Negro: '#111111',
  Blanco: '#F5F5F5',
  Gris: '#8E8E93',
  Beige: '#D8C7A8',
  'Azul marino': '#1F2A44',
  'Verde olivo': '#5B6236',
  Café: '#6B4A33',
  Mezclilla: '#4A6FA5',
};

const CATEGORIES = {
  hombre: ['Playeras', 'Camisas', 'Pantalones', 'Sudaderas', 'Chamarras', 'Tenis'],
  mujer: ['Blusas', 'Vestidos', 'Jeans', 'Sudaderas', 'Chamarras', 'Tenis'],
};

type Seed = {
  name: string;
  gender: Gender;
  category: string; // slug de subcategoría
  price: number;
  sale?: number;
  colors: string[];
  shoes?: boolean;
  featured?: boolean;
  description: string;
};

const PRODUCTS: Seed[] = [
  { name: 'Playera Oversize Básica', gender: 'HOMBRE', category: 'hombre-playeras', price: 349, colors: ['Negro', 'Blanco', 'Gris'], featured: true, description: 'Playera de algodón 100% con corte oversize y cuello redondo reforzado.' },
  { name: 'Playera Heavyweight Logo', gender: 'HOMBRE', category: 'hombre-playeras', price: 449, sale: 299, colors: ['Negro', 'Beige'], description: 'Algodón grueso de 240 g con logo NORTE bordado en el pecho.' },
  { name: 'Camisa Oxford Slim', gender: 'HOMBRE', category: 'hombre-camisas', price: 699, colors: ['Blanco', 'Azul marino'], featured: true, description: 'Camisa Oxford de manga larga, corte slim, ideal para oficina o salida.' },
  { name: 'Camisa de Lino Manga Corta', gender: 'HOMBRE', category: 'hombre-camisas', price: 799, sale: 559, colors: ['Beige', 'Blanco'], description: 'Lino ligero y fresco, cuello cubano y botones de concha.' },
  { name: 'Pantalón Cargo Relaxed', gender: 'HOMBRE', category: 'hombre-pantalones', price: 899, colors: ['Verde olivo', 'Negro', 'Beige'], featured: true, description: 'Pantalón cargo de gabardina con bolsas laterales y ajuste en tobillo.' },
  { name: 'Jogger Técnico', gender: 'HOMBRE', category: 'hombre-pantalones', price: 749, sale: 524, colors: ['Negro', 'Gris'], description: 'Tela técnica elástica que repele el agua, cintura con cordón.' },
  { name: 'Sudadera con Capucha Essential', gender: 'HOMBRE', category: 'hombre-sudaderas', price: 899, colors: ['Gris', 'Negro', 'Azul marino'], description: 'Felpa perchada por dentro, capucha doble y bolsa canguro.' },
  { name: 'Chamarra Bomber', gender: 'HOMBRE', category: 'hombre-chamarras', price: 1499, sale: 1049, colors: ['Negro', 'Verde olivo'], featured: true, description: 'Bomber acolchada con puños de rib y cierre metálico.' },
  { name: 'Chamarra de Mezclilla', gender: 'HOMBRE', category: 'hombre-chamarras', price: 1299, colors: ['Mezclilla', 'Negro'], description: 'Mezclilla rígida de 13 oz con botones metálicos y bolsas de parche.' },
  { name: 'Tenis Urbanos Piel', gender: 'HOMBRE', category: 'hombre-tenis', price: 1599, colors: ['Blanco', 'Negro'], shoes: true, featured: true, description: 'Tenis de piel sintética con suela de goma vulcanizada.' },
  { name: 'Blusa Satinada', gender: 'MUJER', category: 'mujer-blusas', price: 599, colors: ['Beige', 'Negro'], featured: true, description: 'Blusa de satín con caída fluida y cuello en V.' },
  { name: 'Top Rib Básico', gender: 'MUJER', category: 'mujer-blusas', price: 299, sale: 209, colors: ['Blanco', 'Negro', 'Café'], description: 'Top de algodón elástico tipo rib, ajuste al cuerpo.' },
  { name: 'Vestido Midi Lino', gender: 'MUJER', category: 'mujer-vestidos', price: 1099, colors: ['Beige', 'Blanco'], featured: true, description: 'Vestido midi de lino con tirantes ajustables y abertura lateral.' },
  { name: 'Vestido Camisero', gender: 'MUJER', category: 'mujer-vestidos', price: 999, sale: 699, colors: ['Azul marino', 'Verde olivo'], description: 'Vestido camisero con cinturón y botones al frente.' },
  { name: 'Jeans Wide Leg', gender: 'MUJER', category: 'mujer-jeans', price: 899, colors: ['Mezclilla', 'Negro'], featured: true, description: 'Tiro alto y pierna amplia, mezclilla 100% algodón.' },
  { name: 'Jeans Mom Fit', gender: 'MUJER', category: 'mujer-jeans', price: 849, sale: 594, colors: ['Mezclilla'], description: 'Corte mom de tiro alto con lavado claro.' },
  { name: 'Sudadera Cropped', gender: 'MUJER', category: 'mujer-sudaderas', price: 749, colors: ['Gris', 'Beige', 'Negro'], description: 'Sudadera corta de felpa con cuello redondo.' },
  { name: 'Trench Clásico', gender: 'MUJER', category: 'mujer-chamarras', price: 1899, sale: 1329, colors: ['Beige', 'Negro'], featured: true, description: 'Gabardina cruzada con cinturón y hombreras suaves.' },
  { name: 'Chaqueta de Piel Sintética', gender: 'MUJER', category: 'mujer-chamarras', price: 1499, colors: ['Negro', 'Café'], description: 'Estilo biker con cierres metálicos y forro interior.' },
  { name: 'Tenis Plataforma', gender: 'MUJER', category: 'mujer-tenis', price: 1399, sale: 979, colors: ['Blanco', 'Beige'], shoes: true, description: 'Tenis con suela plataforma de 4 cm y plantilla acolchada.' },
];

const slugify = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  console.log('Limpiando datos…');
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Creando categorías…');
  const categoryIds: Record<string, string> = {};
  let order = 0;
  for (const [rootSlug, children] of Object.entries(CATEGORIES)) {
    const root = await prisma.category.create({
      data: {
        name: rootSlug === 'hombre' ? 'Hombre' : 'Mujer',
        slug: rootSlug,
        sortOrder: order++,
        imageUrl: `https://picsum.photos/seed/norte-${rootSlug}/1200/800`,
      },
    });
    for (const [i, name] of children.entries()) {
      const child = await prisma.category.create({
        data: { name, slug: `${rootSlug}-${slugify(name)}`, parentId: root.id, sortOrder: i },
      });
      categoryIds[child.slug] = child.id;
    }
  }

  console.log('Creando 20 productos…');
  for (const [index, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name);
    const sizes = p.shoes ? SHOES : CLOTHING;
    const variants = p.colors.flatMap((color) =>
      sizes.map((size) => ({
        sku: `NOR-${String(index + 1).padStart(3, '0')}-${slugify(color).slice(0, 3).toUpperCase()}-${size.replace('.', '')}`,
        size,
        color,
        colorHex: COLORS[color] ?? null,
        // Algunas tallas en 0 o con poco stock para probar alertas y filtros.
        stock: (index + size.length + color.length) % 7 === 0 ? 0 : 3 + ((index * 7 + size.length) % 18),
      })),
    );

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        gender: p.gender,
        categoryId: categoryIds[p.category],
        basePrice: p.price,
        salePrice: p.sale ?? null,
        currentPrice: p.sale ?? p.price,
        isFeatured: p.featured ?? false,
        // Fechas escalonadas para que "Novedades" tenga sentido.
        createdAt: new Date(Date.now() - index * 3 * 24 * 60 * 60 * 1000),
        variants: { create: variants },
        images: {
          create: [1, 2, 3].map((n) => ({
            url: `https://picsum.photos/seed/norte-${slug}-${n}/800/1067`,
            alt: `${p.name} - foto ${n}`,
            sortOrder: n - 1,
          })),
        },
      },
    });
  }

  console.log('Creando usuario admin…');
  await prisma.user.create({
    data: {
      email: 'admin@norte.mx',
      name: 'Admin NORTE',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('Admin123!', 10),
    },
  });

  console.log('Listo: 12 categorías, 20 productos, admin@norte.mx / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
