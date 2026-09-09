# PRD — Sistem Monitoring Intervensi Gizi Balita (Nugget Zinc)

## 1. Latar Belakang

Studi intervensi gizi untuk memantau efektivitas pemberian nugget (fortifikasi zinc) terhadap
status gizi balita selama **28 hari**. Efektivitas diukur dari tiga indikator utama:

- **Berat badan** (naik/turun)
- **Kadar Zinc**
- **Kadar Hb (hemoglobin)**

Saat ini pencatatan dilakukan manual oleh kader posyandu di lapangan. Sistem ini dibangun untuk
mendigitalkan proses pencatatan, memastikan integritas data (siapa input, kapan), dan
menyediakan agregasi data untuk kebutuhan analisis skripsi.

## 2. Tujuan

1. Memudahkan kader mencatat konsumsi nugget & berat badan balita secara harian, dari HP/web.
2. Mencatat hasil lab (Hb & Zinc) pada baseline (hari-0) dan endline (hari-28).
3. Memberi peneliti (admin) visibilitas penuh atas seluruh data 40 balita untuk kebutuhan
   analisis dan pelaporan skripsi (Bab 4).
4. Menjaga akuntabilitas data — setiap catatan tertaut ke akun kader yang menginputnya.

## 3. Stakeholders & Roles

| Role | Jumlah | Deskripsi |
|---|---|---|
| **Admin/Peneliti** | 1 | Peneliti (pemilik studi). Full access ke seluruh data 40 balita, semua kader, dan export data. |
| **Kader** | 4 | Kader posyandu di lapangan. Masing-masing bertanggung jawab atas ±10 balita. Input data harian & lab. |

Akun dibuat oleh Admin (bukan self-register) — kader menerima username/password dari admin.

## 4. Ruang Lingkup (Scope)

### In-scope (v1)

- Autentikasi & role-based access (Admin, Kader)
- CRUD data balita (profil baseline) oleh Admin, assign ke Kader
- Input harian oleh Kader: berat badan + jumlah nugget termakan (gram)
- Input hasil lab oleh Kader/Admin: Hb & Zinc di hari-0 dan hari-28
- Dashboard progres per balita (grafik tren berat badan 28 hari)
- Dashboard agregat untuk Admin (rata-rata kenaikan BB, compliance rate input, dst.)
- Export data (CSV/Excel) untuk kebutuhan analisis statistik (SPSS)
- Penandaan hari yang tidak diisi kader ("tidak terisi") untuk compliance tracking

### Out-of-scope (v1) — dicatat sebagai future enhancement di `rule.md`

- Notifikasi/reminder otomatis ke kader yang belum input
- Perhitungan status gizi formal (WHO Z-score BB/U, BB/TB)
- Aplikasi mobile native (cukup web app responsive)
- Multi-studi / multi-cohort (sistem ini didesain untuk satu studi 28 hari, 40 balita)

## 5. Data Baseline Balita (dicatat saat registrasi)

- Nama
- Usia (bulan)
- Jenis kelamin
- Tinggi badan awal
- Berat badan awal
- Posyandu asal
- Kader penanggung jawab

## 6. Indikator & Frekuensi Pengukuran

| Indikator | Frekuensi | Alasan |
|---|---|---|
| Berat badan | Harian (28x) | Non-invasif, cukup ditimbang |
| Konsumsi nugget (gram) | Harian (28x) | Target 50gr/hari (2 biji x 25gr) |
| Hb & Zinc | Day-0 & Day-28 (2x) | Butuh sampel darah — invasif, perubahan biomarker perlu waktu, mengikuti pola pre-post test standar studi gizi |

## 7. Metode Evaluasi Hasil

- Status gizi/progres dihitung sebagai **delta angka mentah** (selisih nilai akhir − awal), bukan
  Z-score WHO formal — disederhanakan untuk scope skripsi.
- Compliance rate kader = jumlah hari terisi / 28 hari, per balita.

## 8. Success Metrics (untuk sistem, bukan untuk hasil studi gizinya)

- Kader bisa input data harian dalam <1 menit per balita dari HP.
- Admin bisa export data lengkap 40 balita ke Excel dalam 1 klik.
- Tidak ada data ganda/konflik antar-kader (data terisolasi per kader via role).

## 9. Constraints & Asumsi

- Jumlah balita tetap (40) selama studi berjalan — tidak ada penambahan/dropout ditangani di v1
  (dicatat sebagai catatan, ditangani manual oleh admin jika terjadi).
- Semua input manual, tidak ada integrasi alat digital (timbangan/lab otomatis).
- Studi berjalan satu periode 28 hari (bukan sistem multi-periode berulang).

## 10. Dokumen Terkait

- `schema.md` — desain database
- `architecture.md` — arsitektur teknis & stack
- `rule.md` — business rules, validasi, dan role permission matrix
