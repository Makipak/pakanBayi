import { DURASI_STUDI_HARI, TARGET_NUGGET_GRAM } from "./constants";

export function formatTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function complianceRate(jumlahTerisi: number): number {
  return Math.round((jumlahTerisi / DURASI_STUDI_HARI) * 1000) / 10; // 1 desimal
}

export function delta(akhir: number | null | undefined, awal: number): number | null {
  if (akhir === null || akhir === undefined) return null;
  return Math.round((akhir - awal) * 100) / 100;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type StatusKonsumsi = "HABIS" | "HAMPIR_HABIS" | "SEBAGIAN" | "SEDIKIT";

export const LABEL_KONSUMSI: Record<StatusKonsumsi, string> = {
  HABIS: "Habis",
  HAMPIR_HABIS: "Hampir habis",
  SEBAGIAN: "Sebagian",
  SEDIKIT: "Sedikit",
};

/**
 * Ringkasan konsumsi nugget satu balita. Rata-rata dihitung dari hari yang konsumsinya terisi
 * (hari kosong tidak menarik rata-rata turun). Status memakai persen rata-rata terhadap target:
 * >=100% Habis, >=75% Hampir habis, >=50% Sebagian, selain itu Sedikit.
 */
export function ringkasKonsumsiNugget(
  rows: { statusInput: string; konsumsiNuggetGram: number | null }[]
) {
  const ada = rows.filter((c) => c.statusInput === "TERISI" && c.konsumsiNuggetGram != null);
  if (ada.length === 0) return null;
  const total = ada.reduce((sum, c) => sum + (c.konsumsiNuggetGram ?? 0), 0);
  const rata = total / ada.length;
  const persen = (rata / TARGET_NUGGET_GRAM) * 100;
  const status: StatusKonsumsi =
    persen >= 100 ? "HABIS" : persen >= 75 ? "HAMPIR_HABIS" : persen >= 50 ? "SEBAGIAN" : "SEDIKIT";
  return {
    hariTerisi: ada.length,
    totalGram: Math.round(total * 10) / 10,
    rataGram: Math.round(rata * 10) / 10,
    persenTarget: Math.round(persen * 10) / 10,
    hariHabisPenuh: ada.filter((c) => (c.konsumsiNuggetGram ?? 0) >= TARGET_NUGGET_GRAM).length,
    status,
  };
}
