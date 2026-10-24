"use client";

import { Input, Label, Select } from "@/components/ui";

export type BalitaDefaults = {
  nama?: string;
  usiaBulan?: number;
  jenisKelamin?: string;
  tinggiBadanAwal?: number;
  beratBadanAwal?: number;
  kaderId?: string;
};

const v = (x: string | number | null | undefined) => (x ?? "") as string | number;

// Field-field form balita, dipakai bersama oleh form Tambah (BalitaForm) dan Edit
// (BalitaEditForm). Uncontrolled (defaultValue) — nilai dibaca lewat FormData.
export function BalitaFields({
  kaderList,
  defaults = {},
}: {
  kaderList: { id: string; nama: string }[];
  defaults?: BalitaDefaults;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="nama">Nama</Label>
        <Input id="nama" name="nama" required defaultValue={v(defaults.nama)} />
      </div>
      <div>
        <Label htmlFor="usiaBulan">Usia (bulan)</Label>
        <Input
          id="usiaBulan"
          name="usiaBulan"
          type="text"
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
        <Label htmlFor="tinggiBadanAwal">Tinggi badan (cm)</Label>
        <Input
          id="tinggiBadanAwal"
          name="tinggiBadanAwal"
          type="text"
          required
          defaultValue={v(defaults.tinggiBadanAwal)}
        />
      </div>
      <div>
        <Label htmlFor="beratBadanAwal">Berat badan (kg)</Label>
        <Input
          id="beratBadanAwal"
          name="beratBadanAwal"
          type="text"
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
  );
}
