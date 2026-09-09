export const DURASI_STUDI_HARI = 28;
export const TARGET_NUGGET_GRAM = 50; // 2 biji x 25gr

export const ROLES = ["ADMIN", "KADER"] as const;
export type Role = (typeof ROLES)[number];

export const JENIS_KELAMIN = ["L", "P"] as const;
export type JenisKelamin = (typeof JENIS_KELAMIN)[number];

export const STATUS_BALITA = ["AKTIF", "SELESAI", "DROPOUT"] as const;
export type StatusBalita = (typeof STATUS_BALITA)[number];

export const STATUS_INPUT = ["TERISI", "TIDAK_TERISI"] as const;
export type StatusInput = (typeof STATUS_INPUT)[number];

export const TIPE_LAB = ["BASELINE", "ENDLINE"] as const;
export type TipeLab = (typeof TIPE_LAB)[number];

// Range wajar untuk warning (bukan hard block) — rule.md §2
export const BERAT_BADAN_MIN_WAJAR = 3;
export const BERAT_BADAN_MAX_WAJAR = 30;
export const HB_MIN_WAJAR = 7;
export const HB_MAX_WAJAR = 16;
