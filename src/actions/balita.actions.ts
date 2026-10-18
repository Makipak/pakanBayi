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

async function requireKaderValid(kaderId: string): Promise<boolean> {
  const kader = await prisma.user.findFirst({
    where: { id: kaderId, role: "KADER" },
    select: { id: true },
  });
  return !!kader;
}

export async function createBalita(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = balitaSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    if (!(await requireKaderValid(data.kaderId))) {
      return { ok: false, error: "Kader penanggung jawab tidak valid" };
    }

    const balita = await prisma.balita.create({
      data: {
        nama: data.nama,
        usiaBulan: data.usiaBulan,
        jenisKelamin: data.jenisKelamin,
        tinggiBadanAwal: data.tinggiBadanAwal,
        beratBadanAwal: data.beratBadanAwal,
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

export async function updateBalita(balitaId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = balitaSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    const existing = await prisma.balita.findUnique({
      where: { id: balitaId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Balita tidak ditemukan" };

    if (!(await requireKaderValid(data.kaderId))) {
      return { ok: false, error: "Kader penanggung jawab tidak valid" };
    }

    // Hanya 6 field form yang disentuh. Data lama (kontak, wilayah, posyandu, riwayat
    // pemeriksaan) sengaja TIDAK di-update/dihapus supaya tidak hilang.
    await prisma.balita.update({
      where: { id: balitaId },
      data: {
        nama: data.nama,
        usiaBulan: data.usiaBulan,
        jenisKelamin: data.jenisKelamin,
        tinggiBadanAwal: data.tinggiBadanAwal,
        beratBadanAwal: data.beratBadanAwal,
        kaderId: data.kaderId,
      },
    });

    revalidatePath("/admin/balita");
    revalidatePath(`/admin/balita/${balitaId}`);
    revalidatePath("/admin/dashboard");
    // Kader lama & baru bisa berubah kalau balita dipindah tugas.
    revalidatePath("/kader");
    revalidatePath(`/kader/balita/${balitaId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal update balita" };
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
