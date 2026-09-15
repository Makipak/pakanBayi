"use client";

import { useState, useTransition } from "react";
import { submitHasilLab } from "@/actions/hasil-lab.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";
import type { TipeLab } from "@/lib/constants";

// Form ini hanya dirender oleh halaman detail balita PADA HARI studi yang sesuai
// untuk tipe lab ini (lihat HARI_LAB di constants.ts) — jadi tipe-nya sudah pasti,
// tidak perlu dropdown pilih tipe lagi (mencegah salah pilih/tidak sengaja menimpa
// tipe lain). Server (submitHasilLab) tetap menegakkan aturan hari yang sama.
export function HasilLabForm({
  balitaId,
  tipe,
  label,
  sudahDiisi,
}: {
  balitaId: string;
  tipe: TipeLab;
  label: string;
  sudahDiisi: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        setSuccess(false);
        startTransition(async () => {
          const result = await submitHasilLab(formData);
          if (!result.ok) setError(result.error);
          else setSuccess(true);
        });
      }}
      className="space-y-3"
    >
      <input type="hidden" name="balitaId" value={balitaId} />
      <input type="hidden" name="tipe" value={tipe} />
      <p className="text-sm font-medium text-slate-700">
        Input hasil lab — {label}
        {sudahDiisi ? " (update)" : ""}
      </p>
      <div>
        <Label htmlFor="tanggalPengukuran">Tanggal</Label>
        <Input id="tanggalPengukuran" name="tanggalPengukuran" type="date" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="hbValue">Hb (g/dL)</Label>
          <Input id="hbValue" name="hbValue" type="number" step="0.1" min="0" required />
        </div>
        <div>
          <Label htmlFor="zincValue">Zinc (µg/dL)</Label>
          <Input id="zincValue" name="zincValue" type="number" step="0.1" min="0" required />
        </div>
        <div>
          <Label htmlFor="feValue">Fe (µg/dL)</Label>
          <Input id="feValue" name="feValue" type="number" step="0.1" min="0" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" name="confirmOutOfRange" value="true" className="h-4 w-4" />
        Saya konfirmasi nilai di luar rentang wajar klinis ini valid
      </label>
      <FieldError>{error ?? undefined}</FieldError>
      {success && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Menyimpan..." : "Simpan hasil lab"}
      </Button>
    </form>
  );
}
