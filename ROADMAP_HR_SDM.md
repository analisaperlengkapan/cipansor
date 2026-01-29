# Roadmap Pengembangan Modul Manajemen Sumber Daya Manusia (HR/SDM)

Dokumen ini menjelaskan rencana pengembangan modul Manajemen Sumber Daya Manusia (HR/SDM) untuk sistem informasi Cipansor. Tujuannya adalah untuk menciptakan sistem HR yang komprehensif, terintegrasi, dan sesuai dengan standar pengelolaan SDM serta kepatuhan regulasi Indonesia.

## Visi
Mewujudkan pengelolaan SDM yang profesional, efisien, dan transparan untuk mendukung operasional Yayasan Pesantren Cipansor.

## Roadmap Tahapan Pengembangan

### Phase 1: Core HR Data & Compliance (Current Focus)
Fokus pada kelengkapan data karyawan dan kepatuhan terhadap regulasi pendataan di Indonesia (NIK, KK, BPJS, dll).
- [x] Struktur Data Dasar (Teacher, Staff, User).
- [ ] **Standardisasi Data Staff:** Menambahkan field biodata lengkap (NIK, Gender, Alamat, Domisili) pada entitas `Staff` agar setara dengan `Teacher`.
- [x] Manajemen Dokumen Pegawai (Upload KTP, Ijazah, Kontrak).
- [x] Riwayat Karir (Promosi, Mutasi).
- [x] Dashboard HR (Statistik Karyawan, Kontrak Habis).

### Phase 2: Time & Attendance (Manajemen Waktu)
Pengelolaan kehadiran yang fleksibel dan akurat.
- [x] Absensi Harian (Check-in/Check-out).
- [x] Manajemen Cuti (Pengajuan, Persetujuan, Kuota Tahunan).
- [ ] **Shift Management:** Pengaturan jadwal kerja shift untuk security/dapur.
- [ ] **Rekapitulasi Otomatis:** Perhitungan keterlambatan dan lembur otomatis untuk Payroll.

### Phase 3: Payroll & Compensation (Penggajian)
Sistem penggajian yang terintegrasi dengan Keuangan.
- [x] Master Komponen Gaji (Gaji Pokok, Tunjangan, Potongan).
- [x] Pengaturan Gaji per Karyawan.
- [x] Generate Slip Gaji (Payroll Period).
- [ ] **Automasi PPh 21:** Perhitungan pajak otomatis.
- [ ] **Integrasi Jurnal Keuangan:** Posting otomatis beban gaji ke modul Finance/Accounting.
- [ ] **THR & Bonus:** Perhitungan THR otomatis berdasarkan masa kerja.

### Phase 4: Performance Management (Kinerja)
Evaluasi kinerja berbasis kompetensi dan KPI.
- [x] Penilaian Kinerja Guru (PKG) - 4 Kompetensi Dasar.
- [ ] **KPI Staff:** Penilaian kinerja untuk tenaga kependidikan (non-guru).
- [ ] **Peer Review:** Penilaian sejawat (360 derajat).
- [ ] **Talent Management:** Identifikasi talenta untuk promosi.

### Phase 5: Employee Self-Service (ESS)
Portal mandiri untuk karyawan.
- [x] Cek Slip Gaji Mandiri.
- [x] Pengajuan Cuti Mandiri.
- [ ] **Update Biodata Mandiri:** Karyawan dapat mengajukan update data diri.
- [ ] **Klaim Reimbursement:** Pengajuan klaim pengobatan/perjalanan dinas.

---

## Detail Teknis: Phase 1 (Standardisasi Data Staff)
Saat ini terdapat ketimpangan struktur data antara `Teacher` (Lengkap) dan `Staff` (Basic).
**Tugas Pengembangan:**
1.  Update Schema Database (`Staff` Model) dengan menambahkan:
    - NIK, No KK, NPWP.
    - Gender, Tempat/Tanggal Lahir.
    - Agama, Kewarganegaraan.
    - Alamat Domisili (RT/RW, Desa, Kecamatan, Kabupaten, Provinsi).
2.  Update Backend Service (`hr/service.ts`) untuk menyimpan data tersebut saat Create/Update Staff.
3.  Pastikan Frontend Form (`NewEmployeePage`) yang sudah lengkap dapat menyimpan data ke backend dengan benar.
