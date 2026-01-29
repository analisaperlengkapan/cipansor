# Task: Dev Modul Manajemen Inovasi

**Status:** Planned
**Priority:** High
**Assignee:** Unassigned

## Deskripsi Task

Mengembangkan modul "Manajemen Inovasi" untuk sistem informasi manajemen pesantren (Cipansor). Modul ini bertujuan untuk memfasilitasi pengumpulan, evaluasi, dan pelaksanaan ide-ide inovasi dari seluruh civitas akademika (Guru, Staff, Santri).

## Lingkup Pekerjaan (Scope)

1.  **Analisis & Desain (Completed in this document)**
    - Desain Skema Database.
    - Desain API Backend.
    - Desain UI/UX Frontend.
2.  **Backend Development (NestJS)**
    - Implementasi Prisma Schema.
    - Pembuatan Module, Service, Controller.
    - Implementasi Workflow Status Inovasi.
3.  **Frontend Development (Next.js)**
    - Halaman Dashboard Inovasi.
    - Form Pengajuan Inovasi.
    - Halaman Detail & Diskusi Inovasi.
    - Integrasi Navigasi.
4.  **Integration & Testing**
    - End-to-End Testing (Frontend ke Backend).
    - Role-based Access Control (RBAC) check.

---

## 1. Desain Database (Prisma Schema)

Modul ini membutuhkan tabel-tabel baru di `schema.prisma`.

```prisma
// Status Workflow Inovasi
enum InnovationStatus {
  DRAFT       // Konsep, hanya terlihat oleh pembuat
  SUBMITTED   // Diajukan, menunggu review
  UNDER_REVIEW // Sedang direview oleh manajemen
  APPROVED    // Disetujui untuk dilaksanakan
  REJECTED    // Ditolak
  IN_PROGRESS // Sedang dilaksanakan
  COMPLETED   // Selesai dilaksanakan
  CANCELLED   // Dibatalkan
}

// Model Utama
model Innovation {
  id          String   @id @default(uuid())
  unitId      String   @map("unit_id")
  userId      String   @map("user_id") // Pembuat Inovasi

  title       String
  description String   @db.Text
  benefits    String?  @db.Text // Manfaat yang diharapkan
  costEstimate Decimal? @map("cost_estimate") @db.Decimal(15, 2)

  status      InnovationStatus @default(DRAFT)

  // Metadata
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  unit        Unit     @relation(fields: [unitId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  comments    InnovationComment[]
  attachments InnovationAttachment[]
  reviews     InnovationReview[]

  @@index([unitId])
  @@index([userId])
  @@index([status])
  @@map("innovations")
}

// Lampiran (Dokumen/Gambar)
model InnovationAttachment {
  id           String   @id @default(uuid())
  innovationId String   @map("innovation_id")
  fileName     String   @map("file_name")
  fileUrl      String   @map("file_url")
  fileType     String   @map("file_type")
  createdAt    DateTime @default(now()) @map("created_at")

  innovation   Innovation @relation(fields: [innovationId], references: [id], onDelete: Cascade)

  @@index([innovationId])
  @@map("innovation_attachments")
}

// Diskusi / Komentar
model InnovationComment {
  id           String   @id @default(uuid())
  innovationId String   @map("innovation_id")
  userId       String   @map("user_id")
  content      String   @db.Text
  createdAt    DateTime @default(now()) @map("created_at")

  innovation   Innovation @relation(fields: [innovationId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id])

  @@index([innovationId])
  @@map("innovation_comments")
}

// Review / Penilaian oleh Manajemen
model InnovationReview {
  id           String   @id @default(uuid())
  innovationId String   @map("innovation_id")
  reviewerId   String   @map("reviewer_id")
  score        Int?     // Skala 1-5 atau 1-100
  notes        String?  @db.Text
  decision     String?  // APPROVED / REJECTED / REVISION
  createdAt    DateTime @default(now()) @map("created_at")

  innovation   Innovation @relation(fields: [innovationId], references: [id], onDelete: Cascade)
  reviewer     User       @relation(fields: [reviewerId], references: [id])

  @@index([innovationId])
  @@map("innovation_reviews")
}
```

---

## 2. Backend Architecture (NestJS)

Lokasi: `apps/api/src/modules/innovation`

### Endpoints (Controller)

- `POST /innovation` : Membuat draft inovasi baru.
- `GET /innovation` : List inovasi (filter by unit, status, user).
- `GET /innovation/:id` : Detail inovasi + comments + attachments.
- `PATCH /innovation/:id` : Update inovasi (jika status DRAFT/REVISION).
- `PATCH /innovation/:id/status` : Update status (untuk Approval/Rejection).
- `POST /innovation/:id/comments` : Menambah komentar.
- `POST /innovation/:id/attachments` : Upload lampiran.

### Service Logic

- **Access Control:** Pastikan user hanya bisa melihat inovasi unit mereka (kecuali Super Admin).
- **Validation:** Gunakan Zod/DTO untuk validasi input.
- **Notification:** (Opsional) Kirim notifikasi saat status berubah.

---

## 3. Frontend Architecture (Next.js)

Lokasi: `apps/web/src/app/innovation`

### Struktur Halaman

1.  `page.tsx`: **Innovation Dashboard & List**
    - Statistik ringkas (Total Ide, Approved, In Progress).
    - Tabel/Card list inovasi dengan filter dan pagination.
2.  `create/page.tsx`: **Form Pengajuan**
    - Input Title, Description, Benefits, Cost.
    - File Upload Component.
3.  `[id]/page.tsx`: **Detail View**
    - Menampilkan detail lengkap.
    - Timeline status.
    - Section Komentar (Discussion).
    - Tombol Action (Approve/Reject) untuk Role Admin/Yayasan.

### Komponen UI (Shadcn/UI)

- `InnovationCard`: Untuk tampilan grid.
- `StatusBadge`: Helper component untuk warna status.
- `CommentSection`: Reusable comment list & input.

### Integrasi Navigasi

Update `apps/web/src/config/navigation.ts` untuk menambahkan menu "Manajemen Inovasi" (Icon: `Lightbulb`).

---

## 4. Rencana Implementasi (Step-by-Step)

1.  **Database Migration:**
    - Update `apps/api/prisma/schema.prisma`.
    - Jalankan `npx prisma migrate dev --name add_innovation_module`.
2.  **Backend Setup:**
    - Generate module: `nest g module modules/innovation`.
    - Generate service & controller.
    - Implementasi CRUD dasar.
3.  **Frontend Setup:**
    - Buat folder route `apps/web/src/app/innovation`.
    - Buat halaman list dummy untuk tes routing.
    - Update sidebar navigation.
4.  **Feature: Submission (Create):**
    - Implementasi API `create`.
    - Implementasi Form Frontend + Validasi (Zod).
5.  **Feature: Approval Workflow:**
    - Implementasi API `updateStatus`.
    - Implementasi UI tombol Approve/Reject di detail page (Conditional rendering by Role).
6.  **Feature: Discussion:**
    - Implementasi API Comments.
    - Implementasi UI Komentar.
7.  **Finalisasi:**
    - Testing End-to-End.
    - Perbaikan UI/UX (Loading states, Error handling).
