import { z } from "zod";
import {
  DURASI_STUDI_HARI,
  JENIS_KELAMIN,
  STATUS_BALITA,
  TARGET_NUGGET_GRAM,
  TIPE_LAB,
} from "./constants";

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const balitaSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  usiaBulan: z.coerce
    .number()
    .int()
    .min(0, "Usia minimal 0 bulan")
    .max(59, "Usia maksimal 59 bulan (definisi balita)"),
  jenisKelamin: z.enum(JENIS_KELAMIN),
  tinggiBadanAwal: z.coerce.number().positive("Tinggi badan wajib diisi"),
  beratBadanAwal: z.coerce.number().positive("Berat badan wajib diisi"),
  posyandu: z.string().min(1, "Posyandu wajib diisi"),
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
  beratBadan: z.coerce
    .number()
    .positive("Berat badan wajib angka positif"),
  konsumsiNuggetGram: z.coerce
    .number()
    .min(0, "Tidak boleh negatif")
    .max(TARGET_NUGGET_GRAM, `Maksimal ${TARGET_NUGGET_GRAM} gram`),
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export const hasilLabSchema = z.object({
  balitaId: z.string().min(1),
  tipe: z.enum(TIPE_LAB),
  hbValue: z.coerce.number().positive("Nilai Hb wajib angka positif"),
  zincValue: z.coerce.number().positive("Nilai Zinc wajib angka positif"),
  tanggalPengukuran: z.string().min(1, "Tanggal wajib diisi"),
  confirmOutOfRange: z.coerce.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BalitaInput = z.infer<typeof balitaSchema>;
export type KaderInput = z.infer<typeof kaderSchema>;
export type CatatanHarianInput = z.infer<typeof catatanHarianSchema>;
export type HasilLabInput = z.infer<typeof hasilLabSchema>;

export { DURASI_STUDI_HARI };
