/**
 * Strategic-planning demo data — the yayasan's RPJP → Renstra → RKA cascade.
 *
 * Modelled on three mock-up planning documents supplied for Yayasan Pesantren
 * Cipansor (RPJP 2027–2045, Renstra 2027–2029, RKA 2027). They are realistic
 * mock-ups, NOT official documents. The three levels form one cascade:
 *
 *   RPJP 2027–2045  (foundation-wide, no unit)  — Sasaran Visi + IUP per objective
 *     └─ Renstra 2027–2029 (Tahap I)            — Sasaran Strategis SS1–SS5 + Programs
 *          └─ RKA 2027 (year 1)                 — 5 bidang + 24 kegiatan (K-01…K-24)
 *
 * Mapping to the models (per docs/ROADMAP.md §8.3):
 *   Sasaran / Sasaran Strategis / Bidang → PlanObjective
 *   IUP / IKU / key IKK                   → PlanIndicator (baseline → target)
 *   Program (Renstra) / Kegiatan (RKA)    → PlanActivity
 *
 * Nominal budgets exist only on the RKA and are INDICATIVE mock-up figures: the
 * source document deliberately left every RAB cell as "[Rp ...]" for the
 * Bendahara to fill. They are seeded here only so the demo shows a believable
 * budget roll-up; every RKA activity notes that its figure is indicative.
 */
import {
  PrismaClient,
  Prisma,
  PlanType,
  PlanStatus,
  PlanPriority,
  BSCPerspective,
} from '@prisma/client';

export interface StrategicPlanSeedUsers {
  /** Author of record for the plans (super admin / operator). */
  createdById: string;
  /** Ratifier — Ketua Pembina, who approves via Rapat Pembina. */
  approvedById: string;
  /** Ketua Pengurus Yayasan. */
  ketua: string;
  /** Sekretaris Yayasan. */
  sekretaris: string;
  /** Bendahara Yayasan. */
  bendahara: string;
  /** Kepala SD IT. */
  kepalaSd: string;
  /** Kepala SMP IT. */
  kepalaSmp: string;
  /** Kepala SMA Qur'an (stand-in). */
  kepalaSma: string;
  /** Bidang coordinator stand-in (tahfidz / keagamaan / sosial / unit usaha). */
  koordinator: string;
  /** SMP IT unit id — owner of the unit-level RKA excerpt. */
  unitSmpId: string;
}

const D = (rupiah: number) => new Prisma.Decimal(rupiah);
const JT = 1_000_000; // one million rupiah

type ActivityCreate = Prisma.PlanActivityCreateWithoutObjectiveInput;

export async function seedStrategicPlans(
  prisma: PrismaClient,
  u: StrategicPlanSeedUsers
) {
  // ───────────────────────────────────────────────────────────────────────
  // 1. RPJP 2027–2045 — foundation-wide induk document.
  //    Faithful to the source: an RPJP stops at Sasaran Pokok + IUP and carries
  //    NO Program/Kegiatan, so its objectives have indicators but no activities.
  // ───────────────────────────────────────────────────────────────────────
  const rpjp = await prisma.strategicPlan.create({
    data: {
      // No unit — RPJP is a foundation-wide document (unitId null by omission).
      type: PlanType.RPJP,
      status: PlanStatus.APPROVED,
      title: 'RPJP Yayasan Pesantren Cipansor 2027–2045',
      description:
        "Rencana Pembangunan Jangka Panjang: dokumen induk menuju Generasi Qur'ani " +
        'yang unggul dan berdaya saing di era Indonesia Emas 2045. Kerangka: ' +
        'Visi → Sasaran Visi → Misi Pembangunan → Arah Pembangunan → Sasaran Pokok & IUP per tahap. ' +
        'Diselaraskan dengan RPJPN 2025–2045, RPJPD Jawa Barat & Kab. Tasikmalaya. ' +
        'Mock-up demo, bukan dokumen resmi.',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2045-12-31'),
      progress: 5,
      createdBy: { connect: { id: u.createdById } },
      approvedBy: { connect: { id: u.approvedById } },
      approvedAt: new Date('2026-12-20'),
      objectives: {
        create: [
          {
            order: 0,
            perspective: BSCPerspective.LEARNING,
            priority: PlanPriority.CRITICAL,
            weight: 30,
            progress: 10,
            title: 'Sasaran Visi 1 — Mutu pendidikan pesantren terpadu meningkat',
            description:
              'Seluruh satuan pendidikan formal terakreditasi unggul dan capaian ' +
              'hafalan lulusan meningkat sampai khatam 30 juz pada 2045.',
            indicators: {
              create: [
                {
                  name: 'Satuan pendidikan formal terakreditasi A/Unggul',
                  unit: 'unit',
                  baseline: 1,
                  targetValue: 3,
                  currentValue: 1,
                },
                {
                  name: 'Rata-rata hafalan lulusan SMA (kumulatif)',
                  unit: 'juz',
                  baseline: 6,
                  targetValue: 30,
                  currentValue: 6,
                },
              ],
            },
          },
          {
            order: 1,
            perspective: BSCPerspective.FINANCIAL,
            priority: PlanPriority.HIGH,
            weight: 20,
            progress: 5,
            title: 'Sasaran Visi 2 — Kemandirian ekonomi kelembagaan meningkat',
            description:
              'Kontribusi unit usaha syariah dan wakaf produktif terhadap total ' +
              'anggaran tahunan Yayasan naik dari < 10% menjadi > 40%.',
            indicators: {
              create: [
                {
                  name: 'Kontribusi pendanaan mandiri terhadap anggaran',
                  unit: '%',
                  baseline: 10,
                  targetValue: 40,
                  currentValue: 10,
                },
              ],
            },
          },
          {
            order: 2,
            perspective: BSCPerspective.CUSTOMER,
            priority: PlanPriority.HIGH,
            weight: 20,
            progress: 5,
            title: 'Sasaran Visi 3 — Kemanfaatan sosial-kemanusiaan meluas',
            description:
              'Jumlah penerima manfaat santunan dan beasiswa per tahun tumbuh dari ' +
              '±40 orang menjadi 400+ orang.',
            indicators: {
              create: [
                {
                  name: 'Penerima manfaat sosial per tahun',
                  unit: 'orang',
                  baseline: 40,
                  targetValue: 400,
                  currentValue: 40,
                },
              ],
            },
          },
          {
            order: 3,
            perspective: BSCPerspective.PROCESS,
            priority: PlanPriority.MEDIUM,
            weight: 15,
            progress: 5,
            title: 'Sasaran Visi 4 — Tata kelola kelembagaan modern & akuntabel',
            description:
              'Dari laporan yang direview internal dan sistem informasi parsial ' +
              'menuju audit independen rutin dan sistem terintegrasi penuh. ' +
              'Kematangan diukur pada skala 1 (review internal) sampai 5 (audit independen + sistem terintegrasi).',
            indicators: {
              create: [
                {
                  name: 'Tingkat kematangan tata kelola & audit',
                  unit: 'skala 1-5',
                  baseline: 1,
                  targetValue: 5,
                  currentValue: 1,
                },
              ],
            },
          },
          {
            order: 4,
            perspective: BSCPerspective.CUSTOMER,
            priority: PlanPriority.MEDIUM,
            weight: 15,
            progress: 5,
            title: 'Sasaran Visi 5 — Daya saing & pengakuan regional meningkat',
            description:
              'Jangkauan pengakuan Yayasan naik dari tingkat kecamatan menjadi ' +
              'rujukan tingkat Jawa Barat untuk model pesantren terpadu. ' +
              'Skala 1 (kecamatan) → 5 (rujukan Jawa Barat).',
            indicators: {
              create: [
                {
                  name: 'Jangkauan pengakuan kelembagaan',
                  unit: 'skala 1-5',
                  baseline: 1,
                  targetValue: 5,
                  currentValue: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ───────────────────────────────────────────────────────────────────────
  // 2. Renstra 2027–2029 — Tahap I of the RPJP. Objectives = SS1–SS5, each with
  //    its IKU/indicator (target 2029) and the Programs that serve it.
  // ───────────────────────────────────────────────────────────────────────
  const prog = (
    code: string,
    name: string,
    outcome: string,
    picId: string,
    ikpTarget2029: string,
    priority: PlanPriority,
    status: PlanStatus
  ): ActivityCreate => ({
    title: `Program ${code}: ${name}`,
    description: outcome,
    priority,
    status,
    startDate: new Date('2027-01-01'),
    endDate: new Date('2029-12-31'),
    notes: `IKP (target akhir 2029): ${ikpTarget2029}`,
    pic: { connect: { id: picId } },
  });

  const renstra = await prisma.strategicPlan.create({
    data: {
      // Foundation-wide (unitId null); hangs off the RPJP as its Tahap I.
      parent: { connect: { id: rpjp.id } },
      type: PlanType.RENSTRA,
      status: PlanStatus.IN_PROGRESS,
      title: 'Renstra Yayasan Pesantren Cipansor 2027–2029 (Tahap I RPJP)',
      description:
        'Rencana Strategis penjabaran Tahap I RPJP. Kerangka: ' +
        'Visi → Misi → Tujuan → Sasaran Strategis → Program → Kegiatan. ' +
        'Tema tahap: Penguatan Fondasi Mutu dan Tata Kelola. Mock-up demo.',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2029-12-31'),
      progress: 22,
      createdBy: { connect: { id: u.createdById } },
      approvedBy: { connect: { id: u.approvedById } },
      approvedAt: new Date('2026-12-27'),
      objectives: {
        create: [
          {
            order: 0,
            perspective: BSCPerspective.CUSTOMER,
            priority: PlanPriority.CRITICAL,
            weight: 30,
            progress: 25,
            title: 'SS1 — Meningkatnya mutu & akses pendidikan formal (SD, SMP, SMA) serta TKQ',
            description:
              'Mutu dan akses pendidikan formal tiga jenjang naik, TKQ menguat ' +
              'sebagai pintu masuk, dan kompetensi pendidik meningkat.',
            indicators: {
              create: [
                {
                  name: 'Satuan pendidikan formal terakreditasi A',
                  unit: 'unit',
                  baseline: 1,
                  targetValue: 3,
                  currentValue: 1,
                },
                {
                  name: 'Pendidik tersertifikasi/berkualifikasi',
                  unit: '%',
                  baseline: 60,
                  targetValue: 90,
                  currentValue: 65,
                },
              ],
            },
            activities: {
              create: [
                prog('1.A.1', 'Penguatan Kurikulum Payung Keislaman Lintas Jenjang',
                  'Tersedianya kerangka kurikulum keislaman yang konsisten dari TK hingga SMA.',
                  u.ketua, 'Diterapkan & disempurnakan di seluruh jenjang', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.A.2', 'Digitalisasi Sistem Informasi Akademik Terpadu ("Smart Pesantren")',
                  'Satu sistem informasi akademik & administrasi yang menaungi TKQ, SDIT, SMP IT, SMA Qur\'an.',
                  u.sekretaris, 'Terintegrasi penuh 4 jenjang; 90% wali santri aktif', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.A.3', 'Peningkatan Kompetensi Pendidik Lintas Jenjang',
                  'Kualifikasi & sertifikasi pendidik meningkat merata melalui pelatihan bersama.',
                  u.koordinator, '90% pendidik tersertifikasi/berkualifikasi', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.A.4', 'Pengembangan Fasilitas Bersama Pesantren & Eco-Pesantren Sehat',
                  'Fasilitas ibadah, aula, dan asrama yang representatif, sehat, dan ramah lingkungan.',
                  u.ketua, 'Difungsikan penuh; sanitasi terstandar', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.A.5', 'Pesantren Ramah Anak (Selaras KMA No. 91/2025)',
                  'Lingkungan pesantren aman, bebas kekerasan, ramah anak di seluruh jenjang.',
                  u.koordinator, 'Fase Kemandirian PRA tercapai; nihil kasus tidak tertangani', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.C.1', 'Penguatan Mutu Akademik & Akreditasi SDIT',
                  'Mutu pembelajaran dasar meningkat dan status akreditasi A SDIT terjaga.',
                  u.kepalaSd, 'A (dipertahankan melalui reakreditasi)', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.C.2', 'Perluasan Akses & Sarpras SDIT',
                  'Jumlah peserta didik, penerima beasiswa, dan kelengkapan sarpras dasar SDIT meningkat.',
                  u.kepalaSd, '+35% siswa (kumulatif 3 tahun); sarpras 100%', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
                prog('1.D.1', 'Penguatan Mutu Akademik & Akreditasi SMP IT',
                  'Mutu pembelajaran dan status akreditasi SMP IT naik dari B menuju A.',
                  u.kepalaSmp, 'A', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.D.2', 'Pemenuhan Sarpras & Akses SMP IT',
                  'Sarpras laboratorium terpenuhi dan akses/beasiswa siswa SMP meningkat.',
                  u.kepalaSmp, '100% sarpras; 10 penerima beasiswa', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
                prog('1.E.1', "Penguatan Mutu Akademik & Akreditasi SMA Qur'an",
                  'Mutu pembelajaran dan status akreditasi SMA Qur\'an yang baru berdiri (2023) meningkat.',
                  u.kepalaSma, 'A', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('1.E.2', 'Bimbingan Karier, PTN & Kewirausahaan Santri',
                  'Keterserapan lulusan ke perguruan tinggi/dunia kerja dan jiwa kewirausahaan meningkat.',
                  u.kepalaSma, '50% lulusan terserap PTN/kerja', PlanPriority.MEDIUM, PlanStatus.DRAFT),
                prog('1.E.3', 'Pemenuhan Sarpras SMA',
                  'Sarana laboratorium & referensi belajar yang memadai bagi jenjang SMA.',
                  u.kepalaSma, '100%', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
              ],
            },
          },
          {
            order: 1,
            perspective: BSCPerspective.LEARNING,
            priority: PlanPriority.HIGH,
            weight: 20,
            progress: 20,
            title: 'SS2 — Menguatnya program tahfidz, dakwah, & syiar keagamaan',
            description:
              "Capaian hafalan santri meningkat berjenjang, TKQ menguat, dakwah " +
              'masyarakat meluas, dan pengelolaan ZISWAF optimal.',
            indicators: {
              create: [
                {
                  name: 'Rata-rata hafalan lulusan SMA (kumulatif)',
                  unit: 'juz',
                  baseline: 6,
                  targetValue: 10,
                  currentValue: 8,
                },
                {
                  name: 'Dana ZISWAF terhimpun & tersalurkan per tahun',
                  unit: 'Rp juta',
                  baseline: 150,
                  targetValue: 350,
                  currentValue: 200,
                },
              ],
            },
            activities: {
              create: [
                prog('2.1', 'Penguatan Tahfidz & Tahsin Berjenjang',
                  'Capaian hafalan Al-Qur\'an santri meningkat bertingkat sesuai usia/jenjang.',
                  u.koordinator, 'Rata-rata hafalan lulusan SMA 10 juz', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('2.2', 'Penguatan TKQ sebagai Pintu Masuk Generasi Qur\'ani',
                  'TKQ aman dan mendidik sebagai jenjang non-formal keagamaan pertama sebelum SDIT.',
                  u.koordinator, '80 santri TKQ aktif', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
                prog('2.3', 'Dakwah & Pembinaan Masyarakat Sekitar',
                  'Jangkauan syiar dan layanan keagamaan bagi masyarakat sekitar meningkat.',
                  u.koordinator, '5 majelis taklim binaan; KBIH beroperasi', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
                prog('2.4', 'Pengelolaan ZISWAF dan Qurban',
                  'Penghimpunan & penyaluran dana ZISWAF dan hewan qurban optimal.',
                  u.koordinator, 'Rp350 juta ZISWAF per tahun', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
              ],
            },
          },
          {
            order: 2,
            perspective: BSCPerspective.CUSTOMER,
            priority: PlanPriority.MEDIUM,
            weight: 15,
            progress: 20,
            title: 'SS3 — Meningkatnya jangkauan & kualitas program sosial-kemanusiaan',
            description:
              'Layanan santunan bagi yatim/dhuafa meluas, pemberdayaan ekonomi ' +
              'keluarga dhuafa berjalan, dan kepedulian lingkungan meningkat.',
            indicators: {
              create: [
                {
                  name: 'Penerima manfaat program sosial per tahun',
                  unit: 'orang',
                  baseline: 40,
                  targetValue: 85,
                  currentValue: 55,
                },
              ],
            },
            activities: {
              create: [
                prog('3.1', 'Santunan & Perlindungan Sosial',
                  'Jumlah dan kualitas layanan santunan bagi yatim, dhuafa, dan masyarakat sekitar meningkat.',
                  u.koordinator, '85 penerima santunan per tahun', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('3.2', 'Pemberdayaan Ekonomi & Tanggap Bencana',
                  'Kemandirian ekonomi keluarga dhuafa dan kesiapsiagaan bencana meningkat.',
                  u.koordinator, '25 KK penerima manfaat pemberdayaan', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
                prog('3.3', 'Kepedulian Lingkungan Hidup',
                  'Kualitas dan kelestarian lingkungan pesantren & sekitarnya meningkat.',
                  u.koordinator, '3 kegiatan pelestarian lingkungan per tahun', PlanPriority.LOW, PlanStatus.DRAFT),
              ],
            },
          },
          {
            order: 3,
            perspective: BSCPerspective.PROCESS,
            priority: PlanPriority.HIGH,
            weight: 15,
            progress: 18,
            title: 'SS4 — Terwujudnya tata kelola Yayasan yang transparan & akuntabel',
            description:
              'Kepatuhan administrasi, akuntabilitas keuangan, dan kapasitas ' +
              'manajerial kepengurusan Yayasan menguat.',
            indicators: {
              create: [
                {
                  name: 'Status audit laporan keuangan',
                  unit: 'skala 1-4',
                  baseline: 1,
                  targetValue: 3,
                  currentValue: 2,
                },
              ],
            },
            activities: {
              create: [
                prog('4.1', 'Penguatan Tata Kelola & Kepatuhan Regulasi',
                  'Kepatuhan administrasi Yayasan sesuai UU Yayasan & peraturan pendidikan.',
                  u.sekretaris, '100% kepatuhan pelaporan tahunan & perizinan', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('4.2', 'Penguatan Akuntabilitas Keuangan',
                  'Transparansi dan akuntabilitas pengelolaan keuangan Yayasan meningkat.',
                  u.bendahara, 'Laporan keuangan diaudit rutin', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
                prog('4.3', 'Pengembangan Kapasitas SDM Kepengurusan',
                  'Kapasitas manajerial Pembina, Pengurus, Pengawas & kepala unit meningkat.',
                  u.ketua, '4 pelatihan/bimtek pengurus per tahun', PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
              ],
            },
          },
          {
            order: 4,
            perspective: BSCPerspective.FINANCIAL,
            priority: PlanPriority.HIGH,
            weight: 20,
            progress: 15,
            title: 'SS5 — Meningkatnya kemandirian finansial Yayasan',
            description:
              'Kontribusi sumber pendanaan mandiri terhadap anggaran Yayasan ' +
              'meningkat melalui unit usaha vokasi & kemitraan OPOP Jawa Barat.',
            indicators: {
              create: [
                {
                  name: 'Unit usaha/wakaf produktif aktif',
                  unit: 'unit',
                  baseline: 0,
                  targetValue: 4,
                  currentValue: 1,
                },
                {
                  name: 'Kontribusi pendapatan mandiri terhadap anggaran',
                  unit: '%',
                  baseline: 8,
                  targetValue: 12,
                  currentValue: 8,
                },
              ],
            },
            activities: {
              create: [
                prog('4.4', 'Kemandirian Finansial melalui Vokasi & OPOP (One Pesantren One Product)',
                  'Kontribusi pendanaan mandiri meningkat melalui BLK Bahasa, Kopontren, dan kepesertaan OPOP.',
                  u.koordinator, '4 unit usaha aktif; meraih pengakuan OPOP berprestasi', PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
              ],
            },
          },
        ],
      },
    },
  });

  // ───────────────────────────────────────────────────────────────────────
  // 3. RKA 2027 — year 1 of the Renstra. Objectives = the five bidang; each
  //    kegiatan K-01…K-24 is an activity with a PIC, schedule, and an
  //    indicative (mock-up) budget. plan.budget is the exact sum of the
  //    activity budgets, honouring the source doc's "berjenjang & konsisten"
  //    rule.
  // ───────────────────────────────────────────────────────────────────────
  let rkaTotal = 0;
  const IND = ' (nominal indikatif — mock-up demo; RAB resmi diisi Bendahara)';
  const act = (
    code: string,
    name: string,
    sasaran: string,
    picId: string,
    budgetJt: number,
    priority: PlanPriority,
    status: PlanStatus,
    period?: { start: string; end: string }
  ): ActivityCreate => {
    const budget = budgetJt * JT;
    rkaTotal += budget;
    return {
      title: `${code}: ${name}`,
      description: sasaran,
      priority,
      status,
      startDate: new Date(period?.start ?? '2027-01-01'),
      endDate: new Date(period?.end ?? '2027-12-31'),
      budget: D(budget),
      notes: `Rp${budgetJt.toLocaleString('id-ID')} juta${IND}`,
      pic: { connect: { id: picId } },
    };
  };

  const rkaObjectives: Prisma.PlanObjectiveCreateWithoutPlanInput[] = [
    {
      order: 0,
      perspective: BSCPerspective.CUSTOMER,
      priority: PlanPriority.CRITICAL,
      weight: 45,
      progress: 45,
      title: 'Bidang Pendidikan (SS1) — mutu, akreditasi & sarpras',
      description: 'Prioritas 1: mutu, akreditasi, sarpras & Pesantren Ramah Anak — K-01 s.d. K-12.',
      indicators: {
        create: [
          { name: 'Transaksi SPP non-tunai', unit: '%', baseline: 0, targetValue: 40, currentValue: 20 },
          { name: 'Penerima beasiswa SD (dhuafa/yatim)', unit: 'siswa', baseline: 0, targetValue: 8, currentValue: 8 },
          { name: 'Siswa kelas awal mencapai standar calistung', unit: '%', baseline: 0, targetValue: 80, currentValue: 75 },
        ],
      },
      activities: {
        create: [
          act('K-01', 'Kurikulum Payung Keislaman & Pemetaan Transisi Antar Jenjang',
            'Tersusunnya kurikulum payung keislaman TK–SMA dan dokumen pemetaan transisi, mulai diterapkan TP 2027/2028.',
            u.ketua, 25, PlanPriority.HIGH, PlanStatus.COMPLETED),
          act('K-02', 'Sistem Informasi "Smart Pesantren", Migrasi Non-Tunai & Pelatihan Operator',
            'Aplikasi akademik terpadu terpasang & diuji coba SDIT–SMP IT; 40% SPP non-tunai; operator terlatih.',
            u.sekretaris, 150, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-03', 'Pelatihan HOTS & Fasilitasi Sertifikasi Pendidik Lintas Jenjang',
            '3 pelatihan pembelajaran aktif dan fasilitasi sertifikasi/studi lanjut 7 guru.',
            u.koordinator, 60, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS,
            { start: '2027-02-01', end: '2027-11-30' }),
          act('K-04', 'Pembangunan Fasilitas Bersama (Masjid/Aula, Asrama Tahap 1) & Eco-Pesantren',
            'Dimulainya pembangunan masjid/aula dan asrama tahap 1 sesuai DED; sanitasi & kemitraan Bank Sampah.',
            u.ketua, 1500, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-05', 'Pesantren Ramah Anak: Unit BK, Kode Etik & Satgas, Kanal Pengaduan',
            'BK aktif di 2 unit, kode etik & Satgas Anti-Bullying terbentuk, kanal pengaduan tersedia.',
            u.koordinator, 40, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-06', 'Pendampingan Reakreditasi & Penguatan Calistung SDIT',
            'Berkas reakreditasi SDIT diajukan; 80% siswa kelas awal mencapai standar literasi-numerasi.',
            u.kepalaSd, 20, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-07', 'PPDB, Beasiswa & Pengembangan Sarpras SDIT',
            'Siswa SDIT bertambah 10%; 8 beasiswa tersalurkan; capaian sarpras 75%.',
            u.kepalaSd, 120, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-08', 'Persiapan Kenaikan Status Akreditasi & Pembinaan Remaja SMP IT',
            'Rekomendasi visitasi terpenuhi dan berkas kenaikan status disiapkan; 3 sesi pembinaan remaja.',
            u.kepalaSmp, 25, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-09', 'Pengembangan Laboratorium & Beasiswa SMP IT',
            'Capaian standar laboratorium 70%; 7 beasiswa SMP tersalurkan.',
            u.kepalaSmp, 90, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-10', "Akreditasi Perdana & Pemenuhan Guru Mapel SMA Qur'an",
            'Berkas akreditasi perdana SMA diajukan; 80% mapel diampu guru sesuai kualifikasi.',
            u.kepalaSma, 35, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-11', 'Bimbingan Karier/PTN & Kewirausahaan Santri SMA',
            '30% lulusan terserap PTN/dunia kerja; 15 siswa mengikuti kewirausahaan/magang.',
            u.kepalaSma, 30, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-12', 'Pengembangan Laboratorium & Referensi SMA',
            'Capaian standar sarpras SMA 70%.',
            u.kepalaSma, 80, PlanPriority.MEDIUM, PlanStatus.DRAFT,
            { start: '2027-03-01', end: '2027-11-30' }),
        ],
      },
    },
    {
      order: 1,
      perspective: BSCPerspective.LEARNING,
      priority: PlanPriority.HIGH,
      weight: 15,
      progress: 50,
      title: 'Bidang Keagamaan & Dakwah (SS2) — tahfidz, TKQ, dakwah & ZISWAF',
      description: 'Prioritas 2: pembinaan tahfidz & keagamaan — K-13 s.d. K-16.',
      indicators: {
        create: [
          { name: 'Santri TKQ aktif', unit: 'santri', baseline: 40, targetValue: 55, currentValue: 45 },
          { name: 'Halaqah/kajian per pekan', unit: 'halaqah', baseline: 6, targetValue: 8, currentValue: 7 },
          { name: 'Dana ZISWAF terhimpun', unit: 'Rp juta', baseline: 150, targetValue: 200, currentValue: 110 },
        ],
      },
      activities: {
        create: [
          act('K-13', 'Pembinaan Tahfidz-Tahsin Berjenjang & Halaqah Rutin',
            'Capaian hafalan lulusan: SD 2 juz, SMP 4 juz, SMA 8 juz; 8 halaqah/kajian per pekan berjalan.',
            u.koordinator, 180, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-14', 'Penerimaan-Pembinaan Santri TKQ, Pengadaan APE & Pelatihan Pengajar',
            '55 santri TKQ aktif terbina; APE lengkap; 2 pengajar terlatih.',
            u.koordinator, 45, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-15', 'Pembinaan Majelis Taklim & Pengurusan Izin KBIH',
            '3 majelis taklim binaan aktif; izin KBIH terbit.',
            u.koordinator, 30, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-16', 'Penghimpunan-Penyaluran ZISWAF & Koordinasi Qurban',
            'Dana ZISWAF terhimpun-tersalurkan Rp200 juta (indikatif); 30 ekor hewan qurban terkelola.',
            u.koordinator, 25, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
        ],
      },
    },
    {
      order: 2,
      perspective: BSCPerspective.CUSTOMER,
      priority: PlanPriority.MEDIUM,
      weight: 10,
      progress: 55,
      title: 'Bidang Sosial & Kemanusiaan (SS3) — santunan, pemberdayaan & lingkungan',
      description: 'Prioritas 3: santunan & pemberdayaan — K-17 s.d. K-19.',
      indicators: {
        create: [
          { name: 'Penerima santunan yatim & dhuafa', unit: 'orang', baseline: 40, targetValue: 55, currentValue: 48 },
          { name: 'KK penerima pemberdayaan usaha', unit: 'KK', baseline: 0, targetValue: 15, currentValue: 7 },
        ],
      },
      activities: {
        create: [
          act('K-17', 'Santunan Yatim-Dhuafa & Peningkatan Layanan Jenazah',
            '55 penerima santunan; tim & perlengkapan layanan jenazah ditingkatkan.',
            u.koordinator, 140, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-18', 'Pemberdayaan Usaha Keluarga Dhuafa & Aksi Tanggap Bencana',
            '15 KK terdampingi usaha; kesiapsiagaan 3 aksi kemanusiaan.',
            u.koordinator, 75, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS),
          act('K-19', 'Penghijauan & Kebersihan Lingkungan Pesantren',
            '2 kegiatan penghijauan/kebersihan lingkungan terlaksana.',
            u.koordinator, 10, PlanPriority.LOW, PlanStatus.DRAFT,
            { start: '2027-02-01', end: '2027-11-30' }),
        ],
      },
    },
    {
      order: 3,
      perspective: BSCPerspective.PROCESS,
      priority: PlanPriority.HIGH,
      weight: 20,
      progress: 40,
      title: 'Bidang Kelembagaan & Tata Kelola (SS4 & SS5) — kepatuhan, audit & kemandirian',
      description: 'Prioritas 4 & 5: kepatuhan, akuntabilitas & unit usaha — K-20 s.d. K-23.',
      indicators: {
        create: [
          { name: 'Peserta kursus BLK Bahasa', unit: 'peserta', baseline: 0, targetValue: 20, currentValue: 8 },
          { name: 'Pelatihan/bimtek pengurus', unit: 'kali', baseline: 0, targetValue: 3, currentValue: 1 },
        ],
      },
      activities: {
        create: [
          act('K-20', 'Rapat Pembina, Laporan Tahunan & Administrasi Perizinan',
            'Laporan tahunan 2026 & Rapat Pembina tepat waktu (Ps. 35 & Ps. 12 AD); izin terpantau & diperpanjang.',
            u.sekretaris, 35, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-21', 'Review Eksternal Laporan Keuangan & Penataan Sistem Akuntansi',
            'Laporan keuangan 2026 direview eksternal; sistem akuntansi ditata menuju kesiapan audit 2028.',
            u.bendahara, 40, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
          act('K-22', 'Pelatihan/Bimtek Manajemen Kepengurusan',
            '3 pelatihan manajemen kelembagaan & keuangan bagi pengurus dan kepala unit.',
            u.ketua, 30, PlanPriority.MEDIUM, PlanStatus.IN_PROGRESS,
            { start: '2027-02-01', end: '2027-10-31' }),
          act('K-23', 'Penataan BLK Bahasa, Kepesertaan OPOP, Kopontren & Publikasi Kelembagaan',
            'BLK tertata (20 peserta); unit usaha terverifikasi & tersertifikasi OPOP; Kopontren aktif; website aktif.',
            u.koordinator, 120, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
        ],
      },
    },
    {
      order: 4,
      perspective: BSCPerspective.FINANCIAL,
      priority: PlanPriority.HIGH,
      weight: 10,
      progress: 58,
      title: 'Layanan Rutin Operasional & Personalia (lintas program)',
      description: 'Belanja personalia & operasional yang menjadi prasyarat berjalannya seluruh Program — K-24.',
      indicators: {
        create: [
          { name: 'Bulan terbayar tepat waktu', unit: '%', baseline: 0, targetValue: 100, currentValue: 58 },
        ],
      },
      activities: {
        create: [
          act('K-24', 'Layanan Rutin Operasional & Personalia Yayasan',
            'Seluruh kewajiban rutin personalia & operasional (bisyaroh, utilitas, konsumsi) terbayar tepat waktu 12 bulan.',
            u.bendahara, 900, PlanPriority.HIGH, PlanStatus.IN_PROGRESS),
        ],
      },
    },
  ];

  const rka = await prisma.strategicPlan.create({
    data: {
      // Foundation-wide consolidated RKA; hangs off the Renstra as its year 1.
      parent: { connect: { id: renstra.id } },
      type: PlanType.RKA,
      status: PlanStatus.IN_PROGRESS,
      title: 'RKA Yayasan Pesantren Cipansor 2027 (Tahun ke-1 Renstra)',
      description:
        'Rencana Kerja dan Anggaran tahun pertama Renstra 2027–2029. Setiap ' +
        'kegiatan memiliki induk Program, output terukur, jadwal, penanggung ' +
        'jawab, dan RAB. Nominal bersifat indikatif (mock-up demo). ' +
        'Rantai: RPJP 2027–2045 → Renstra 2027–2029 → RKA 2027.',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2027-12-31'),
      progress: 45,
      budget: D(rkaTotal),
      createdBy: { connect: { id: u.createdById } },
      approvedBy: { connect: { id: u.approvedById } },
      approvedAt: new Date('2027-01-10'),
      objectives: { create: rkaObjectives },
    },
  });

  // ───────────────────────────────────────────────────────────────────────
  // 4. A unit-level RKA excerpt — SMP IT's own slice for 2027. The Renstra
  //    (§5.1) is explicit that RKA is drawn up by the yayasan AND by each
  //    satuan pendidikan, so a per-unit RKA is faithful, not incidental. It
  //    also gives unit-scoped consumers (risk/audit linkage) a plan that lives
  //    on a real unit, alongside the foundation-wide cascade.
  // ───────────────────────────────────────────────────────────────────────
  const smpBudget = (25 + 90) * JT;
  const smpRka = await prisma.strategicPlan.create({
    data: {
      unit: { connect: { id: u.unitSmpId } },
      parent: { connect: { id: renstra.id } },
      type: PlanType.RKA,
      status: PlanStatus.IN_PROGRESS,
      title: 'RKA SMP IT Pesantren Cipansor 2027',
      description:
        'Rencana Kerja dan Anggaran SMP IT tahun 2027 — turunan unit dari RKA ' +
        'Yayasan 2027, memuat kegiatan mutu/akreditasi dan sarpras yang dikelola ' +
        'langsung oleh Kepala SMP IT. Nominal indikatif (mock-up demo).',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2027-12-31'),
      progress: 40,
      budget: D(smpBudget),
      createdBy: { connect: { id: u.createdById } },
      objectives: {
        create: [
          {
            order: 0,
            perspective: BSCPerspective.CUSTOMER,
            priority: PlanPriority.HIGH,
            weight: 60,
            progress: 45,
            title: 'Mutu & akreditasi SMP IT',
            description: 'Persiapan kenaikan status akreditasi B → A dan pembinaan karakter remaja.',
            indicators: {
              create: [
                { name: 'Sesi pembinaan karakter remaja', unit: 'sesi', baseline: 0, targetValue: 3, currentValue: 1 },
              ],
            },
            activities: {
              create: [
                {
                  title: 'K-08: Persiapan Kenaikan Status Akreditasi & Pembinaan Remaja SMP IT',
                  description: 'Rekomendasi visitasi terpenuhi dan berkas kenaikan status disiapkan; 3 sesi pembinaan remaja.',
                  priority: PlanPriority.HIGH,
                  status: PlanStatus.IN_PROGRESS,
                  startDate: new Date('2027-01-01'),
                  endDate: new Date('2027-12-31'),
                  budget: D(25 * JT),
                  notes: `Rp25 juta${IND}`,
                  pic: { connect: { id: u.kepalaSmp } },
                },
              ],
            },
          },
          {
            order: 1,
            perspective: BSCPerspective.PROCESS,
            priority: PlanPriority.MEDIUM,
            weight: 40,
            progress: 35,
            title: 'Sarpras & akses SMP IT',
            description: 'Pengembangan laboratorium IPA & komputer dan penyaluran beasiswa dhuafa/yatim.',
            indicators: {
              create: [
                { name: 'Capaian standar laboratorium', unit: '%', baseline: 0, targetValue: 70, currentValue: 40 },
                { name: 'Penerima beasiswa SMP', unit: 'siswa', baseline: 0, targetValue: 7, currentValue: 7 },
              ],
            },
            activities: {
              create: [
                {
                  title: 'K-09: Pengembangan Laboratorium & Beasiswa SMP IT',
                  description: 'Capaian standar laboratorium 70%; 7 beasiswa SMP tersalurkan.',
                  priority: PlanPriority.MEDIUM,
                  status: PlanStatus.IN_PROGRESS,
                  startDate: new Date('2027-01-01'),
                  endDate: new Date('2027-12-31'),
                  budget: D(90 * JT),
                  notes: `Rp90 juta${IND}`,
                  pic: { connect: { id: u.kepalaSmp } },
                },
              ],
            },
          },
        ],
      },
    },
  });

  return { rpjp, renstra, rka, smpRka };
}
