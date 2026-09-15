"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitHariPertama } from "@/actions/onboarding.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { TARGET_NUGGET_GRAM } from "@/lib/constants";

// Form onboarding Hari ke-1: gabungan input harian + hasil lab Baseline dalam satu
// form/satu tombol simpan. Ini yang dirender di halaman detail balita SELAMA data
// hari pertama belum pernah diisi — begitu tersimpan, halaman detail otomatis
// pindah ke tampilan dashboard biasa (server component yang memanggil ini yang
// menentukan kapan form ini vs dashboard yang dirender).
export function OnboardingForm({
  balitaId,
  catatanHarianId,
}: {
  balitaId: string;
  catatanHarianId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmBerat, setNeedsConfirmBerat] = useState(false);
  const [needsConfirmHb, setNeedsConfirmHb] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await submitHariPertama(formData);
          if (!result.ok) {
            setError(result.error);
            if (result.warning === "berat_out_of_range") setNeedsConfirmBerat(true);
            if (result.warning === "hb_out_of_range") setNeedsConfirmHb(true);
          } else {
            router.refresh();
          }
        });
      }}
      className="space-y-5"
    >
      <input type="hidden" name="balitaId" value={balitaId} />
      <input type="hidden" name="catatanHarianId" value={catatanHarianId} />

      <div>
        <p className="font-medium text-slate-900">Input Hari Pertama (Hari ke-1)</p>
        <p className="text-xs text-slate-500">
          Ini input pertama untuk balita ini — isi semua data di bawah sekali jalan
          (data harian + hasil lab Baseline), lalu Simpan.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Data Harian</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="beratBadan">Berat badan (kg)</Label>
            <Input id="beratBadan" name="beratBadan" type="number" step="0.1" min="0" required inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="tinggiBadan">Tinggi badan (cm)</Label>
            <Input id="tinggiBadan" name="tinggiBadan" type="number" step="0.1" min="0" required inputMode="decimal" />
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
            inputMode="numeric"
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Asupan makronutrien harian</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="karbohidratGram">Karbohidrat (g)</Label>
              <Input id="karbohidratGram" name="karbohidratGram" type="number" step="0.1" min="0" required inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="proteinGram">Protein (g)</Label>
              <Input id="proteinGram" name="proteinGram" type="number" step="0.1" min="0" required inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="lemakGram">Lemak (g)</Label>
              <Input id="lemakGram" name="lemakGram" type="number" step="0.1" min="0" required inputMode="decimal" />
            </div>
          </div>
        </div>
        {needsConfirmBerat && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name="confirmBeratOutOfRange" value="true" className="h-4 w-4" />
            Saya konfirmasi berat badan ini valid meskipun di luar rentang wajar
          </label>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Hasil Lab Baseline (Hb, Zinc &amp; Fe)</p>
        <div>
          <Label htmlFor="tanggalPengukuranLab">Tanggal Pengukuran</Label>
          <Input id="tanggalPengukuranLab" name="tanggalPengukuranLab" type="date" required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="hbValue">Hb (g/dL)</Label>
            <Input id="hbValue" name="hbValue" type="number" step="0.1" min="0" required inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="zincValue">Zinc (µg/dL)</Label>
            <Input id="zincValue" name="zincValue" type="number" step="0.1" min="0" required inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="feValue">Fe (µg/dL)</Label>
            <Input id="feValue" name="feValue" type="number" step="0.1" min="0" required inputMode="decimal" />
          </div>
        </div>
        {needsConfirmHb && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name="confirmHbOutOfRange" value="true" className="h-4 w-4" />
            Saya konfirmasi nilai Hb ini valid meskipun di luar rentang wajar klinis
          </label>
        )}
      </div>

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan..." : "Simpan Data Hari Pertama"}
      </Button>
    </form>
  );
}
