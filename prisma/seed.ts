import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DURASI_STUDI_HARI } from "../src/lib/constants";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding...");

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: await hash("admin123"),
      role: "ADMIN",
      nama: "Peneliti Utama",
    },
  });

  const kaderData = [
    { username: "kader1", nama: "Kader Posyandu Melati" },
    { username: "kader2", nama: "Kader Posyandu Mawar" },
    { username: "kader3", nama: "Kader Posyandu Anggrek" },
    { username: "kader4", nama: "Kader Posyandu Kenanga" },
  ];

  const kaders = [];
  for (const k of kaderData) {
    const kader = await prisma.user.upsert({
      where: { username: k.username },
      update: {},
      create: {
        username: k.username,
        passwordHash: await hash("kader123"),
        role: "KADER",
        nama: k.nama,
      },
    });
    kaders.push(kader);
  }

  // Contoh 2 balita per kader (8 total) supaya ada data demo untuk dilihat.
  // Sisanya (sampai 40) tinggal ditambah Admin lewat halaman "Kelola Balita".
  const namaContoh = [
    "Ahmad Fauzi", "Siti Aminah", "Budi Santoso", "Dewi Lestari",
    "Rizky Pratama", "Nurul Huda", "Fajar Ramadhan", "Putri Ayu",
  ];

  let idx = 0;
  const mulaiStudi = new Date();
  mulaiStudi.setHours(0, 0, 0, 0);

  for (const kader of kaders) {
    for (let i = 0; i < 2; i++) {
      const nama = namaContoh[idx % namaContoh.length];
      idx++;
      const beratAwal = 8 + Math.round(Math.random() * 6);

      const existing = await prisma.balita.findFirst({
        where: { nama, kaderId: kader.id },
      });
      if (existing) continue;

      const balita = await prisma.balita.create({
        data: {
          nama,
          usiaBulan: 12 + Math.floor(Math.random() * 40),
          jenisKelamin: Math.random() > 0.5 ? "L" : "P",
          tinggiBadanAwal: 70 + Math.round(Math.random() * 20),
          beratBadanAwal: beratAwal,
          posyandu: `Posyandu ${kader.nama.split(" ").pop()}`,
          kaderId: kader.id,
          status: "AKTIF",
          tanggalMulai: mulaiStudi,
        },
      });

      // Generate 28 baris CatatanHarian kosong (status_input = TIDAK_TERISI)
      const rows = Array.from({ length: DURASI_STUDI_HARI }, (_, day) => {
        const tanggal = new Date(mulaiStudi);
        tanggal.setDate(tanggal.getDate() + day);
        return {
          balitaId: balita.id,
          tanggal,
          hariKe: day + 1,
          statusInput: "TIDAK_TERISI",
        };
      });
      await prisma.catatanHarian.createMany({ data: rows });

      // Isi 3 hari pertama sebagai contoh data terisi
      for (let day = 0; day < 3; day++) {
        const catatan = await prisma.catatanHarian.findFirst({
          where: { balitaId: balita.id, hariKe: day + 1 },
        });
        if (!catatan) continue;
        await prisma.catatanHarian.update({
          where: { id: catatan.id },
          data: {
            beratBadan: beratAwal + day * 0.05,
            konsumsiNuggetGram: 40 + Math.round(Math.random() * 10),
            statusInput: "TERISI",
            inputBy: kader.id,
          },
        });
      }

      // Hasil lab baseline
      await prisma.hasilLab.upsert({
        where: { balitaId_tipe: { balitaId: balita.id, tipe: "BASELINE" } },
        update: {},
        create: {
          balitaId: balita.id,
          tipe: "BASELINE",
          hbValue: 9 + Math.round(Math.random() * 30) / 10,
          zincValue: 50 + Math.round(Math.random() * 30),
          tanggalPengukuran: mulaiStudi,
          inputBy: kader.id,
        },
      });
    }
  }

  console.log("Seed selesai.");
  console.log("Login admin: admin / admin123");
  console.log("Login kader: kader1..kader4 / kader123");
  console.log({ admin: admin.username, kaders: kaders.map((k) => k.username) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
