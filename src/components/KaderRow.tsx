"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { KaderEditForm } from "@/components/KaderEditForm";
import { KaderDeleteButton } from "@/components/KaderDeleteButton";

export function KaderRow({
  kaderId,
  nama,
  username,
  jumlahBalita,
}: {
  kaderId: string;
  nama: string;
  username: string;
  jumlahBalita: number;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <KaderEditForm
        kaderId={kaderId}
        defaultNama={nama}
        defaultUsername={username}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium text-slate-900">{nama}</p>
        <p className="text-xs text-slate-500">
          @{username} · {jumlahBalita} balita ditangani
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <KaderDeleteButton kaderId={kaderId} />
      </div>
    </Card>
  );
}
