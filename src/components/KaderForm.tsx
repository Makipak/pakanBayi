"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKader } from "@/actions/balita.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";

export function KaderForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        + Tambah Akun Kader
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createKader(formData);
          if (!result.ok) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="font-medium text-slate-900">Tambah Akun Kader</p>
      <div>
        <Label htmlFor="nama">Nama lengkap</Label>
        <Input id="nama" name="nama" required />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required />
      </div>
      <div>
        <Label htmlFor="password">Password awal</Label>
        <Input id="password" name="password" type="text" required minLength={6} />
        <p className="mt-1 text-xs text-slate-400">
          Sampaikan username &amp; password ini langsung ke kader.
        </p>
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
