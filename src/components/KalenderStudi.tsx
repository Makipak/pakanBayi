"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTanggalMulai } from "@/actions/balita.actions";
import { Button, Card, FieldError } from "@/components/ui";

export type HariKalender = { hariKe: number; ymd: string; terisi: boolean };

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const fmtBulan = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", month: "long", year: "numeric" });
const fmtPanjang = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const label = (ymd: string) => fmtPanjang.format(toDate(ymd));
const addDays = (ymd: string, n: number) =>
  new Date(toDate(ymd).getTime() + n * 86400000).toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");

// Kalender bulanan sungguhan. Sebelum penelitian dimulai ia hanya kalender biasa: tanggal
// yang diklik (lalu dikonfirmasi) menjadi Hari ke-1 penelitian, dan 28 hari berikutnya
// langsung ditandai. Setelah itu, klik hari yang sudah tiba (termasuk yang terlewat)
// untuk mengisinya. "Ubah tanggal mulai" untuk menggeser awal penelitian.
export function KalenderStudi({
  balitaId,
  hari,
  todayYmd,
  hrefTemplate,
  terpilih,
  boleh,
  labHari,
  jumlahTerisi,
}: {
  balitaId: string;
  hari: HariKalender[];
  todayYmd: string;
  /** Mengandung "{n}" yang diganti nomor hari. Kosong = hari tidak bisa diklik untuk mengisi. */
  hrefTemplate?: string;
  terpilih?: number;
  /** false = balita tidak aktif; kalender hanya tampil. */
  boleh: boolean;
  labHari: number[];
  jumlahTerisi: number;
}) {
  const router = useRouter();
  const urut = [...hari].sort((a, b) => a.hariKe - b.hariKe);
  const mulai = urut[0]?.ymd ?? null;
  const akhir = urut[urut.length - 1]?.ymd ?? null;
  const peta = new Map(urut.map((h) => [h.ymd, h]));
  const sekarang = peta.get(todayYmd);

  const awalBulan = (mulai ?? todayYmd).slice(0, 7);
  const [bulan, setBulan] = useState(awalBulan); // "YYYY-MM"
  const [ubah, setUbah] = useState(false);
  const [tentatif, setTentatif] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const memilih = boleh && (mulai === null || ubah);

  const [y, m] = bulan.split("-").map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const jumlahHari = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const geser = (d: number) => {
    const t = new Date(Date.UTC(y, m - 1 + d, 1));
    setBulan(`${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`);
  };

  const klik = (ymd: string) => {
    setError(null);
    if (memilih) {
      setTentatif(ymd);
      return;
    }
    const h = peta.get(ymd);
    if (h) {
      // Tanggal di dalam rentang penelitian: buka form isian hari itu (kalau sudah tiba).
      if (hrefTemplate && ymd <= todayYmd) {
        setTentatif(null);
        router.push(hrefTemplate.replace("{n}", String(h.hariKe)));
      }
    } else if (boleh) {
      // Tanggal di luar rentang (sebelum Hari ke-1 / sesudah Hari ke-28): tawarkan jadi awal penelitian.
      setTentatif(ymd);
    }
  };

  const simpan = () => {
    if (!tentatif) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTanggalMulai(balitaId, tentatif);
      if (!result.ok) setError(result.error);
      else {
        setTentatif(null);
        setUbah(false);
        setBulan(tentatif.slice(0, 7));
        router.refresh();
      }
    });
  };

  let status = "Penelitian belum dimulai. Klik sebuah tanggal untuk menetapkannya sebagai Hari ke-1.";
  if (mulai && akhir) {
    if (todayYmd < mulai) status = `Penelitian dimulai ${label(mulai)}.`;
    else if (todayYmd > akhir) status = "Periode penelitian 28 hari sudah selesai.";
    else if (sekarang) status = `Hari ini adalah Hari ke-${sekarang.hariKe} dari 28.`;
  }

  const sel: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) sel.push(<div key={`k${i}`} />);
  for (let d = 1; d <= jumlahHari; d++) {
    const ymd = `${bulan}-${pad(d)}`;
    const h = peta.get(ymd);
    const hariIni = ymd === todayYmd;
    const tiba = ymd <= todayYmd;
    const dipilih = tentatif === ymd;
    const bisaKlik = memilih || (boleh && (h ? !!hrefTemplate && tiba : true));

    let warna = "border-transparent bg-white text-slate-700";
    if (h) {
      warna = h.terisi
        ? "border-emerald-200 bg-emerald-50 text-slate-900"
        : tiba
          ? "border-amber-200 bg-amber-50 text-slate-900"
          : "border-slate-200 bg-slate-50 text-slate-700";
    }
    if (!h && !memilih) warna += " text-slate-500";
    if (dipilih) warna = "border-slate-900 bg-slate-900 text-white";

    sel.push(
      <button
        key={ymd}
        type="button"
        disabled={!bisaKlik || pending}
        onClick={() => klik(ymd)}
        aria-label={label(ymd)}
        aria-current={hariIni ? "date" : undefined}
        className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors sm:aspect-auto sm:min-h-14 ${warna} ${
          hariIni ? "ring-2 ring-brand" : ""
        } ${terpilih !== undefined && h?.hariKe === terpilih ? "outline outline-2 outline-offset-1 outline-slate-900" : ""} ${
          bisaKlik ? "cursor-pointer hover:border-slate-400" : "cursor-default"
        }`}
      >
        <span className="font-medium">{d}</span>
        {h && (
          <span className={`text-[10px] leading-none ${dipilih ? "text-slate-300" : "text-slate-500"}`}>
            H{h.hariKe}
            {labHari.includes(h.hariKe) ? " · Lab" : ""}
          </span>
        )}
      </button>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-medium text-slate-900">Kalender Penelitian</h2>
          <p className="text-sm text-slate-600">{status}</p>
          {mulai && akhir && (
            <p className="text-xs text-slate-500">
              Hari ke-1: {label(mulai)} · Hari ke-28: {label(akhir)}
            </p>
          )}
        </div>
        {boleh && mulai && !ubah && (
          <Button variant="secondary" onClick={() => setUbah(true)}>
            Ubah tanggal mulai
          </Button>
        )}
        {boleh && mulai && ubah && (
          <Button
            variant="ghost"
            onClick={() => {
              setUbah(false);
              setTentatif(null);
            }}
          >
            Batal ubah
          </Button>
        )}
      </div>

      {memilih && mulai && (
        <p className="mb-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          Klik tanggal baru untuk menjadi Hari ke-1. Isian yang sudah ada tetap menempel pada nomor harinya
          ({jumlahTerisi} hari terisi); hanya tanggalnya yang bergeser.
        </p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => geser(-1)}
          className="rounded-lg px-3 py-1 text-lg text-slate-600 hover:bg-slate-100"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold capitalize text-slate-900">{fmtBulan.format(toDate(`${bulan}-01`))}</p>
          {bulan !== todayYmd.slice(0, 7) && (
            <button
              type="button"
              onClick={() => setBulan(todayYmd.slice(0, 7))}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
            >
              Bulan ini
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => geser(1)}
          className="rounded-lg px-3 py-1 text-lg text-slate-600 hover:bg-slate-100"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {NAMA_HARI.map((n) => (
          <div key={n} className="pb-1 text-[11px] font-medium text-slate-400">
            {n}
          </div>
        ))}
        {sel}
      </div>

      {tentatif && boleh && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-800">
            Jadikan <span className="font-semibold">{label(tentatif)}</span> sebagai Hari ke-1 penelitian?
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Hari ke-28 jatuh pada {label(addDays(tentatif, 27))}.</p>
          {mulai && (
            <p className="mt-0.5 text-xs text-slate-500">
              Awal penelitian saat ini {label(mulai)} akan dipindahkan; {jumlahTerisi} hari yang sudah terisi tetap
              menempel pada nomor harinya (hanya tanggalnya yang bergeser).
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button onClick={simpan} disabled={pending}>
              {pending ? "Menyimpan..." : mulai ? "Simpan tanggal baru" : "Mulai penelitian"}
            </Button>
            <Button variant="secondary" onClick={() => setTentatif(null)} disabled={pending}>
              Batal
            </Button>
          </div>
        </div>
      )}
      <FieldError>{error ?? undefined}</FieldError>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-emerald-200 bg-emerald-50" />
          Sudah diisi
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-amber-200 bg-amber-50" />
          Terlewat
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-slate-200 bg-slate-50" />
          Belum tiba
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-brand" />
          Hari ini
        </span>
        {!memilih && (
          <span>
            Klik hari berwarna yang sudah tiba (termasuk yang terlewat) untuk mengisi; klik tanggal lain untuk
            memindahkan awal penelitian.
          </span>
        )}
      </div>
    </Card>
  );
}
