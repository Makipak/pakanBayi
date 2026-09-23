import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DURASI_STUDI_HARI } from "../src/lib/constants";

// Fix sama seperti server.js: batasi CPU affinity SEBELUM instansiasi
// PrismaClient, supaya Tokio runtime di query engine nggak auto-scale ke
// 30 core yang keliatan di server (lihat insiden LVE Number of Processes
// 22-23 Sep 2026). Script standalone kayak seed.ts nggak lewat server.js,
// jadi perlu guard sendiri di sini.
try {
  require("child_process").execFileSync("taskset", ["-pc", "0,1", String(process.pid)]);
  console.log("[seed] CPU affinity dibatasi ke core 0,1 (taskset)");
} catch (err) {
  console.error("[seed] taskset gagal, lanjut tanpa CPU affinity limit:", (err as Error).message);
}

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
      const tinggiAwal = 70 + Math.round(Math.random() * 20);

      const existing = await prisma.balita.findFirst({
        where: { nama, kaderId: kader.id },
      });
      if (existing) continue;

      const balita = await prisma.balita.create({
        data: {
          nama,
          usiaBulan: 12 + Math.floor(Math.random() * 40),
          jenisKelamin: Math.random() > 0.5 ? "L" : "P",
          tinggiBadanAwal: tinggiAwal,
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
          statusInput: "TIDAK_TERISI" as const,
        };
      });
      await prisma.catatanHarian.createMany({ data: rows });

      // Sengaja TIDAK di-prefill — semua 28 hari mulai kosong (TIDAK_TERISI) dan
      // belum ada HasilLab sama sekali, supaya kader bisa langsung coba alur input
      // dari nol (termasuk input Baseline hari-0) begitu login.
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
