import { PrismaClient, QualityStandardType } from '@prisma/client';

const prisma = new PrismaClient();

const STANDARDS = [
  {
    type: QualityStandardType.STANDAR_ISI,
    name: 'Standar Isi',
    description: 'Ruang lingkup materi dan tingkat kompetensi yang dituangkan dalam kriteria tentang kompetensi tamatan, kompetensi bahan kajian, kompetensi mata pelajaran, dan silabus pembelajaran.',
    indicators: [
      { code: '1.1', name: 'Kurikulum Tingkat Satuan Pendidikan (KTSP) dikembangkan sesuai prosedur' },
      { code: '1.2', name: 'Sekolah melaksanakan kurikulum sesuai ketentuan' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_PROSES,
    name: 'Standar Proses',
    description: 'Pelaksanaan pembelajaran pada satu satuan pendidikan untuk mencapai standar kompetensi lulusan.',
    indicators: [
      { code: '2.1', name: 'Silabus sudah sesuai/relevan dengan standar' },
      { code: '2.2', name: 'RPP dirancang untuk mencapai pembelajaran efektif' },
      { code: '2.3', name: 'Proses pembelajaran dilaksanakan dengan interaktif' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_KOMPETENSI_LULUSAN,
    name: 'Standar Kompetensi Lulusan',
    description: 'Kualifikasi kemampuan lulusan yang mencakup sikap, pengetahuan, dan keterampilan.',
    indicators: [
      { code: '3.1', name: 'Lulusan memiliki kompetensi pada dimensi sikap' },
      { code: '3.2', name: 'Lulusan memiliki kompetensi pada dimensi pengetahuan' },
      { code: '3.3', name: 'Lulusan memiliki kompetensi pada dimensi keterampilan' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_PENDIDIK_DAN_TENAGA_KEPENDIDIKAN,
    name: 'Standar Pendidik dan Tenaga Kependidikan',
    description: 'Kriteria pendidikan prajabatan dan kelayakan fisik maupun mental, serta pendidikan dalam jabatan.',
    indicators: [
      { code: '4.1', name: 'Ketersediaan dan kompetensi guru sesuai ketentuan' },
      { code: '4.2', name: 'Ketersediaan dan kompetensi kepala sekolah sesuai ketentuan' },
      { code: '4.3', name: 'Ketersediaan dan kompetensi tenaga administrasi sesuai ketentuan' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_SARANA_DAN_PRASARANA,
    name: 'Standar Sarana dan Prasarana',
    description: 'Kriteria minimal tentang ruang belajar, tempat berolahraga, tempat beribadah, perpustakaan, laboratorium, bengkel kerja, tempat bermain, tempat berkreasi dan berekreasi, serta sumber belajar lain.',
    indicators: [
      { code: '5.1', name: 'Kapasitas dan kelayakan ruang kelas' },
      { code: '5.2', name: 'Ketersediaan laboratorium dan peralatan' },
      { code: '5.3', name: 'Ketersediaan perpustakaan dan buku' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_PENGELOLAAN,
    name: 'Standar Pengelolaan',
    description: 'Perencanaan, pelaksanaan, dan pengawasan kegiatan pendidikan pada tingkat satuan pendidikan, kabupaten/kota, provinsi, atau nasional.',
    indicators: [
      { code: '6.1', name: 'Sekolah memiliki visi, misi, dan tujuan yang jelas' },
      { code: '6.2', name: 'Sekolah memiliki rencana kerja jangka menengah dan tahunan' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_PEMBIAYAAN,
    name: 'Standar Pembiayaan',
    description: 'Komponen dan besarnya biaya operasi satuan pendidikan yang berlaku selama satu tahun.',
    indicators: [
      { code: '7.1', name: 'Sekolah memiliki Rencana Kerja dan Anggaran Sekolah (RKAS)' },
      { code: '7.2', name: 'Pengelolaan keuangan dilaksanakan secara transparan dan akuntabel' }
    ]
  },
  {
    type: QualityStandardType.STANDAR_PENILAIAN_PENDIDIKAN,
    name: 'Standar Penilaian Pendidikan',
    description: 'Mekanisme, prosedur, dan instrumen penilaian hasil belajar peserta didik.',
    indicators: [
      { code: '8.1', name: 'Guru melaksanakan penilaian hasil belajar' },
      { code: '8.2', name: 'Sekolah melaksanakan penilaian hasil belajar' }
    ]
  }
];

async function main() {
  console.log('Seeding Quality Standards...');

  for (const std of STANDARDS) {
    const existing = await prisma.qualityStandard.findUnique({
      where: { type: std.type }
    });

    if (!existing) {
      console.log(`Creating standard: ${std.name}`);
      await prisma.qualityStandard.create({
        data: {
          type: std.type,
          name: std.name,
          description: std.description,
          indicators: {
            create: std.indicators.map((ind, index) => ({
              code: ind.code,
              name: ind.name,
              sortOrder: index + 1
            }))
          }
        }
      });
    } else {
      console.log(`Standard ${std.name} already exists. Skipping.`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
