import { PrismaClient, PAUDAspect } from '@prisma/client';

const prisma = new PrismaClient();

interface IndicatorSeed {
  aspect: PAUDAspect;
  code: string;
  name: string;
  description: string;
  ageGroupMin: number; // in months
  ageGroupMax: number; // in months
  orderNumber: number;
}

// PAUD Development Indicators based on Kurikulum Merdeka PAUD
const indicators: IndicatorSeed[] = [
  // ============================================
  // NAM - Nilai Agama & Moral (Religious & Moral Values)
  // ============================================
  // Age 2-3 years (24-36 months)
  {
    aspect: 'NAM',
    code: 'NAM-01',
    name: 'Mengenal Tuhan melalui ciptaan-Nya',
    description:
      'Anak menunjukkan ketertarikan ketika dikenalkan dengan ciptaan Tuhan seperti hewan, tumbuhan, matahari, bulan',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'NAM',
    code: 'NAM-02',
    name: 'Meniru gerakan beribadah',
    description: 'Anak meniru gerakan sederhana saat ibadah seperti gerakan sholat, berdoa',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'NAM',
    code: 'NAM-03',
    name: 'Mengucapkan doa pendek',
    description: 'Anak dapat mengucapkan doa pendek sehari-hari dengan bimbingan',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years (36-48 months)
  {
    aspect: 'NAM',
    code: 'NAM-04',
    name: 'Mengenal perilaku baik dan buruk',
    description: 'Anak dapat membedakan perilaku baik dan buruk dalam keseharian sederhana',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'NAM',
    code: 'NAM-05',
    name: 'Menghafal surat pendek',
    description: 'Anak dapat menghafal surat-surat pendek Al-Quran (Al-Fatihah, Al-Ikhlas, dll)',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'NAM',
    code: 'NAM-06',
    name: 'Mengenal rukun Islam',
    description: 'Anak dapat menyebutkan rukun Islam dengan bimbingan',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years (48-60 months)
  {
    aspect: 'NAM',
    code: 'NAM-07',
    name: 'Berdoa sebelum dan sesudah kegiatan',
    description: 'Anak terbiasa berdoa sebelum dan sesudah kegiatan secara mandiri',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'NAM',
    code: 'NAM-08',
    name: 'Mengenal hari besar Islam',
    description: 'Anak mengenal hari-hari besar Islam seperti Idul Fitri, Idul Adha, Maulid Nabi',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years (60-72 months)
  {
    aspect: 'NAM',
    code: 'NAM-09',
    name: 'Melaksanakan ibadah dengan benar',
    description: 'Anak dapat melaksanakan gerakan sholat dengan urutan yang benar',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'NAM',
    code: 'NAM-10',
    name: 'Menunjukkan sikap sopan santun',
    description: 'Anak menunjukkan sikap hormat kepada orang tua, guru, dan orang yang lebih tua',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },

  // ============================================
  // FM - Fisik Motorik (Physical Motor)
  // ============================================
  // Age 2-3 years
  {
    aspect: 'FM',
    code: 'FM-01',
    name: 'Berjalan dengan stabil',
    description: 'Anak dapat berjalan dengan keseimbangan yang baik tanpa bantuan',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'FM',
    code: 'FM-02',
    name: 'Memegang benda dengan jari',
    description: 'Anak dapat memegang benda-benda kecil dengan menggunakan jari',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'FM',
    code: 'FM-03',
    name: 'Naik turun tangga',
    description: 'Anak dapat naik turun tangga dengan berpegangan',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years
  {
    aspect: 'FM',
    code: 'FM-04',
    name: 'Berlari tanpa terjatuh',
    description: 'Anak dapat berlari dengan keseimbangan baik tanpa sering terjatuh',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'FM',
    code: 'FM-05',
    name: 'Menggambar garis dan lingkaran',
    description: 'Anak dapat menggambar garis lurus dan lingkaran sederhana',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'FM',
    code: 'FM-06',
    name: 'Menggunakan sendok dan garpu',
    description: 'Anak dapat makan sendiri menggunakan sendok dan garpu',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years
  {
    aspect: 'FM',
    code: 'FM-07',
    name: 'Melompat dengan dua kaki',
    description: 'Anak dapat melompat dengan kedua kaki secara bersamaan',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'FM',
    code: 'FM-08',
    name: 'Menggunting sesuai pola',
    description: 'Anak dapat menggunting kertas mengikuti garis atau pola sederhana',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years
  {
    aspect: 'FM',
    code: 'FM-09',
    name: 'Menulis huruf dan angka',
    description: 'Anak dapat menulis huruf dan angka dengan rapi',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'FM',
    code: 'FM-10',
    name: 'Koordinasi mata dan tangan',
    description:
      'Anak memiliki koordinasi mata-tangan yang baik untuk kegiatan seperti menangkap bola',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },

  // ============================================
  // KOG - Kognitif (Cognitive)
  // ============================================
  // Age 2-3 years
  {
    aspect: 'KOG',
    code: 'KOG-01',
    name: 'Mengenal warna dasar',
    description: 'Anak dapat mengidentifikasi dan menyebutkan warna dasar (merah, kuning, biru)',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'KOG',
    code: 'KOG-02',
    name: 'Mengenal bentuk dasar',
    description: 'Anak dapat mengidentifikasi bentuk dasar seperti lingkaran, kotak, segitiga',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'KOG',
    code: 'KOG-03',
    name: 'Mengelompokkan benda',
    description: 'Anak dapat mengelompokkan benda berdasarkan satu karakteristik (warna/bentuk)',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years
  {
    aspect: 'KOG',
    code: 'KOG-04',
    name: 'Menghitung 1-10',
    description: 'Anak dapat menghitung benda dari 1 sampai 10',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'KOG',
    code: 'KOG-05',
    name: 'Mengenal konsep besar-kecil',
    description: 'Anak dapat membedakan benda besar dan kecil',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'KOG',
    code: 'KOG-06',
    name: 'Menyusun puzzle sederhana',
    description: 'Anak dapat menyusun puzzle 4-6 keping',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years
  {
    aspect: 'KOG',
    code: 'KOG-07',
    name: 'Mengenal huruf hijaiyah',
    description: 'Anak dapat mengenal dan menyebutkan huruf hijaiyah',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'KOG',
    code: 'KOG-08',
    name: 'Mengurutkan benda',
    description: 'Anak dapat mengurutkan benda dari kecil ke besar atau sebaliknya',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years
  {
    aspect: 'KOG',
    code: 'KOG-09',
    name: 'Operasi penjumlahan sederhana',
    description: 'Anak dapat melakukan penjumlahan sederhana dengan benda konkret',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'KOG',
    code: 'KOG-10',
    name: 'Memecahkan masalah sederhana',
    description: 'Anak dapat mencari solusi untuk masalah sederhana dalam bermain',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },

  // ============================================
  // BHS - Bahasa (Language)
  // ============================================
  // Age 2-3 years
  {
    aspect: 'BHS',
    code: 'BHS-01',
    name: 'Mengucapkan kata-kata',
    description: 'Anak dapat mengucapkan kata-kata sederhana dengan jelas',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'BHS',
    code: 'BHS-02',
    name: 'Memahami perintah sederhana',
    description: 'Anak dapat memahami dan mengikuti perintah sederhana',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'BHS',
    code: 'BHS-03',
    name: 'Menyebutkan nama benda',
    description: 'Anak dapat menyebutkan nama-nama benda di sekitarnya',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years
  {
    aspect: 'BHS',
    code: 'BHS-04',
    name: 'Berbicara dalam kalimat',
    description: 'Anak dapat berbicara menggunakan kalimat lengkap (3-4 kata)',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'BHS',
    code: 'BHS-05',
    name: 'Menjawab pertanyaan',
    description: 'Anak dapat menjawab pertanyaan sederhana dengan tepat',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'BHS',
    code: 'BHS-06',
    name: 'Menceritakan pengalaman',
    description: 'Anak dapat menceritakan pengalaman sederhana dengan kata-kata sendiri',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years
  {
    aspect: 'BHS',
    code: 'BHS-07',
    name: 'Mengenal huruf alfabet',
    description: 'Anak dapat mengenal dan menyebutkan huruf a-z',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'BHS',
    code: 'BHS-08',
    name: 'Menyimak cerita',
    description: 'Anak dapat menyimak cerita dengan fokus dan memahami isinya',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years
  {
    aspect: 'BHS',
    code: 'BHS-09',
    name: 'Membaca kata sederhana',
    description: 'Anak dapat membaca kata-kata sederhana',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'BHS',
    code: 'BHS-10',
    name: 'Menulis nama sendiri',
    description: 'Anak dapat menulis nama sendiri dengan benar',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },

  // ============================================
  // SE - Sosial Emosional (Social Emotional)
  // ============================================
  // Age 2-3 years
  {
    aspect: 'SE',
    code: 'SE-01',
    name: 'Menunjukkan emosi',
    description: 'Anak dapat menunjukkan emosi dasar seperti senang, sedih, marah',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'SE',
    code: 'SE-02',
    name: 'Bermain bersama',
    description: 'Anak mau bermain berdekatan dengan teman sebaya',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'SE',
    code: 'SE-03',
    name: 'Mengenal diri sendiri',
    description: 'Anak dapat menyebutkan nama sendiri dan jenis kelamin',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years
  {
    aspect: 'SE',
    code: 'SE-04',
    name: 'Berbagi dengan teman',
    description: 'Anak mau berbagi mainan atau makanan dengan teman',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'SE',
    code: 'SE-05',
    name: 'Mengikuti aturan',
    description: 'Anak dapat mengikuti aturan sederhana dalam permainan',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'SE',
    code: 'SE-06',
    name: 'Sabar menunggu giliran',
    description: 'Anak dapat menunggu giliran dengan bimbingan',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years
  {
    aspect: 'SE',
    code: 'SE-07',
    name: 'Mengenal perasaan',
    description: 'Anak dapat mengidentifikasi dan menyebutkan perasaan diri dan orang lain',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'SE',
    code: 'SE-08',
    name: 'Bermain kooperatif',
    description: 'Anak dapat bermain bersama dalam kelompok kecil',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years
  {
    aspect: 'SE',
    code: 'SE-09',
    name: 'Menyelesaikan konflik',
    description: 'Anak dapat menyelesaikan konflik sederhana dengan teman secara verbal',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'SE',
    code: 'SE-10',
    name: 'Menunjukkan empati',
    description: 'Anak menunjukkan kepedulian terhadap perasaan orang lain',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },

  // ============================================
  // SNI - Seni (Art)
  // ============================================
  // Age 2-3 years
  {
    aspect: 'SNI',
    code: 'SNI-01',
    name: 'Mencoret-coret',
    description:
      'Anak menunjukkan ketertarikan dalam mencoret-coret dengan krayon atau pensil warna',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 1,
  },
  {
    aspect: 'SNI',
    code: 'SNI-02',
    name: 'Menggerakkan tubuh saat musik',
    description: 'Anak menggerakkan tubuh mengikuti irama musik',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 2,
  },
  {
    aspect: 'SNI',
    code: 'SNI-03',
    name: 'Menyanyikan lagu sederhana',
    description: 'Anak dapat mengikuti dan menyanyikan lagu anak-anak sederhana',
    ageGroupMin: 24,
    ageGroupMax: 36,
    orderNumber: 3,
  },
  // Age 3-4 years
  {
    aspect: 'SNI',
    code: 'SNI-04',
    name: 'Mewarnai gambar',
    description: 'Anak dapat mewarnai gambar sederhana',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 4,
  },
  {
    aspect: 'SNI',
    code: 'SNI-05',
    name: 'Membuat bentuk dari plastisin',
    description: 'Anak dapat membuat bentuk sederhana dari plastisin atau play-doh',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 5,
  },
  {
    aspect: 'SNI',
    code: 'SNI-06',
    name: 'Menari sederhana',
    description: 'Anak dapat menirukan gerakan tari sederhana',
    ageGroupMin: 36,
    ageGroupMax: 48,
    orderNumber: 6,
  },
  // Age 4-5 years
  {
    aspect: 'SNI',
    code: 'SNI-07',
    name: 'Menggambar objek',
    description: 'Anak dapat menggambar objek yang dapat dikenali seperti orang, rumah',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 7,
  },
  {
    aspect: 'SNI',
    code: 'SNI-08',
    name: 'Memainkan alat musik perkusi',
    description: 'Anak dapat memainkan alat musik perkusi sederhana mengikuti irama',
    ageGroupMin: 48,
    ageGroupMax: 60,
    orderNumber: 8,
  },
  // Age 5-6 years
  {
    aspect: 'SNI',
    code: 'SNI-09',
    name: 'Mengekspresikan ide melalui seni',
    description: 'Anak dapat mengekspresikan ide atau perasaan melalui karya seni',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 9,
  },
  {
    aspect: 'SNI',
    code: 'SNI-10',
    name: 'Menampilkan karya seni',
    description: 'Anak percaya diri menampilkan hasil karya seni di depan teman-teman',
    ageGroupMin: 60,
    ageGroupMax: 72,
    orderNumber: 10,
  },
];

export async function seedPAUDIndicators() {
  console.log('🌱 Seeding PAUD Development Indicators...');

  for (const indicator of indicators) {
    await prisma.pAUDDevelopmentIndicator.upsert({
      where: { code: indicator.code },
      update: {
        aspect: indicator.aspect,
        name: indicator.name,
        description: indicator.description,
        ageGroupMin: indicator.ageGroupMin,
        ageGroupMax: indicator.ageGroupMax,
        orderNumber: indicator.orderNumber,
        isActive: true,
      },
      create: {
        aspect: indicator.aspect,
        code: indicator.code,
        name: indicator.name,
        description: indicator.description,
        ageGroupMin: indicator.ageGroupMin,
        ageGroupMax: indicator.ageGroupMax,
        orderNumber: indicator.orderNumber,
        isActive: true,
      },
    });
  }

  console.log(`✅ Created/Updated ${indicators.length} PAUD Development Indicators`);

  // Log summary by aspect
  const aspects = ['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'];
  for (const aspect of aspects) {
    const count = indicators.filter((i) => i.aspect === aspect).length;
    console.log(`   - ${aspect}: ${count} indicators`);
  }
}

// Run if called directly
if (require.main === module) {
  seedPAUDIndicators()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
