"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteKader } from "@/actions/balita.actions";
import { Button, FieldError } from "@/components/ui";

export function KaderDeleteButton({ kaderId }: { kaderId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  if (!confirm) {
    return (
      <Button variant="ghost" className="text-red-600" onClick={() => setConfirm(true)}>
        Hapus
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteKader(kaderId);
              if (!result.ok) setError(result.error);
              else router.refresh();
            })
          }
        >
          Ya, hapus
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          Batal
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
