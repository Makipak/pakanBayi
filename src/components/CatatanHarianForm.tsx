"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCatatanHarian } from "@/actions/catatan-harian.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { TARGET_NUGGET_GRAM } from "@/lib/constants";

export function CatatanHarianForm({
  balitaId,
  catatanHarianId,
  hariKe,
  defaultTinggiBadan,
  defaultBeratBadan,
  defaultKonsumsi,
  defaultKarbohidrat,
  defaultProtein,
  defaultLemak,
}: {
  balitaId: string;
  catatanHarianId: string;
  hariKe: number;
  defaultTinggiBadan?: number | null;
  defaultBeratBadan?: number | null;
  defaultKonsumsi?: number | null;
  defaultKarbohidrat?: number | null;
  defaultProtein?: number | null;
  defaultLemak?: number | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await submitCatatanHarian(balitaId, formData);
          if (!result.ok) {
            setError(result.error);
            if (result.warning === "out_of_range") setNeedsConfirm(true);
          } else {
            router.push(`/kader/balita/${balitaId}`);
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="catatanHarianId" value={catatanHarianId} />
      <p className="text-sm font-medium text-slate-700">Hari ke-{hariKe} dari 28</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="beratBadan">Berat badan (kg)</Label>
          <Input
            id="beratBadan"
            name="beratBadan"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={defaultBeratBadan ?? undefined}
            inputMode="decimal"
          />
        </div>
        <div>
          <Label htmlFor="tinggiBadan">Tinggi badan (cm)</Label>
          <Input
            id="tinggiBadan"
            name="tinggiBadan"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={defaultTinggiBadan ?? undefined}
            inputMode="decimal"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="konsumsiNuggetGram">
          Konsumsi nugget (gram) — target {TARGET_NUGGET_GRAM}gr
        </Label>
        <Input
          id="konsumsiNuggetGram"
          name="konsumsiNuggetGram"
          type="number"
          step="1"
          min="0"
          max={TARGET_NUGGET_GRAM}
          required
          defaultValue={defaultKonsumsi ?? undefined}
          inputMode="numeric"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Asupan makronutrien harian</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="karbohidratGram">Karbohidrat (g)</Label>
            <Input
              id="karbohidratGram"
              name="karbohidratGram"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={defaultKarbohidrat ?? undefined}
              inputMode="decimal"
            />
          </div>
          <div>
            <Label htmlFor="proteinGram">Protein (g)</Label>
            <Input
              id="proteinGram"
              name="proteinGram"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={defaultProtein ?? undefined}
              inputMode="decimal"
            />
          </div>
          <div>
            <Label htmlFor="lemakGram">Lemak (g)</Label>
            <Input
              id="lemakGram"
              name="lemakGram"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={defaultLemak ?? undefined}
              inputMode="decimal"
            />
          </div>
        </div>
      </div>

      {needsConfirm && (
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" name="confirmOutOfRange" value="true" className="h-4 w-4" />
          Saya konfirmasi berat badan ini valid meskipun di luar rentang wajar
        </label>
      )}

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
