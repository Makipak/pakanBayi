"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateKader } from "@/actions/balita.actions";
import { Button, FieldError, Input, Label } from "@/components/ui";

export function KaderEditForm({
  kaderId,
  defaultNama,
  defaultUsername,
  onDone,
}: {
  kaderId: string;
  defaultNama: string;
  defaultUsername: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateKader(kaderId, formData);
          if (!result.ok) setError(result.error);
          else {
            router.refresh();
            onDone();
          }
        });
      }}
      className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p className="font-medium text-slate-900">Edit Akun Kader</p>
      <div>
        <Label htmlFor={`nama-${kaderId}`}>Nama lengkap</Label>
        <Input id={`nama-${kaderId}`} name="nama" defaultValue={defaultNama} required />
      </div>
      <div>
        <Label htmlFor={`username-${kaderId}`}>Username</Label>
        <Input id={`username-${kaderId}`} name="username" defaultValue={defaultUsername} required />
      </div>
      <div>
        <Label htmlFor={`password-${kaderId}`}>Password baru (opsional)</Label>
        <Input id={`password-${kaderId}`} name="password" type="text" minLength={6} />
        <p className="mt-1 text-xs text-slate-400">
          Kosongkan kalau tidak mau ganti password.
        </p>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  );
}
