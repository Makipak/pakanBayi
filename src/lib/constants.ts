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

// Hasil lab Hb/Zinc/Fe diambil 2x: awal dan akhir studi (checkpoint "pertengahan" sudah
// dihapus; nilai enum PERTENGAHAN di DB dibiarkan demi data lama, tidak dipakai lagi). Form input
// masing-masing HANYA muncul pas hari studinya — supaya tidak ada yang kepencet/
// keganti tidak sengaja di hari lain (lihat submitHasilLab yang juga menegakkan ini
// di server, bukan cuma di UI).
export const HARI_LAB: Record<TipeLab, number> = {
  BASELINE: 1,
  ENDLINE: DURASI_STUDI_HARI, // hari ke-28
};

export const LABEL_LAB: Record<TipeLab, string> = {
  BASELINE: "Baseline (Awal)",
  ENDLINE: "Endline (Akhir)",
};

// Range wajar untuk warning (bukan hard block) — rule.md §2
export const BERAT_BADAN_MIN_WAJAR = 3;
export const BERAT_BADAN_MAX_WAJAR = 30;
export const HB_MIN_WAJAR = 7;
export const HB_MAX_WAJAR = 16;
