import { PrismaClient, QualityStandardType } from '@prisma/client';

export const seedQualityStandards = async (prisma: PrismaClient) => {
  console.log('🌱 Seeding Quality Standards (8 SNP)...');

  const standardsData = [
    {
      type: QualityStandardType.STANDAR_ISI,
      name: 'Standar Isi',
      description: 'Ruang lingkup materi dan tingkat kompetensi yang dituangkan dalam kriteria tentang kompetensi tamatan, kompetensi bahan kajian, kompetensi mata pelajaran, dan silabus pembelajaran.',
      indicators: [
        { code: '1.1', name: 'Ketersediaan Dokumen KOSP', targetScore: 100 },
        { code: '1.2', name: 'Kesesuaian Kurikulum dengan Visi Misi', targetScore: 100 },
        { code: '1.3', name: 'Beban Belajar sesuai ketentuan', targetScore: 100 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_PROSES,
      name: 'Standar Proses',
      description: 'Pelaksanaan pembelajaran pada satu satuan pendidikan untuk mencapai standar kompetensi lulusan.',
      indicators: [
        { code: '2.1', name: 'Kelengkapan RPP/Modul Ajar', targetScore: 100 },
        { code: '2.2', name: 'Pelaksanaan Pembelajaran Aktif', targetScore: 90 },
        { code: '2.3', name: 'Pelaksanaan Supervisi Akademik', targetScore: 100 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_KOMPETENSI_LULUSAN,
      name: 'Standar Kompetensi Lulusan',
      description: 'Kualifikasi kemampuan lulusan yang mencakup sikap, pengetahuan, dan keterampilan.',
      indicators: [
        { code: '3.1', name: 'Rata-rata Nilai Ujian Sekolah', targetScore: 80 },
        { code: '3.2', name: 'Pencapaian Prestasi Non-Akademik', targetScore: 85 },
        { code: '3.3', name: 'Keterserapan Lulusan / Studi Lanjut', targetScore: 90 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_PENDIDIK_DAN_TENAGA_KEPENDIDIKAN,
      name: 'Standar Pendidik dan Tenaga Kependidikan',
      description: 'Kriteria pendidikan prajabatan dan kelayakan fisik maupun mental, serta pendidikan dalam jabatan.',
      indicators: [
        { code: '4.1', name: 'Kualifikasi Akademik Guru (Min. S1/D4)', targetScore: 100 },
        { code: '4.2', name: 'Kepemilikan Sertifikat Pendidik', targetScore: 80 },
        { code: '4.3', name: 'Kompetensi Tenaga Kependidikan', targetScore: 90 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_SARANA_DAN_PRASARANA,
      name: 'Standar Sarana dan Prasarana',
      description: 'Kriteria minimal tentang ruang belajar, tempat berolahraga, tempat beribadah, perpustakaan, laboratorium, bengkel kerja, tempat bermain, tempat berkreasi dan berekreasi.',
      indicators: [
        { code: '5.1', name: 'Kondisi Ruang Kelas Layak', targetScore: 100 },
        { code: '5.2', name: 'Kelengkapan Laboratorium & Perpustakaan', targetScore: 90 },
        { code: '5.3', name: 'Ketersediaan Sanitasi & Air Bersih', targetScore: 100 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_PENGELOLAAN,
      name: 'Standar Pengelolaan',
      description: 'Perencanaan, pelaksanaan, dan pengawasan kegiatan pendidikan pada tingkat satuan pendidikan, kabupaten/kota, provinsi, atau nasional.',
      indicators: [
        { code: '6.1', name: 'Kepemilikan Visi, Misi, dan Tujuan', targetScore: 100 },
        { code: '6.2', name: 'Dokumen RKAS/RKAM', targetScore: 100 },
        { code: '6.3', name: 'Keterlibatan Komite Sekolah', targetScore: 90 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_PEMBIAYAAN,
      name: 'Standar Pembiayaan',
      description: 'Komponen dan besarnya biaya operasi satuan pendidikan yang berlaku selama satu tahun.',
      indicators: [
        { code: '7.1', name: 'Transparansi Laporan Keuangan', targetScore: 100 },
        { code: '7.2', name: 'Alokasi Biaya Investasi & Operasional', targetScore: 100 },
        { code: '7.3', name: 'Sumber Pendanaan yang Jelas', targetScore: 100 },
      ],
    },
    {
      type: QualityStandardType.STANDAR_PENILAIAN_PENDIDIKAN,
      name: 'Standar Penilaian Pendidikan',
      description: 'Mekanisme, prosedur, dan instrumen penilaian hasil belajar peserta didik.',
      indicators: [
        { code: '8.1', name: 'Kelengkapan Instrumen Penilaian', targetScore: 100 },
        { code: '8.2', name: 'Analisis Hasil Belajar & Remedial', targetScore: 90 },
        { code: '8.3', name: 'Pelaporan Hasil Belajar (Rapor)', targetScore: 100 },
      ],
    },
  ];

  for (const std of standardsData) {
    // Upsert Standard
    const standard = await prisma.qualityStandard.upsert({
      where: { type: std.type },
      update: {
        name: std.name,
        description: std.description,
      },
      create: {
        type: std.type,
        name: std.name,
        description: std.description,
      },
    });

    // Create Indicators if not exist (using code as quasi-unique check per standard)
    for (let i = 0; i < std.indicators.length; i++) {
      const ind = std.indicators[i];

      // Check if exists by code and standardId (since code isn't unique globally, only per standard logic usually)
      const existingIndicator = await prisma.qualityIndicator.findFirst({
        where: {
          standardId: standard.id,
          code: ind.code,
        },
      });

      if (!existingIndicator) {
        await prisma.qualityIndicator.create({
          data: {
            standardId: standard.id,
            code: ind.code,
            name: ind.name,
            targetScore: ind.targetScore,
            sortOrder: i + 1,
          },
        });
      }
    }
  }

  console.log('✅ Quality Standards seeded');
};
