import { DURASI_STUDI_HARI } from "./constants";

export function formatTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
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
