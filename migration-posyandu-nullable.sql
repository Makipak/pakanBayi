-- Update produksi (PostgreSQL): form balita disederhanakan jadi
-- nama, usia, jenis kelamin, tinggi, berat, kader penanggung jawab.
-- Kolom posyandu tidak lagi diisi -> harus boleh NULL. Data lama TIDAK diubah.
-- Aman dijalankan berulang kali.
ALTER TABLE "Balita" ALTER COLUMN "posyandu" DROP NOT NULL;
