"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBalita } from "@/actions/balita.actions";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";

export function BalitaForm({ kaderList }: { kaderList: { id: string; nama: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
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
            router.refresh();
          }
        });
      }}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="font-medium text-slate-900">Tambah Balita Baru</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" required />
        </div>
        <div>
          <Label htmlFor="posyandu">Posyandu</Label>
          <Input id="posyandu" name="posyandu" required />
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
