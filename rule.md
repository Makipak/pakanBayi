# Rule — Business Rules & Validasi

## 1. Role Permission Matrix

| Aksi | Admin | Kader |
|---|---|---|
| Lihat semua balita (40) | ✅ | ❌ (hanya ±10 miliknya) |
| Tambah/edit/hapus data balita | ✅ | ❌ |
| Assign balita ke kader | ✅ | ❌ |
| Input `CatatanHarian` (BB, konsumsi) | ✅ (semua balita) | ✅ (hanya balita miliknya) |
| Edit `CatatanHarian` yang sudah diisi | ✅ | ✅ (hanya milik sendiri, hari yang sama) |
| Input `HasilLab` (Hb, Zinc) | ✅ | ✅ (hanya balita miliknya) |
| Buat/kelola akun kader | ✅ | ❌ |
| Export data (Excel/CSV) | ✅ | ❌ |
| Lihat dashboard agregat (semua balita) | ✅ | ❌ (hanya agregat balita miliknya) |

**Prinsip:** semua endpoint/Server Action untuk role Kader **wajib** memfilter berdasarkan
`kaderId = session.userId` di level query database, bukan hanya disembunyikan di UI.

## 2. Validasi Input

### `CatatanHarian`

| Field | Rule |
|---|---|
| `berat_badan` | Wajib angka positif. Range wajar: 3–30 kg (sesuai rentang usia balita). Di luar range → warning, tapi tetap bisa disimpan dengan konfirmasi (bukan hard block, karena bisa jadi data valid untuk kasus tertentu). |
| `konsumsi_nugget_gram` | 0–50 gram (maksimal 2 biji × 25gr). Tidak boleh negatif atau melebihi 50gr. |
| `hari_ke` | 1–28, harus sesuai tanggal mulai studi balita tsb. Tidak bisa input untuk hari di luar rentang studi. |
| `tanggal` | Tidak boleh tanggal di masa depan. |

### `HasilLab`

| Field | Rule |
|---|---|
| `tipe` | Hanya boleh `BASELINE` atau `ENDLINE`, satu balita maksimal 1 record per tipe (unique constraint). |
| `hb_value` | Angka positif, range wajar sesuai standar klinis balita (mis. 7–16 g/dL — sesuaikan dengan referensi medis yang dipakai peneliti). |
| `zinc_value` | Angka positif sesuai satuan lab yang dipakai. |
| `tanggal_pengukuran` (ENDLINE) | Harus ≥ 28 hari setelah `tanggal_pengukuran` BASELINE (mengikuti durasi studi). |

### `Balita`

| Field | Rule |
|---|---|
| `usia_bulan` | 0–59 bulan (definisi balita/toddler). |
| `berat_badan_awal`, `tinggi_badan_awal` | Wajib diisi saat registrasi, tidak bisa kosong. |
| `kader_id` | Wajib di-assign saat registrasi — tidak ada balita tanpa kader penanggung jawab. |

## 3. Aturan Data Hilang (Missing Data)

- Baris `CatatanHarian` untuk semua 28 hari **dibuat otomatis** saat balita didaftarkan/studi
  dimulai, dengan `status_input = TIDAK_TERISI`.
- Jika kader tidak input pada hari tersebut, baris **dibiarkan kosong** (`berat_badan` dan
  `konsumsi_nugget_gram` = null, `status_input` tetap `TIDAK_TERISI`).
- **Tidak ada backfill** — kader tidak bisa mengisi data untuk hari yang sudah lewat tanpa
  ditandai. (Jika kebutuhan berubah dan backfill diizinkan, tandai dengan flag tambahan
  `is_backfilled` — saat ini di luar scope v1.)
- `status_input = TIDAK_TERISI` digunakan untuk menghitung **compliance rate** per balita/kader,
  yang bisa jadi temuan menarik di skripsi (mis. korelasi compliance rate vs hasil akhir).

## 4. Aturan Balita Dropout

- Balita yang keluar dari studi sebelum hari ke-28 diberi `status = DROPOUT` (bukan dihapus dari
  database — data historis tetap disimpan untuk transparansi).
- Balita dengan status `DROPOUT` tidak muncul di form input harian aktif, tapi tetap muncul di
  laporan/export dengan penanda status.

## 5. Aturan Akun

- Akun kader **dibuat oleh Admin**, bukan self-register.
- Password awal di-generate oleh admin, kader disarankan mengganti password saat login pertama
  (opsional untuk v1, bisa ditambahkan sebagai enhancement).
- Satu kader hanya terhubung ke satu akun — tidak ada shared account antar-kader (untuk menjaga
  akuntabilitas siapa input apa).

## 6. Future Enhancements (Out-of-scope v1)

Dicatat di sini supaya tidak lupa, tapi sengaja tidak dikerjakan dulu demi menjaga scope
skripsi tetap realistis:

- 🔲 Notifikasi/reminder otomatis (email/WA) ke kader yang belum input hari ini
- 🔲 Perhitungan status gizi formal pakai standar WHO Z-score (BB/U, BB/TB, BB/PB)
- 🔲 Backfill data dengan flag "telat input"
- 🔲 Multi-studi / multi-cohort (saat ini didesain untuk 1 studi, 40 balita, 28 hari)
- 🔲 Alert otomatis kalau berat badan balita turun signifikan (butuh threshold klinis yang
  divalidasi, tidak boleh sembarangan menentukan sendiri)
- 🔲 Integrasi alat ukur digital (timbangan/lab terhubung otomatis)
