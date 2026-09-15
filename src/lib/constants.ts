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

export const TIPE_LAB = ["BASELINE", "PERTENGAHAN", "ENDLINE"] as const;
export type TipeLab = (typeof TIPE_LAB)[number];

// Hasil lab Hb/Zinc/Fe diambil 3x: awal, pertengahan, akhir studi. Form input
// masing-masing HANYA muncul pas hari studinya — supaya tidak ada yang kepencet/
// keganti tidak sengaja di hari lain (lihat submitHasilLab yang juga menegakkan ini
// di server, bukan cuma di UI).
export const HARI_LAB: Record<TipeLab, number> = {
  BASELINE: 1,
  PERTENGAHAN: Math.round(DURASI_STUDI_HARI / 2), // hari ke-14
  ENDLINE: DURASI_STUDI_HARI, // hari ke-28
};

export const LABEL_LAB: Record<TipeLab, string> = {
  BASELINE: "Baseline (Awal)",
  PERTENGAHAN: "Pertengahan",
  ENDLINE: "Endline (Akhir)",
};

// Range wajar untuk warning (bukan hard block) — rule.md §2
export const BERAT_BADAN_MIN_WAJAR = 3;
export const BERAT_BADAN_MAX_WAJAR = 30;
export const HB_MIN_WAJAR = 7;
export const HB_MAX_WAJAR = 16;

// Opsi untuk data riwayat pemeriksaan sebelum proyek (dari catatan posyandu lama)
export const CARA_UKUR = ["Berdiri", "Telentang"] as const;
export const KATEGORI_GIZI = ["Gizi Buruk", "Gizi Kurang", "Gizi Baik", "Gizi Lebih"] as const;
export const KATEGORI_TB_U = ["Sangat Pendek", "Pendek", "Normal", "Tinggi"] as const;
export const HASIL_KPSP = ["Sesuai", "Meragukan", "Penyimpangan"] as const;
