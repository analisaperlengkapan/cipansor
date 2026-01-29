# Task: Dev Modul Manajemen Organisasi

**Status**: In Progress
**Assignee**: Jules
**Priority**: High

## Deskripsi Task
Mengembangkan modul Manajemen Organisasi untuk mengelola struktur organisasi, departemen, dan jabatan secara hierarkis. Modul ini bertujuan untuk memberikan visualisasi yang jelas mengenai struktur organisasi dan memudahkan pengelolaan SDM.

## Scope of Work

### 1. Database Schema
- **Update `Department` Model**:
  - Menambahkan field `parentId` (Self-relation) untuk mendukung struktur hierarki departemen (Sub-departemen).
- **Create `Position` Model**:
  - Membuat tabel `positions` untuk menyimpan data jabatan.
  - Fields: `id`, `unitId`, `departmentId`, `name`, `code`, `level`, `parentId`, `description`, `isActive`.
  - Relations: Self-relation (`parent`), `unit`, `department`.

### 2. Backend (API)
- **Module**: `organization`
- **Endpoints**:
  - `GET /organization/departments/tree`: Mengambil struktur departemen dalam bentuk tree.
  - `GET /organization/positions/tree`: Mengambil struktur jabatan dalam bentuk tree.
  - CRUD standard untuk `Department` dan `Position`.
- **Services**:
  - Implementasi logika rekursif untuk membangun tree structure.
  - Validasi agar tidak terjadi circular dependency pada hierarchy.

### 3. Frontend (Web)
- **Menu**: Menambahkan grup menu "Organization" di sidebar (untuk Admin/Yayasan).
- **Pages**:
  - `/organization/departments`: Manajemen Departemen (List & Tree View).
  - `/organization/positions`: Manajemen Jabatan (List & Tree View).
  - `/organization/structure`: Visualisasi Bagan Organisasi (Org Chart).
- **Components**:
  - `OrgTree`: Komponen reusable untuk menampilkan hierarki.
  - `OrgChart`: Visualisasi grafis menggunakan CSS/SVG atau library ringan.

## Standar & Best Practices
- Menggunakan pola rekursif pada backend untuk pengambilan data hierarki (atau CTE jika memungkinkan dengan Prisma, namun recursive function di service layer lebih portable).
- Validasi input yang ketat.
- UI yang responsif dan user-friendly.
- Type safety end-to-end.

## Referensi
- Struktur organisasi umum: Yayasan -> Unit -> Departemen -> Sub-dept.
- Struktur jabatan: Ketua -> Kepala Bagian -> Staff.
