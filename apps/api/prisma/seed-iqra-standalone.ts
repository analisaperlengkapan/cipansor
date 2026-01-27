import { PrismaClient, KitabCategory, KitabLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Iqra Books...');

  const iqraBooks = [
    { vol: 1, pages: 32 },
    { vol: 2, pages: 32 },
    { vol: 3, pages: 32 },
    { vol: 4, pages: 32 },
    { vol: 5, pages: 32 },
    { vol: 6, pages: 32 },
  ];

  // We need a dummy unit ID because KitabKuning requires unitId.
  // We'll try to find the TK unit, or fallback to the first unit found.
  const tkUnit = await prisma.unit.findFirst({
    where: { type: 'TK_QURAN' },
  });

  const anyUnit = await prisma.unit.findFirst();

  const unitId = tkUnit?.id || anyUnit?.id;

  if (!unitId) {
    console.error('❌ No Unit found. Please seed units first.');
    process.exit(1);
  }

  for (const book of iqraBooks) {
    const name = `Iqra Jilid ${book.vol}`;

    // We try to find existing first to avoid unique constraint issues if we re-run
    // But KitabKuning doesn't enforce unique name globally, just ID.
    // Ideally we should have a unique code.
    // Let's check if we can find it by name and unitId.

    const existing = await prisma.kitabKuning.findFirst({
      where: {
        unitId,
        title: name,
      }
    });

    if (existing) {
      console.log(`📘 ${name} already exists.`);
      continue;
    }

    await prisma.kitabKuning.create({
      data: {
        unitId,
        title: name,
        author: 'KH. As\'ad Humam',
        category: KitabCategory.OTHER, // Using OTHER as Tahsin/Iqra is not in enum
        level: KitabLevel.PEMULA,
        totalPages: book.pages,
        description: 'Metode belajar membaca Al-Quran',
        isActive: true,
      },
    });
    console.log(`✅ Created ${name}`);
  }

  console.log('✅ Iqra seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
