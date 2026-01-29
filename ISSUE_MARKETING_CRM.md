# [TASK] Dev Modul Manajemen Pemasaran & CRM

**Status:** Open
**Priority:** High
**Labels:** `feature`, `backend`, `frontend`, `marketing`, `crm`

## 1. Deskripsi Task

Mengembangkan lebih lanjut modul **Marketing & PSB (Penerimaan Santri Baru)** yang sudah ada menjadi sistem **CRM (Customer Relationship Management)** yang komprehensif. Saat ini fitur dasar seperti Dashboard, Daftar Kampanye, dan Daftar Leads sudah tersedia, namun perlu ditingkatkan untuk mendukung operasional pemasaran yang lebih efektif, pengukuran ROI, dan manajemen pipeline calon santri.

## 2. Kondisi Saat Ini (Current State)

- **Dashboard:** Statistik dasar (sumber pendaftar, top kampanye) sudah ada.
- **Campaigns:** CRUD Kampanye dasar (Kode, Nama, Budget) tersedia. Tracking link (`/psb?ref=CODE`) sudah terintegrasi.
- **Leads:** Hanya berupa tabel daftar (List View) di `/marketing/leads`. Detail view ada tetapi terbatas.
- **Interactions:** Logging interaksi dasar sudah didukung di backend.

## 3. Rencana Pengembangan (Scope of Work)

### A. Backend Development (`apps/api`)

#### 1. Expense Tracking (ROI Calculation)

Menambahkan fitur pelacakan pengeluaran riil kampanye untuk menghitung _Cost Per Lead (CPL)_ dan _Cost Per Acquisition (CPA)_ secara akurat.

- **Schema Update:** Buat model `MarketingExpense` yang berelasi dengan `MarketingCampaign`.
  ```prisma
  model MarketingExpense {
    id          String   @id @default(uuid())
    campaignId  String
    amount      Decimal
    date        DateTime
    category    String   // ADS, PRINTING, EVENT, AGENCY, ETC
    description String?
    // ... relations
  }
  ```
- **API Endpoint:** CRUD untuk expenses.
- **Analytics Update:** Update endpoint `getDashboardStats` untuk menghitung ROI berdasarkan total expense vs jumlah leads/students.

#### 2. Geo-Analytics Helper

- Tambahkan endpoint/service untuk mengelompokkan leads berdasarkan `city` atau `province` untuk visualisasi peta sebaran pendaftar.

#### 3. WhatsApp Integration Support

- Siapkan helper/service untuk generate link WhatsApp (`wa.me`) dinamis dengan template pesan (greeting) yang bisa dikonfigurasi per kampanye.

---

### B. Frontend Development (`apps/web`)

#### 1. Leads Kanban Board (`/marketing/leads`)

Mengubah atau menambah opsi tampilan dari "List View" menjadi "Kanban Board" untuk memvisualisasikan pipeline pendaftaran.

- **Columns:** Registered -> Document Check -> Test Scheduled -> Accepted -> Enrolled.
- **Interaction:** Drag-and-drop untuk update status (jika flow bisnis mengizinkan) atau visualisasi status perpindahan.
- **Tech:** Gunakan `@dnd-kit/core` atau library sejenis.

#### 2. Enhanced Campaign Management (`/marketing/campaigns/[id]`)

- **Expense Tab:** Tab baru di detail kampanye untuk input pengeluaran realisasi (Ads spend harian, biaya cetak brosur, dll).
- **Media Gallery:** Fitur upload materi promosi (banner, brosur) agar tim marketing memiliki akses aset yang sama.
- **QR Code Generator:** Generate QR Code otomatis untuk link tracking kampanye.

#### 3. Enhanced Lead Detail (`/marketing/leads/[id]`)

- **Activity Timeline:** Tampilan kronologis (timeline) dari semua interaksi:
  - Tanggal daftar.
  - Log telepon/WA.
  - Perubahan status pendaftaran.
  - Catatan staf.
- **Quick Actions:** Tombol "Chat WA" (membuka WhatsApp Web dengan template), "Jadwalkan Follow-up".

#### 4. Geographic Map (`/marketing/analytics`)

- Visualisasi peta Indonesia (menggunakan library charting seperti Highcharts Maps atau Leaflet) yang menunjukkan densitas asal pendaftar.

## 4. Referensi & Best Practices

- **HubSpot CRM:** Referensi untuk tampilan Timeline aktivitas dan Kanban board.
- **Salesforce:** Konsep "Campaign Members" dan kalkulasi ROI.
- **Integrasi PSB:** Pastikan kode referensi (`ref` atau `campaign_code`) terus terbawa hingga siswa diterima untuk atribusi keberhasilan kampanye yang akurat.

## 5. Acceptance Criteria (DoD)

1. User dapat melihat pipeline leads dalam bentuk Kanban Board.
2. User dapat menginput pengeluaran (expense) per kampanye.
3. Dashboard menampilkan metrik **Cost Per Lead (CPL)** aktual.
4. Detail Lead menampilkan histori interaksi yang lengkap dan kronologis.
5. Tombol "Click to Chat" WhatsApp berfungsi dengan template pesan yang dinamis.
6. Semua fitur terintegrasi end-to-end tanpa error type/build.
