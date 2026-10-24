-- 24 Okt 2026: tambah energi (kkal) di input harian, Fe dihapus dari input lab.
ALTER TABLE "CatatanHarian" ADD COLUMN IF NOT EXISTS "energiKkal" DOUBLE PRECISION;
ALTER TABLE "HasilLab" ALTER COLUMN "feValue" DROP NOT NULL;
