import { z } from "zod";
import {
  DURASI_STUDI_HARI,
  JENIS_KELAMIN,
  STATUS_BALITA,
  TARGET_NUGGET_GRAM,
  TIPE_LAB,
} from "./constants";

// Asupan makronutrien (karbohidrat/protein/lemak) bersifat opsional: kolom kosong
// -> undefined (disimpan null), kalau diisi harus angka >= 0.
// Semua input angka menerima desimal; koma ("12,5") dan titik ("12.5") sama-sama diterima.
const normalisasiAngka = (v: unknown) =>
  typeof v === "string" ? (v.trim() === "" ? undefined : v.trim().replace(",", ".")) : v;
export const angka = (pesan = "Harus berupa angka") =>
  z.preprocess(normalisasiAngka, z.coerce.number({ error: pesan }));

export const gramOpsional = z.preprocess(
  normalisasiAngka,
  z.coerce.number({ error: "Harus berupa angka" }).min(0, "Tidak boleh negatif").optional()
);

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

// Input balita sengaja minimal: identitas dasar + antropometri awal + kader penanggung jawab.
export const balitaSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  usiaBulan: angka("Usia wajib diisi (angka, boleh desimal)")
    .pipe(z.number().min(0, "Usia minimal 0 bulan").max(80, "Usia maksimal 80 bulan")),
  jenisKelamin: z.enum(JENIS_KELAMIN),
  tinggiBadanAwal: angka("Tinggi badan wajib diisi").pipe(z.number().positive("Tinggi badan wajib diisi")),
  beratBadanAwal: angka("Berat badan wajib diisi").pipe(z.number().positive("Berat badan wajib diisi")),
  kaderId: z.string().min(1, "Kader penanggung jawab wajib dipilih"),
});

export const balitaStatusSchema = z.object({
  status: z.enum(STATUS_BALITA),
});

export const kaderSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const catatanHarianSchema = z.object({
  catatanHarianId: z.string().min(1),
  tinggiBadan: angka("Tinggi badan wajib diisi (angka)").pipe(z.number().positive("Tinggi badan wajib angka positif")),
  beratBadan: angka("Berat badan wajib diisi (angka)").pipe(z.number().positive("Berat badan wajib angka positif")),
  konsumsiNuggetGram: angka("Konsumsi nugget wajib diisi (angka)").pipe(
    z.number().min(0, "Tidak boleh negatif").max(TARGET_NUGGET_GRAM, `Maksimal ${TARGET_NUGGET_GRAM} gram`)
  ),
  energiKkal: gramOpsional,
  karbohidratGram: gramOpsional,
  proteinGram: gramOpsional,
  lemakGram: gramOpsional,
  keterangan: z
    .string()
    .trim()
    .max(500, "Keterangan maksimal 500 karakter")
    .optional()
    .transform((v) => (v ? v : undefined)),
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export const hasilLabSchema = z.object({
  balitaId: z.string().min(1),
  tipe: z.enum(TIPE_LAB),
  hbValue: angka("Nilai Hb wajib diisi (angka)").pipe(z.number().positive("Nilai Hb wajib angka positif")),
  zincValue: angka("Nilai Zinc wajib diisi (angka)").pipe(z.number().positive("Nilai Zinc wajib angka positif")),
  tanggalPengukuran: z.string().min(1, "Tanggal wajib diisi"),
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BalitaInput = z.infer<typeof balitaSchema>;
export type KaderInput = z.infer<typeof kaderSchema>;
export type CatatanHarianInput = z.infer<typeof catatanHarianSchema>;
export type HasilLabInput = z.infer<typeof hasilLabSchema>;

export { DURASI_STUDI_HARI };
