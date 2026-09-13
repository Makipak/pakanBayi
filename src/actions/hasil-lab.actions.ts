"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasilLabSchema } from "@/lib/validators";
import { HB_MAX_WAJAR, HB_MIN_WAJAR } from "@/lib/constants";
import type { ActionResult } from "./balita.actions";

export async function submitHasilLab(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) return { ok: false, error: "Belum login" };

    const raw = Object.fromEntries(formData.entries());
    const parsed = hasilLabSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
    }
    const data = parsed.data;

    const balita = await prisma.balita.findUnique({ where: { id: data.balitaId } });
    if (!balita) return { ok: false, error: "Balita tidak ditemukan" };
    if (session.user.role === "KADER" && balita.kaderId !== session.user.id) {
      return { ok: false, error: "Anda tidak punya akses ke balita ini" };
    }

    const outOfRange = data.hbValue < HB_MIN_WAJAR || data.hbValue > HB_MAX_WAJAR;
    if (outOfRange && !data.confirmOutOfRange) {
      return {
        ok: false,
        error: `Nilai Hb ${data.hbValue} g/dL di luar rentang klinis wajar (${HB_MIN_WAJAR}-${HB_MAX_WAJAR}). Centang konfirmasi jika data ini valid.`,
      };
    }

    if (data.tipe === "ENDLINE") {
      const baseline = await prisma.hasilLab.findUnique({
        where: { balitaId_tipe: { balitaId: data.balitaId, tipe: "BASELINE" } },
      });
      if (baseline) {
        const jarakHari =
          (new Date(data.tanggalPengukuran).getTime() -
            new Date(baseline.tanggalPengukuran).getTime()) /
          (1000 * 60 * 60 * 24);
        if (jarakHari < 28) {
          return {
            ok: false,
            error: "Tanggal endline harus minimal 28 hari setelah tanggal baseline",
          };
        }
      }
    }

    await prisma.hasilLab.upsert({
      where: { balitaId_tipe: { balitaId: data.balitaId, tipe: data.tipe } },
      update: {
        hbValue: data.hbValue,
        zincValue: data.zincValue,
        feValue: data.feValue,
        tanggalPengukuran: new Date(data.tanggalPengukuran),
        inputBy: session.user.id,
      },
      create: {
        balitaId: data.balitaId,
        tipe: data.tipe,
        hbValue: data.hbValue,
        zincValue: data.zincValue,
        feValue: data.feValue,
        tanggalPengukuran: new Date(data.tanggalPengukuran),
        inputBy: session.user.id,
      },
    });

    revalidatePath(`/kader/balita/${data.balitaId}`);
    revalidatePath(`/admin/balita/${data.balitaId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal simpan hasil lab" };
  }
}
