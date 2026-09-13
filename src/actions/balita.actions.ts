"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { balitaSchema, balitaStatusSchema } from "@/lib/validators";
import { DURASI_STUDI_HARI } from "@/lib/constants";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Hanya SPV Kader yang bisa melakukan aksi ini");
  }
  return session;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createBalita(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const parsed = balitaSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

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
      },
    });

    // Generate 28 baris CatatanHarian kosong — lihat rule.md §3
    const mulai = balita.tanggalMulai;
    const rows = Array.from({ length: DURASI_STUDI_HARI }, (_, day) => {
      const tanggal = new Date(mulai);
      tanggal.setDate(tanggal.getDate() + day);
      return {
        balitaId: balita.id,
        tanggal,
        hariKe: day + 1,
        statusInput: "TIDAK_TERISI",
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
