# Rule — NUTRIMO (Nuget Nutrition Monitoring): Business Rules & Validasi

> **Update 19 Okt 2026:** hasil lab Hb/Zinc/Fe kini **2 checkpoint** (Baseline hari-1 & Endline hari-28);
> checkpoint Pertengahan dihapus (nilai enum `PERTENGAHAN` tetap ada di DB untuk data lama, tidak dipakai).
> Asupan makronutrien harian (karbohidrat/protein/lemak) kini **opsional**.

> **Update:** ditambahkan aturan "kunci hari" untuk hasil lab (3 checkpoint, bukan 2), aturan
> onboarding hari-1, kader sekarang bisa di-update (bukan cuma add/delete), dan validasi field
> baru di `Balita`/`RiwayatPemeriksaanAwal`. Proyek ini sekarang bernama **NUTRIMO**.

> **Update 18 Okt 2026 — form input balita disederhanakan:** hanya 6 field (nama, usia, jenis kelamin,
> tinggi badan, berat badan, kader penanggung jawab). Field kontak, wilayah, posyandu, dan riwayat
> pemeriksaan sudah tidak diisi lagi; data lama tetap tersimpan dan tampil read-only.

## 1. Role Permission Matrix

| Aksi | Admin ("SPV Kader" di UI) | Kader |
|---|---|---|
| Lihat semua balita | ✅ | ❌ (hanya balita miliknya) |
| Tambah & edit balita (6 field) | ✅ | ❌ |
| Update status balita (AKTIF/SELESAI/DROPOUT) | ✅ | ❌ |
| Hapus balita | ✅ | ❌ |
| Input `CatatanHarian` (harian) | ✅ (semua balita) | ✅ (hanya balita miliknya) |
| Edit `CatatanHarian` yang sudah diisi | ✅ | ✅ (hanya milik sendiri) |
| Input `HasilLab` (Baseline/Endline) | ✅ (semua balita) | ✅ (hanya balita miliknya) — **dikunci ke hari yang sesuai, lihat §7** |
| Isi form onboarding hari-1 (`submitHariPertama`) | ✅ | ✅ (hanya balita miliknya) |
| Tambah akun kader | ✅ | ❌ |
| **Update akun kader** (username/password) | ✅ | ❌ |
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
| `karbohidratGram`, `proteinGram`, `lemakGram` | **Opsional** (sejak 19 Okt 2026) — boleh dikosongkan (disimpan `null`); kalau diisi harus angka ≥ 0. Berlaku di input harian dan onboarding hari-1. |
| `hariKe` | 1–28, harus sesuai `tanggalMulai` balita. |
| `tanggal` | Tidak boleh di masa depan. |

## 3. Validasi Input — `HasilLab`

| Field | Rule |
|---|---|
| `tipe` | `BASELINE` \| `ENDLINE` (**2 tipe**; `PERTENGAHAN` masih ada di enum DB tapi tidak dipakai lagi). Satu balita maksimal 1 record per tipe (unique constraint, disimpan via `upsert`). |
| `hbValue` | Angka positif, rentang wajar klinis 7–16 g/dL (`HB_MIN_WAJAR`/`MAX_WAJAR`). Di luar rentang → warning + perlu konfirmasi, sama seperti berat badan. |
| `zincValue`, `feValue` | **`feValue` baru ditambahkan** — angka positif, satuan sesuai lab yang dipakai. |
| `tanggalPengukuran` (`ENDLINE`) | Harus ≥ 28 hari setelah `tanggalPengukuran` `BASELINE` balita tsb (tetap dicek sebagai pengaman tambahan, walau §7 di bawah sudah mengunci secara hari studi). |

## 4. Validasi Input — `Balita`

| Field | Rule |
|---|---|
| `usiaBulan` | 0–59 bulan. |
| `jenisKelamin` | `L` \| `P`. |
| `tinggiBadanAwal`, `beratBadanAwal` | Wajib diisi, angka positif. |
| `nama` | Wajib diisi (spasi di awal/akhir dibuang). |
| `kaderId` | Wajib dipilih; harus akun berrole `KADER` (dicek di `createBalita` & `updateBalita`). |

Field lain (kontak, wilayah, posyandu, riwayat) **tidak ada di form dan tidak divalidasi lagi**.
`updateBalita` hanya mengubah 6 field di atas; data lama pada kolom legacy tidak disentuh.

## 5. `RiwayatPemeriksaanAwal` (legacy)

Form pengisian riwayat pemeriksaan sudah **dihapus** (18 Okt 2026) dan tidak ada validasinya lagi.
Tabel dan data lama dipertahankan; tampil read-only di detail admin hanya untuk balita yang
memang punya datanya.

## 6. Aturan Data Hilang (Missing Data) — `CatatanHarian`

Tidak berubah dari v1: baris untuk semua 28 hari **dibuat otomatis** saat balita didaftarkan,
dengan `statusInput = TIDAK_TERISI`. Kalau kader tidak input pada hari itu, baris dibiarkan
kosong. Tidak ada backfill.

## 7. Aturan "Kunci Hari" — `HasilLab` (baru)

Hb/Zinc/Fe diambil di **2 checkpoint**: Baseline (Hari ke-1) dan Endline (Hari ke-28) — lihat `HARI_LAB` di `src/lib/constants.ts`. Untuk mencegah data ke-input/ke-ubah
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
- **Belum ada toleransi keterlambatan** untuk Endline (mis. ±2 hari) — kalau kader
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
- **Form akun kader hanya berisi `username` dan `password`** (sejak 19 Okt 2026, tanpa nama lengkap).
  Kolom `nama` di DB tetap wajib, jadi otomatis diisi sama dengan `username` agar label di dropdown
  kader dan export tetap terisi. Akun lama tetap memakai nama lengkapnya.
- **Update ditambahkan** (sebelumnya hanya Tambah/Hapus): Admin bisa update `username` dan opsional
  ganti `password` (kosongkan field password di form edit kalau tidak mau ganti). Jika `nama` masih
  sama dengan username lama, ikut diperbarui.
- Kader tidak bisa dihapus kalau masih menangani balita aktif — harus dipindah ke kader lain dulu
  (dicek di `deleteKader`).
- Satu kader = satu akun, tidak ada shared account.
- **Login "Ingat saya"** (checkbox, default tercentang): dicentang → sesi bertahan 30 hari; tidak dicentang → sesi habis dalam 12 jam. Nilainya di `src/auth.ts` (`INGAT_SAYA_DETIK`, `TANPA_INGAT_SAYA_DETIK`). Jangan dicentang di perangkat bersama.

## 11. Future Enhancements (masih di luar scope)

- 🔲 Notifikasi/reminder otomatis (email/WA) ke kader yang belum input hari ini
- 🔲 Perhitungan status gizi formal pakai standar WHO Z-score (BB/U, BB/TB, BB/PB) — saat ini
  `RiwayatPemeriksaanAwal` menyimpan kategori/Z-score dari catatan lama secara manual, belum ada
  perhitungan otomatis untuk data studi 28 hari yang baru
- 🔲 Backfill data dengan flag "telat input"
- 🔲 Toleransi keterlambatan (±N hari) atau override admin untuk checkpoint lab Endline
  yang terlewat (lihat §7)
- 🔲 Multi-studi / multi-cohort
- 🔲 Alert otomatis kalau berat badan balita turun signifikan (butuh threshold klinis yang tervalidasi)
- 🔲 Integrasi alat ukur digital (timbangan/lab terhubung otomatis)
