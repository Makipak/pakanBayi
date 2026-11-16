-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'KADER');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusBalita" AS ENUM ('AKTIF', 'SELESAI', 'DROPOUT');

-- CreateEnum
CREATE TYPE "StatusInput" AS ENUM ('TERISI', 'TIDAK_TERISI');

-- CreateEnum
CREATE TYPE "TipeLab" AS ENUM ('BASELINE', 'PERTENGAHAN', 'ENDLINE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balita" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "usiaBulan" INTEGER NOT NULL,
    "jenisKelamin" "JenisKelamin" NOT NULL,
    "tinggiBadanAwal" DOUBLE PRECISION NOT NULL,
    "beratBadanAwal" DOUBLE PRECISION NOT NULL,
    "namaIbu" TEXT,
    "alamat" TEXT,
    "noTelp" TEXT,
    "provinsi" TEXT,
    "kabupatenKota" TEXT,
    "kecamatan" TEXT,
    "puskesmas" TEXT,
    "desaKelurahan" TEXT,
    "posyandu" TEXT NOT NULL,
    "rt" TEXT,
    "rw" TEXT,
    "kaderId" TEXT NOT NULL,
    "status" "StatusBalita" NOT NULL DEFAULT 'AKTIF',
    "tanggalMulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Balita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatPemeriksaanAwal" (
    "id" TEXT NOT NULL,
    "balitaId" TEXT NOT NULL,
    "usiaSaatUkurBulan" INTEGER,
    "tanggalPengukuran" TIMESTAMP(3),
    "berat" DOUBLE PRECISION,
    "tinggi" DOUBLE PRECISION,
    "caraUkur" TEXT,
    "lila" DOUBLE PRECISION,
    "bbU" TEXT,
    "zsBbU" DOUBLE PRECISION,
    "tbU" TEXT,
    "zsTbU" DOUBLE PRECISION,
    "bbTb" TEXT,
    "zsBbTb" DOUBLE PRECISION,
    "naikBeratBadan" BOOLEAN,
    "jmlVitA" INTEGER,
    "kpsp" TEXT,
    "kia" BOOLEAN,
    "kelasIbuBalita" BOOLEAN,
    "mbg" BOOLEAN,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatPemeriksaanAwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatatanHarian" (
    "id" TEXT NOT NULL,
    "balitaId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "hariKe" INTEGER NOT NULL,
    "tinggiBadan" DOUBLE PRECISION,
    "beratBadan" DOUBLE PRECISION,
    "konsumsiNuggetGram" DOUBLE PRECISION,
    "karbohidratGram" DOUBLE PRECISION,
    "proteinGram" DOUBLE PRECISION,
    "lemakGram" DOUBLE PRECISION,
    "statusInput" "StatusInput" NOT NULL DEFAULT 'TIDAK_TERISI',
    "inputBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatatanHarian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HasilLab" (
    "id" TEXT NOT NULL,
    "balitaId" TEXT NOT NULL,
    "tipe" "TipeLab" NOT NULL,
    "hbValue" DOUBLE PRECISION NOT NULL,
    "zincValue" DOUBLE PRECISION NOT NULL,
    "feValue" DOUBLE PRECISION NOT NULL,
    "tanggalPengukuran" TIMESTAMP(3) NOT NULL,
    "inputBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HasilLab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Balita_kaderId_idx" ON "Balita"("kaderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiwayatPemeriksaanAwal_balitaId_key" ON "RiwayatPemeriksaanAwal"("balitaId");

-- CreateIndex
CREATE INDEX "CatatanHarian_balitaId_idx" ON "CatatanHarian"("balitaId");

-- CreateIndex
CREATE INDEX "CatatanHarian_tanggal_idx" ON "CatatanHarian"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "CatatanHarian_balitaId_hariKe_key" ON "CatatanHarian"("balitaId", "hariKe");

-- CreateIndex
CREATE UNIQUE INDEX "HasilLab_balitaId_tipe_key" ON "HasilLab"("balitaId", "tipe");

-- AddForeignKey
ALTER TABLE "Balita" ADD CONSTRAINT "Balita_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatPemeriksaanAwal" ADD CONSTRAINT "RiwayatPemeriksaanAwal_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatatanHarian" ADD CONSTRAINT "CatatanHarian_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatatanHarian" ADD CONSTRAINT "CatatanHarian_inputBy_fkey" FOREIGN KEY ("inputBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasilLab" ADD CONSTRAINT "HasilLab_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasilLab" ADD CONSTRAINT "HasilLab_inputBy_fkey" FOREIGN KEY ("inputBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

