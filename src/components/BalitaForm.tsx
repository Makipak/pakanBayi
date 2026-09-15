"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBalita } from "@/actions/balita.actions";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";
import { WilayahSelect } from "@/components/WilayahSelect";
import { CARA_UKUR, HASIL_KPSP, KATEGORI_GIZI, KATEGORI_TB_U } from "@/lib/constants";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
      {children}
    </p>
  );
}

export function BalitaForm({ kaderList }: { kaderList: { id: string; nama: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        + Tambah Balita
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createBalita(formData);
          if (!result.ok) setError(result.error);
          else {
            setOpen(false);
            setShowRiwayat(false);
            router.refresh();
          }
        });
      }}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="font-medium text-slate-900">Tambah Balita Baru</p>

      <SectionTitle>Data Balita</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" required />
        </div>
        <div>
          <Label htmlFor="usiaBulan">Usia (bulan)</Label>
          <Input id="usiaBulan" name="usiaBulan" type="number" min="0" max="59" required />
        </div>
        <div>
          <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
          <Select id="jenisKelamin" name="jenisKelamin" required defaultValue="">
            <option value="" disabled>
              Pilih
            </option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
          <Input id="tanggalLahir" name="tanggalLahir" type="date" />
        </div>
        <div>
          <Label htmlFor="tinggiBadanAwal">Tinggi badan awal (cm)</Label>
          <Input id="tinggiBadanAwal" name="tinggiBadanAwal" type="number" step="0.1" required />
        </div>
        <div>
          <Label htmlFor="beratBadanAwal">Berat badan awal (kg)</Label>
          <Input id="beratBadanAwal" name="beratBadanAwal" type="number" step="0.1" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="kaderId">Kader Penanggung Jawab</Label>
          <Select id="kaderId" name="kaderId" required defaultValue="">
            <option value="" disabled>
              Pilih kader
            </option>
            {kaderList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <SectionTitle>Data Orang Tua &amp; Kontak</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="namaIbu">Nama Ibu Kandung</Label>
          <Input id="namaIbu" name="namaIbu" />
        </div>
        <div>
          <Label htmlFor="noTelp">No. Telp</Label>
          <Input id="noTelp" name="noTelp" type="tel" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Input id="alamat" name="alamat" />
        </div>
      </div>

      <SectionTitle>Wilayah Administratif</SectionTitle>
      <p className="-mt-1 text-xs text-slate-400">
        Provinsi, Kab/Kota, Kecamatan, dan Desa/Kel tinggal pilih dari dropdown.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <WilayahSelect />
        <div>
          <Label htmlFor="puskesmas">Puskesmas</Label>
          <Input id="puskesmas" name="puskesmas" />
        </div>
        <div>
          <Label htmlFor="posyandu">Posyandu</Label>
          <Input id="posyandu" name="posyandu" required />
        </div>
        <div>
          <Label htmlFor="rt">RT</Label>
          <Input id="rt" name="rt" />
        </div>
        <div>
          <Label htmlFor="rw">RW</Label>
          <Input id="rw" name="rw" />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowRiwayat((v) => !v)}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {showRiwayat ? "− Sembunyikan" : "+ Isi"} Riwayat Pemeriksaan Sebelum Proyek Ini
        </button>
        <p className="mt-1 text-xs text-slate-400">
          Opsional — data terakhir dari catatan posyandu lama, sebelum balita ikut studi ini.
        </p>
      </div>

      {showRiwayat && (
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="usiaSaatUkurBulan">Usia Saat Ukur (bulan)</Label>
            <Input id="usiaSaatUkurBulan" name="usiaSaatUkurBulan" type="number" min="0" />
          </div>
          <div>
            <Label htmlFor="tanggalPengukuran">Tanggal Pengukuran</Label>
            <Input id="tanggalPengukuran" name="tanggalPengukuran" type="date" />
          </div>
          <div>
            <Label htmlFor="berat">Berat (kg)</Label>
            <Input id="berat" name="berat" type="number" step="0.1" />
          </div>
          <div>
            <Label htmlFor="tinggi">Tinggi (cm)</Label>
            <Input id="tinggi" name="tinggi" type="number" step="0.1" />
          </div>
          <div>
            <Label htmlFor="caraUkur">Cara Ukur</Label>
            <Select id="caraUkur" name="caraUkur" defaultValue="">
              <option value="">Tidak diisi</option>
              {CARA_UKUR.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="lila">LiLA (cm)</Label>
            <Input id="lila" name="lila" type="number" step="0.1" />
          </div>
          <div>
            <Label htmlFor="bbU">BB/U</Label>
            <Select id="bbU" name="bbU" defaultValue="">
              <option value="">Tidak diisi</option>
              {KATEGORI_GIZI.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsBbU">ZS BB/U</Label>
            <Input id="zsBbU" name="zsBbU" type="number" step="0.01" />
          </div>
          <div>
            <Label htmlFor="tbU">TB/U</Label>
            <Select id="tbU" name="tbU" defaultValue="">
              <option value="">Tidak diisi</option>
              {KATEGORI_TB_U.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsTbU">ZS TB/U</Label>
            <Input id="zsTbU" name="zsTbU" type="number" step="0.01" />
          </div>
          <div>
            <Label htmlFor="bbTb">BB/TB</Label>
            <Select id="bbTb" name="bbTb" defaultValue="">
              <option value="">Tidak diisi</option>
              {KATEGORI_GIZI.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsBbTb">ZS BB/TB</Label>
            <Input id="zsBbTb" name="zsBbTb" type="number" step="0.01" />
          </div>
          <div>
            <Label htmlFor="jmlVitA">Jml Vit A</Label>
            <Input id="jmlVitA" name="jmlVitA" type="number" min="0" />
          </div>
          <div>
            <Label htmlFor="kpsp">KPSP</Label>
            <Select id="kpsp" name="kpsp" defaultValue="">
              <option value="">Tidak diisi</option>
              {HASIL_KPSP.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="naikBeratBadan" className="h-4 w-4 rounded border-slate-300" />
              Naik Berat Badan
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="kia" className="h-4 w-4 rounded border-slate-300" />
              Punya KIA
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="kelasIbuBalita" className="h-4 w-4 rounded border-slate-300" />
              Ikut Kelas Ibu Balita
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="mbg" className="h-4 w-4 rounded border-slate-300" />
              Terdaftar MBG
            </label>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="detail">Detail / Catatan</Label>
            <Input id="detail" name="detail" />
          </div>
        </div>
      )}

      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
