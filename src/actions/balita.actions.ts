"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  balitaSchema,
  balitaStatusSchema,
  riwayatPemeriksaanSchema,
} from "@/lib/validators";
import { DURASI_STUDI_HARI } from "@/lib/constants";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Hanya SPV Kader yang bisa melakukan aksi ini");
  }
  return session;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// Field opsional (alamat, riwayat pemeriksaan, checkbox, dll) yang tidak dirender
// di DOM (mis. section "Riwayat Pemeriksaan" belum dibuka) atau checkbox yang tidak
// dicentang, sama sekali TIDAK MUNCUL sebagai key di FormData — bukan cuma bernilai
// kosong. Zod v4 memperlakukan key yang benar-benar hilang dari objek sebagai error
// "expected nonoptional" walau schema-nya sudah `.optional()`, begitu field itu
// dibungkus `.transform()`/`.refine()` lagi setelahnya. Jadi kita isi default ""
// dulu sebelum divalidasi supaya key-nya selalu ada.
const BALITA_OPTIONAL_KEYS = [
  "tanggalLahir",
  "namaIbu",
  "alamat",
  "noTelp",
  "provinsi",
  "kabupatenKota",
  "kecamatan",
  "puskesmas",
  "desaKelurahan",
  "rt",
  "rw",
] as const;

const RIWAYAT_KEYS = [
  "usiaSaatUkurBulan",
  "tanggalPengukuran",
  "berat",
  "tinggi",
  "caraUkur",
  "lila",
  "bbU",
  "zsBbU",
  "tbU",
  "zsTbU",
  "bbTb",
  "zsBbTb",
  "naikBeratBadan",
  "jmlVitA",
  "kpsp",
  "kia",
  "kelasIbuBalita",
  "mbg",
  "detail",
] as const;

function withDefaultKeys(
  raw: Record<string, FormDataEntryValue>,
  keys: readonly string[]
): Record<string, FormDataEntryValue> {
  const out = { ...raw };
  for (const key of keys) {
    if (!(key in out)) out[key] = "";
  }
  return out;
}

export async function createBalita(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const normalized = withDefaultKeys(withDefaultKeys(raw, BALITA_OPTIONAL_KEYS), RIWAYAT_KEYS);

    const parsed = balitaSchema.safeParse(normalized);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    const riwayatParsed = riwayatPemeriksaanSchema.safeParse(normalized);
    if (!riwayatParsed.success) {
      return {
        ok: false,
        error: riwayatParsed.error.issues[0]?.message ?? "Data riwayat pemeriksaan tidak valid",
      };
    }
    const riwayat = riwayatParsed.data;
    // "Ada isi riwayat?" dicek dari FormData ASLI (sebelum di-default ke ""), supaya
    // section yang tidak pernah dibuka user tidak ikut membuat baris riwayat kosong.
    const adaRiwayat = RIWAYAT_KEYS.some((key) => {
      const value = raw[key];
      return typeof value === "string" && value.trim().length > 0;
    });

    const balita = await prisma.balita.create({
      data: {
        nama: data.nama,
        usiaBulan: data.usiaBulan,
        jenisKelamin: data.jenisKelamin,
        tinggiBadanAwal: data.tinggiBadanAwal,
        beratBadanAwal: data.beratBadanAwal,
        posyandu: data.posyandu,
        kaderId: data.kaderId,
        status: "AKTIF",
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : undefined,
        namaIbu: data.namaIbu,
        alamat: data.alamat,
        noTelp: data.noTelp,
        provinsi: data.provinsi,
        kabupatenKota: data.kabupatenKota,
        kecamatan: data.kecamatan,
        puskesmas: data.puskesmas,
        desaKelurahan: data.desaKelurahan,
        rt: data.rt,
        rw: data.rw,
      },
    });

    if (adaRiwayat) {
      await prisma.riwayatPemeriksaanAwal.create({
        data: {
          balitaId: balita.id,
          usiaSaatUkurBulan: riwayat.usiaSaatUkurBulan,
          tanggalPengukuran: riwayat.tanggalPengukuran
            ? new Date(riwayat.tanggalPengukuran)
            : undefined,
          berat: riwayat.berat,
          tinggi: riwayat.tinggi,
          caraUkur: riwayat.caraUkur,
          lila: riwayat.lila,
          bbU: riwayat.bbU,
          zsBbU: riwayat.zsBbU,
          tbU: riwayat.tbU,
          zsTbU: riwayat.zsTbU,
          bbTb: riwayat.bbTb,
          zsBbTb: riwayat.zsBbTb,
          naikBeratBadan: riwayat.naikBeratBadan,
          jmlVitA: riwayat.jmlVitA,
          kpsp: riwayat.kpsp,
          kia: riwayat.kia,
          kelasIbuBalita: riwayat.kelasIbuBalita,
          mbg: riwayat.mbg,
          detail: riwayat.detail,
        },
      });
    }

    // Generate 28 baris CatatanHarian kosong — lihat rule.md §3
    const mulai = balita.tanggalMulai;
    const rows = Array.from({ length: DURASI_STUDI_HARI }, (_, day) => {
      const tanggal = new Date(mulai);
      tanggal.setDate(tanggal.getDate() + day);
      return {
        balitaId: balita.id,
        tanggal,
        hariKe: day + 1,
        statusInput: "TIDAK_TERISI" as const,
      };
    });
    await prisma.catatanHarian.createMany({ data: rows });

    revalidatePath("/admin/balita");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah balita" };
  }
}

export async function updateBalitaStatus(
  balitaId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const parsed = balitaStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Status tidak valid" };
    }
    await prisma.balita.update({
      where: { id: balitaId },
      data: { status: parsed.data.status },
    });
    revalidatePath("/admin/balita");
    revalidatePath(`/admin/balita/${balitaId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal update status" };
  }
}

export async function deleteBalita(balitaId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.balita.delete({ where: { id: balitaId } });
    revalidatePath("/admin/balita");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal hapus balita" };
  }
}

export async function createKader(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const username = String(raw.username ?? "").trim();
    const nama = String(raw.nama ?? "").trim();
    const password = String(raw.password ?? "");

    if (username.length < 3) return { ok: false, error: "Username minimal 3 karakter" };
    if (!nama) return { ok: false, error: "Nama wajib diisi" };
    if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter" };

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return { ok: false, error: "Username sudah dipakai" };

    await prisma.user.create({
      data: {
        username,
        nama,
        passwordHash: await bcrypt.hash(password, 10),
        role: "KADER",
      },
    });
    revalidatePath("/admin/kader");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah kader" };
  }
}

export async function updateKader(kaderId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const username = String(raw.username ?? "").trim();
    const nama = String(raw.nama ?? "").trim();
    const password = String(raw.password ?? "");

    if (username.length < 3) return { ok: false, error: "Username minimal 3 karakter" };
    if (!nama) return { ok: false, error: "Nama wajib diisi" };
    if (password.length > 0 && password.length < 6) {
      return { ok: false, error: "Password minimal 6 karakter (kosongkan jika tidak diganti)" };
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== kaderId) {
      return { ok: false, error: "Username sudah dipakai kader lain" };
    }

    await prisma.user.update({
      where: { id: kaderId },
      data: {
        username,
        nama,
        ...(password.length > 0 ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
    revalidatePath("/admin/kader");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal update kader" };
  }
}

export async function deleteKader(kaderId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const balitaCount = await prisma.balita.count({ where: { kaderId } });
    if (balitaCount > 0) {
      return {
        ok: false,
        error: `Kader masih menangani ${balitaCount} balita. Pindahkan balita ke kader lain dulu.`,
      };
    }
    await prisma.user.delete({ where: { id: kaderId } });
    revalidatePath("/admin/kader");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal hapus kader" };
  }
}
