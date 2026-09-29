"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBalita } from "@/actions/balita.actions";
import { Button, FieldError } from "@/components/ui";
import { BalitaFields } from "@/components/BalitaFields";

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

      <BalitaFields kaderList={kaderList} />

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
