// Tanggal studi selalu dihitung per tanggal kalender WIB (Asia/Jakarta), bukan zona
// waktu server, supaya "hari ini" dan "hari ke-N" tidak bergeser di server hosting
// yang berjalan di UTC.
const ZONA = "Asia/Jakarta";
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Tanggal kalender WIB dalam format "YYYY-MM-DD". */
export function ymdWib(d: Date | string): string {
  return ymdFmt.format(typeof d === "string" ? new Date(d) : d);
}

/** "YYYY-MM-DD" -> Date pada pukul 12:00 WIB (aman dari pergeseran hari). */
export function ymdKeDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0));
}

/** Tanggal hari studi ke-N (1-based) jika hari ke-1 jatuh pada `mulaiYmd`. */
export function tanggalStudi(mulaiYmd: string, hariKe: number): Date {
  return new Date(ymdKeDate(mulaiYmd).getTime() + (hariKe - 1) * 24 * 60 * 60 * 1000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return ymdWib(a) === ymdWib(b);
}

export function todayCatatan<T extends { tanggal: Date }>(rows: T[]): T | undefined {
  const today = new Date();
  return rows.find((r) => isSameDay(new Date(r.tanggal), today));
}
