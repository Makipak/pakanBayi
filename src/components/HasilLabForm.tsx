"use client";

import { useState, useTransition } from "react";
import { submitHasilLab } from "@/actions/hasil-lab.actions";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";

export function HasilLabForm({
  balitaId,
  defaultTipe,
  hasBaseline,
  hasEndline,
}: {
  balitaId: string;
  defaultTipe: "BASELINE" | "ENDLINE";
  hasBaseline: boolean;
  hasEndline: boolean;
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
      <p className="text-sm font-medium text-slate-700">Input hasil lab</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tipe">Tipe</Label>
          <Select id="tipe" name="tipe" defaultValue={defaultTipe}>
            <option value="BASELINE">Baseline (Hari-0){hasBaseline ? " — update" : ""}</option>
            <option value="ENDLINE">Endline (Hari-28){hasEndline ? " — update" : ""}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="tanggalPengukuran">Tanggal</Label>
          <Input id="tanggalPengukuran" name="tanggalPengukuran" type="date" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="hbValue">Hb (g/dL)</Label>
          <Input id="hbValue" name="hbValue" type="number" step="0.1" min="0" required />
        </div>
        <div>
          <Label htmlFor="zincValue">Zinc (µg/dL)</Label>
          <Input id="zincValue" name="zincValue" type="number" step="0.1" min="0" required />
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
