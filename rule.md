# Rule — NUTRIMO (Nuget Nutrition Monitoring): Business Rules & Validasi

> **Update:** ditambahkan aturan "kunci hari" untuk hasil lab (3 checkpoint, bukan 2), aturan
> onboarding hari-1, kader sekarang bisa di-update (bukan cuma add/delete), dan validasi field
> baru di `Balita`/`RiwayatPemeriksaanAwal`. Proyek ini sekarang bernama **NUTRIMO**.

## 1. Role Permission Matrix

| Aksi | Admin ("SPV Kader" di UI) | Kader |
|---|---|---|
| Lihat semua balita | ✅ | ❌ (hanya balita miliknya) |
| Tambah balita (+ riwayat pemeriksaan awal) | ✅ | ❌ |
| Update status balita (AKTIF/SELESAI/DROPOUT) | ✅ | ❌ |
| Hapus balita | ✅ | ❌ |
| Input `CatatanHarian` (harian) | ✅ (semua balita) | ✅ (hanya balita miliknya) |
| Edit `CatatanHarian` yang sudah diisi | ✅ | ✅ (hanya milik sendiri) |
| Input `HasilLab` (Baseline/Pertengahan/Endline) | ✅ (semua balita) | ✅ (hanya balita miliknya) — **dikunci ke hari yang sesuai, lihat §7** |
| Isi form onboarding hari-1 (`submitHariPertama`) | ✅ | ✅ (hanya balita miliknya) |
| Tambah akun kader | ✅ | ❌ |
| **Update akun kader** (username/nama/password) | ✅ | ❌ |
| Hapus akun kader (kalau tidak ada balita aktif) | ✅ | ❌ |
| Export data (CSV) | ✅ | ❌ |
| Lihat dashboard agregat (semua balita) | ✅ | ❌ (hanya agregat balita miliknya) |

**Prinsip (tidak berubah):** semua Server Action untuk role Kader **wajib** memfilter
berdasarkan `kaderId = session.user.id` di level query database, bukan hanya disembunyikan di UI.

## 2. Validasi Input — `CatatanHarian`

| Field | Rule |
|---|---|
| `beratBadan` | Wajib angka positif. Rentang wajar 3–30 kg (`BERAT_BADAN_MIN_WAJAR`/`MAX_WAJAR`). Di luar rentang → warning, tetap bisa disimpan dengan centang konfirmasi (bukan hard block). |
| `tinggiBadan` | **Baru** — wajib angka positif, dicatat harian (bukan hanya sekali di awal seperti draft v1). |
| `konsumsiNuggetGram` | 0–50 gram (`TARGET_NUGGET_GRAM`). |
| `karbohidratGram`, `proteinGram`, `lemakGram` | **Baru** — wajib angka ≥ 0, dicatat harian bersamaan dengan input lainnya. |
| `hariKe` | 1–28, harus sesuai `tanggalMulai` balita. |
| `tanggal` | Tidak boleh di masa depan. |

## 3. Validasi Input — `HasilLab`

| Field | Rule |
|---|---|
| `tipe` | `BASELINE` \| `PERTENGAHAN` \| `ENDLINE` (**3 tipe**, bukan 2). Satu balita maksimal 1 record per tipe (unique constraint, disimpan via `upsert`). |
| `hbValue` | Angka positif, rentang wajar klinis 7–16 g/dL (`HB_MIN_WAJAR`/`MAX_WAJAR`). Di luar rentang → warning + perlu konfirmasi, sama seperti berat badan. |
| `zincValue`, `feValue` | **`feValue` baru ditambahkan** — angka positif, satuan sesuai lab yang dipakai. |
| `tanggalPengukuran` (`ENDLINE`) | Harus ≥ 28 hari setelah `tanggalPengukuran` `BASELINE` balita tsb (tetap dicek sebagai pengaman tambahan, walau §7 di bawah sudah mengunci secara hari studi). |

## 4. Validasi Input — `Balita`

| Field | Rule |
|---|---|
| `usiaBulan` | 0–59 bulan. |
| `jenisKelamin` | `L` \| `P`. |
| `tinggiBadanAwal`, `beratBadanAwal` | Wajib diisi, angka positif. |
| `posyandu` | Wajib diisi (teks bebas). |
| `kaderId` | Wajib dipilih. |
| `tanggalLahir`, `namaIbu`, `alamat`, `noTelp`, `provinsi`, `kabupatenKota`, `kecamatan`, `puskesmas`, `desaKelurahan`, `rt`, `rw` | **Semua opsional** — boleh dikosongkan tanpa gagal submit. `provinsi`/`kabupatenKota`/`kecamatan`/`desaKelurahan` diisi via dropdown berjenjang (bisa fallback isi manual — lihat `architecture.md` §7), sisanya isian teks bebas. |

## 5. Validasi Input — `RiwayatPemeriksaanAwal`

Semua field **opsional**. Baris ini hanya dibuat kalau **minimal satu** field-nya diisi saat
submit form Tambah Balita — kalau bagian "Riwayat Pemeriksaan Sebelum Proyek Ini" tidak pernah
dibuka/diisi sama sekali, tidak ada baris `RiwayatPemeriksaanAwal` yang dibuat untuk balita itu.

## 6. Aturan Data Hilang (Missing Data) — `CatatanHarian`

Tidak berubah dari v1: baris untuk semua 28 hari **dibuat otomatis** saat balita didaftarkan,
dengan `statusInput = TIDAK_TERISI`. Kalau kader tidak input pada hari itu, baris dibiarkan
kosong. Tidak ada backfill.

## 7. Aturan "Kunci Hari" — `HasilLab` (baru)

Hb/Zinc/Fe diambil di **3 checkpoint**: Baseline (Hari ke-1), Pertengahan (Hari ke-14), Endline
(Hari ke-28) — lihat `HARI_LAB` di `src/lib/constants.ts`. Untuk mencegah data ke-input/ke-ubah
tidak sengaja di hari yang salah:

- Form input untuk suatu tipe lab **hanya dirender** kalau hari studi balita itu **hari ini**
  (dihitung dari `tanggalMulai`, bukan tanggal kalender biasa) **sama dengan** hari target tipe
  tersebut. Di luar hari itu, hanya ringkasan angka tersimpan yang ditampilkan (read-only, tanpa
  form sama sekali).
- Ini ditegakkan di **dua tempat**: di UI (form memang tidak dirender) dan di server
  (`submitHasilLab` menolak submit kalau `hariKe` hari ini ≠ hari target tipe yang disubmit) —
  supaya tidak bisa dilewati lewat request langsung.
- **Pengecualian: Baseline.** Baseline ditangani lewat alur onboarding (§8), bukan lewat kunci
  hari biasa — jadi tetap bisa diisi kapan saja **selama data hari-1 belum pernah disubmit**,
  tidak strict harus tepat di hari kalender balita didaftarkan (mengantisipasi kader yang baru
  buka sistem beberapa hari setelah balita ditambahkan).
- **Belum ada toleransi keterlambatan** untuk Pertengahan/Endline (mis. ±2 hari) — kalau kader
  terlambat mengukur di luar hari target, saat ini datanya tidak bisa diinput sama sekali lewat
  form. Kalau dibutuhkan toleransi atau override khusus admin, ini dicatat sebagai enhancement
  di §11.

## 8. Aturan Onboarding Hari ke-1 (baru)

Untuk balita yang baru ditambahkan, input hari ke-1 (data harian) dan Hasil Lab Baseline
**digabung jadi satu form** (`OnboardingForm` → `submitHariPertama`), bukan dua form terpisah:

- Form gabungan ini yang tampil di halaman detail balita **selama** `CatatanHarian` hari ke-1
  belum `TERISI` **atau** `HasilLab` `BASELINE` belum ada.
- Begitu disubmit (satu tombol, satu Server Action, dua tabel diupdate sekaligus), halaman
  otomatis berganti ke tampilan dashboard biasa (chart tren, ringkasan, dst.) — sama seperti
  yang dilihat kader untuk hari ke-2 dan seterusnya.
- Halaman `/kader/balita/[id]/input` (input harian biasa) **redirect balik** ke halaman detail
  kalau hari ke-1 belum selesai — supaya kader tidak bisa mengisi data harian tanpa Baseline
  lewat jalan pintas.

## 9. Aturan Balita Dropout

Tidak berubah dari v1: `status = DROPOUT` (tidak dihapus dari database). Balita `DROPOUT` tidak
muncul di form input aktif, tapi tetap muncul di export dengan penanda status.

## 10. Aturan Akun

- Akun kader dibuat oleh Admin, bukan self-register.
- **Update ditambahkan** (sebelumnya hanya Tambah/Hapus): Admin bisa update `username`, `nama`,
  dan opsional ganti `password` (kosongkan field password di form edit kalau tidak mau ganti).
- Kader tidak bisa dihapus kalau masih menangani balita aktif — harus dipindah ke kader lain dulu
  (dicek di `deleteKader`).
- Satu kader = satu akun, tidak ada shared account.

## 11. Future Enhancements (masih di luar scope)

- 🔲 Notifikasi/reminder otomatis (email/WA) ke kader yang belum input hari ini
- 🔲 Perhitungan status gizi formal pakai standar WHO Z-score (BB/U, BB/TB, BB/PB) — saat ini
  `RiwayatPemeriksaanAwal` menyimpan kategori/Z-score dari catatan lama secara manual, belum ada
  perhitungan otomatis untuk data studi 28 hari yang baru
- 🔲 Backfill data dengan flag "telat input"
- 🔲 Toleransi keterlambatan (±N hari) atau override admin untuk checkpoint lab Pertengahan/Endline
  yang terlewat (lihat §7)
- 🔲 Multi-studi / multi-cohort
- 🔲 Alert otomatis kalau berat badan balita turun signifikan (butuh threshold klinis yang tervalidasi)
- 🔲 Integrasi alat ukur digital (timbangan/lab terhubung otomatis)
- 🔲 Rapikan format nama wilayah dari API (kadang huruf besar semua, mis. "JAWA BARAT") jadi Title Case