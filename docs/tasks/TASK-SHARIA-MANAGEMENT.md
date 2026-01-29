# [Feature] Pengembangan Modul Manajemen Syariah (Sharia Management System)

## Ringkasan
Pengembangan modul khusus untuk menangani aspek manajemen syariah di Pesantren Cipansor, mencakup pengelolaan ZISWAF (Zakat, Infaq, Shodaqoh, Wakaf), distribusi dana (Tasaruf) kepada Asnaf, serta pelaporan keuangan standar ISAK 35.

## Latar Belakang
Saat ini, sistem telah memiliki modul:
- **Finance:** Pencatatan akuntansi umum (Jurnal, Buku Besar).
- **Donation:** Penerimaan dana (Fundraising) yang terintegrasi ke Jurnal sebagai Pendapatan/Aset.

Namun, terdapat kekosongan fungsional (Gap):
1. **Distribusi ZISWAF:** Belum ada fitur pencatatan penyaluran dana ke Mustahik (8 Asnaf).
2. **Manajemen Mustahik:** Belum ada database penerima manfaat.
3. **Kepatuhan ISAK 35:** Pelaporan masih berbasis standar umum (Laba/Rugi), belum memisahkan Dana Terikat (Zakat/Wakaf) dan Tidak Terikat secara eksplisit dalam format ISAK 35 (Laporan Perubahan Aset Kelolaan).
4. **Manajemen Wakaf:** Aset wakaf belum memiliki pencatatan spesifik terkait Nadzhir dan Akta Ikrar Wakaf (AIW).

## Ruang Lingkup (Scope)

### 1. Backend (API & Database)
*   **Schema & Models:**
    *   `Mustahik`: Database penerima manfaat (Individu/Lembaga).
    *   `ZiswafDistribution`: Transaksi penyaluran dana.
    *   `WaqfAsset` (Extension of Asset): Detail aset wakaf.
*   **Service Logic:**
    *   CRUD Mustahik (dengan kategori Asnaf).
    *   Distribusi Dana:
        *   Validasi saldo dana (e.g., Saldo Zakat).
        *   Auto-Journaling: Debit (Dana Zakat/Kewajiban) -> Credit (Kas/Bank).
    *   Reporting: Aggregation untuk ISAK 35.

### 2. Frontend (Web App)
*   **Route:** `/sharia` atau `/manajemen-syariah`.
*   **Dashboard:** Ringkasan Penghimpunan vs Penyaluran.
*   **Master Data:** Manajemen Mustahik.
*   **Transaksi:** Form Penyaluran Dana.
*   **Laporan:** View Laporan Posisi Keuangan Syariah & Perubahan Dana.

## Spesifikasi Teknis

### Database Schema (Draft)
```prisma
enum AsnafType {
  FAKIR
  MISKIN
  AMIL
  MUALAF
  RIQAB
  GHARIM
  FISABILILLAH
  IBNU_SABIL
  LAINNYA
}

model Mustahik {
  id          String   @id @default(uuid())
  unitId      String   @map("unit_id")
  name        String
  type        String   // INDIVIDU, LEMBAGA
  asnafType   AsnafType
  nik         String?
  address     String?
  phone       String?
  email       String?
  status      String   @default("ACTIVE")
  notes       String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  unit        Unit     @relation(fields: [unitId], references: [id])
  distributions ZiswafDistribution[]

  @@index([unitId])
  @@map("mustahiks")
}

model ZiswafDistribution {
  id          String   @id @default(uuid())
  unitId      String   @map("unit_id")
  mustahikId  String   @map("mustahik_id")
  programId   String?  @map("program_id") // Optional link to specific program
  amount      Decimal  @db.Decimal(15, 2)
  date        DateTime @default(now())
  fundSource  String   // ZAKAT, INFAK, WAKAF
  description String?  @db.Text

  // Accounting Link
  journalEntryId String? @map("journal_entry_id")

  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  unit        Unit     @relation(fields: [unitId], references: [id])
  mustahik    Mustahik @relation(fields: [mustahikId], references: [id])
  createdBy   User     @relation("DistributionCreator", fields: [createdById], references: [id])

  @@index([unitId])
  @@index([mustahikId])
  @@index([date])
  @@map("ziswaf_distributions")
}
```

## Rencana Pengerjaan (Roadmap)
1.  **Phase 1: Foundation**
    *   Setup Database Schema (Mustahik, Distribution).
    *   Setup Module Structure (Backend NestJS + Frontend Next.js).
2.  **Phase 2: Distribution Management**
    *   Fitur CRUD Mustahik.
    *   Fitur Transaksi Penyaluran.
    *   Integrasi Jurnal Otomatis.
3.  **Phase 3: Reporting**
    *   Dashboard Analytics.
    *   Laporan ISAK 35.

## Acceptance Criteria
- [ ] Tersedia menu Manajemen Syariah di Sidebar.
- [ ] Admin dapat menginput data Mustahik.
- [ ] Admin dapat mencatat penyaluran dana Zakat/Infak.
- [ ] Transaksi penyaluran otomatis memotong saldo di laporan keuangan.
- [ ] Laporan ISAK 35 dapat di-generate (PDF/View).
