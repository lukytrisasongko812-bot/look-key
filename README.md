# RISE — Resources Integrated System for Efficiency
**Shared Service Center of MIND ID (Mining Industry Indonesia)**

Aplikasi web fullstack modern untuk manajemen dan pelacakan dokumen legal, perizinan, dan kontrak pengadaan di lingkungan grup MIND ID (Holding BUMN Pertambangan).

Dibangun menggunakan **React (Next.js App Router)**, **shadcn/ui**, **Tailwind CSS**, dan **MongoDB lokal** dengan **Mongoose**.

---

## 🚀 Fitur Utama

1. **Autentikasi & Keamanan Enterprise**:
   - Login Email Perusahaan & Password dengan hashing `bcrypt`.
   - **Single Sign-On (SSO)**: One-click sign in instan untuk domain `@resourcesid.co.id` dan integrasi simulasi Microsoft 365.
   - **Two-Factor Authentication (2FA)**: Dialog OTP 6-digit.
   - Registrasi akun baru & reset password dengan token recovery.
   - Indikator keamanan session (TLS 1.3, device recognition, attempt countdown).

2. **Dashboard Interaktif**:
   - 4 Kartu KPI Metrik (Total Requests, Under Review, Waiting Approval, Completed) lengkap dengan tren mingguan.
   - **Contract Expiry & Renewal Reminder**: Deteksi otomatis kontrak mendekati jatuh tempo (&le; 60 hari) dengan visual tier urgensi (`cd-safe`, `cd-soon`, `cd-urgent`, `Expired`), tombol aksi cepat **Renew** dan **Terminate**.
   - Peluncur cepat kategori kontrak (8 kategori: Pengadaan Barang/Jasa, Perjanjian, NDA, MoU, Legal Opinion, Surat Kuasa, Surat Resmi).
   - Pratinjau Document Tracking interaktif dengan pemilih dokumen.

3. **Document Tracking (2 Tab Terintegrasi)**:
   - **New Request Form**: Pengajuan berkas lengkap (Divisi, Kategori, Prioritas, Kerahasiaan, Nama Dokumen, Tanggal Mulai & Berakhir dengan opsi *No fixed duration*, Catatan, dan Drag & Drop file uploader berkas pendukung).
   - **Track Progress**:
     - 7 Tahapan pipeline visual (*Submitted* ➔ *Review* ➔ *Legal Drafting* ➔ *Legal Approval* ➔ *BOD Approval / Signed* ➔ *Archived* ➔ *Expired / Renewal*).
     - Status tahapan dinamis: *Active* (efek pulsing), *Completed* (centang hijau), *Revision Needed* (warning badge), *Rejected* (merah).
     - Kartu detail inspeksi tahapan (PIC, SLA kerja, tanggal update, status).
     - Timeline Pengingat Jatuh Tempo (Milestone `H-60`, `H-45`, `H-30`, `H-15`, `H-7`, `Expired`).
     - Modal Keputusan Kontrak (*Renew* vs *Terminate*) dengan chips pertimbangan kepatuhan/anggaran dan justifikasi.

4. **My Documents**:
   - Pencarian real-time (nomor dokumen, nama, kategori, PIC).
   - Filter dropdown status (*Review*, *Legal Drafting*, *Waiting Approval*, *Revision Needed*, *Rejected*, *Completed*, *Archived*).
   - Tabel responsif dengan aksi lengkap:
     - **View**: Modal rincian dokumen lengkap.
     - **Edit**: Ubah nama dokumen dan PIC langsung tersimpan di MongoDB.
     - **Download**: Ekspor ringkasan dokumen sebagai file `.txt`.
     - **Track**: Langsung membuka tracker dokumen yang bersangkutan.

5. **My Account**:
   - Kartu profil karyawan, inisial avatar, upload foto profil custom.
   - Tab Profil: Ubah nama, divisi, posisi, nomor telepon.
   - Tab Keamanan: Ganti password, toggle 2FA OTP, toggle alert perangkat baru.
   - Tab Devices: Daftar perangkat aktif dan opsi remote sign out.
   - Tab Login History: Riwayat sesi login dari MongoDB.

6. **Settings & Role-Based Access Control (RBAC)**:
   - Status koneksi real-time ke MongoDB lokal (`/api/health`).
   - Tombol **Reseed Demo Data** untuk mereset data contoh kapan saja.
   - **Role Simulator**: Ganti peran sebagai *User*, *Legal Officer*, *Legal Manager*, *Department Manager*, *Director / BOD*, atau *Administrator*.
   - Matriks Hak Akses Administrator (Submit, Review, Approve, Archive).
   - Preferensi notifikasi Email, WhatsApp, dan Expiry reminder.

7. **Notification Drawer**:
   - Panel geser kanan dengan status belum dibaca (*unread count badge*).
   - Jenis notifikasi: Approved, Revision, Signed, SLA Reminder, Email Sent, WhatsApp Sent, Contract Decision.
   - Tombol "Mark read" untuk menandai semua sudah dibaca.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Next.js 16 (App Router), TypeScript
- **UI & Komponen**: shadcn/ui, Radix UI, Lucide React
- **Styling**: Tailwind CSS v4 dengan palet korporat Navy (`#163A70`, `#0F2A54`, `#3E5D91`)
- **Database**: MongoDB lokal (`mongodb://127.0.0.1:27017/rise_db`)
- **ODM**: Mongoose 9.x
- **Autentikasi**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: Next.js Form Data API ke `public/uploads/`

---

## 📦 Menjalankan Aplikasi Secara Lokal

### 1. Pastikan MongoDB Lokal Berjalan
Pastikan layanan `mongod` lokal Anda aktif pada port default `27017`:
```bash
# macOS (Homebrew)
brew services start mongodb-community
# atau periksa dengan:
lsof -i :27017
```

### 2. Instalasi Dependensi
```bash
pnpm install
# atau
npm install
```

### 3. Konfigurasi Environment
File `.env.local` sudah disediakan secara otomatis:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/rise_db
JWT_SECRET=rise_corporate_secure_secret_key_2026
NEXT_PUBLIC_APP_NAME=RISE
NEXT_PUBLIC_APP_SUBTITLE=Resources Integrated System for Efficiency
```

### 4. Isi Data Awal (Seed Database)
Jalankan seeder untuk mengisi akun default, 7 dokumen kontrak contoh, notifikasi, dan riwayat login:
```bash
pnpm run seed
# atau
npm run seed
```

### 5. Jalankan Server Development
```bash
pnpm run dev
# atau
npm run dev
```

Buka peramban di: **[http://localhost:3000](http://localhost:3000)** (atau port yang ditunjuk terminal, misal `3001`).

---

## 🔑 Kredensial Demo

| Field | Nilai Demo |
| :--- | :--- |
| **Email** | `luky.pratama@resourcesid.co.id` |
| **Password** | `DemoPass123!` |
| **Role Default** | Legal Officer (dapat disimulasikan di Settings) |
| **Opsi SSO** | Klik tombol **Company Email** untuk login otomatis instan |
| **OTP (2FA)** | Masukkan 6 digit angka apa saja pada dialog OTP |

---

## 📡 Endpoint API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Cek status koneksi MongoDB lokal |
| `GET/POST` | `/api/seed` | Memicu seeding data (opsi query `?force=true`) |
| `POST` | `/api/auth/login` | Login email & password |
| `POST` | `/api/auth/sso` | Login otomatis instan domain perusahaan |
| `POST` | `/api/auth/register` | Pendaftaran akun pengguna baru |
| `GET/PATCH`| `/api/auth/me` | Ambil & update profil pengguna aktif |
| `POST` | `/api/auth/reset-password` | Permintaan token & reset password |
| `GET` | `/api/documents` | Ambil daftar dokumen (filter: `q`, `status`, `category`) |
| `POST` | `/api/documents` | Buat pengajuan dokumen baru |
| `GET/PATCH/DELETE` | `/api/documents/[id]` | Detail, update metadata, dan hapus dokumen |
| `POST` | `/api/documents/[id]/decision` | Submit keputusan perpanjangan / terminasi kontrak |
| `GET/PATCH`| `/api/notifications` | Daftar notifikasi dan mark all read |
| `POST` | `/api/upload` | Unggah file berkas pendukung kontrak |
