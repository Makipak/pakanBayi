import { z } from "zod";
import {
  CARA_UKUR,
  DURASI_STUDI_HARI,
  HASIL_KPSP,
  JENIS_KELAMIN,
  KATEGORI_GIZI,
  KATEGORI_TB_U,
  STATUS_BALITA,
  TARGET_NUGGET_GRAM,
  TIPE_LAB,
} from "./constants";

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

// Field opsional dari FormData: string kosong dianggap "tidak diisi" (undefined),
// bukan error validasi — banyak field di form Tambah Balita sifatnya opsional.
const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? Number(v) : undefined))
  .refine((v) => v === undefined || !Number.isNaN(v), "Wajib angka");

const optionalInt = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? Number(v) : undefined))
  .refine((v) => v === undefined || Number.isInteger(v), "Wajib angka bulat");

const optionalDateString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

// Checkbox HTML: hadir di FormData ("on") kalau dicentang, tidak ada sama sekali kalau tidak.
const optionalCheckbox = z
  .union([z.string(), z.undefined()])
  .transform((v) => (v === "on" || v === "true" ? true : v === undefined ? undefined : false));

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

  tanggalLahir: optionalDateString,

  // Data orang tua & kontak
  namaIbu: optionalText,
  alamat: optionalText,
  noTelp: optionalText,

  // Wilayah administratif
  provinsi: optionalText,
  kabupatenKota: optionalText,
  kecamatan: optionalText,
  puskesmas: optionalText,
  desaKelurahan: optionalText,
  rt: optionalText,
  rw: optionalText,
});

// Data riwayat pemeriksaan terakhir SEBELUM proyek ini (opsional semua — snapshot
// satu kali dari catatan posyandu lama, tidak semua balita punya datanya).
export const riwayatPemeriksaanSchema = z.object({
  usiaSaatUkurBulan: optionalInt,
  tanggalPengukuran: optionalDateString,
  berat: optionalNumber,
  tinggi: optionalNumber,
  caraUkur: z
    .union([z.enum(CARA_UKUR), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  lila: optionalNumber,
  bbU: z
    .union([z.enum(KATEGORI_GIZI), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  zsBbU: optionalNumber,
  tbU: z
    .union([z.enum(KATEGORI_TB_U), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  zsTbU: optionalNumber,
  bbTb: z
    .union([z.enum(KATEGORI_GIZI), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  zsBbTb: optionalNumber,
  naikBeratBadan: optionalCheckbox,
  jmlVitA: optionalInt,
  kpsp: z
    .union([z.enum(HASIL_KPSP), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  kia: optionalCheckbox,
  kelasIbuBalita: optionalCheckbox,
  mbg: optionalCheckbox,
  detail: optionalText,
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
  karbohidratGram: z.coerce.number().min(0, "Tidak boleh negatif"),
  proteinGram: z.coerce.number().min(0, "Tidak boleh negatif"),
  lemakGram: z.coerce.number().min(0, "Tidak boleh negatif"),
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
export type RiwayatPemeriksaanInput = z.infer<typeof riwayatPemeriksaanSchema>;
export type KaderInput = z.infer<typeof kaderSchema>;
export type CatatanHarianInput = z.infer<typeof catatanHarianSchema>;
export type HasilLabInput = z.infer<typeof hasilLabSchema>;

export { DURASI_STUDI_HARI };
