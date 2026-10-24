"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { formatTanggal } from "@/lib/utils";

type Item = { id: string; hariKe: number; tanggal: Date; keterangan: string | null };

const BATAS_AWAL = 3;

/**
 * Keterangan harian, terbaru (hari terbesar) di atas. Awalnya hanya 3 teratas;
 * sisanya dibuka lewat "Lihat semua". Tidak tampil kalau belum ada yang mengisi.
 */
export function KeteranganHarian({ catatan, hrefTemplate }: { catatan: Item[]; hrefTemplate?: string }) {
  const [semua, setSemua] = useState(false);
  const items = catatan.filter((c) => c.keterangan).sort((a, b) => b.hariKe - a.hariKe);
  if (items.length === 0) return null;
  const tampil = semua ? items : items.slice(0, BATAS_AWAL);
  const sisa = items.length - BATAS_AWAL;

  return (
    <Card>
      <h2 className="mb-3 font-medium text-slate-900">
        Keterangan Harian <span className="text-sm font-normal text-slate-400">({items.length})</span>
      </h2>
      <ul className="divide-y divide-slate-100 text-sm">
        {tampil.map((c) => {
          const label = (
            <>
              <span className="font-medium text-slate-700">Hari {c.hariKe}</span>
              <span className="block text-xs text-slate-400">{formatTanggal(c.tanggal)}</span>
            </>
          );
          return (
            <li key={c.id} className="flex gap-3 py-2 first:pt-0 last:pb-0">
              <div className="w-24 shrink-0">
                {hrefTemplate ? (
                  <a href={hrefTemplate.replace("{n}", String(c.hariKe))} className="hover:underline">
                    {label}
                  </a>
                ) : (
                  label
                )}
              </div>
              <p className="whitespace-pre-line break-words text-slate-700">{c.keterangan}</p>
            </li>
          );
        })}
      </ul>
      {sisa > 0 && (
        <button
          type="button"
          onClick={() => setSemua((v) => !v)}
          className="mt-3 text-sm font-medium text-brand hover:underline"
        >
          {semua ? "Tampilkan lebih sedikit" : `Lihat semua (${items.length})`}
        </button>
      )}
    </Card>
  );
}
