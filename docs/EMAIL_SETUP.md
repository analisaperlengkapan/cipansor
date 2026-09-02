# Email keluar — setup Gmail API

Bagaimana sistem Cipansor mengirim email, dan langkah persisnya untuk
mengaktifkannya lewat Gmail API tanpa sandi aplikasi.

Ringkasnya:

- **Pengirim** (`From`) — `noreply@cipansor.or.id`. Kotak surat otomatis, tidak
  dibaca manusia.
- **Tujuan balasan** (`Reply-To`) — `halo@cipansor.or.id`. Ke sinilah balasan
  wali santri sampai, baik yang tidak sengaja menekan "Balas" maupun yang
  memang ingin bertanya.

Kedua alamat dipisah di setiap template dan disetel di satu tempat
(`config.mail`), bukan ditulis ulang per-template.

---

## Kenapa Gmail API, bukan sandi aplikasi

| | Sandi aplikasi (SMTP) | Service account (Gmail API) |
|---|---|---|
| Bentuk kredensial | 16 karakter, setara password | Kunci RSA |
| Cakupan akses | **Seluruh** kotak surat akun itu | Hanya `gmail.send` |
| Bisa baca inbox? | Ya | **Tidak** |
| Bisa dipakai login? | Pada beberapa alur, ya | Tidak |
| Mensyaratkan 2FA di akun pengirim | Ya | Tidak |
| Dicabut dari mana | Ganti sandi akun | Admin console, per-scope |
| Kalau bocor | Penyerang memegang kotak surat | Penyerang hanya bisa mengirim, dan bisa dicabut |

Karena itu urutan pemilihan transport di `email-transport.ts` adalah **Gmail API
→ SMTP → log-only**. SMTP tetap ada sebagai cadangan, tapi bukan pilihan utama.

---

## Apakah gratis?

**Ya, untuk pemakaian yayasan ini.**

- **Gmail API sendiri tidak dipungut biaya.** Tidak ada tarif per-panggilan.
  Yang berlaku adalah *kuota*, bukan tagihan.
- **Google Cloud project** yang menampung service account juga gratis selama
  Anda hanya mengaktifkan Gmail API. Kartu kredit **tidak** diperlukan untuk
  mengaktifkan Gmail API (berbeda dengan sebagian layanan Cloud lain).
- **Kuota yang berlaku** (Google Workspace, per akun pengirim, per 24 jam):
  - **2.000 penerima/hari** untuk akun Workspace berbayar/nonprofit.
  - Kuota Gmail API dihitung dalam *quota units*; `messages.send` memakai 100
    unit, dengan batas 1.200.000 unit/menit per project — jauh di atas
    kebutuhan sistem ini.
- **Skala Cipansor hari ini:** 107 akun dan 14 santri. Bahkan bila setiap
  setoran tahfidz, setiap pembayaran, dan satu pengumuman ke semua orang
  dikirim dalam sehari, jumlahnya ratusan — bukan ribuan. Kuota 2.000/hari
  tidak akan tersentuh.

Yang perlu diawasi bukan biaya, melainkan **batas 2.000 penerima/hari** kalau
suatu saat daftar wali santri tumbuh besar dan ada pengumuman massal harian.

---

## Langkah-langkah di Google Console

Anda perlu dua peran: **Google Cloud Console** (membuat service account) dan
**Google Admin console** (mengizinkan service account itu bertindak sebagai
`noreply@`). Keduanya dipegang admin Workspace yayasan.

### 1. Buat atau pilih project — Google Cloud Console

1. Buka <https://console.cloud.google.com/>.
2. Klik pemilih project di kiri atas → **New Project**.
3. Nama: `cipansor-mailer` (bebas). Organisasi: pilih `cipansor.or.id` bila
   muncul. → **Create**.
4. Pastikan project ini yang aktif di pemilih project sebelum lanjut.

### 2. Aktifkan Gmail API

1. Menu → **APIs & Services** → **Library**.
2. Cari **Gmail API** → **Enable**.
3. Tidak perlu mengisi tagihan. Tidak perlu mengisi OAuth consent screen —
   layar itu untuk aplikasi yang meminta izin ke pengguna, sedangkan service
   account tidak melalui layar persetujuan.

### 3. Buat service account

1. Menu → **APIs & Services** → **Credentials**.
2. **+ Create credentials** → **Service account**.
3. Isi:
   - *Service account name*: `cipansor-mailer`
   - *Service account ID*: terisi otomatis, mis.
     `cipansor-mailer@cipansor-mailer.iam.gserviceaccount.com`
4. **Create and continue** → langkah "Grant this service account access to
   project" **dilewati saja** (Continue) — tidak ada peran IAM yang dibutuhkan.
   Izin yang dipakai datang dari Workspace, bukan dari IAM.
5. **Done**.

### Jangan tertukar: tiga identitas yang berbeda

Baca ini sebelum mengambil kuncinya — inilah dua hal yang paling sering
tertukar.

| Yang Anda isi | Isinya apa | Contoh | Dari mana |
|---|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Alamat **robot**, dibuat otomatis oleh Google. Selalu berakhiran `.iam.gserviceaccount.com` dan **tidak bisa** dibuat beralamat `@cipansor.or.id`. | `cipansor-mailer@cipansor-mailer.iam.gserviceaccount.com` | Field `client_email` di file kunci JSON |
| `GMAIL_SENDER` | Kotak surat **manusia** yang ditiru robot itu. Inilah yang muncul sebagai pengirim. | `noreply@cipansor.or.id` | Alamat Workspace Anda sendiri |
| Client ID (Unique ID) | Angka panjang, dipakai **hanya** di Admin console untuk domain-wide delegation | `114857392017465829301` | Field `client_id` di file kunci JSON |

Robot itu tidak punya kotak surat sendiri. Yang membuatnya boleh mengirim
*sebagai* `noreply@cipansor.or.id` adalah izin delegasi di langkah 6 — itulah
sebabnya kedua alamat ini berbeda dan keduanya diperlukan.

### Private key ≠ client secret

`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` **bukan** client secret.

- **Client secret** (`GOCSPX-…`, satu baris pendek) berasal dari
  *APIs & Services → Credentials → **OAuth 2.0 Client IDs***. Itu jenis
  kredensial yang berbeda, dipakai untuk alur SMTP OAuth2 cadangan, dan **tidak
  bisa** melakukan domain-wide delegation.
- **Private key** berasal dari *APIs & Services → Credentials → **Service
  Accounts*** → buka akunnya → tab **Keys** → *Add key* → *Create new key* →
  **JSON**. Yang terunduh adalah berkas seperti ini:

  ```json
  {
    "type": "service_account",
    "project_id": "cipansor-mailer",
    "private_key_id": "abc123…",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg…\n-----END PRIVATE KEY-----\n",
    "client_email": "cipansor-mailer@cipansor-mailer.iam.gserviceaccount.com",
    "client_id": "114857392017465829301",
    "token_uri": "https://oauth2.googleapis.com/token"
  }
  ```

**Kalau Anda tidak punya berkas yang memuat `-----BEGIN PRIVATE KEY-----`,
berarti yang dibuat adalah OAuth 2.0 Client ID, bukan service account.** Ulangi
dari langkah 3. Di halaman *Credentials* ada tiga bagian terpisah — *API Keys*,
*OAuth 2.0 Client IDs*, dan *Service Accounts* — dan yang dipakai di sini adalah
bagian ketiga.

### 4. Ambil kunci JSON

1. Di daftar **Service Accounts**, klik akun yang baru dibuat.
2. Tab **Keys** → **Add key** → **Create new key** → pilih **JSON** → **Create**.
3. Berkas `.json` terunduh. **Ini satu-satunya salinan** — Google tidak
   menyimpannya. Simpan di tempat aman, jangan pernah masuk ke repositori.

Dari berkas itu Anda butuh tiga nilai: `client_email`, `private_key`, dan
`client_id`.

### 5. Catat Client ID (Unique ID) service account

1. Masih di halaman service account, tab **Details**.
2. Salin **Unique ID** — angka panjang, mis. `114857392017465829301`.

Nilai inilah yang dipakai di Admin console, **bukan** alamat emailnya.

### 6. Izinkan delegasi domain — Google Admin console

Langkah ini yang membuat service account boleh bertindak sebagai
`noreply@cipansor.or.id`. Tanpa ini, semua pengiriman ditolak dengan
`unauthorized_client`.

1. Buka <https://admin.google.com/> sebagai super admin `cipansor.or.id`.
2. **Security** → **Access and data control** → **API controls**.
3. Di bagian *Domain-wide delegation*, klik **Manage domain-wide delegation**.
4. **Add new**.
5. Isi:
   - *Client ID*: **Unique ID** dari langkah 5.
   - *OAuth scopes*: `https://www.googleapis.com/auth/gmail.send`

     Persis satu scope ini. Jangan tambahkan `gmail.readonly` atau
     `https://mail.google.com/` — sistem tidak memerlukannya, dan cakupan yang
     lebih luas berarti kerusakan yang lebih besar bila kunci bocor.
6. **Authorize**.

Perubahan delegasi kadang butuh beberapa menit untuk menyebar.

### 7. Pastikan kotak surat pengirim ada

`noreply@cipansor.or.id` harus benar-benar ada di Workspace — sebagai **user**
atau sebagai **alias** dari user yang ada. Service account meniru identitas
seorang pengguna nyata; kalau alamat itu tidak ada, Google menolak dengan
`unauthorized_client` meski langkah 6 sudah benar.

Begitu juga `halo@cipansor.or.id` harus ada dan **dibaca orang** — bisa berupa
user biasa atau *Google Group* berisi staf TU. Ke sinilah balasan wali santri
akan masuk.

### 8. Isi konfigurasi di server

Di `.env` pada host produksi (berkas ini tidak pernah masuk git):

```dotenv
MAIL_FROM=Yayasan Pesantren Cipansor <noreply@cipansor.or.id>
MAIL_REPLY_TO=halo@cipansor.or.id

GOOGLE_SERVICE_ACCOUNT_EMAIL=cipansor-mailer@cipansor-mailer.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
GMAIL_SENDER=noreply@cipansor.or.id
```

Menyalin private key dengan tangan adalah tempat langkah ini paling sering
gagal, jadi ada skrip pembantu yang mencetak ketiga barisnya sekaligus dari
berkas JSON:

```bash
scripts/gmail-key-to-env.sh ~/Downloads/cipansor-mailer-abc123.json
```

Skrip itu juga mencetak **Client ID** untuk Admin console, dan berhenti dengan
pesan yang jelas bila yang diberikan ternyata berkas OAuth client, bukan service
account. Tidak ada yang ditulis ke mana pun — keluarannya untuk Anda tempelkan
sendiri ke `.env`.

Catatan penting soal format:

- **`MAIL_FROM` tanpa tanda kutip.** Nilai di `.env` dan di
  `docker-compose.yml` dibaca apa adanya; tanda kutip akan ikut terkirim
  sebagai bagian dari nama pengirim, sehingga penerima melihat
  `' Yayasan Pesantren Cipansor'`.
- **`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` ditulis satu baris**, dengan `\n`
  sebagai dua karakter literal (backslash dan huruf n), dibungkus tanda kutip
  ganda. Nilai ini bisa disalin langsung dari field `private_key` di berkas
  JSON. Aplikasi mengubah `\n` kembali menjadi baris baru saat membaca.

Lalu terapkan:

```bash
docker compose up -d api
```

Variabel-variabel ini sudah didaftarkan di blok `environment:` service `api`
pada `docker-compose.yml`. Menambah variabel di `.env` saja tidak cukup — kalau
tidak disebut di blok itu, nilainya tidak pernah sampai ke dalam container dan
fitur gagal diam-diam.

### 9. Pastikan sudah aktif

1. Masuk portal sebagai super admin → **Notifikasi** → **Pengaturan**.
2. Kartu **Server Email Keluar** harus menampilkan:
   - Metode: `Gmail API` (service account, tanpa sandi aplikasi) sebagai
     `noreply@cipansor.or.id`
   - Badge hijau **Email siap kirim**

   Kalau masih kuning **Email tidak terkirim — hanya dicatat di log**, berarti
   kredensial belum terbaca container. Periksa `docker compose exec api env |
   grep GOOGLE_`.
3. Uji satu kiriman nyata: **Pengguna** → menu titik-tiga pada satu akun uji →
   **Kirim tautan reset password**. Email harus masuk, dengan pengirim
   `Yayasan Pesantren Cipansor` dan balasan mengarah ke `halo@`.

---

## Kalau gagal

| Pesan | Artinya |
|---|---|
| `unauthorized_client` | Client ID belum diizinkan di Admin console (langkah 6), atau scope-nya tidak persis `gmail.send`, atau `GMAIL_SENDER` bukan user/alias nyata di domain. |
| `Delegation denied for <alamat>` | Delegasi ada, tetapi tidak mencakup alamat yang diminta. Periksa `GMAIL_SENDER`. |
| `invalid_grant` | Jam server melenceng jauh, atau private key salah salin (baris `\n` hilang). |
| Badge tetap kuning | Variabel tidak sampai ke container — lihat catatan `environment:` di langkah 8. |
| Email masuk spam | Pastikan SPF/DKIM/DMARC domain sudah disetel Workspace. Karena pengiriman lewat infrastruktur Gmail sebagai user domain, DKIM Workspace berlaku otomatis begitu diaktifkan di Admin console → Apps → Google Workspace → Gmail → Authenticate email. |

---

## Cadangan: SMTP

Kalau karena satu dan lain hal Gmail API tidak bisa dipakai, transport SMTP
tetap tersedia dan dipakai otomatis ketika kredensial Gmail kosong:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@cipansor.or.id
SMTP_PASS=<sandi aplikasi 16 karakter>
```

Sandi aplikasi mensyaratkan 2FA aktif pada akun pengirim, dan memberi pemegangnya
akses ke seluruh kotak surat — itulah sebabnya ini cadangan, bukan pilihan
utama.

Koneksi SMTP dipakai dengan *pooling* (maksimum 5 koneksi, 10 pesan/detik)
karena pengumuman dikirim berkelompok 50 sekaligus dan Gmail menolak koneksi
serentak yang terlalu banyak.

---

## Kalau tidak ada yang dikonfigurasi

Sistem tidak error dan tidak menggantung: setiap email dicatat di log lalu
dibuang, dan halaman Pengaturan Notifikasi menyatakannya apa adanya
("Email tidak terkirim — hanya dicatat di log"). Ini keadaan produksi sebelum
perubahan ini — bedanya, dulu halaman itu tetap menampilkan badge hijau.

---

## Alur reset password

Terkait langsung dengan email, dan sengaja dibuat begini:

- **Tidak ada halaman "lupa password" publik.** Formulir yang bisa diisi
  siapa saja adalah cara gratis untuk membuat sistem mengirim email ke alamat
  mana pun, dan untuk menebak alamat mana yang punya akun.
- **Reset dimulai admin.** Pengguna yang lupa password menghubungi admin. Admin
  membuka **Pengguna**, menemukan orangnya, dan memilih **Kirim tautan reset
  password**.
- **Admin tidak pernah tahu password barunya.** Yang dikirim hanyalah tautan
  sekali pakai berumur 1 jam menuju `/reset-password` di portal; penggunalah
  yang memilih password baru.
- **Token disimpan sebagai SHA-256**, dihapus begitu dipakai, dan semua sesi
  lama diakhiri setelah password berganti.

Akun santri dan wali yang dibuat lewat alur SPMB memakai mekanisme yang sama,
dengan tautan berumur 24 jam.
