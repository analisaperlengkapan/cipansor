# [Feature Request] Pengembangan & Integrasi Modul Manajemen Operasional

## Latar Belakang
Sistem Informasi Manajemen Pesantren (Cipansor) saat ini memiliki beberapa modul operasional yang terpisah (Procurement, Facilities, Reception, Inventory). Diperlukan upaya untuk mengintegrasikan modul-modul ini menjadi satu kesatuan "Manajemen Operasional" yang kohesif, serta melengkapi fitur-fitur kritikal yang belum tersedia di sisi frontend.

## Tujuan
1.  **Integrasi:** Menyatukan akses dan monitoring operasional (Pengadaan, Sarpras, Tamu) dalam satu dashboard.
2.  **Kelengkapan Fitur:** Menyediakan antarmuka untuk pelaporan kerusakan (Maintenance) dan alur persetujuan pengadaan yang lengkap.
3.  **Efisiensi:** Mempercepat proses konversi dari "Permintaan Barang" (PR) menjadi "Aset" di inventaris.

## Ruang Lingkup Pekerjaan

### 1. Manajemen Fasilitas (Facilities) & Pemeliharaan (Maintenance)
Saat ini modul Fasilitas hanya menangani data master (Tanah, Gedung, Ruang). Belum ada fitur untuk melaporkan kerusakan atau memantau perbaikan.
*   **Backend:** Logic `createMaintenanceRequest` sudah tersedia di `InventoryService`.
*   **Frontend (Priority):**
    *   Menambahkan Tab "Maintenance" di halaman `Facilities`.
    *   Membuat Dialog "Lapor Kerusakan" (Maintenance Request) yang terhubung ke API Inventory.
    *   Menampilkan daftar riwayat pemeliharaan.

### 2. Manajemen Pengadaan (Procurement)
Backend sudah mendukung alur lengkap (Pending -> Approved -> Ordered -> Received -> Asset Creation).
*   **Frontend:**
    *   Memastikan halaman Detail Pengadaan mendukung aksi Approval/Rejection (untuk Admin).
    *   Memastikan aksi "Terima Barang" (Fulfillment) berfungsi dan memicu pembuatan Aset otomatis.

### 3. Resepsionis (Reception) & Front Office
Modul ini sudah ada namun perlu dipastikan stabilitasnya.
*   **Integrasi:** Menampilkan statistik tamu aktif di Dashboard Operasional.

### 4. Dashboard Operasional (New)
Membuat halaman khusus `/operations` sebagai pusat kontrol yang menampilkan ringkasan:
*   Jumlah Pengajuan Pembelian (Pending).
*   Jumlah Tiket Maintenance (Open/In Progress).
*   Jumlah Tamu Aktif saat ini.
*   Status Paket Santri (Pending).

## Spesifikasi Teknis
*   **Stack:** Next.js (App Router), Shadcn UI, React Query.
*   **API Hooks:**
    *   `useMaintenances`, `useCreateMaintenanceRequest` (Inventory).
    *   `useProcurement` (Procurement).
    *   `useReceptionStats` (Reception).

## Kriteria Keberhasilan (Acceptance Criteria)
1.  Admin dapat melihat daftar permintaan maintenance di halaman Fasilitas.
2.  User dapat membuat permintaan maintenance baru.
3.  Terdapat Dashboard Operasional yang merangkum metrik kunci dari ketiga modul tersebut.
4.  Navigasi menu diperbarui untuk menyertakan akses ke Dashboard Operasional.
