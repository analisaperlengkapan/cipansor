/**
 * Canonical demo accounts — one per RoleCode in the system.
 *
 * This single list is the source of truth consumed by BOTH:
 *   - the API seed (apps/api/prisma/seed.ts) which creates the login users, and
 *   - the web login page (apps/web/src/app/login/page.tsx) which lists them.
 * Keeping them in one place is what guarantees every advertised credential
 * actually logs in — edit accounts here, never in the two consumers.
 *
 * Real names + photos are used for the six leaders published on
 * pesantrencipansor.com. All other names are representative demo data.
 */

export interface DemoAccount {
  /** Tab/group key — must match a DEMO_TABS entry. */
  group: string;
  /** Must match the Prisma RoleCode enum exactly. */
  roleCode: string;
  name: string;
  email: string;
  password: string;
  description: string;
  /** Public path to an avatar, when a real photo exists. */
  photo?: string;
}

export interface DemoTab {
  key: string;
  label: string;
}

/** Every demo account shares one password, shown on each card. */
export const DEMO_PASSWORD = "Cipansor123!";

/** Tabs in display order — one per realm, plus support/business. */
export const DEMO_TABS: DemoTab[] = [
  { key: "YAYASAN", label: "Global & Yayasan" },
  { key: "PESANTREN", label: "Pesantren" },
  { key: "TK_QURAN", label: "TK Qur'an" },
  { key: "SD_IT", label: "SD IT" },
  { key: "SMP_IT", label: "SMP IT" },
  { key: "SMA_QURAN", label: "SMA Qur'an" },
  { key: "PERGURUAN_TINGGI", label: "Perguruan Tinggi" },
  { key: "SARANA_USAHA", label: "Sarana & Unit Usaha" },
];

const P = DEMO_PASSWORD;

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // ── Global & Yayasan ────────────────────────────────────────────────
  { group: "YAYASAN", roleCode: "SUPER_ADMIN", name: "Administrator Sistem", email: "super.admin@demo.cipansor.or.id", password: P, description: "Akses penuh seluruh sistem" },
  { group: "YAYASAN", roleCode: "YAYASAN_KETUA", name: "H. Ramram Mansur Ramdani, S.Pd.I., M.Ag", email: "yayasan.ketua@demo.cipansor.or.id", password: P, description: "Ketua Yayasan Pesantren Cipansor", photo: "/images/people/ketua-yayasan.webp" },
  { group: "YAYASAN", roleCode: "YAYASAN_PEMBINA", name: "K.H. Endang Saepudin, M.Pd.I", email: "yayasan.pembina@demo.cipansor.or.id", password: P, description: "Pembina Yayasan" },
  { group: "YAYASAN", roleCode: "YAYASAN_PENGAWAS", name: "H. Ujang Suryana, S.E.", email: "yayasan.pengawas@demo.cipansor.or.id", password: P, description: "Pengawas Yayasan" },
  { group: "YAYASAN", roleCode: "YAYASAN_SEKRETARIS", name: "Hj. Siti Maemunah, S.Pd.", email: "yayasan.sekretaris@demo.cipansor.or.id", password: P, description: "Sekretaris Yayasan" },
  { group: "YAYASAN", roleCode: "YAYASAN_BENDAHARA", name: "H. Andi Muhammad Badrudin, S.T.", email: "yayasan.bendahara@demo.cipansor.or.id", password: P, description: "Bendahara Yayasan", photo: "/images/people/bendahara-yayasan.webp" },
  { group: "YAYASAN", roleCode: "YAYASAN_ANGGOTA", name: "H. Dedi Mulyadi, S.Ag.", email: "yayasan.anggota@demo.cipansor.or.id", password: P, description: "Anggota Pengurus Yayasan" },

  // ── Pesantren ───────────────────────────────────────────────────────
  { group: "PESANTREN", roleCode: "PESANTREN_PENGASUH", name: "K.H. Muhammad Taufik Ismail, S.Pd", email: "pesantren.pengasuh@demo.cipansor.or.id", password: P, description: "Pimpinan / Pengasuh Pesantren", photo: "/images/people/pimpinan-pesantren.webp" },
  { group: "PESANTREN", roleCode: "PESANTREN_DIREKTUR", name: "Ustadz Hilman Fauzi, Lc.", email: "pesantren.direktur@demo.cipansor.or.id", password: P, description: "Direktur operasional pesantren" },
  { group: "PESANTREN", roleCode: "PESANTREN_TATA_USAHA", name: "Ahmad Ridwan, S.Kom.", email: "pesantren.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha Pesantren" },
  { group: "PESANTREN", roleCode: "USTADZ", name: "Ustadz Abdul Karim, Lc.", email: "pesantren.ustadz@demo.cipansor.or.id", password: P, description: "Ustadz pengampu kitab" },
  { group: "PESANTREN", roleCode: "MUSYRIF", name: "Ustadz Fahmi Nurhidayat", email: "pesantren.musyrif@demo.cipansor.or.id", password: P, description: "Pembina asrama putra" },
  { group: "PESANTREN", roleCode: "MUSYRIFAH", name: "Ustadzah Nur Aisyah", email: "pesantren.musyrifah@demo.cipansor.or.id", password: P, description: "Pembina asrama putri" },
  { group: "PESANTREN", roleCode: "MUHAFIDZ", name: "Ustadz Hafizh Anwar, Al-Hafidz", email: "pesantren.muhafidz@demo.cipansor.or.id", password: P, description: "Pengampu tahfidz putra" },
  { group: "PESANTREN", roleCode: "MUHAFIDZAH", name: "Ustadzah Khodijah, Al-Hafidzah", email: "pesantren.muhafidzah@demo.cipansor.or.id", password: P, description: "Pengampu tahfidz putri" },
  { group: "PESANTREN", roleCode: "MURABBI", name: "Ustadz Salman Alfarisi", email: "pesantren.murabbi@demo.cipansor.or.id", password: P, description: "Pembina akhlaq" },
  { group: "PESANTREN", roleCode: "WALI_KAMAR", name: "Ustadz Rizki Ramadhan", email: "pesantren.walikamar@demo.cipansor.or.id", password: P, description: "Penanggung jawab kamar" },

  // ── TK Qur'an ───────────────────────────────────────────────────────
  { group: "TK_QURAN", roleCode: "TKQ_ADMIN", name: "Admin TK Qur'an", email: "tkq.admin@demo.cipansor.or.id", password: P, description: "Administrator TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_KEPALA_SEKOLAH", name: "Hj. Wulan Sari, S.Pd.AUD", email: "tkq.kepala@demo.cipansor.or.id", password: P, description: "Kepala TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_WAKASEK", name: "Rina Marlina, S.Pd.", email: "tkq.wakasek@demo.cipansor.or.id", password: P, description: "Wakil Kepala TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_GURU", name: "Bunda Fitri Handayani, S.Pd.", email: "tkq.guru@demo.cipansor.or.id", password: P, description: "Guru TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_WALI_KELAS", name: "Bunda Neng Sartika, S.Pd.", email: "tkq.walikelas@demo.cipansor.or.id", password: P, description: "Wali Kelas TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_TATA_USAHA", name: "Dewi Puspitasari", email: "tkq.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_BENDAHARA", name: "Euis Komariah", email: "tkq.bendahara@demo.cipansor.or.id", password: P, description: "Bendahara TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_KOMITE", name: "H. Asep Saepuloh", email: "tkq.komite@demo.cipansor.or.id", password: P, description: "Komite TK Qur'an" },
  { group: "TK_QURAN", roleCode: "TKQ_ORANG_TUA", name: "Ibu Yeni Rahayu", email: "tkq.ortu@demo.cipansor.or.id", password: P, description: "Orang tua santri TK Qur'an" },

  // ── SD IT ───────────────────────────────────────────────────────────
  { group: "SD_IT", roleCode: "SDIT_ADMIN", name: "Admin SD IT", email: "sdit.admin@demo.cipansor.or.id", password: P, description: "Administrator SD IT" },
  { group: "SD_IT", roleCode: "SDIT_KEPALA_SEKOLAH", name: "H. Dadan Ali Ridwan, S.Ag", email: "sdit.kepala@demo.cipansor.or.id", password: P, description: "Kepala SD IT", photo: "/images/people/kepala-sdit.webp" },
  { group: "SD_IT", roleCode: "SDIT_WAKASEK", name: "Agus Setiawan, S.Pd.", email: "sdit.wakasek@demo.cipansor.or.id", password: P, description: "Wakil Kepala SD IT" },
  { group: "SD_IT", roleCode: "SDIT_GURU", name: "Ustadz Yusuf Maulana, S.Pd.", email: "sdit.guru@demo.cipansor.or.id", password: P, description: "Guru SD IT" },
  { group: "SD_IT", roleCode: "SDIT_WALI_KELAS", name: "Ustadzah Siti Nurjanah, S.Pd.", email: "sdit.walikelas@demo.cipansor.or.id", password: P, description: "Wali Kelas SD IT" },
  { group: "SD_IT", roleCode: "SDIT_TATA_USAHA", name: "Iwan Setiadi", email: "sdit.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha SD IT" },
  { group: "SD_IT", roleCode: "SDIT_BENDAHARA", name: "Nia Kurniasih", email: "sdit.bendahara@demo.cipansor.or.id", password: P, description: "Bendahara SD IT" },
  { group: "SD_IT", roleCode: "SDIT_KOMITE", name: "H. Deden Supriadi", email: "sdit.komite@demo.cipansor.or.id", password: P, description: "Komite SD IT" },
  { group: "SD_IT", roleCode: "SDIT_ORANG_TUA", name: "Bapak Hendra Gunawan", email: "sdit.ortu@demo.cipansor.or.id", password: P, description: "Orang tua santri SD IT" },
  { group: "SD_IT", roleCode: "SDIT_SISWA", name: "Ananda Muhammad Fauzan", email: "sdit.siswa@demo.cipansor.or.id", password: P, description: "Santri SD IT" },

  // ── SMP IT ──────────────────────────────────────────────────────────
  { group: "SMP_IT", roleCode: "SMPIT_ADMIN", name: "Admin SMP IT", email: "smpit.admin@demo.cipansor.or.id", password: P, description: "Administrator SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_KEPALA_SEKOLAH", name: "H. Cecep Helmi Syawali, Lc., M.Ag", email: "smpit.kepala@demo.cipansor.or.id", password: P, description: "Kepala SMP IT", photo: "/images/people/kepala-smpit.webp" },
  { group: "SMP_IT", roleCode: "SMPIT_WAKASEK", name: "Dodi Hermawan, S.Pd.", email: "smpit.wakasek@demo.cipansor.or.id", password: P, description: "Wakil Kepala SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_GURU", name: "Ustadz Ahmad Musyaffa, S.Pd.", email: "smpit.guru@demo.cipansor.or.id", password: P, description: "Guru SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_WALI_KELAS", name: "Ustadzah Fatimah Zahra, S.Pd.", email: "smpit.walikelas@demo.cipansor.or.id", password: P, description: "Wali Kelas SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_GURU_BK", name: "Sri Wahyuni, S.Psi.", email: "smpit.bk@demo.cipansor.or.id", password: P, description: "Guru BK SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_TATA_USAHA", name: "Bambang Sutrisno", email: "smpit.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_BENDAHARA", name: "Ratna Sari", email: "smpit.bendahara@demo.cipansor.or.id", password: P, description: "Bendahara SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_KOMITE", name: "H. Tatang Suherman", email: "smpit.komite@demo.cipansor.or.id", password: P, description: "Komite SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_ORANG_TUA", name: "Bapak Slamet Riyadi", email: "smpit.ortu@demo.cipansor.or.id", password: P, description: "Orang tua santri SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_SISWA", name: "Ananda Rayhan Al-Ghifari", email: "smpit.siswa@demo.cipansor.or.id", password: P, description: "Santri SMP IT" },
  { group: "SMP_IT", roleCode: "SMPIT_ALUMNI", name: "Fikri Haikal", email: "smpit.alumni@demo.cipansor.or.id", password: P, description: "Alumni SMP IT" },

  // ── SMA Qur'an ──────────────────────────────────────────────────────
  { group: "SMA_QURAN", roleCode: "SMAQ_ADMIN", name: "Admin SMA Qur'an", email: "smaq.admin@demo.cipansor.or.id", password: P, description: "Administrator SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_KEPALA_SEKOLAH", name: "H.M. Rizkon Hakiki, Lc., Al-Hafidz", email: "smaq.kepala@demo.cipansor.or.id", password: P, description: "Kepala SMA Qur'an", photo: "/images/people/kepala-smaquran.webp" },
  { group: "SMA_QURAN", roleCode: "SMAQ_WAKASEK", name: "Taufik Hidayat, S.Pd.", email: "smaq.wakasek@demo.cipansor.or.id", password: P, description: "Wakil Kepala SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_GURU", name: "Ustadz Malik Ibrahim, Lc.", email: "smaq.guru@demo.cipansor.or.id", password: P, description: "Guru SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_WALI_KELAS", name: "Ustadzah Halimah Sa'diyah, S.Pd.", email: "smaq.walikelas@demo.cipansor.or.id", password: P, description: "Wali Kelas SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_GURU_BK", name: "Anisa Rahmawati, S.Psi.", email: "smaq.bk@demo.cipansor.or.id", password: P, description: "Guru BK SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_TATA_USAHA", name: "Hendi Kurnia", email: "smaq.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_BENDAHARA", name: "Wati Nurhayati", email: "smaq.bendahara@demo.cipansor.or.id", password: P, description: "Bendahara SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_KOMITE", name: "H. Endang Rustandi", email: "smaq.komite@demo.cipansor.or.id", password: P, description: "Komite SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_ORANG_TUA", name: "Bapak Agus Salim", email: "smaq.ortu@demo.cipansor.or.id", password: P, description: "Orang tua santri SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_SISWA", name: "Ananda Zaidan Abdullah", email: "smaq.siswa@demo.cipansor.or.id", password: P, description: "Santri SMA Qur'an" },
  { group: "SMA_QURAN", roleCode: "SMAQ_ALUMNI", name: "Arya Satria", email: "smaq.alumni@demo.cipansor.or.id", password: P, description: "Alumni SMA Qur'an" },

  // ── Perguruan Tinggi ────────────────────────────────────────────────
  { group: "PERGURUAN_TINGGI", roleCode: "PT_REKTOR", name: "Prof. Dr. K.H. Abdul Somad, M.A.", email: "pt.rektor@demo.cipansor.or.id", password: P, description: "Rektor Perguruan Tinggi" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_WAKIL_REKTOR", name: "Dr. Hasan Basri, M.A.", email: "pt.wakilrektor@demo.cipansor.or.id", password: P, description: "Wakil Rektor" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_DEKAN", name: "Dr. Zainal Abidin, M.Ag.", email: "pt.dekan@demo.cipansor.or.id", password: P, description: "Dekan Fakultas" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_KAPRODI", name: "Dr. Umar Faruq, M.Pd.", email: "pt.kaprodi@demo.cipansor.or.id", password: P, description: "Ketua Program Studi" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_DOSEN", name: "Dr. Ibrahim Adham, Lc.", email: "pt.dosen@demo.cipansor.or.id", password: P, description: "Dosen" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_MAHASISWA", name: "Ananda Bilal Musthofa", email: "pt.mahasiswa@demo.cipansor.or.id", password: P, description: "Mahasiswa" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_STAF_AKADEMIK", name: "Nurul Hidayah, S.Kom.", email: "pt.staf@demo.cipansor.or.id", password: P, description: "Staf Akademik" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_TATA_USAHA", name: "Firmansyah", email: "pt.tu@demo.cipansor.or.id", password: P, description: "Tata Usaha Perguruan Tinggi" },
  { group: "PERGURUAN_TINGGI", roleCode: "PT_ALUMNI", name: "Zulfikar Ali", email: "pt.alumni@demo.cipansor.or.id", password: P, description: "Alumni Perguruan Tinggi" },

  // ── Sarana & Unit Usaha ─────────────────────────────────────────────
  { group: "SARANA_USAHA", roleCode: "PUSTAKAWAN", name: "Lestari Ningsih, S.IP.", email: "sarana.pustakawan@demo.cipansor.or.id", password: P, description: "Pustakawan / perpustakaan" },
  { group: "SARANA_USAHA", roleCode: "PERAWAT", name: "Ns. Dian Anggraini, S.Kep.", email: "sarana.perawat@demo.cipansor.or.id", password: P, description: "Perawat UKS & klinik" },
  { group: "SARANA_USAHA", roleCode: "KEAMANAN", name: "Sukirman", email: "sarana.keamanan@demo.cipansor.or.id", password: P, description: "Petugas keamanan" },
  { group: "SARANA_USAHA", roleCode: "LABORAN", name: "Eka Prasetyo, S.Si.", email: "sarana.laboran@demo.cipansor.or.id", password: P, description: "Laboran & praktikum" },
  { group: "SARANA_USAHA", roleCode: "BUSINESS_MANAGER", name: "H. Rahmat Hidayat, S.E.", email: "usaha.manager@demo.cipansor.or.id", password: P, description: "Manajer unit usaha" },
  { group: "SARANA_USAHA", roleCode: "BUSINESS_STAFF", name: "Yudi Setiawan", email: "usaha.staff@demo.cipansor.or.id", password: P, description: "Staf unit usaha" },
];
