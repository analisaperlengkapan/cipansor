/**
 * Long-form public content: leadership, profile prose, unit detail and the
 * full text of published articles.
 *
 * `site.ts` holds the canonical *facts* (address, bank account, unit list).
 * This file holds the *prose* that turns those facts into pages a reader — and
 * a Google Ad Grants reviewer — recognises as a real institution rather than a
 * one-page brochure.
 *
 * Everything here is transcribed from the pesantren's own published pages at
 * pesantrencipansor.com. Do not invent quotes, award results, or names: the
 * people listed are real, and Ad Grants suspends accounts whose site
 * misrepresents the nonprofit.
 */

/** A paragraph-level block. Rendered as elements, never as raw HTML. */
export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; attribution?: string };

// ============================================================
// PROFIL
// ============================================================

export const profileSections: ContentBlock[] = [
  {
    type: "p",
    text: "Yayasan Pesantren Cipansor adalah lembaga pendidikan Islam nirlaba di Kabupaten Tasikmalaya, Jawa Barat, yang bernaung di bawah Markaz Annur. Kami menyelenggarakan pendidikan berasrama yang menyeimbangkan kemajuan intelektual dengan keluhuran akhlak sesuai Al-Qur'an dan As-Sunnah.",
  },
  { type: "h2", text: "Sejarah Singkat" },
  {
    type: "p",
    text: "Cipansor berdiri sejak tahun 1911. Bermula dari pengajian sederhana di tengah masyarakat Kampung Nyalindung, kegiatan belajar itu tumbuh menjadi lembaga pendidikan terpadu yang kini menaungi lima jenjang, dari taman kanak-kanak hingga program tahfidz lanjutan.",
  },
  {
    type: "p",
    text: "Nama \"Cipansor\" sendiri menyimpan doa: air yang mengalir dan menaungi. Harapannya, manfaat ilmu yang lahir dari pesantren ini terus mengalir kepada santri, keluarga, dan masyarakat sekitarnya.",
  },
  { type: "h2", text: "Visi" },
  {
    type: "p",
    text: "Mencetak Generasi Qur'ani yang Cerdas dan Mandiri.",
  },
  { type: "h2", text: "Bagaimana Visi Itu Diterjemahkan" },
  {
    type: "ul",
    items: [
      "Qur'ani — hafalan dan bacaan Al-Qur'an dibina setiap hari, bersanad, dengan penekanan pada kualitas tahsin sebelum kuantitas hafalan.",
      "Cerdas — kurikulum nasional dijalankan penuh dan didampingi kajian kitab kuning, bahasa Arab, serta bahasa Inggris.",
      "Mandiri — kehidupan asrama, organisasi santri, dan pembinaan kewirausahaan melatih santri mengurus diri dan mengambil tanggung jawab.",
    ],
  },
  { type: "h2", text: "Lima Unit Pendidikan" },
  {
    type: "p",
    text: "Pesantren Cipansor menyelenggarakan pendidikan berjenjang yang saling menyambung, sehingga santri dapat menempuh seluruh masa belajarnya dalam satu lingkungan pembinaan yang konsisten.",
  },
];

/**
 * Legal standing and independent verification.
 *
 * Google Ad Grants asks nonprofits to publish their registration details so a
 * visitor — and a reviewer — can confirm the organisation is what it says it
 * is. Every claim here must be checkable against a document the yayasan holds.
 *
 * Word these as *facts*, never as endorsement: Goodstack verifies that an
 * organisation's nonprofit status is genuine; it does not accredit, rate, or
 * recommend the pesantren, and saying otherwise would be an overclaim.
 */
export const legalIdentity = {
  decree: {
    title: "Pengesahan Badan Hukum",
    authority: "Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia",
    number: "AHU-3039.AH.01.04.Tahun 2022",
    description:
      "Yayasan Pesantren Cipansor berbadan hukum resmi dan disahkan melalui Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia.",
  },
  verification: {
    title: "Verifikasi Status Nirlaba",
    authority: "Goodstack",
    description:
      "Status nirlaba Yayasan Pesantren Cipansor telah diverifikasi secara independen oleh Goodstack, penyedia verifikasi organisasi nirlaba berskala internasional yang dipakai berbagai program sosial global untuk memastikan keabsahan sebuah lembaga.",
    /**
     * Goodstack's own wordmark, self-hosted rather than hotlinked so the badge
     * cannot break on the page Google reviews and costs no third-party request.
     * The SVG was checked for scripts and external references before adding.
     */
    logo: "/images/goodstack.svg",
    /**
     * The identifier Goodstack holds for the yayasan and the one Google matched
     * the application against. Google's own website policy requires it to be on
     * the site — "Include your nonprofit registration number (EIN, tax ID)
     * and/or an annual report" — and the Google for Nonprofits review rejected
     * the domain specifically for not displaying it.
     *
     * Indonesia has no "charity number"; the registered identifier for a
     * yayasan is its NPWP, which is what this is (15 digits, XX.XXX.XXX.X-XXX.XXX).
     * It is an organisational tax ID, routinely printed on yayasan letterheads,
     * invoices and donation receipts — not personal data.
     */
    registeredId: "31.512.635.9-425.000",
    registeredIdLabel: "Registered ID (NPWP)",
  },
  /**
   * Governance — the right closing note on the profile page.
   *
   * Indonesian yayasan law (UU No. 16/2001 jo. UU No. 28/2004) requires three
   * organs: Pembina, Pengurus, Pengawas. Naming them says something real about
   * how the institution is run.
   */
  governance:
    "Sebagai badan hukum yayasan, Pesantren Cipansor dijalankan oleh tiga organ sesuai peraturan perundang-undangan: Pembina, Pengurus, dan Pengawas. Pembagian peran ini memastikan pengambilan keputusan, pelaksanaan harian, dan pengawasan berjalan pada jalur yang terpisah.",
  /**
   * Donation-specific pledge — only shown where donations are the subject.
   * On the profile page it read as a non sequitur under a heading about legal
   * standing.
   */
  transparency:
    "Setiap donasi yang diamanahkan kepada kami dikelola secara transparan dan disalurkan sesuai akad program yang dipilih donatur, dengan laporan penyaluran dana yang diperbarui secara berkala.",
};

/** Verifiable figures only. Do not add numbers nobody can check. */
export const profileStats = [
  { label: "Berdiri sejak", value: "1911" },
  { label: "Santri", value: "±800" },
  { label: "Tenaga pendidik", value: "60" },
  { label: "Unit pendidikan", value: "5" },
];

// ============================================================
// PIMPINAN
// ============================================================

export interface Leader {
  name: string;
  position: string;
  /** A saying each leader chose to be published alongside their name. */
  motto: string;
  /** Portrait in `public/images/people/`, shared with the demo-account panel. */
  photo: string;
}

export const leadership: Leader[] = [
  {
    name: "H. Ramram Mansur Ramdani, S.Pd.I., M.Ag",
    photo: "/images/people/ketua-yayasan.webp",
    position: "Ketua Yayasan",
    motto:
      "Tidaklah seseorang merendahkan diri karena Allah, melainkan Allah akan mengangkat derajatnya.",
  },
  {
    name: "K.H. Muhammad Taufik Ismail, S.Pd",
    photo: "/images/people/pimpinan-pesantren.webp",
    position: "Pimpinan Pesantren",
    motto:
      "Didiklah anak-anakmu sesuai zamannya, karena mereka hidup bukan di zamanmu.",
  },
  {
    name: "H. Andi Muhammad Badrudin, S.T.",
    photo: "/images/people/bendahara-yayasan.webp",
    position: "Bendahara Yayasan",
    motto:
      "Ilmu tanpa adab bagaikan api tanpa kayu bakar. Ia tidak memberi manfaat, bahkan bisa membinasakan.",
  },
  {
    name: "H. Dadan Ali Ridwan, S.Ag",
    photo: "/images/people/kepala-sdit.webp",
    position: "Kepala SD IT Cipansor",
    motto: "Sesungguhnya setiap amalan tergantung pada niatnya.",
  },
  {
    name: "H. Cecep Helmi Syawali, Lc., M.Ag",
    photo: "/images/people/kepala-smpit.webp",
    position: "Kepala SMP IT Cipansor",
    motto:
      "Didiklah anak-anakmu sesuai zamannya, karena mereka hidup bukan di zamanmu.",
  },
  {
    name: "H. M. Rizkon Hakiki, Lc., Al-Hafidz",
    photo: "/images/people/kepala-smaquran.webp",
    position: "Kepala SMA Qur'an",
    motto: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",
  },
];

// ============================================================
// ARTIKEL
// ============================================================

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  unit: string;
  image: string;
  body: ContentBlock[];
}

export const articles: Article[] = [
  {
    slug: "osn-kecamatan-kadipaten-2026",
    title:
      "SD IT Pesantren Cipansor Borong Juara OSN Tingkat Kecamatan Kadipaten 2026",
    excerpt:
      "Raih juara di berbagai kategori, santri menunjukkan prestasi akademik yang membanggakan pada Olimpiade Sains Nasional tingkat kecamatan.",
    date: "2026-04-14",
    unit: "SD IT",
    image: "/images/cipansor/berita-3.webp",
    body: [
      {
        type: "p",
        text: "SD IT Pesantren Cipansor kembali menorehkan prestasi membanggakan dalam ajang Olimpiade Sains Nasional (OSN) Tingkat Kecamatan Kadipaten Tahun 2026. Kegiatan ini dilaksanakan pada Senin, 13 April 2026, dan bertempat di SD IT Pesantren Cipansor.",
      },
      {
        type: "p",
        text: "Dalam kompetisi tersebut, siswa-siswi SD IT Pesantren Cipansor berhasil meraih sejumlah penghargaan di berbagai kategori lomba, mulai dari Calistung hingga bidang akademik seperti AKM, Matematika, IPA, IPS, serta kategori Siswa Prestasi. Pencapaian ini menjadi bukti bahwa SD IT Pesantren Cipansor terus konsisten dalam meningkatkan mutu pendidikan dan membina potensi siswa sejak dini.",
      },
      {
        type: "p",
        text: "OSN tingkat kecamatan merupakan salah satu agenda penting yang bertujuan untuk mengasah kemampuan akademik siswa sekaligus melatih daya saing secara sehat. Kegiatan ini diikuti oleh siswa-siswi terbaik dari berbagai sekolah di wilayah Kecamatan Kadipaten. Melalui lomba ini, para peserta diuji kemampuan literasi, numerasi, serta penguasaan ilmu pengetahuan dasar yang menjadi pondasi penting dalam pendidikan.",
      },
      { type: "h2", text: "Daftar Prestasi Santri" },
      {
        type: "ul",
        items: [
          "Calistung Kelas 1 — Hanifah Asshafiyah, Juara 3",
          "Calistung Kelas 2 — Fuziyah Hanifah, Juara 1",
          "Calistung Kelas 3 — Wazza Dzulfaqhar M, Juara 1",
          "AKM Kelas 4 — Muhammad Zidan Abdillah, Juara 1",
          "Matematika Kelas 5 — Muhammad Rifqie Ashshidqqie, Juara 2",
          "IPA Kelas 5 — Dafiya Qisya, Juara 1",
          "IPS Kelas 5 — Aniqta Syabin, Juara 1",
          "Siswa Prestasi Kelas 6 — Rd. Khansa Shofiyah Dz, Juara 2",
        ],
      },
      {
        type: "p",
        text: "Kepala SD IT Pesantren Cipansor, Bapak Dadan Ali Ridwan, S.Ag, menyampaikan rasa syukur dan apresiasi atas pencapaian para siswa. Menurutnya, prestasi tersebut merupakan hasil kerja keras peserta didik, bimbingan guru, serta dukungan penuh dari orang tua.",
      },
      {
        type: "quote",
        text: "Kami berharap prestasi ini menjadi langkah awal untuk meraih pencapaian yang lebih tinggi di tingkat berikutnya.",
        attribution: "Dadan Ali Ridwan, S.Ag — Kepala SD IT Pesantren Cipansor",
      },
      {
        type: "p",
        text: "Keikutsertaan dalam ajang OSN menjadi bagian dari program sekolah dalam mengembangkan kemampuan siswa, baik secara akademik maupun karakter. Selain meningkatkan kemampuan belajar, pembinaan ini juga bertujuan menumbuhkan budaya prestasi, semangat kompetitif yang sehat, serta nilai-nilai tanggung jawab dan disiplin.",
      },
    ],
  },
  {
    slug: "bmw-championship-road-to-malaysia-2026",
    title:
      "Siswa SMP IT Pesantren Cipansor Raih Prestasi Gemilang pada BMW Championship Road to Malaysia 2026",
    excerpt:
      "Borong juara dalam lomba pencak silat tingkat nasional di Bandung, membuktikan pembinaan bela diri berjalan seiring pembinaan hafalan.",
    date: "2026-04-23",
    unit: "SMP IT",
    image: "/images/cipansor/berita-2.webp",
    body: [
      {
        type: "p",
        text: "Prestasi membanggakan kembali ditorehkan oleh siswa SMP IT Pesantren Cipansor dalam ajang BMW Championship Road to Malaysia 2026 cabang olahraga pencak silat. Kompetisi ini dilaksanakan pada 16 hingga 19 April 2026 di Bandung, dan diikuti oleh peserta dari berbagai daerah.",
      },
      {
        type: "p",
        text: "Dalam ajang tersebut, para atlet muda dari SMP IT Pesantren Cipansor menunjukkan semangat juang tinggi, kedisiplinan, serta kemampuan teknik yang baik sehingga mampu meraih sejumlah penghargaan. Keberhasilan ini menjadi bukti bahwa pembinaan di SMP IT Pesantren Cipansor tidak hanya menyentuh bidang akademik dan karakter islami, tetapi juga olahraga.",
      },
      { type: "h2", text: "Daftar Santri Berprestasi" },
      {
        type: "ul",
        items: [
          "Juara 1 — Surya Muhammad Fadhil",
          "Juara 2 — Riko Sodikin",
          "Juara 3 — Putra Cikal Anugrah",
          "Peserta Berprestasi — Riki Sodikin",
        ],
      },
      {
        type: "p",
        text: "BMW Championship Road to Malaysia 2026 merupakan ajang yang menjadi salah satu jalur seleksi dan pembinaan atlet pencak silat menuju event yang lebih besar, termasuk peluang tampil pada kompetisi tingkat internasional. Keikutsertaan santri dalam ajang ini menjadi pengalaman yang mengasah kemampuan teknik dan fisik sekaligus membentuk mental bertanding dan sportivitas.",
      },
      {
        type: "quote",
        text: "Alhamdulillah, kami sangat bersyukur dan bangga atas prestasi yang diraih oleh siswa-siswi SMP IT Pesantren Cipansor dalam ajang BMW Championship Road to Malaysia 2026. Ini merupakan hasil dari kerja keras, kedisiplinan, dan latihan yang konsisten.",
        attribution:
          "H. Cecep Helmi Syawali, Lc., M.Ag — Kepala SMP IT Pesantren Cipansor",
      },
      {
        type: "p",
        text: "SMP IT Pesantren Cipansor terus berkomitmen mendukung pembinaan bakat dan minat santri, baik akademik maupun non-akademik. Pembinaan pencak silat menjadi salah satu program yang tidak hanya melatih fisik, namun juga menanamkan kedisiplinan, keberanian, dan sportivitas yang selaras dengan pendidikan karakter di lingkungan pesantren.",
      },
    ],
  },
  {
    slug: "prestasi-pentas-pai-kadipaten",
    title:
      "SD IT Pesantren Cipansor Ukir Prestasi Membanggakan pada Lomba Pentas PAI Tingkat Kecamatan Kadipaten",
    excerpt:
      "Sabet juara di berbagai cabang, santri menunjukkan keunggulan dalam bidang keagamaan dan pembinaan karakter Islami.",
    date: "2026-04-23",
    unit: "SD IT",
    image: "/images/cipansor/berita-1.webp",
    body: [
      {
        type: "p",
        text: "SD IT Pesantren Cipansor meraih sejumlah penghargaan pada Lomba Pentas Pendidikan Agama Islam (PAI) Tingkat Kecamatan Kadipaten. Santri berhasil menyabet juara pada berbagai cabang, mulai dari Pildacil, MHQ, MTQ, praktik salat, kaligrafi, hingga adzan.",
      },
      {
        type: "p",
        text: "Pentas PAI menjadi wadah bagi santri untuk menyalurkan bakat di bidang keagamaan sekaligus melatih mental tampil di hadapan orang banyak. Bagi SD IT Pesantren Cipansor, ajang ini sejalan dengan pembinaan harian yang menempatkan Al-Qur'an dan akhlak sebagai pondasi, berdampingan dengan kurikulum akademik.",
      },
      { type: "h2", text: "Daftar Prestasi Santri" },
      {
        type: "ul",
        items: [
          "Pildacil — Alifa Hibatillah A.G, Juara 1",
          "MHQ Putra — Waza D.M, Juara 2",
          "MHQ Putri — Aulia Zahra, Juara 3",
          "Praktik Salat Putri — Siti N, Juara 2",
          "Praktik Salat Putra — Altan M. Al Ghifari, Juara 2",
          "Praktik Salat Putra — M. Khaedar D, Juara 2",
          "MTQ Putra — M. Fadel Al Fatih, Juara Harapan 1",
          "Kaligrafi — Andini Al Qarni, Juara Harapan 3",
          "Adzan — M. Aqil M., Juara Harapan 3",
        ],
      },
      {
        type: "p",
        text: "Kepala SD IT Pesantren Cipansor, Bapak Dadan Ali Ridwan, S.Ag, menyampaikan apresiasi atas kesungguhan santri serta dukungan orang tua. Ia menekankan bahwa mengikuti lomba bukan hanya untuk menang, tetapi untuk belajar — melatih keberanian, kedisiplinan, dan kesiapan menerima hasil apa pun.",
      },
      {
        type: "p",
        text: "SD IT Pesantren Cipansor berkomitmen terus menyeimbangkan pembelajaran umum dan pendidikan agama Islam, serta membina santri agar tumbuh menjadi pribadi berakhlak mulia.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

// ============================================================
// UNIT PENDIDIKAN — detail beyond the one-line homepage summary
// ============================================================

export const unitDetails: Record<
  string,
  { jenjang: string; highlights: string[]; intro: string }
> = {
  tkq: {
    jenjang: "Pendidikan Anak Usia Dini",
    intro:
      "TK Qur'an Cipansor memperkenalkan Al-Qur'an kepada anak lewat cara yang paling sesuai dengan usianya: bermain, bernyanyi, dan meniru. Tujuannya bukan mengejar jumlah hafalan, melainkan menumbuhkan kecintaan pada Al-Qur'an sejak awal.",
    highlights: [
      "Pengenalan huruf hijaiyah dan bacaan iqra bertahap",
      "Hafalan surat-surat pendek melalui pembiasaan harian",
      "Pembinaan adab: salam, doa harian, dan kemandirian dasar",
      "Belajar melalui bermain, bercerita, dan kegiatan motorik",
    ],
  },
  sdit: {
    jenjang: "Sekolah Dasar",
    intro:
      "SD IT Cipansor menjalankan kurikulum nasional secara penuh dan memadukannya dengan pembinaan tahfidz harian. Santri dibiasakan salat berjamaah, disiplin, dan aktif mengikuti kompetisi akademik maupun keagamaan.",
    highlights: [
      "Kurikulum nasional dipadukan dengan tahfidz harian",
      "Pembiasaan salat berjamaah dan adab keseharian",
      "Pembinaan olimpiade sains dan Pentas PAI",
      "Penguatan literasi dan numerasi sejak kelas awal",
    ],
  },
  smpit: {
    jenjang: "Sekolah Menengah Pertama",
    intro:
      "SMP IT Cipansor adalah jenjang menengah pertama berasrama yang menekankan keseimbangan antara capaian akademik, pembentukan karakter, dan nilai-nilai Qur'ani, untuk melahirkan generasi berjiwa islami, berkarakter tarbawi, dan mandiri.",
    highlights: [
      "Penguatan bahasa Arab dan bahasa Inggris melalui muhadatsah",
      "Kajian kitab kuning sebagai dasar pemahaman syariat",
      "Pembinaan kepanduan, bela diri, dan kepemimpinan santri",
      "Kehidupan asrama yang melatih kemandirian",
    ],
  },
  "sma-quran": {
    jenjang: "Sekolah Menengah Atas",
    intro:
      "SMA Qur'an memadukan target hafalan Al-Qur'an dengan persiapan perguruan tinggi, baik dalam maupun luar negeri, sekaligus membina kesiapan santri memimpin.",
    highlights: [
      "Target hafalan Al-Qur'an berdampingan dengan kurikulum SMA",
      "Bimbingan belajar khusus kelas XII untuk seleksi perguruan tinggi",
      "Pembinaan kepemimpinan dan public speaking",
      "Pendampingan karier dan studi lanjut",
    ],
  },
  takhosus: {
    jenjang: "Program Khusus Tahfidz",
    intro:
      "Takhosus adalah program tahfidz intensif bagi santri yang menargetkan hafalan 30 juz bersanad dengan kualitas mutqin, disertai penguasaan ilmu tajwid dan qira'ah.",
    highlights: [
      "Target hafalan 30 juz bersanad dengan kualitas mutqin",
      "Penguatan ilmu tajwid dan qira'ah",
      "Halaqoh harian dan muroja'ah terjadwal",
      "Beasiswa tersedia melalui program Beasiswa Santri Takhosus",
    ],
  },
};
