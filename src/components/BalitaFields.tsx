"use client";

import { useState } from "react";
import { Input, Label, Select } from "@/components/ui";
import { WilayahSelect } from "@/components/WilayahSelect";
import { CARA_UKUR, HASIL_KPSP, KATEGORI_GIZI, KATEGORI_TB_U } from "@/lib/constants";

export type BalitaDefaults = {
  nama?: string;
  usiaBulan?: number;
  jenisKelamin?: string;
  tanggalLahir?: string; // yyyy-mm-dd
  tinggiBadanAwal?: number;
  beratBadanAwal?: number;
  kaderId?: string;
  namaIbu?: string | null;
  noTelp?: string | null;
  alamat?: string | null;
  provinsi?: string | null;
  kabupatenKota?: string | null;
  kecamatan?: string | null;
  desaKelurahan?: string | null;
  puskesmas?: string | null;
  posyandu?: string;
  rt?: string | null;
  rw?: string | null;
};

export type RiwayatDefaults = {
  usiaSaatUkurBulan?: number | null;
  tanggalPengukuran?: string | null; // yyyy-mm-dd
  berat?: number | null;
  tinggi?: number | null;
  caraUkur?: string | null;
  lila?: number | null;
  bbU?: string | null;
  zsBbU?: number | null;
  tbU?: string | null;
  zsTbU?: number | null;
  bbTb?: string | null;
  zsBbTb?: number | null;
  naikBeratBadan?: boolean | null;
  jmlVitA?: number | null;
  kpsp?: string | null;
  kia?: boolean | null;
  kelasIbuBalita?: boolean | null;
  mbg?: boolean | null;
  detail?: string | null;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
      {children}
    </p>
  );
}

// Field-field form balita, dipakai bersama oleh form Tambah (BalitaForm) dan Edit
// (BalitaEditForm). Semua uncontrolled (defaultValue) — nilai dibaca lewat FormData.
export function BalitaFields({
  kaderList,
  defaults = {},
  riwayat,
  editMode = false,
}: {
  kaderList: { id: string; nama: string }[];
  defaults?: BalitaDefaults;
  riwayat?: RiwayatDefaults | null;
  editMode?: boolean;
}) {
  const [showRiwayat, setShowRiwayat] = useState(!!riwayat);
  const r = riwayat ?? {};
  const v = (x: string | number | null | undefined) => (x ?? "") as string | number;

  return (
    <>
      <SectionTitle>Data Balita</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" required defaultValue={v(defaults.nama)} />
        </div>
        <div>
          <Label htmlFor="usiaBulan">Usia (bulan)</Label>
          <Input
            id="usiaBulan"
            name="usiaBulan"
            type="number"
            min="0"
            max="59"
            required
            defaultValue={v(defaults.usiaBulan)}
          />
        </div>
        <div>
          <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
          <Select id="jenisKelamin" name="jenisKelamin" required defaultValue={defaults.jenisKelamin ?? ""}>
            <option value="" disabled>
              Pilih
            </option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
          <Input id="tanggalLahir" name="tanggalLahir" type="date" defaultValue={v(defaults.tanggalLahir)} />
        </div>
        <div>
          <Label htmlFor="tinggiBadanAwal">Tinggi badan awal (cm)</Label>
          <Input
            id="tinggiBadanAwal"
            name="tinggiBadanAwal"
            type="number"
            step="0.1"
            required
            defaultValue={v(defaults.tinggiBadanAwal)}
          />
        </div>
        <div>
          <Label htmlFor="beratBadanAwal">Berat badan awal (kg)</Label>
          <Input
            id="beratBadanAwal"
            name="beratBadanAwal"
            type="number"
            step="0.1"
            required
            defaultValue={v(defaults.beratBadanAwal)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="kaderId">Kader Penanggung Jawab</Label>
          <Select id="kaderId" name="kaderId" required defaultValue={defaults.kaderId ?? ""}>
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
          <Input id="namaIbu" name="namaIbu" defaultValue={v(defaults.namaIbu)} />
        </div>
        <div>
          <Label htmlFor="noTelp">No. Telp</Label>
          <Input id="noTelp" name="noTelp" type="tel" defaultValue={v(defaults.noTelp)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Input id="alamat" name="alamat" defaultValue={v(defaults.alamat)} />
        </div>
      </div>

      <SectionTitle>Wilayah Administratif</SectionTitle>
      <p className="-mt-1 text-xs text-slate-400">
        {editMode
          ? "Wilayah tersimpan tampil sebagai isian teks. Klik \"Coba pilih dari dropdown lagi\" kalau mau ganti lewat dropdown (pilih sampai Desa/Kel, kalau tidak wilayah akan dikosongkan)."
          : "Provinsi, Kab/Kota, Kecamatan, dan Desa/Kel tinggal pilih dari dropdown."}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <WilayahSelect
          initialManual={editMode}
          defaultProvinsi={defaults.provinsi ?? ""}
          defaultKabupatenKota={defaults.kabupatenKota ?? ""}
          defaultKecamatan={defaults.kecamatan ?? ""}
          defaultDesaKelurahan={defaults.desaKelurahan ?? ""}
        />
        <div>
          <Label htmlFor="puskesmas">Puskesmas</Label>
          <Input id="puskesmas" name="puskesmas" defaultValue={v(defaults.puskesmas)} />
        </div>
        <div>
          <Label htmlFor="posyandu">Posyandu</Label>
          <Input id="posyandu" name="posyandu" required defaultValue={v(defaults.posyandu)} />
        </div>
        <div>
          <Label htmlFor="rt">RT</Label>
          <Input id="rt" name="rt" defaultValue={v(defaults.rt)} />
        </div>
        <div>
          <Label htmlFor="rw">RW</Label>
          <Input id="rw" name="rw" defaultValue={v(defaults.rw)} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowRiwayat((s) => !s)}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {showRiwayat ? "− Sembunyikan" : "+ Isi"} Riwayat Pemeriksaan Sebelum Proyek Ini
        </button>
        <p className="mt-1 text-xs text-slate-400">
          Opsional — data terakhir dari catatan posyandu lama, sebelum balita ikut studi ini.
          {editMode && " Kalau semua isian dikosongkan, riwayat yang tersimpan akan dihapus."}
        </p>
      </div>

      {showRiwayat && (
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="usiaSaatUkurBulan">Usia Saat Ukur (bulan)</Label>
            <Input id="usiaSaatUkurBulan" name="usiaSaatUkurBulan" type="number" min="0" defaultValue={v(r.usiaSaatUkurBulan)} />
          </div>
          <div>
            <Label htmlFor="tanggalPengukuran">Tanggal Pengukuran</Label>
            <Input id="tanggalPengukuran" name="tanggalPengukuran" type="date" defaultValue={v(r.tanggalPengukuran)} />
          </div>
          <div>
            <Label htmlFor="berat">Berat (kg)</Label>
            <Input id="berat" name="berat" type="number" step="0.1" defaultValue={v(r.berat)} />
          </div>
          <div>
            <Label htmlFor="tinggi">Tinggi (cm)</Label>
            <Input id="tinggi" name="tinggi" type="number" step="0.1" defaultValue={v(r.tinggi)} />
          </div>
          <div>
            <Label htmlFor="caraUkur">Cara Ukur</Label>
            <Select id="caraUkur" name="caraUkur" defaultValue={r.caraUkur ?? ""}>
              <option value="">Tidak diisi</option>
              {CARA_UKUR.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="lila">LiLA (cm)</Label>
            <Input id="lila" name="lila" type="number" step="0.1" defaultValue={v(r.lila)} />
          </div>
          <div>
            <Label htmlFor="bbU">BB/U</Label>
            <Select id="bbU" name="bbU" defaultValue={r.bbU ?? ""}>
              <option value="">Tidak diisi</option>
              {KATEGORI_GIZI.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsBbU">ZS BB/U</Label>
            <Input id="zsBbU" name="zsBbU" type="number" step="0.01" defaultValue={v(r.zsBbU)} />
          </div>
          <div>
            <Label htmlFor="tbU">TB/U</Label>
            <Select id="tbU" name="tbU" defaultValue={r.tbU ?? ""}>
              <option value="">Tidak diisi</option>
              {KATEGORI_TB_U.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsTbU">ZS TB/U</Label>
            <Input id="zsTbU" name="zsTbU" type="number" step="0.01" defaultValue={v(r.zsTbU)} />
          </div>
          <div>
            <Label htmlFor="bbTb">BB/TB</Label>
            <Select id="bbTb" name="bbTb" defaultValue={r.bbTb ?? ""}>
              <option value="">Tidak diisi</option>
              {KATEGORI_GIZI.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="zsBbTb">ZS BB/TB</Label>
            <Input id="zsBbTb" name="zsBbTb" type="number" step="0.01" defaultValue={v(r.zsBbTb)} />
          </div>
          <div>
            <Label htmlFor="jmlVitA">Jml Vit A</Label>
            <Input id="jmlVitA" name="jmlVitA" type="number" min="0" defaultValue={v(r.jmlVitA)} />
          </div>
          <div>
            <Label htmlFor="kpsp">KPSP</Label>
            <Select id="kpsp" name="kpsp" defaultValue={r.kpsp ?? ""}>
              <option value="">Tidak diisi</option>
              {HASIL_KPSP.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="naikBeratBadan" defaultChecked={!!r.naikBeratBadan} className="h-4 w-4 rounded border-slate-300" />
              Naik Berat Badan
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="kia" defaultChecked={!!r.kia} className="h-4 w-4 rounded border-slate-300" />
              Punya KIA
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="kelasIbuBalita" defaultChecked={!!r.kelasIbuBalita} className="h-4 w-4 rounded border-slate-300" />
              Ikut Kelas Ibu Balita
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="mbg" defaultChecked={!!r.mbg} className="h-4 w-4 rounded border-slate-300" />
              Terdaftar MBG
            </label>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="detail">Detail / Catatan</Label>
            <Input id="detail" name="detail" defaultValue={v(r.detail)} />
          </div>
        </div>
      )}
    </>
  );
}
