# Monitoring Gizi Balita — Nugget Zinc (28 hari)

Web app untuk mencatat & memantau intervensi gizi balita (studi 28 hari), dibangun dari
`prd.md` / `architecture.md` / `schema.md` / `rule.md`. Next.js 16 (App Router) + Prisma
(SQLite untuk dev) + NextAuth v5 + Tailwind, mobile-first lalu progresif ke desktop.

## Setup pertama kali

Jalankan di terminal **biasa** (PowerShell/CMD/VS Code, atau terminal Linux/WSL), bukan lewat
Claude — supaya bisa akses internet penuh untuk download Prisma engine:

```bash
npm install
npm run db:setup   # generate Prisma client + buat dev.db + isi data contoh
npm run dev
```

Buka http://localhost:3000

## Develop di Linux

Project ini dibuat & lebih sering dites di Windows, tapi tidak ada yang khusus Windows di
kodenya — dependency native (Prisma engine, `@next/swc-*`, `@tailwindcss/oxide-*`, `lightningcss`)
otomatis resolve ke build Linux lewat `optionalDependencies`, jadi `npm install` di Linux cukup
apa adanya. Yang perlu diperhatikan:

- **Node.js ≥ 20.9** (syarat Next.js 16). Cek dengan `node -v`; kalau perlu ganti versi pakai
  `nvm` (`nvm install 20 && nvm use 20`).
- **Prisma butuh OpenSSL** untuk query engine-nya. Di Debian/Ubuntu biasanya sudah ada, tapi kalau
  `prisma generate`/`db push` gagal terkait `libssl`, install dulu:
  ```bash
  sudo apt-get update && sudo apt-get install -y openssl ca-certificates
  ```
  Untuk image minimal (mis. Alpine/Docker), pakai `openssl` juga (Prisma butuh `libssl` versi 1.1/3
  tergantung distro) — lihat error `prisma generate` untuk target binary yang persis dibutuhkan.
- **SQLite file (`dev.db`)** dibuat relatif ke `prisma/` lewat `DATABASE_URL="file:./dev.db"` di
  `.env` — path relatif ini portable, tidak perlu diubah antar OS.
- **Line endings**: repo belum punya `.gitattributes`; kalau pindah-pindah antara Windows dan
  Linux/WSL dan mulai lihat diff penuh karena CRLF/LF, tambahkan `.gitattributes` dengan
  `* text=auto eol=lf`.
- **Case sensitivity**: filesystem Linux case-sensitive (Windows umumnya tidak) — pastikan import
  path (`src/...`) persis sama huruf besar/kecilnya dengan nama file aslinya.
- Semua command di dokumen ini (`npm install`, `npm run db:setup`, dst.) sama persis di Linux,
  cukup jalankan lewat bash/zsh.

Login contoh (dari seed):
- Admin: `admin` / `admin123`
- Kader: `kader1`, `kader2`, `kader3`, `kader4` / `kader123` (masing-masing sudah punya 2 balita contoh)

## Kenapa ada langkah manual `npm install` + `npm run db:setup`?

Project ini di-generate & di-cek (TypeScript + ESLint bersih) lewat Claude, tapi environment
otomatisasi Claude tidak punya akses ke `binaries.prisma.sh` (dipakai Prisma CLI untuk
download query engine), jadi langkah `prisma generate` / `db push` / seed harus dijalankan
manual sekali di komputer kamu sendiri yang aksesnya tidak dibatasi.

## Struktur

- `src/app/admin/*` — halaman Admin/Peneliti (dashboard agregat, CRUD balita, kelola kader, export CSV)
- `src/app/kader/*` — halaman Kader (list balita miliknya, input harian, hasil lab)
- `src/actions/*` — Server Actions (mutasi data, scope-checked per role)
- `src/lib/validators.ts` — validasi Zod sesuai `rule.md`
- `prisma/schema.prisma` — skema DB (SQLite; enum di schema.md jadi String tervalidasi di app,
  lihat komentar di file untuk migrasi balik ke enum Postgres kalau deploy)
- `prisma/seed.ts` — data awal (1 admin, 4 kader, 8 balita contoh)

## Yang sudah jalan (sesuai prd.md scope v1)

- Login role-based (Admin/Kader), scope query kader difilter `kaderId` di server (bukan cuma UI)
- CRUD balita + assign kader, generate 28 baris CatatanHarian otomatis (rule.md §3)
- Input harian (BB + gram nugget) dengan validasi rentang & warning-bukan-block untuk BB di luar rentang wajar
- Input hasil lab Baseline/Endline (Hb & Zinc) + validasi jarak endline ≥ 28 hari
- Grafik tren berat badan per balita (Recharts)
- Dashboard agregat admin (compliance rate, delta BB, lab lengkap)
- Export CSV ringkasan per balita & detail harian (siap dibuka Excel/SPSS)
- Status balita AKTIF/SELESAI/DROPOUT (data historis tetap tersimpan)
- Mobile-first: bottom nav + form 1-kolom di HP, sidebar + grid multi-kolom di layar lebar (breakpoint `md`)

## Belum dikerjakan (sesuai rule.md §6 — memang di luar scope v1)

Notifikasi reminder, Z-score WHO formal, backfill data, multi-studi, alert otomatis BB turun,
integrasi alat ukur digital.

## Deploy (opsional, lihat architecture.md §6)

Ganti `datasource db` di `prisma/schema.prisma` dari `sqlite` ke `postgresql`, set
`DATABASE_URL` ke Postgres (Neon/Supabase), lalu redeploy migration. Field enum di schema
juga bisa dikembalikan jadi Prisma enum asli di Postgres (SQLite tidak mendukungnya).
