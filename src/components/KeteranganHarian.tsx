import { Card } from "@/components/ui";
import { formatTanggal } from "@/lib/utils";

type Item = { id: string; hariKe: number; tanggal: Date; keterangan: string | null };

/** Daftar keterangan harian (urut hari). Tidak tampil kalau belum ada yang mengisi. */
export function KeteranganHarian({ catatan, hrefTemplate }: { catatan: Item[]; hrefTemplate?: string }) {
  const items = catatan.filter((c) => c.keterangan).sort((a, b) => a.hariKe - b.hariKe);
  if (items.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-3 font-medium text-slate-900">Keterangan Harian</h2>
      <ul className="divide-y divide-slate-100 text-sm">
        {items.map((c) => {
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
              <p className="whitespace-pre-line text-slate-700">{c.keterangan}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
