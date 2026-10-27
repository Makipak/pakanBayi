"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kosongkanCatatanHarian, submitCatatanHarian } from "@/actions/catatan-harian.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { TARGET_NUGGET_GRAM } from "@/lib/constants";
import type { FieldSalinan, Referensi } from "@/lib/data";

type Props = {
  balitaId: string;
  catatanHarianId: string;
  hariKe: number;
  defaultTinggiBadan?: number | null;
  defaultBeratBadan?: number | null;
  defaultKonsumsi?: number | null;
  defaultEnergi?: number | null;
  defaultKarbohidrat?: number | null;
  defaultProtein?: number | null;
  defaultLemak?: number | null;
  /** Hari TERISI terdekat sebelumnya; dipakai sebagai nilai awal field yang masih kosong. */
  referensi?: Referensi | null;
  defaultKeterangan?: string | null;
  /** Hari ini sudah pernah disimpan (TERISI) -> tampilkan tombol hapus isian. */
  sudahDiisi?: boolean;
};

// Normalisasi untuk membandingkan "24,5" dengan 24.5.
const num = (v: string) => {
  const t = v.trim().replace(",", ".");
  return t === "" || isNaN(Number(t)) ? null : Number(t);
};

export function CatatanHarianForm(props: Props) {
  const { balitaId, catatanHarianId, hariKe, referensi } = props;
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [konfirmHapus, setKonfirmHapus] = useState(false);
  const router = useRouter();

  // Nilai tersimpan menang; kalau kosong, pakai nilai hari referensi (nugget tidak pernah disalin).
  const awal = (own: number | null | undefined, f: FieldSalinan) =>
    String(own ?? referensi?.[f] ?? "");
  const [v, setV] = useState<Record<FieldSalinan, string>>({
    beratBadan: awal(props.defaultBeratBadan, "beratBadan"),
    tinggiBadan: awal(props.defaultTinggiBadan, "tinggiBadan"),
    energiKkal: awal(props.defaultEnergi, "energiKkal"),
    karbohidratGram: awal(props.defaultKarbohidrat, "karbohidratGram"),
    proteinGram: awal(props.defaultProtein, "proteinGram"),
    lemakGram: awal(props.defaultLemak, "lemakGram"),
  });

  const salinan = (f: FieldSalinan) =>
    !!referensi && referensi[f] != null && num(v[f]) === referensi[f];

  function field(f: FieldSalinan, label: string, required = false) {
    const sama = salinan(f);
    return (
      <div>
        <Label htmlFor={f}>{label}</Label>
        <Input
          id={f}
          name={f}
          type="text"
          required={required}
          inputMode="decimal"
          value={v[f]}
          onChange={(e) => setV((s) => ({ ...s, [f]: e.target.value }))}
          className={sama ? "text-slate-400" : undefined}
        />
        {sama && (
          <p className="mt-1 text-xs text-slate-400">Sama dengan Hari ke-{referensi!.hariKe}, ubah jika berbeda</p>
        )}
      </div>
    );
  }

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
        {field("beratBadan", "Berat badan (kg)", true)}
        {field("tinggiBadan", "Tinggi badan (cm)", true)}
      </div>

      <div>
        <Label htmlFor="konsumsiNuggetGram">
          Konsumsi nugget (gram) — target {TARGET_NUGGET_GRAM}gr
        </Label>
        <Input
          id="konsumsiNuggetGram"
          name="konsumsiNuggetGram"
          type="text"
          required
          defaultValue={props.defaultKonsumsi ?? undefined}
          inputMode="decimal"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Asupan harian: energi &amp; makronutrien (opsional)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {field("energiKkal", "Energi (kkal)")}
          {field("karbohidratGram", "Karbohidrat (g)")}
          {field("proteinGram", "Protein (g)")}
          {field("lemakGram", "Lemak (g)")}
        </div>
      </div>

      <div>
        <Label htmlFor="keterangan">Keterangan (opsional)</Label>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={3}
          maxLength={500}
          defaultValue={props.defaultKeterangan ?? ""}
          placeholder="Mis. anak sakit, nugget tidak habis, menu berbeda, dll."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
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

      {props.sudahDiisi && (
        <div className="border-t border-slate-100 pt-3">
          {!konfirmHapus ? (
            <button
              type="button"
              onClick={() => setKonfirmHapus(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Hapus isian hari ini
            </button>
          ) : (
            <div className="space-y-2 rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-700">
                Semua isian Hari ke-{hariKe} (berat, tinggi, nugget, asupan, keterangan) akan dikosongkan. Lanjutkan?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const r = await kosongkanCatatanHarian(balitaId, catatanHarianId);
                      if (!r.ok) {
                        setError(r.error);
                        setKonfirmHapus(false);
                      } else {
                        router.refresh();
                      }
                    });
                  }}
                >
                  {pending ? "Menghapus..." : "Ya, hapus"}
                </Button>
                <Button type="button" variant="ghost" disabled={pending} onClick={() => setKonfirmHapus(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
