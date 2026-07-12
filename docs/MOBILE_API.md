# Kontrak API Aplikasi Mobile (Android) — Portal Orang Tua

Fondasi backend untuk aplikasi Android Cipansor (visi PR #298). Semua endpoint
sudah tersedia dan teruji di API; aplikasi Flutter tinggal mengonsumsinya.

Base URL: `https://<host>/api` — autentikasi Bearer JWT (login → access +
refresh token). Semua respons berbentuk `{ success, data, ... }`.

## 1. Autentikasi

| Endpoint | Keterangan |
|---|---|
| `POST /auth/login` `{email, password}` | Orang tua login. Admin ber-2FA mendapat `requiresTwoFactor + tempToken`. |
| `POST /auth/refresh` `{refreshToken}` | Perpanjang sesi. |
| `PUT /notifications/fcm-token` `{token}` | Daftarkan token push FCM perangkat (kirim `{token: null}` saat logout). |

## 2. Capaian anak (role PARENT)

| Endpoint | Keterangan |
|---|---|
| `GET /parent/children` | Daftar anak. |
| `GET /parent/children/:studentId/weekly-progress` | Ringkasan mingguan: kehadiran, tahfidz (ziyadah/murojaah/nilai), perilaku, akademik. |
| `GET /parent/children/:studentId/tahfidz` / `attendance` / `grades` | Detail per domain. |

## 3. Tagihan & pembayaran SPP

| Endpoint | Keterangan |
|---|---|
| `GET /parent/children/:studentId/finance` | Tagihan + ringkasan pembayaran anak. |
| `POST /finance/invoices/:id/payment-proof` | **Upload bukti transfer** — body `{amount, method, referenceNo?, proofUrl, notes?}`. Membuat Payment `PENDING_VERIFICATION`; kepemilikan diverifikasi (orang tua hanya bisa membayar tagihan anaknya). Unggah berkas gambarnya sendiri via `POST /upload` lalu pakai URL-nya sebagai `proofUrl`. |

### Alur verifikasi (maker-checker Tata Usaha)

```
PENDING_VERIFICATION → (TU unit memverifikasi) → TU_APPROVED
TU_APPROVED → (admin unit — orang berbeda — mengesahkan) → FINAL_APPROVED
PENDING/TU_APPROVED → REJECTED (dengan alasan)
```

- Tagihan & jurnal akuntansi hanya ter-update saat `FINAL_APPROVED`
  (idempotent — tidak mungkin terposting dua kali).
- Saat `FINAL_APPROVED`, orang tua & santri menerima notifikasi
  **"Pembayaran SPP Berhasil"** (in-app + email + WhatsApp bila provider
  dikonfigurasi). Saat `REJECTED`, notifikasi berisi alasan penolakan.
- Halaman TU web: `/finance/verification`.

## 4. Notifikasi

| Endpoint | Keterangan |
|---|---|
| `GET /parent/notifications` | Daftar notifikasi + unread count. |
| `PUT /parent/notifications/:id/read` | Tandai dibaca. |

**Pengingat bulanan otomatis**: setiap tanggal 1 pukul 06:00 scheduler
mengirim pengingat tagihan SPP bulan berjalan ke SEMUA orang tua
(in-app + WhatsApp Business API via template `payment_reminder`).

## 5. Konfigurasi server (env)

| Variabel | Fungsi |
|---|---|
| `WA_PROVIDER` = `META` \| `FONNTE` \| `WABLAS` \| `SIMULATOR` | Provider WhatsApp (default SIMULATOR = log saja). |
| `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID` | Kredensial Meta Cloud API. |

## Status implementasi mobile

Backend + web selesai dan teruji. Aplikasi Flutter-nya sendiri **belum
dibangun di repo ini** — skeleton di PR #298 (login, dashboard, daftar
tagihan) bisa dijadikan titik awal, tetapi butuh proyek Firebase (FCM),
signing, dan CI mobile tersendiri. Pengiriman push FCM server-side
menunggu kredensial `google-services`/service-account; token perangkat
sudah bisa didaftarkan sejak sekarang sehingga tidak ada perubahan API
saat sender diaktifkan.
