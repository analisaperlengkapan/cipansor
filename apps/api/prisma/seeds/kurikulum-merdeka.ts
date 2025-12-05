import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Learning Phase codes as string constants
const LearningPhase = {
  FASE_A: 'FASE_A',
  FASE_B: 'FASE_B',
  FASE_C: 'FASE_C',
  FASE_D: 'FASE_D',
  FASE_E: 'FASE_E',
  FASE_F: 'FASE_F',
} as const;

// P5 Dimension codes as string constants
const P5Dimension = {
  BERIMAN: 'BERIMAN',
  BERKEBINEKAAN: 'BERKEBINEKAAN',
  BERGOTONG_ROYONG: 'BERGOTONG_ROYONG',
  MANDIRI: 'MANDIRI',
  BERNALAR_KRITIS: 'BERNALAR_KRITIS',
  KREATIF: 'KREATIF',
} as const;

/**
 * Data Fase Pembelajaran Kurikulum Merdeka
 * Berdasarkan Keputusan Kepala BSKAP No. 008/H/KR/2022
 */
export const learningPhasesData = [
  {
    code: LearningPhase.FASE_A,
    name: 'Fase A',
    description: 'Jenjang PAUD (TK-B, RA) dan SD/MI Kelas 1-2. Usia 5-7 tahun. Anak belajar melalui bermain, eksplorasi, dan pengalaman langsung.',
    gradeRange: 'TK-B, SD/MI Kelas 1-2',
  },
  {
    code: LearningPhase.FASE_B,
    name: 'Fase B',
    description: 'Jenjang SD/MI Kelas 3-4. Usia 8-9 tahun. Anak mulai mengembangkan kemampuan berpikir abstrak sederhana.',
    gradeRange: 'SD/MI Kelas 3-4',
  },
  {
    code: LearningPhase.FASE_C,
    name: 'Fase C',
    description: 'Jenjang SD/MI Kelas 5-6. Usia 10-11 tahun. Anak mengembangkan kemampuan berpikir kritis dan kolaboratif.',
    gradeRange: 'SD/MI Kelas 5-6',
  },
  {
    code: LearningPhase.FASE_D,
    name: 'Fase D',
    description: 'Jenjang SMP/MTs Kelas 7-9. Usia 12-14 tahun. Remaja awal dengan kemampuan abstraksi yang berkembang.',
    gradeRange: 'SMP/MTs Kelas 7-9',
  },
  {
    code: LearningPhase.FASE_E,
    name: 'Fase E',
    description: 'Jenjang SMA/MA/SMK Kelas 10. Usia 15-16 tahun. Masa transisi ke remaja akhir.',
    gradeRange: 'SMA/MA/SMK Kelas 10',
  },
  {
    code: LearningPhase.FASE_F,
    name: 'Fase F',
    description: 'Jenjang SMA/MA/SMK Kelas 11-12. Usia 16-18 tahun. Persiapan ke perguruan tinggi atau dunia kerja.',
    gradeRange: 'SMA/MA/SMK Kelas 11-12',
  },
];

/**
 * Data Dimensi P5 (Profil Pelajar Pancasila)
 */
export const p5DimensionsData = [
  {
    code: P5Dimension.BERIMAN,
    name: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    description: 'Pelajar Indonesia yang beriman dan bertakwa kepada Tuhan YME serta berakhlak mulia dalam hubungannya dengan Tuhan, diri sendiri, sesama manusia, dan alam.',
    elements: [
      { code: 'BERIMAN_1', name: 'Akhlak Beragama', description: 'Mengenal sifat-sifat Tuhan dan menumbuhkan rasa cinta kepada-Nya' },
      { code: 'BERIMAN_2', name: 'Akhlak Pribadi', description: 'Mengembangkan kebiasaan baik untuk kepentingan diri sendiri' },
      { code: 'BERIMAN_3', name: 'Akhlak kepada Manusia', description: 'Menghormati dan menyayangi sesama manusia' },
      { code: 'BERIMAN_4', name: 'Akhlak kepada Alam', description: 'Menjaga kelestarian lingkungan hidup' },
      { code: 'BERIMAN_5', name: 'Akhlak Bernegara', description: 'Menjalankan hak dan kewajiban sebagai warga negara' },
    ],
  },
  {
    code: P5Dimension.BERKEBINEKAAN,
    name: 'Berkebinekaan Global',
    description: 'Pelajar Indonesia mempertahankan budaya luhur, lokalitas dan identitasnya, dan tetap berpikiran terbuka dalam berinteraksi dengan budaya lain.',
    elements: [
      { code: 'KEBINEKAAN_1', name: 'Mengenal dan Menghargai Budaya', description: 'Mengenali dan menghargai budaya sendiri dan budaya lain' },
      { code: 'KEBINEKAAN_2', name: 'Komunikasi dan Interaksi Antarbudaya', description: 'Berkomunikasi dan berinteraksi dengan budaya yang berbeda' },
      { code: 'KEBINEKAAN_3', name: 'Refleksi dan Tanggung Jawab', description: 'Merefleksikan dan bertanggung jawab atas pengalaman kebinekaan' },
      { code: 'KEBINEKAAN_4', name: 'Berkeadilan Sosial', description: 'Menumbuhkan sikap dan perilaku yang berkeadilan sosial' },
    ],
  },
  {
    code: P5Dimension.BERGOTONG_ROYONG,
    name: 'Bergotong Royong',
    description: 'Pelajar Indonesia memiliki kemampuan gotong royong, yaitu kemampuan untuk melakukan kegiatan secara bersama-sama dengan suka rela.',
    elements: [
      { code: 'GOTONG_1', name: 'Kolaborasi', description: 'Bekerja sama dengan orang lain untuk mencapai tujuan bersama' },
      { code: 'GOTONG_2', name: 'Kepedulian', description: 'Memperhatikan kebutuhan dan kepentingan orang lain' },
      { code: 'GOTONG_3', name: 'Berbagi', description: 'Memberi dan menerima dengan tulus' },
    ],
  },
  {
    code: P5Dimension.MANDIRI,
    name: 'Mandiri',
    description: 'Pelajar Indonesia merupakan pelajar mandiri, yaitu pelajar yang bertanggung jawab atas proses dan hasil belajarnya.',
    elements: [
      { code: 'MANDIRI_1', name: 'Kesadaran akan Diri dan Situasi', description: 'Mengenali emosi, kekuatan, dan kelemahan diri' },
      { code: 'MANDIRI_2', name: 'Regulasi Diri', description: 'Mampu mengatur pikiran, perasaan, dan perilaku' },
    ],
  },
  {
    code: P5Dimension.BERNALAR_KRITIS,
    name: 'Bernalar Kritis',
    description: 'Pelajar Indonesia mampu bernalar kritis, yaitu mampu secara objektif memproses informasi baik kualitatif maupun kuantitatif.',
    elements: [
      { code: 'KRITIS_1', name: 'Memperoleh dan Memproses Informasi', description: 'Mengumpulkan dan mengolah informasi dari berbagai sumber' },
      { code: 'KRITIS_2', name: 'Menganalisis dan Mengevaluasi Penalaran', description: 'Menganalisis argumen dan menarik kesimpulan' },
      { code: 'KRITIS_3', name: 'Merefleksi Pemikiran', description: 'Mengevaluasi dan memperbaiki proses berpikir' },
      { code: 'KRITIS_4', name: 'Mengambil Keputusan', description: 'Membuat keputusan berdasarkan pertimbangan matang' },
    ],
  },
  {
    code: P5Dimension.KREATIF,
    name: 'Kreatif',
    description: 'Pelajar Indonesia mampu memodifikasi dan menghasilkan sesuatu yang orisinal, bermakna, bermanfaat, dan berdampak.',
    elements: [
      { code: 'KREATIF_1', name: 'Menghasilkan Gagasan yang Orisinal', description: 'Mengembangkan ide-ide baru dan kreatif' },
      { code: 'KREATIF_2', name: 'Menghasilkan Karya dan Tindakan yang Orisinal', description: 'Menciptakan karya atau melakukan tindakan inovatif' },
      { code: 'KREATIF_3', name: 'Memiliki Keluwesan Berpikir', description: 'Berpikir fleksibel dan adaptif' },
    ],
  },
];

/**
 * Sample Capaian Pembelajaran (Learning Outcomes)
 */
export const learningOutcomesData = [
  // Matematika Fase D
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Matematika',
    domain: 'Bilangan',
    code: 'MTK-D-BIL-01',
    description: 'Peserta didik dapat menjelaskan bilangan berpangkat bulat dan bentuk akar, serta menggunakannya dalam memecahkan masalah.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Matematika',
    domain: 'Aljabar',
    code: 'MTK-D-ALJ-01',
    description: 'Peserta didik dapat mengenali pola bilangan, menyatakan pola dalam bentuk aljabar, dan menggunakannya untuk membuat prediksi.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Matematika',
    domain: 'Geometri',
    code: 'MTK-D-GEO-01',
    description: 'Peserta didik dapat menjelaskan dan menggunakan hubungan antar garis, sudut-sudut yang terjadi, serta menggunakannya untuk memecahkan masalah.',
  },

  // IPA Fase D
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Ilmu Pengetahuan Alam',
    domain: 'Makhluk Hidup',
    code: 'IPA-D-MH-01',
    description: 'Peserta didik mampu melakukan pengamatan terhadap makhluk hidup dan lingkungannya, serta mengidentifikasi komponen ekosistem.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Ilmu Pengetahuan Alam',
    domain: 'Zat dan Perubahannya',
    code: 'IPA-D-ZAT-01',
    description: 'Peserta didik dapat menjelaskan struktur atom, unsur, senyawa, dan campuran serta perubahannya.',
  },

  // Pendidikan Agama Islam Fase D
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Pendidikan Agama Islam',
    domain: 'Al-Quran dan Hadits',
    code: 'PAI-D-QH-01',
    description: 'Peserta didik dapat membaca Al-Quran dengan tartil, menghafal surah-surah pendek, dan memahami kandungan ayat-ayat pilihan.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Pendidikan Agama Islam',
    domain: 'Akidah',
    code: 'PAI-D-AKD-01',
    description: 'Peserta didik dapat memahami dan meyakini rukun iman serta mengamalkannya dalam kehidupan sehari-hari.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Pendidikan Agama Islam',
    domain: 'Fiqih',
    code: 'PAI-D-FIQ-01',
    description: 'Peserta didik dapat memahami dan melaksanakan thaharah, shalat wajib, shalat sunnah, puasa, dan zakat.',
  },

  // Bahasa Indonesia Fase D
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Bahasa Indonesia',
    domain: 'Membaca',
    code: 'BI-D-BC-01',
    description: 'Peserta didik dapat memahami dan menganalisis teks fiksi dan nonfiksi, serta menyampaikan hasil analisisnya.',
  },
  {
    phase: LearningPhase.FASE_D,
    subjectName: 'Bahasa Indonesia',
    domain: 'Menulis',
    code: 'BI-D-TLS-01',
    description: 'Peserta didik dapat menulis berbagai jenis teks dengan memperhatikan struktur, diksi, dan tata bahasa yang tepat.',
  },
];

/**
 * Sample Tema P5 (Proyek Penguatan Profil Pelajar Pancasila)
 */
export const p5ThemesData = [
  {
    name: 'Gaya Hidup Berkelanjutan',
    description: 'Membangun kesadaran dan kepedulian terhadap lingkungan melalui praktik hidup berkelanjutan.',
    dimensions: [P5Dimension.BERIMAN, P5Dimension.BERNALAR_KRITIS, P5Dimension.KREATIF],
  },
  {
    name: 'Kearifan Lokal',
    description: 'Menggali dan melestarikan kearifan lokal sebagai bagian dari identitas bangsa.',
    dimensions: [P5Dimension.BERKEBINEKAAN, P5Dimension.BERGOTONG_ROYONG],
  },
  {
    name: 'Bhinneka Tunggal Ika',
    description: 'Memahami dan mengamalkan keberagaman sebagai kekuatan bangsa Indonesia.',
    dimensions: [P5Dimension.BERKEBINEKAAN, P5Dimension.BERIMAN],
  },
  {
    name: 'Bangunlah Jiwa dan Raganya',
    description: 'Mengembangkan kesehatan fisik dan mental peserta didik.',
    dimensions: [P5Dimension.MANDIRI, P5Dimension.BERGOTONG_ROYONG],
  },
  {
    name: 'Suara Demokrasi',
    description: 'Memahami dan mengamalkan nilai-nilai demokrasi dalam kehidupan bermasyarakat.',
    dimensions: [P5Dimension.BERNALAR_KRITIS, P5Dimension.MANDIRI],
  },
  {
    name: 'Berekayasa dan Berteknologi untuk Membangun NKRI',
    description: 'Mengembangkan kemampuan rekayasa dan teknologi untuk kemajuan bangsa.',
    dimensions: [P5Dimension.BERNALAR_KRITIS, P5Dimension.KREATIF, P5Dimension.BERGOTONG_ROYONG],
  },
  {
    name: 'Kewirausahaan',
    description: 'Mengembangkan jiwa dan keterampilan kewirausahaan.',
    dimensions: [P5Dimension.MANDIRI, P5Dimension.KREATIF, P5Dimension.BERGOTONG_ROYONG],
  },
];

/**
 * Kode Akun Keuangan Standar Yayasan Pendidikan
 */
export const accountCodesData = [
  // Aset
  { code: '1100', name: 'Kas', type: 'ASSET', parentCode: null },
  { code: '1101', name: 'Kas Tunai', type: 'ASSET', parentCode: '1100' },
  { code: '1102', name: 'Kas Bank BCA', type: 'ASSET', parentCode: '1100' },
  { code: '1103', name: 'Kas Bank Mandiri', type: 'ASSET', parentCode: '1100' },
  { code: '1200', name: 'Piutang', type: 'ASSET', parentCode: null },
  { code: '1201', name: 'Piutang SPP', type: 'ASSET', parentCode: '1200' },
  { code: '1202', name: 'Piutang Lain-lain', type: 'ASSET', parentCode: '1200' },
  { code: '1300', name: 'Persediaan', type: 'ASSET', parentCode: null },
  { code: '1400', name: 'Aset Tetap', type: 'ASSET', parentCode: null },
  { code: '1401', name: 'Tanah', type: 'ASSET', parentCode: '1400' },
  { code: '1402', name: 'Bangunan', type: 'ASSET', parentCode: '1400' },
  { code: '1403', name: 'Kendaraan', type: 'ASSET', parentCode: '1400' },
  { code: '1404', name: 'Inventaris Kantor', type: 'ASSET', parentCode: '1400' },
  
  // Kewajiban
  { code: '2100', name: 'Utang', type: 'LIABILITY', parentCode: null },
  { code: '2101', name: 'Utang Usaha', type: 'LIABILITY', parentCode: '2100' },
  { code: '2102', name: 'Utang Gaji', type: 'LIABILITY', parentCode: '2100' },
  { code: '2103', name: 'Utang Bank', type: 'LIABILITY', parentCode: '2100' },
  { code: '2200', name: 'Pendapatan Diterima Dimuka', type: 'LIABILITY', parentCode: null },
  
  // Ekuitas
  { code: '3100', name: 'Modal', type: 'EQUITY', parentCode: null },
  { code: '3101', name: 'Modal Yayasan', type: 'EQUITY', parentCode: '3100' },
  { code: '3102', name: 'Saldo Laba', type: 'EQUITY', parentCode: '3100' },
  
  // Pendapatan
  { code: '4100', name: 'Pendapatan Operasional', type: 'REVENUE', parentCode: null },
  { code: '4101', name: 'Pendapatan SPP', type: 'REVENUE', parentCode: '4100' },
  { code: '4102', name: 'Pendapatan Uang Pangkal', type: 'REVENUE', parentCode: '4100' },
  { code: '4103', name: 'Pendapatan Ujian', type: 'REVENUE', parentCode: '4100' },
  { code: '4104', name: 'Pendapatan Kegiatan', type: 'REVENUE', parentCode: '4100' },
  { code: '4105', name: 'Pendapatan Seragam', type: 'REVENUE', parentCode: '4100' },
  { code: '4200', name: 'Pendapatan Non-Operasional', type: 'REVENUE', parentCode: null },
  { code: '4201', name: 'Donasi/Infaq', type: 'REVENUE', parentCode: '4200' },
  { code: '4202', name: 'Pendapatan BOS', type: 'REVENUE', parentCode: '4200' },
  { code: '4203', name: 'Pendapatan Hibah', type: 'REVENUE', parentCode: '4200' },
  { code: '4204', name: 'Bunga Bank', type: 'REVENUE', parentCode: '4200' },
  
  // Beban
  { code: '5100', name: 'Beban Operasional', type: 'EXPENSE', parentCode: null },
  { code: '5101', name: 'Beban Gaji Guru', type: 'EXPENSE', parentCode: '5100' },
  { code: '5102', name: 'Beban Gaji Staff', type: 'EXPENSE', parentCode: '5100' },
  { code: '5103', name: 'Beban Honorarium', type: 'EXPENSE', parentCode: '5100' },
  { code: '5104', name: 'Beban ATK', type: 'EXPENSE', parentCode: '5100' },
  { code: '5105', name: 'Beban Listrik', type: 'EXPENSE', parentCode: '5100' },
  { code: '5106', name: 'Beban Air', type: 'EXPENSE', parentCode: '5100' },
  { code: '5107', name: 'Beban Telepon/Internet', type: 'EXPENSE', parentCode: '5100' },
  { code: '5108', name: 'Beban Pemeliharaan', type: 'EXPENSE', parentCode: '5100' },
  { code: '5109', name: 'Beban Kegiatan', type: 'EXPENSE', parentCode: '5100' },
  { code: '5110', name: 'Beban Konsumsi', type: 'EXPENSE', parentCode: '5100' },
  { code: '5200', name: 'Beban Non-Operasional', type: 'EXPENSE', parentCode: null },
  { code: '5201', name: 'Beban Penyusutan', type: 'EXPENSE', parentCode: '5200' },
  { code: '5202', name: 'Beban Bunga', type: 'EXPENSE', parentCode: '5200' },
  { code: '5203', name: 'Beban Pajak', type: 'EXPENSE', parentCode: '5200' },
  { code: '5204', name: 'Beban Lain-lain', type: 'EXPENSE', parentCode: '5200' },
];

export async function seedKurikulumMerdeka(unitId: string, academicYearId: string) {
  console.log('📚 Seeding Kurikulum Merdeka data...');

  // Seed Learning Phases
  console.log('   Seeding Learning Phases...');
  const phaseMap: Record<string, string> = {};
  for (const phase of learningPhasesData) {
    const created = await prisma.learningPhase.upsert({
      where: { code: phase.code as any },
      update: {},
      create: {
        code: phase.code as any,
        name: phase.name,
        description: phase.description,
        gradeRange: phase.gradeRange,
      },
    });
    phaseMap[phase.code] = created.id;
  }
  console.log(`   ✅ ${learningPhasesData.length} Learning Phases created`);

  // Get subject IDs
  const subjects = await prisma.subject.findMany({
    where: { unitId },
    select: { id: true, name: true },
  });
  const subjectMap: Record<string, string> = {};
  for (const subj of subjects) {
    subjectMap[subj.name] = subj.id;
  }

  // Seed Learning Outcomes
  console.log('   Seeding Learning Outcomes (Capaian Pembelajaran)...');
  let loCount = 0;
  for (const lo of learningOutcomesData) {
    // Try to find matching subject
    let subjectId: string | null = null;
    for (const [name, id] of Object.entries(subjectMap)) {
      if (lo.subjectName.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(lo.subjectName.toLowerCase().split(' ')[0])) {
        subjectId = id;
        break;
      }
    }

    // Skip if no matching subject found
    if (!subjectId) {
      console.log(`      ⚠️  Skipping ${lo.code}: No matching subject for "${lo.subjectName}"`);
      continue;
    }

    await prisma.learningOutcome.create({
      data: {
        phaseId: phaseMap[lo.phase],
        subjectId: subjectId,
        code: lo.code,
        description: `${lo.domain}: ${lo.description}`,
        elements: { domain: lo.domain, indicators: [`Indikator untuk ${lo.code}`] },
      },
    });
    loCount++;
  }
  console.log(`   ✅ ${loCount} Learning Outcomes created`);

  console.log('📚 Kurikulum Merdeka seeding completed!');
  return { phaseMap };
}

export async function seedAccountCodes() {
  console.log('💰 Seeding Account Codes...');

  const codeMap: Record<string, string> = {};

  // First pass: create all accounts without parent
  for (const acc of accountCodesData) {
    const created = await prisma.accountCode.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        isActive: true,
      },
    });
    codeMap[acc.code] = created.id;
  }

  // Second pass: update parent relationships
  for (const acc of accountCodesData) {
    if (acc.parentCode) {
      await prisma.accountCode.update({
        where: { code: acc.code },
        data: { parentId: codeMap[acc.parentCode] },
      });
    }
  }

  console.log(`   ✅ ${accountCodesData.length} Account Codes created`);
  return codeMap;
}

export default { seedKurikulumMerdeka, seedAccountCodes, p5ThemesData, p5DimensionsData };
