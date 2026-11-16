"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Nilai = { hb: number; zinc: number } | null | undefined;

const WARNA = { Baseline: "#94a3b8", Endline: "#0d9488" } as const;

function Panel({
  judul,
  unit,
  baseline,
  endline,
}: {
  judul: string;
  unit: string;
  baseline: number | null;
  endline: number | null;
}) {
  const data = [
    { nama: "Baseline", nilai: baseline },
    { nama: "Endline", nilai: endline },
  ];
  const delta = baseline != null && endline != null ? Math.round((endline - baseline) * 100) / 100 : null;
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">{judul}</p>
        {delta !== null && (
          <p className={`text-sm font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta > 0 ? "+" : ""}
            {delta} {unit}
          </p>
        )}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="nama" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={36} domain={[0, (max: number) => Math.ceil(max * 1.15)]} />
            <Tooltip formatter={(v) => [`${v} ${unit}`, judul]} cursor={{ fill: "rgba(148,163,184,0.15)" }} />
            <Bar dataKey="nilai" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((d) => (
                <Cell key={d.nama} fill={WARNA[d.nama as keyof typeof WARNA]} />
              ))}
              <LabelList dataKey="nilai" position="top" style={{ fontSize: 11, fill: "#334155" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(baseline == null || endline == null) && (
        <p className="mt-1 text-xs text-slate-400">
          {baseline == null && endline == null
            ? "Belum ada data."
            : `${baseline == null ? "Baseline" : "Endline"} belum diisi.`}
        </p>
      )}
    </div>
  );
}

/** Perbandingan Baseline vs Endline untuk Hb dan Zinc (dua checkpoint per balita). */
export function LabChart({ baseline, endline }: { baseline: Nilai; endline: Nilai }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Panel judul="Hb" unit="g/dL" baseline={baseline?.hb ?? null} endline={endline?.hb ?? null} />
      <Panel judul="Zinc" unit="µg/dL" baseline={baseline?.zinc ?? null} endline={endline?.zinc ?? null} />
    </div>
  );
}
