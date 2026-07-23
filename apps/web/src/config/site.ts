/**
 * Canonical public-facing data for Yayasan Pesantren Cipansor.
 *
 * Every figure here must be verifiable against an official source. Google Ad
 * Grants suspends accounts whose site misrepresents the nonprofit, so do not
 * add enrollment counts, alumni totals, or award tallies that nobody can check.
 */

export const siteConfig = {
  name: "Pesantren Cipansor",
  legalName: "Yayasan Pesantren Cipansor",
  markaz: "Markaz Annur",
  tagline: "Sekolah Islam Terpadu (IT)",
  visi: "Mencetak Generasi Qur'ani yang Cerdas dan Mandiri",
  establishedYear: 1911,
  description:
    "Pesantren Cipansor adalah lembaga pendidikan Islam terpadu yang menyeimbangkan ilmu agama, akademik, dan teknologi. Kami berdedikasi mencetak generasi yang berakhlak mulia, berilmu, serta siap bersaing di era global.",
  url: "https://cipansor.or.id",
  contact: {
    email: "halo@cipansor.or.id",
    phone: "0811-110-400",
    // E.164 for tel: and wa.me links.
    phoneE164: "62811110400",
    whatsapp: "https://wa.me/62811110400",
    address: {
      street: "Jl. Raya Malangbong - Kadipaten RT 001 RW 001",
      village: "Kp. Nyalindung, Desa Buniasih",
      district: "Kecamatan Kadipaten",
      regency: "Kabupaten Tasikmalaya",
      province: "Jawa Barat",
      postalCode: "46157",
    },
    /**
     * The pesantren's Google Maps listing.
     *
     * Tracking parameters (`entry`, `g_ep`) are stripped — they encode the
     * session that produced the link and expire. What identifies the place is
     * the feature id `1s0x…:0x…` and the coordinates, both kept.
     */
    maps: {
      url: "https://www.google.com/maps/place/Pesantren+Cipansor/@-7.120041,108.1362663,706m/data=!3m2!1e3!4b1!4m6!3m5!1s0x2e6f4bd13990be6f:0xf031eb3bed37e742!8m2!3d-7.120041!4d108.1362663!16s%2Fg%2F11f0ksgmwv",
      latitude: -7.120041,
      longitude: 108.1362663,
    },
  },
} as const;

export const addressLines = [
  siteConfig.contact.address.street,
  siteConfig.contact.address.village,
  `${siteConfig.contact.address.district}, ${siteConfig.contact.address.regency}`,
  `${siteConfig.contact.address.province} ${siteConfig.contact.address.postalCode}`,
];

/** The five formal education units, in ascending age order. */
export const educationUnits = [
  {
    slug: "tkq",
    name: "TK Qur'an",
    shortName: "TKQ",
    tagline: "Teman Bermain dan Mengaji",
    description:
      "Pendidikan anak usia dini yang memperkenalkan huruf hijaiyah, hafalan surat pendek, dan adab harian lewat bermain. Anak belajar mencintai Al-Qur'an sebelum diminta menghafalnya.",
    logo: "/images/cipansor/unit-tkq.webp",
  },
  {
    slug: "sdit",
    name: "SD IT Cipansor",
    shortName: "SDIT",
    tagline: "Berkarakter Disiplin dan Berprestasi",
    description:
      "Sekolah dasar terpadu yang menggabungkan kurikulum nasional dengan pembinaan tahfidz harian. Santri dibiasakan salat berjamaah, mandiri, dan aktif mengikuti kompetisi akademik.",
    logo: "/images/cipansor/unit-sdit.webp",
  },
  {
    slug: "smpit",
    name: "SMP IT Cipansor",
    shortName: "SMPIT",
    tagline: "Berjiwa Islami Berkarakter Tarbawi dan Mandiri",
    description:
      "Jenjang menengah pertama berasrama dengan penguatan bahasa Arab dan Inggris, kajian kitab, serta pembinaan mental melalui kegiatan kepanduan dan bela diri.",
    logo: "/images/cipansor/unit-smpit.webp",
  },
  {
    slug: "sma-quran",
    name: "SMA Qur'an",
    shortName: "SMAQURAN",
    tagline: "Membentuk Hafidz yang unggul dan berkarakter rabbani",
    description:
      "Menengah atas yang memadukan target hafalan Al-Qur'an dengan persiapan perguruan tinggi, baik dalam maupun luar negeri, serta pembinaan kepemimpinan santri.",
    logo: "/images/cipansor/unit-smaquran.webp",
  },
  {
    slug: "takhosus",
    name: "Takhosus",
    shortName: "TAKHOSUS",
    tagline: "Mencetak penghafal Qur'an bersanad dan mutqin",
    description:
      "Program khusus tahfidz intensif untuk santri yang menargetkan hafalan 30 juz bersanad dengan kualitas mutqin, disertai penguasaan ilmu tajwid dan qira'ah.",
    logo: "/images/cipansor/unit-takhosus.webp",
  },
];

/** Program unggulan as published by the pesantren. */
export const featuredPrograms = [
  {
    slug: "tahfidz-tahsin",
    title: "Tahfidz & Tahsin Qur'an",
    description:
      "Membentuk hafidz Qur'an bersanad sekaligus memiliki kemampuan tahsin Qur'an. Setoran hafalan dan perbaikan bacaan berjalan setiap hari di bawah bimbingan musyrif.",
  },
  {
    slug: "kitab-kuning",
    title: "Kajian Kitab Kuning",
    description:
      "Pembacaan dan pembahasan kitab turats klasik dalam bidang fiqih, akidah, nahwu, dan akhlak, sehingga santri terbiasa membaca sumber asli berbahasa Arab.",
  },
  {
    slug: "leadership",
    title: "Leadership (Kepemimpinan)",
    description:
      "Pembinaan karakter melalui organisasi santri, pengelolaan kegiatan asrama, dan latihan kepemimpinan Islami yang menumbuhkan tanggung jawab serta kemandirian.",
  },
  {
    slug: "bahasa",
    title: "Bahasa Arab & Bahasa Inggris",
    description:
      "Pembiasaan dua bahasa dalam percakapan harian, muhadatsah, dan muhadhoroh agar santri siap mengakses literatur keislaman maupun ilmu pengetahuan global.",
  },
  {
    slug: "hadits",
    title: "Menghafal Hadits",
    description:
      "Program hafalan hadits pilihan lengkap dengan pemahaman makna dan penerapannya, membangun sanad keilmuan santri sejak dini.",
  },
  {
    slug: "praktik-ibadah",
    title: "Praktik Ibadah",
    description:
      "Bimbingan praktik ibadah harian mulai dari thaharah, salat, hingga pengurusan jenazah, agar ilmu yang dipelajari langsung diamalkan.",
  },
  {
    slug: "public-speaking",
    title: "Public Speaking",
    description:
      "Membangun kepercayaan diri santri dalam menyampaikan ide dan dakwah secara efektif, menciptakan generasi yang cerdas berkomunikasi dan mandiri dalam berekspresi.",
  },
  {
    slug: "pembinaan-islam",
    title: "Pembinaan Islam Intensif",
    description:
      "Program pembentukan karakter dan pemahaman Islam yang mendalam untuk memastikan santri tumbuh menjadi pribadi yang teguh memegang nilai-nilai Qur'ani dalam setiap aspek kehidupan.",
  },
  {
    slug: "entrepreneurship",
    title: "Entrepreneurship",
    description:
      "Menanamkan jiwa kewirausahaan sejak dini untuk membentuk santri yang kreatif, inovatif, dan mandiri secara ekonomi di masa depan.",
  },
  {
    slug: "bimbel-xii",
    title: "Bimbingan Belajar Kelas XII",
    description:
      "Dukungan akademik strategis bagi santri kelas XII dalam mempersiapkan diri menempuh seleksi masuk perguruan tinggi, di dalam maupun luar negeri.",
  },
];

/**
 * Articles live in `config/content.ts`, which holds the same fields plus the
 * body. A second copy here meant the homepage teaser and the /berita page could
 * drift apart — different excerpt, different date, same slug.
 */

/**
 * Donation details, as published on the pesantren's own wakaf-infaq page.
 * Treat these as financial data: never substitute placeholder digits here. A
 * wrong account number sends real donations to a stranger.
 */
export const donationConfig = {
  /** Framing taken from the yayasan's own "Investasi Akhirat" campaign. */
  headline: "Investasi Akhirat",
  subheadline: "Program Donasi Pesantren Cipansor",
  lead: "Setiap rupiah yang Anda infakkan adalah benih kebaikan yang akan terus bertumbuh dan mengalirkan pahala jariyah melalui lantunan ayat suci para santri.",
  programsIntro:
    "Kami menyediakan tiga kanal utama bagi Anda untuk menanam amal di Pesantren Cipansor:",
  hadith: {
    text: "Siapa yang membangun masjid (atau sarana pendidikan) karena Allah, maka Allah akan membangunkan untuknya rumah di surga.",
    source: "HR. Muslim",
  },
  commitment: {
    title: "Komitmen Amanah Kami",
    text: "Kami menjamin setiap rupiah yang Anda titipkan akan dikelola secara transparan dan disalurkan 100% sesuai dengan akad program yang Anda pilih. Laporan penyaluran dana akan diperbarui secara berkala sebagai bentuk pertanggungjawaban kami kepada umat dan Allah SWT.",
  },
  bank: {
    name: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7169094734",
    accountHolder: "Yayasan Pesantren Cipansor",
  },
  /** Transfer proof goes to a dedicated confirmation line, not the main one. */
  confirmation: {
    whatsappNumber: "085320174340",
    whatsappE164: "6285320174340",
    // The published poster writes the format as "Nama_Program
    // Donasi_Nominal_Nama" — four fields — but its own example has three
    // (program, nominal, donor). Donors copy the example, not the spec, so the
    // format shown here follows the example. Worth correcting on the poster too.
    format: "Program Donasi_Nominal_Nama",
    example: "Wakaf Sarana Pendidikan_100jt_Bahrul",
  },
  /**
   * The three channels the yayasan publishes. `type` maps each to the akad the
   * donation form records, so "Pilih Program" in the instructions is something
   * a donor can actually click rather than a heading to read past.
   */
  programs: [
    {
      title: "Wakaf Sarana Pendidikan",
      type: "WAKAF",
      description:
        "Dana akan dialokasikan sepenuhnya untuk pembangunan dan pengembangan ruang kelas baru bagi jenjang SD IT, SMP IT, dan SMA Qur'an demi kenyamanan belajar para santri.",
    },
    {
      title: "Beasiswa Santri Takhosus",
      type: "BEASISWA",
      description:
        "Dukungan biaya operasional khusus bagi para penghafal Al-Qur'an 30 juz agar mereka dapat fokus belajar tanpa terkendala biaya pendidikan.",
    },
    {
      title: "Infaq Operasional Pesantren",
      type: "INFAK",
      description:
        "Dukungan dana untuk kelancaran kegiatan belajar-mengajar harian serta pemeliharaan fasilitas pesantren setiap harinya.",
    },
  ],
  /**
   * The three steps as published on the yayasan's donation poster.
   *
   * The poster describes the manual route only — it was written for a static
   * site. This page also has an online form, so the steps now say which route
   * they belong to instead of leaving a donor to guess why the page offers a
   * "Donasi Sekarang" button that the instructions never mention.
   */
  steps: [
    {
      title: "Pilih Program",
      description:
        "Tentukan program donasi yang ingin Anda dukung: Wakaf Sarana Pendidikan, Beasiswa Santri Takhosus, atau Infaq Operasional — lalu tekan “Pilih Program Ini”.",
    },
    {
      title: "Transfer Dana",
      description:
        "Kirimkan donasi Anda melalui rekening resmi yayasan yang tercantum di atas.",
    },
    {
      title: "Konfirmasi",
      description:
        "Kirimkan foto bukti transfer melalui WhatsApp Admin kami dengan format yang ditentukan, agar donasi Anda tercatat pada program yang benar.",
    },
  ],
} as const;

/** Documentation gallery shown on the homepage. */
export const galleryItems = [
  {
    slug: "fasilitas",
    title: "Kilas Balik & Dokumentasi Fasilitas Pondok",
    image: "/images/cipansor/galeri-1.webp",
  },
  {
    slug: "disiplin",
    title: "Membangun Budaya Disiplin Sejak Dini",
    image: "/images/cipansor/galeri-2.webp",
  },
  {
    slug: "karakter",
    title: "Pembinaan Spiritual & Karakter Rabbani",
    image: "/images/cipansor/galeri-3.webp",
  },
];
