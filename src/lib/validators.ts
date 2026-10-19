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
export const gramOpsional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0, "Tidak boleh negatif").optional()
);

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

// Input balita sengaja minimal: identitas dasar + antropometri awal + kader penanggung jawab.
export const balitaSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  usiaBulan: z.coerce
    .number()
    .int()
    .min(0, "Usia minimal 0 bulan")
    .max(59, "Usia maksimal 59 bulan (definisi balita)"),
  jenisKelamin: z.enum(JENIS_KELAMIN),
  tinggiBadanAwal: z.coerce.number().positive("Tinggi badan wajib diisi"),
  beratBadanAwal: z.coerce.number().positive("Berat badan wajib diisi"),
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
  tinggiBadan: z.coerce.number().positive("Tinggi badan wajib angka positif"),
  beratBadan: z.coerce
    .number()
    .positive("Berat badan wajib angka positif"),
  konsumsiNuggetGram: z.coerce
    .number()
    .min(0, "Tidak boleh negatif")
    .max(TARGET_NUGGET_GRAM, `Maksimal ${TARGET_NUGGET_GRAM} gram`),
  karbohidratGram: gramOpsional,
  proteinGram: gramOpsional,
  lemakGram: gramOpsional,
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export const hasilLabSchema = z.object({
  balitaId: z.string().min(1),
  tipe: z.enum(TIPE_LAB),
  hbValue: z.coerce.number().positive("Nilai Hb wajib angka positif"),
  zincValue: z.coerce.number().positive("Nilai Zinc wajib angka positif"),
  feValue: z.coerce.number().positive("Nilai Fe wajib angka positif"),
  tanggalPengukuran: z.string().min(1, "Tanggal wajib diisi"),
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BalitaInput = z.infer<typeof balitaSchema>;
export type KaderInput = z.infer<typeof kaderSchema>;
export type CatatanHarianInput = z.infer<typeof catatanHarianSchema>;
export type HasilLabInput = z.infer<typeof hasilLabSchema>;

export { DURASI_STUDI_HARI };
