import { Card } from "@/components/ui";
import { DURASI_STUDI_HARI, HARI_LAB } from "@/lib/constants";
import { ymdWib } from "@/lib/data";

const fmtSingkat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
});
const fmtHari = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "short" });
const fmtPanjang = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type Hari = { hariKe: number; tanggal: Date; statusInput: string };

// Kalender 28 hari studi: menunjukkan hari ke-1 jatuh di tanggal berapa, hari ke-2
// tanggal berapa, dst., plus status isian dan penanda hari pengambilan lab. Server
// component murni (tanpa JS di browser). Form pengubah tanggal hari ke-1 (khusus
// admin) dikirim lewat `aksi`.
export function KalenderStudi({ catatan, aksi }: { catatan: Hari[]; aksi?: React.ReactNode }) {
  const hari = [...catatan].sort((a, b) => a.hariKe - b.hariKe);
  const hariLab = new Set<number>(Object.values(HARI_LAB));
  const todayYmd = ymdWib(new Date());
  const awal = hari[0] ? ymdWib(hari[0].tanggal) : null;
  const akhir = hari.length ? ymdWib(hari[hari.length - 1].tanggal) : null;
  const sekarang = hari.find((h) => ymdWib(h.tanggal) === todayYmd);

  let ringkas = "Kalender belum tersedia.";
  if (awal && akhir) {
    if (todayYmd < awal) ringkas = "Studi belum dimulai.";
    else if (todayYmd > akhir) ringkas = "Periode studi 28 hari sudah selesai.";
    else if (sekarang) ringkas = `Hari ini adalah Hari ke-${sekarang.hariKe} dari ${DURASI_STUDI_HARI}.`;
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-medium text-slate-900">Kalender Studi {DURASI_STUDI_HARI} Hari</h2>
          {hari[0] && hari[hari.length - 1] && (
            <p className="text-xs text-slate-500">
              Hari ke-1: {fmtPanjang.format(hari[0].tanggal)} · Hari ke-{hari[hari.length - 1].hariKe}:{" "}
              {fmtPanjang.format(hari[hari.length - 1].tanggal)}
            </p>
          )}
        </div>
        <p className="text-sm font-medium text-slate-700">{ringkas}</p>
      </div>

      {aksi && <div className="mb-4 border-b border-slate-100 pb-4">{aksi}</div>}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {hari.map((h) => {
          const ymd = ymdWib(h.tanggal);
          const terisi = h.statusInput === "TERISI";
          const hariIni = ymd === todayYmd;
          const terlewat = ymd < todayYmd && !terisi;
          const tone = terisi
            ? "border-emerald-200 bg-emerald-50"
            : terlewat
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white";
          return (
            <div
              key={h.hariKe}
              className={`rounded-lg border p-2 text-center ${tone} ${hariIni ? "ring-2 ring-brand" : ""}`}
              title={fmtPanjang.format(h.tanggal)}
            >
              <p className="text-[11px] font-semibold text-slate-700">Hari {h.hariKe}</p>
              <p className="text-xs text-slate-900">{fmtSingkat.format(h.tanggal)}</p>
              <p className="text-[10px] text-slate-400">{fmtHari.format(h.tanggal)}</p>
              {hariLab.has(h.hariKe) && (
                <p className="mt-1 rounded bg-slate-900 px-1 text-[10px] font-medium text-white">Lab</p>
              )}
            </div>
          );
        })}
      </div>

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
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-slate-200 bg-white" />
          Belum tiba
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-brand" />
          Hari ini
        </span>
      </div>
    </Card>
  );
}
