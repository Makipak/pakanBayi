"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBalita, updateBalitaStatus } from "@/actions/balita.actions";
import { Button, FieldError, Select } from "@/components/ui";

export function BalitaStatusForm({
  balitaId,
  currentStatus,
}: {
  balitaId: string;
  currentStatus: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await updateBalitaStatus(balitaId, formData);
            if (!result.ok) setError(result.error);
            else router.refresh();
          });
        }}
        className="flex items-center gap-2"
      >
        <Select name="status" defaultValue={currentStatus} disabled={pending}>
          <option value="AKTIF">Aktif</option>
          <option value="SELESAI">Selesai</option>
          <option value="DROPOUT">Dropout</option>
        </Select>
        <Button type="submit" variant="secondary" disabled={pending}>
          Update status
        </Button>
      </form>

      {!confirmDelete ? (
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Hapus
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Yakin hapus permanen?</span>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteBalita(balitaId);
                if (!result.ok) setError(result.error);
                else router.push("/admin/balita");
              })
            }
          >
            Ya, hapus
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Batal
          </Button>
        </div>
      )}
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
