-- 24 Okt 2026: tambah energi (kkal) di input harian, Fe dihapus dari input lab.
ALTER TABLE "CatatanHarian" ADD COLUMN IF NOT EXISTS "energiKkal" DOUBLE PRECISION;
ALTER TABLE "HasilLab" ALTER COLUMN "feValue" DROP NOT NULL;
-- Kalender penelitian: tanggal Hari ke-1 dipilih lewat kalender (balita baru belum punya tanggal mulai).
ALTER TABLE "Balita" ALTER COLUMN "tanggalMulai" DROP NOT NULL;
ALTER TABLE "Balita" ALTER COLUMN "tanggalMulai" DROP DEFAULT;
-- Semua input angka boleh desimal (usia balita dalam bulan, mis. 24,5).
ALTER TABLE "Balita" ALTER COLUMN "usiaBulan" TYPE DOUBLE PRECISION;
