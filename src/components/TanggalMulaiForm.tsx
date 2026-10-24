"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTanggalMulai } from "@/actions/balita.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";

// Khusus admin: menentukan tanggal Hari ke-1. Hari ke-2 dst. otomatis mengikuti
// (tanggal berurutan sampai Hari ke-28).
export function TanggalMulaiForm({
  balitaId,
  defaultYmd,
  jumlahTerisi,
}: {
  balitaId: string;
  defaultYmd: string;
  jumlahTerisi: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        setOk(false);
        startTransition(async () => {
          const result = await updateTanggalMulai(balitaId, String(formData.get("tanggalMulai") ?? ""));
          if (!result.ok) setError(result.error);
          else {
            setOk(true);
            router.refresh();
          }
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div>
        <Label htmlFor="tanggalMulai">Tanggal Hari ke-1</Label>
        <Input id="tanggalMulai" name="tanggalMulai" type="date" required defaultValue={defaultYmd} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan tanggal"}
      </Button>
      <p className="basis-full text-xs text-slate-500">
        Hari ke-2 dan seterusnya otomatis mengikuti (berurutan sampai Hari ke-28).
        {jumlahTerisi > 0 &&
          ` Sudah ada ${jumlahTerisi} hari terisi; isiannya tetap menempel pada nomor harinya dan hanya tanggalnya yang bergeser.`}
      </p>
      <FieldError>{error ?? undefined}</FieldError>
      {ok && <p className="text-sm text-emerald-600">Tanggal tersimpan.</p>}
    </form>
  );
}
