"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBalita } from "@/actions/balita.actions";
import { Button, FieldError } from "@/components/ui";
import { BalitaFields, type BalitaDefaults } from "@/components/BalitaFields";

// Form edit profil balita (khusus SPV Kader/Admin). Tombol "Edit Profil" membuka form
// berisi data yang sudah tersimpan; setelah disimpan halaman detail di-refresh.
export function BalitaEditForm({
  balitaId,
  kaderList,
  defaults,
}: {
  balitaId: string;
  kaderList: { id: string; nama: string }[];
  defaults: BalitaDefaults;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit Profil
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateBalita(balitaId, formData);
          if (!result.ok) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="font-medium text-slate-900">Edit Profil Balita</p>

      <BalitaFields kaderList={kaderList} defaults={defaults} />

      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}
