# PRD — NUTRIMO (Nuget Nutrition Monitoring)

> **Update:** direvisi mengikuti implementasi aktual — indikator lab jadi 3x pengukuran (bukan
> 2x), data baseline balita jauh lebih lengkap, dan ada beberapa fitur UX baru yang tidak ada di
> rencana awal (dropdown wilayah, onboarding hari-1, rename label admin). Proyek ini sekarang
> bernama **NUTRIMO** — nama sebelumnya "Sistem Monitoring Intervensi Gizi Balita (Nugget Zinc)"
> masih dipakai sebagai deskripsi/subjudul di beberapa tempat.

## 1. Latar Belakang

Studi intervensi gizi untuk memantau efektivitas pemberian nugget (fortifikasi zinc) terhadap
status gizi balita selama **28 hari**. Efektivitas diukur dari indikator:

- **Berat badan & tinggi badan** (naik/turun, dicatat harian)
- **Asupan makronutrien harian** (karbohidrat, protein, lemak) — sejalan dengan konsumsi nugget
- **Kadar Zinc, Hb (hemoglobin), dan Fe (zat besi)** — diambil 3x selama studi (bukan cuma awal-akhir)

Saat ini pencatatan dilakukan manual oleh kader posyandu di lapangan. NUTRIMO dibangun untuk
mendigitalkan proses pencatatan, memastikan integritas data (siapa input, kapan), dan
menyediakan agregasi data untuk kebutuhan analisis skripsi.

## 2. Tujuan

1. Memudahkan kader mencatat konsumsi nugget, berat/tinggi badan, dan asupan makronutrien balita
   secara harian, dari HP/web.
2. Mencatat hasil lab (Hb, Zinc, Fe) pada **3 checkpoint**: Baseline (hari-1), Pertengahan
   (hari-14), Endline (hari-28) — dengan pengamanan supaya data tidak ke-input/ke-ubah tidak
   sengaja di hari yang salah.
3. Mencatat data identitas, kontak, wilayah administratif, dan riwayat pemeriksaan posyandu
   sebelum balita ikut studi ini — supaya data setara dengan catatan posyandu manual yang sudah
   ada.
4. Memberi peneliti (SPV Kader/Admin) visibilitas penuh atas seluruh data balita untuk kebutuhan
   analisis dan pelaporan skripsi (Bab 4).
5. Menjaga akuntabilitas data — setiap catatan tertaut ke akun kader yang menginputnya.

## 3. Stakeholders & Roles

| Role | Deskripsi |
|---|---|
| **Admin** (label di UI: **"SPV Kader"**) | Peneliti/pemilik studi. Full access ke seluruh data balita, semua kader, dan export data. Satu-satunya role yang bisa menambah/mengedit balita dan mengelola akun kader. Nilai role di database & URL (`/admin/*`) tetap `ADMIN` — "SPV Kader" cuma label tampilan. |
| **Kader** | Kader posyandu di lapangan. Masing-masing bertanggung jawab atas sebagian balita. Input data harian & lab untuk balita miliknya sendiri. |

Akun dibuat oleh Admin (bukan self-register). Admin bisa menambah, **mengedit**, dan menghapus
akun kader (edit ditambahkan setelah rencana v1 — sebelumnya cuma tambah/hapus).

## 4. Ruang Lingkup (Scope) — Diperbarui

### In-scope (aktual)

- Autentikasi & role-based access (Admin/"SPV Kader", Kader)
- CRUD data balita oleh Admin, assign ke Kader, termasuk:
  - Data identitas & kontak: tanggal lahir, nama ibu kandung, alamat, no. telp
  - Wilayah administratif: Provinsi/Kab-Kota/Kecamatan/Desa-Kel (dropdown berjenjang, klik saja
    — lihat §7), Puskesmas, Posyandu, RT/RW
  - Riwayat pemeriksaan posyandu sebelum proyek ini (opsional, satu kali/snapshot): usia saat
    ukur, tanggal, berat/tinggi, cara ukur, LiLA, kategori BB/U & TB/U & BB/TB + Z-score,
    kenaikan berat badan, jumlah Vit A, hasil KPSP, kepemilikan KIA, keikutsertaan Kelas Ibu
    Balita, status MBG, catatan detail
- CRUD akun kader oleh Admin (tambah, **edit**, hapus)
- Input harian oleh Kader: berat badan, tinggi badan, konsumsi nugget (gram), dan asupan
  karbohidrat/protein/lemak (gram)
- **Onboarding Hari ke-1**: input harian pertama + Hasil Lab Baseline digabung jadi satu form/satu
  submit, supaya kader tidak perlu bolak-balik halaman saat balita baru mulai ikut studi
- Input hasil lab oleh Kader/Admin: Hb, Zinc, Fe — di 3 checkpoint (Baseline/Pertengahan/Endline),
  masing-masing **dikunci** hanya bisa diisi tepat di hari studi yang sesuai (kecuali Baseline,
  lihat §8 di `rule.md`)
- Dashboard progres per balita (grafik tren berat badan & tinggi badan 28 hari, ringkasan asupan,
  ringkasan lab)
- Dashboard agregat untuk Admin
- Export data (CSV) untuk kebutuhan analisis statistik (SPSS/Excel)
- Penandaan hari yang tidak diisi kader ("tidak terisi") untuk compliance tracking

### Out-of-scope (masih, dicatat di `rule.md` §11)

- Notifikasi/reminder otomatis ke kader yang belum input
- Perhitungan status gizi formal (WHO Z-score) untuk data studi 28 hari yang baru — nilai Z-score
  di `RiwayatPemeriksaanAwal` cuma menyimpan data historis dari catatan posyandu lama, bukan
  hasil hitung otomatis sistem ini
- Aplikasi mobile native (cukup web app responsive, mobile-first)
- Multi-studi / multi-cohort
- Toleransi keterlambatan checkpoint lab yang terlewat (lihat `rule.md` §7)
- Deployment ke cloud (saat ini jalan lokal di komputer peneliti — lihat `architecture.md` §8
  untuk catatan migrasi kalau nanti dibutuhkan)

## 5. Data Baseline Balita (dicatat saat registrasi) — Diperbarui

Data inti (wajib):

- Nama, usia (bulan), jenis kelamin, tinggi & berat badan awal, posyandu, kader penanggung jawab

Data identitas & kontak (opsional):

- Tanggal lahir, nama ibu kandung, alamat, no. telp

Data wilayah administratif (opsional, provinsi/kab-kota/kecamatan/desa via dropdown berjenjang):

- Provinsi, Kab/Kota, Kecamatan, Puskesmas, Desa/Kel, RT, RW

Riwayat pemeriksaan posyandu sebelum proyek ini (opsional, satu kali):

- Usia saat ukur, tanggal pengukuran, berat, tinggi, cara ukur, LiLA, BB/U + Z-score, TB/U +
  Z-score, BB/TB + Z-score, naik berat badan, jumlah Vit A, hasil KPSP, punya KIA, ikut Kelas
  Ibu Balita, terdaftar MBG, catatan detail

## 6. Indikator & Frekuensi Pengukuran — Diperbarui

| Indikator | Frekuensi | Keterangan |
|---|---|---|
| Berat badan | Harian (28x) | |
| **Tinggi badan** | Harian (28x) | Ditambahkan — semula direncanakan sekali di awal saja |
| Konsumsi nugget (gram) | Harian (28x) | Target 50gr/hari (2 biji × 25gr) |
| **Karbohidrat, protein, lemak** (gram) | Harian (28x) | Ditambahkan, sejalan dengan input konsumsi nugget |
| **Hb, Zinc, Fe** | **3x**: Hari-1 (Baseline), Hari-14 (Pertengahan), Hari-28 (Endline) | Semula direncanakan 2x (Day-0/Day-28); Fe ditambahkan sebagai indikator ketiga selain Hb & Zinc. Baseline sekarang digabung dengan input harian pertama (onboarding) |

## 7. Fitur UX Baru (tidak ada di rencana awal)

- **Dropdown wilayah berjenjang**: Provinsi → Kab/Kota → Kecamatan → Desa/Kel tinggal pilih dari
  dropdown (data dari API publik wilayah Indonesia), tidak perlu ketik manual — dengan fallback
  isi manual kalau koneksi ke sumber data bermasalah.
- **Onboarding hari-1 gabungan**: mengurangi jumlah langkah kader saat balita baru mulai ikut
  studi (satu form, bukan dua form terpisah di dua halaman).
- **Kunci hari untuk hasil lab**: mencegah data Hb/Zinc/Fe ke-input atau ke-ubah tidak sengaja di
  hari yang salah.
- **Label "SPV Kader"** menggantikan "Admin" di seluruh tampilan (bukan perubahan struktur akses).
- **Rebrand jadi NUTRIMO**: nama aplikasi (judul tab browser, sidebar, halaman login) diganti
  jadi "NUTRIMO" dengan tagline "Nuget Nutrition Monitoring" — nama internal proyek/folder
  (`balita-feed` / `D:\projek\balitaFeed`) tidak diganti, ini murni penamaan yang tampil ke user.

## 8. Metode Evaluasi Hasil

- Status gizi/progres studi ini dihitung sebagai **delta angka mentah** (selisih nilai akhir −
  awal untuk berat/tinggi badan dan Hb/Zinc/Fe Endline − Baseline), bukan Z-score WHO formal —
  disederhanakan untuk scope skripsi. (Z-score di `RiwayatPemeriksaanAwal` adalah data historis
  yang diinput manual dari catatan posyandu lama, bukan hasil hitung sistem ini.)
- Compliance rate kader = jumlah hari `CatatanHarian` terisi / 28 hari, per balita.

## 9. Success Metrics (untuk sistem, bukan untuk hasil studi gizinya)

- Kader bisa input data harian dalam <1 menit per balita dari HP.
- Onboarding balita baru (hari-1 + Baseline) selesai dalam satu form tanpa pindah halaman.
- Admin bisa export data lengkap ke CSV dalam 1 klik.
- Tidak ada data ganda/konflik antar-kader (data terisolasi per kader via role, ditegakkan di
  level Server Action).
- Tidak ada hasil lab yang ke-input/ke-ubah di hari yang salah (ditegakkan di UI & server).

## 10. Constraints & Asumsi

- Jumlah balita bisa bertambah lewat form Tambah Balita oleh Admin — tidak strict 40 balita
  seperti rencana awal.
- Semua input manual, tidak ada integrasi alat digital (timbangan/lab otomatis).
- Studi berjalan satu periode 28 hari (bukan sistem multi-periode berulang).
- Sistem jalan lokal di komputer peneliti (SQLite lokal) — bukan cloud-hosted, untuk saat ini.
- Set kategori riwayat pemeriksaan (cara ukur, BB/U, TB/U, BB/TB, KPSP) adalah asumsi awal —
  perlu dicek kembali kesesuaiannya dengan istilah yang dipakai posyandu di lapangan.

## 11. Dokumen Terkait

- `schema.md` — desain database (aktual, sesuai `prisma/schema.prisma`)
- `architecture.md` — arsitektur teknis & stack (aktual)
- `rule.md` — business rules, validasi, dan role permission matrix (aktual)