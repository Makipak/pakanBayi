"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { catatanHarianSchema } from "@/lib/validators";
import { BERAT_BADAN_MAX_WAJAR, BERAT_BADAN_MIN_WAJAR } from "@/lib/constants";
import type { ActionResult } from "./balita.actions";

// Cek scope: kader hanya boleh akses balita miliknya sendiri (rule.md §1, architecture.md §3)
async function getScopedBalitaOrThrow(balitaId: string) {
  const session = await auth();
  if (!session) throw new Error("Belum login");

  const balita = await prisma.balita.findUnique({ where: { id: balitaId } });
  if (!balita) throw new Error("Balita tidak ditemukan");

  if (session.user.role === "KADER" && balita.kaderId !== session.user.id) {
    throw new Error("Anda tidak punya akses ke balita ini");
  }
  return { balita, session };
}

export async function submitCatatanHarian(
  balitaId: string,
  formData: FormData
): Promise<ActionResult & { warning?: string }> {
  try {
    const { session } = await getScopedBalitaOrThrow(balitaId);

    const raw = Object.fromEntries(formData.entries());
    const parsed = catatanHarianSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    const catatan = await prisma.catatanHarian.findUnique({
      where: { id: data.catatanHarianId },
    });
    if (!catatan || catatan.balitaId !== balitaId) {
      return { ok: false, error: "Catatan harian tidak ditemukan" };
    }

    // Tanggal tidak boleh di masa depan (rule.md §2)
    if (catatan.tanggal > new Date()) {
      return { ok: false, error: "Tidak bisa input untuk tanggal di masa depan" };
    }

    // Warning (bukan hard block) untuk berat badan di luar rentang wajar
    const outOfRange =
      data.beratBadan < BERAT_BADAN_MIN_WAJAR || data.beratBadan > BERAT_BADAN_MAX_WAJAR;
    if (outOfRange && !data.confirmOutOfRange) {
      return {
        ok: false,
        error: `Berat badan ${data.beratBadan}kg di luar rentang wajar (${BERAT_BADAN_MIN_WAJAR}-${BERAT_BADAN_MAX_WAJAR}kg). Centang konfirmasi jika data ini valid.`,
        warning: "out_of_range",
      };
    }

    await prisma.catatanHarian.update({
      where: { id: data.catatanHarianId },
      data: {
        beratBadan: data.beratBadan,
        konsumsiNuggetGram: data.konsumsiNuggetGram,
        statusInput: "TERISI",
        inputBy: session.user.id,
      },
    });

    revalidatePath(`/kader/balita/${balitaId}`);
    revalidatePath(`/kader/balita/${balitaId}/input`);
    revalidatePath(`/admin/balita/${balitaId}`);
    revalidatePath("/kader/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal simpan catatan harian" };
  }
}
