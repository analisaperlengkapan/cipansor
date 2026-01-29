# Task: Dev Modul Manajemen Ujian

**Status**: In Progress
**Assignee**: Jules

## Deskripsi
Mengembangkan lebih lanjut modul Manajemen Ujian (Assessment) untuk memenuhi kebutuhan operasional sekolah/pesantren, khususnya terkait visualisasi jadwal, pencetakan dokumen ujian, dan administrasi.

## Scope of Work

### 1. Exam Calendar (Kalender Ujian)
- **Problem**: Saat ini ujian hanya ditampilkan dalam bentuk list/tabel, menyulitkan untuk melihat potensi bentrok jadwal.
- **Solution**: Implementasi tampilan Kalender (Month View) yang menampilkan jadwal ujian.
- **Features**:
  - Grid view per bulan.
  - Filter berdasarkan Kelas.
  - Navigasi bulan.
  - Badge warna berdasarkan tipe ujian.

### 2. Exam Cards (Kartu Peserta Ujian)
- **Problem**: Tidak ada fitur untuk mencetak Kartu Peserta Ujian yang dibutuhkan santri untuk mengikuti ujian.
- **Solution**: Halaman khusus untuk generate dan cetak kartu ujian per kelas.
- **Features**:
  - Filter Kelas dan Semester.
  - Preview kartu ujian.
  - Generate PDF (Download/Print).
  - Format kartu mencakup: Foto (placeholder), Nama, NIS, Kelas, Jadwal (opsional), QR Code (opsional).

### 3. Exam Minutes (Berita Acara Ujian)
- **Problem**: Pengawas ujian membutuhkan dokumen fisik (Berita Acara) untuk mencatat kehadiran dan kejadian selama ujian.
- **Solution**: Halaman cetak Berita Acara per ujian.
- **Features**:
  - Header Ujian (Mapel, Kelas, Waktu, Pengampu).
  - Daftar Hadir Siswa (Checklist).
  - Kolom Catatan Kejadian.
  - Kolom Tanda Tangan Pengawas dan Saksi.

## Technical Plan

### Frontend
- **Calendar**: Custom grid using `date-fns` tailored for Exam objects.
- **PDF Generation**: Client-side generation using `html2canvas` and `jspdf` for maximum compatibility without heavy backend PDF rendering services.
- **Routing**:
  - `/assessment`: Add Calendar Tab.
  - `/assessment/exam-cards`: New page for card generation.
  - `/assessment/[id]/proctoring`: New page for Berita Acara.

### Backend
- Menggunakan endpoint `assessment` yang sudah ada.
- `getExams` support date range filtering (already implemented).
- `getReportCards` or `ClassEnrollment` used for fetching students for cards.

## Checklist
- [ ] Create `ExamCalendar` component.
- [ ] Integrate Calendar into `AssessmentPage`.
- [ ] Create `ExamCardsPage`.
- [ ] Create `ProctoringPage` (Berita Acara).
- [ ] Verify Build.
