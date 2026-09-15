"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BERAT_BADAN_MAX_WAJAR,
  BERAT_BADAN_MIN_WAJAR,
  HB_MAX_WAJAR,
  HB_MIN_WAJAR,
  TARGET_NUGGET_GRAM,
} from "@/lib/constants";
import type { ActionResult } from "./balita.actions";

// Hari ke-1: input harian (berat/tinggi/nugget/makro) DIGABUNG dengan hasil lab
// Baseline dalam satu form/satu submit — supaya kader tidak perlu bolak-balik
// halaman untuk onboarding balita baru. Setelah ini tersimpan, halaman detail
// balita otomatis pindah ke tampilan dashboard biasa (lihat halaman detail).
const hariPertamaSchema = z.object({
  balitaId: z.string().min(1),
  catatanHarianId: z.string().min(1),

  tinggiBadan: z.coerce.number().positive("Tinggi badan wajib angka positif"),
  beratBadan: z.coerce.number().positive("Berat badan wajib angka positif"),
  konsumsiNuggetGram: z.coerce
    .number()
    .min(0, "Tidak boleh negatif")
    .max(TARGET_NUGGET_GRAM, `Maksimal ${TARGET_NUGGET_GRAM} gram`),
  karbohidratGram: z.coerce.number().min(0, "Tidak boleh negatif"),
  proteinGram: z.coerce.number().min(0, "Tidak boleh negatif"),
  lemakGram: z.coerce.number().min(0, "Tidak boleh negatif"),
  confirmBeratOutOfRange: z.coerce.boolean().optional(),

  tanggalPengukuranLab: z.string().min(1, "Tanggal pengukuran lab wajib diisi"),
  hbValue: z.coerce.number().positive("Nilai Hb wajib angka positif"),
  zincValue: z.coerce.number().positive("Nilai Zinc wajib angka positif"),
  feValue: z.coerce.number().positive("Nilai Fe wajib angka positif"),
  confirmHbOutOfRange: z.coerce.boolean().optional(),
});

export async function submitHariPertama(
  formData: FormData
): Promise<ActionResult & { warning?: "berat_out_of_range" | "hb_out_of_range" }> {
  try {
    const session = await auth();
    if (!session) return { ok: false, error: "Belum login" };

    const raw = Object.fromEntries(formData.entries());
    const parsed = hariPertamaSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    const balita = await prisma.balita.findUnique({
      where: { id: data.balitaId },
      include: { catatanHarian: true, hasilLab: true },
    });
    if (!balita) return { ok: false, error: "Balita tidak ditemukan" };
    if (session.user.role === "KADER" && balita.kaderId !== session.user.id) {
      return { ok: false, error: "Anda tidak punya akses ke balita ini" };
    }

    const hari1 = balita.catatanHarian.find((c) => c.hariKe === 1);
    if (!hari1 || hari1.id !== data.catatanHarianId) {
      return { ok: false, error: "Data hari pertama tidak ditemukan" };
    }
    if (hari1.statusInput === "TERISI") {
      return { ok: false, error: "Data hari pertama sudah pernah diisi" };
    }

    const beratOutOfRange =
      data.beratBadan < BERAT_BADAN_MIN_WAJAR || data.beratBadan > BERAT_BADAN_MAX_WAJAR;
    if (beratOutOfRange && !data.confirmBeratOutOfRange) {
      return {
        ok: false,
        error: `Berat badan ${data.beratBadan}kg di luar rentang wajar (${BERAT_BADAN_MIN_WAJAR}-${BERAT_BADAN_MAX_WAJAR}kg). Centang konfirmasi jika data ini valid.`,
        warning: "berat_out_of_range",
      };
    }

    const hbOutOfRange = data.hbValue < HB_MIN_WAJAR || data.hbValue > HB_MAX_WAJAR;
    if (hbOutOfRange && !data.confirmHbOutOfRange) {
      return {
        ok: false,
        error: `Nilai Hb ${data.hbValue} g/dL di luar rentang klinis wajar (${HB_MIN_WAJAR}-${HB_MAX_WAJAR}). Centang konfirmasi jika data ini valid.`,
        warning: "hb_out_of_range",
      };
    }

    await prisma.catatanHarian.update({
      where: { id: data.catatanHarianId },
      data: {
        tinggiBadan: data.tinggiBadan,
        beratBadan: data.beratBadan,
        konsumsiNuggetGram: data.konsumsiNuggetGram,
        karbohidratGram: data.karbohidratGram,
        proteinGram: data.proteinGram,
        lemakGram: data.lemakGram,
        statusInput: "TERISI",
        inputBy: session.user.id,
      },
    });

    await prisma.hasilLab.upsert({
      where: { balitaId_tipe: { balitaId: data.balitaId, tipe: "BASELINE" } },
      update: {
        hbValue: data.hbValue,
        zincValue: data.zincValue,
        feValue: data.feValue,
        tanggalPengukuran: new Date(data.tanggalPengukuranLab),
        inputBy: session.user.id,
      },
      create: {
        balitaId: data.balitaId,
        tipe: "BASELINE",
        hbValue: data.hbValue,
        zincValue: data.zincValue,
        feValue: data.feValue,
        tanggalPengukuran: new Date(data.tanggalPengukuranLab),
        inputBy: session.user.id,
      },
    });

    revalidatePath(`/kader/balita/${data.balitaId}`);
    revalidatePath(`/admin/balita/${data.balitaId}`);
    revalidatePath("/kader/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal simpan data hari pertama" };
  }
}
