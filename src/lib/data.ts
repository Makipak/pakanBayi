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

/** Hari studi sudah tiba (tanggalnya hari ini atau sudah lewat) — hari terlewat boleh diisi belakangan. */
export function sudahTiba(tanggal: Date): boolean {
  return ymdWib(tanggal) <= ymdWib(new Date());
}

/**
 * Hari yang sedang dipilih di kalender: dari parameter `?hari=N` kalau valid; kalau tidak,
 * hari ini; kalau di luar rentang studi: hari terlewat pertama yang belum diisi (atau Hari 1).
 */
export function pilihHari<T extends { hariKe: number; tanggal: Date; statusInput: string }>(
  rows: T[],
  param?: string | string[]
): T | undefined {
  const raw = Array.isArray(param) ? param[0] : param;
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isInteger(n)) {
    const dipilih = rows.find((r) => r.hariKe === n);
    if (dipilih) return dipilih;
  }
  const hariIni = todayCatatan(rows);
  if (hariIni) return hariIni;
  const urut = [...rows].sort((a, b) => a.hariKe - b.hariKe);
  return urut.find((r) => sudahTiba(r.tanggal) && r.statusInput !== "TERISI") ?? urut[0];
}

/** Bentuk data ringkas untuk komponen KalenderStudi (aman dikirim ke client component). */
export function infoKalender(rows: { hariKe: number; tanggal: Date; statusInput: string }[]) {
  return rows.map((r) => ({
    hariKe: r.hariKe,
    ymd: ymdWib(r.tanggal),
    terisi: r.statusInput === "TERISI",
  }));
}
