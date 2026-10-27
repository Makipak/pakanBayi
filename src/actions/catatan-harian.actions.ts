"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { catatanHarianSchema } from "@/lib/validators";
import { BERAT_BADAN_MAX_WAJAR, BERAT_BADAN_MIN_WAJAR } from "@/lib/constants";
import { cariReferensi, FIELD_SALINAN, sudahTiba } from "@/lib/data";
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

    // Tanggal tidak boleh di masa depan (rule.md §2). Hari yang terlewat boleh diisi belakangan.
    if (!sudahTiba(catatan.tanggal)) {
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

    // Tandai field yang nilainya identik dengan hari referensi (dihitung di server, bukan dipercaya dari klien).
    const semuaHari = await prisma.catatanHarian.findMany({ where: { balitaId } });
    const ref = cariReferensi(semuaHari, catatan.hariKe);
    const salinan = ref
      ? FIELD_SALINAN.filter((f) => data[f] != null && ref[f] != null && data[f] === ref[f])
      : [];

    await prisma.catatanHarian.update({
      where: { id: data.catatanHarianId },
      data: {
        tinggiBadan: data.tinggiBadan,
        beratBadan: data.beratBadan,
        konsumsiNuggetGram: data.konsumsiNuggetGram,
        energiKkal: data.energiKkal ?? null,
        karbohidratGram: data.karbohidratGram ?? null,
        proteinGram: data.proteinGram ?? null,
        lemakGram: data.lemakGram ?? null,
        keterangan: data.keterangan ?? null,
        salinanField: salinan.length ? salinan.join(",") : null,
        salinanDariHari: salinan.length && ref ? ref.hariKe : null,
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

/**
 * Kosongkan isian satu hari (mis. salah input): semua nilai dikembalikan ke kosong dan
 * status menjadi TIDAK_TERISI. Barisnya tetap ada (kalender 28 hari tidak berubah).
 * Hasil lab tidak ikut terhapus. Admin atau kader pemilik balita.
 */
export async function kosongkanCatatanHarian(
  balitaId: string,
  catatanHarianId: string
): Promise<ActionResult> {
  try {
    await getScopedBalitaOrThrow(balitaId);

    const catatan = await prisma.catatanHarian.findUnique({ where: { id: catatanHarianId } });
    if (!catatan || catatan.balitaId !== balitaId) {
      return { ok: false, error: "Catatan harian tidak ditemukan" };
    }
    if (catatan.statusInput !== "TERISI") {
      return { ok: false, error: "Hari ini memang belum terisi" };
    }

    await prisma.catatanHarian.update({
      where: { id: catatanHarianId },
      data: {
        tinggiBadan: null,
        beratBadan: null,
        konsumsiNuggetGram: null,
        energiKkal: null,
        karbohidratGram: null,
        proteinGram: null,
        lemakGram: null,
        keterangan: null,
        salinanField: null,
        salinanDariHari: null,
        statusInput: "TIDAK_TERISI",
        inputBy: null,
      },
    });

    revalidatePath(`/kader/balita/${balitaId}`);
    revalidatePath(`/kader/balita/${balitaId}/input`);
    revalidatePath(`/admin/balita/${balitaId}`);
    revalidatePath("/kader/dashboard");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengosongkan catatan harian" };
  }
}
