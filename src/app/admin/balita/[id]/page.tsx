import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { TrendChart } from "@/components/TrendChart";
import { IconBack } from "@/components/icons";
import { complianceRate, delta, formatTanggal } from "@/lib/utils";
import { todayCatatan } from "@/lib/data";
import { DURASI_STUDI_HARI } from "@/lib/constants";
import { HasilLabForm } from "@/components/HasilLabForm";
import { CatatanHarianForm } from "@/components/CatatanHarianForm";
import { BalitaStatusForm } from "@/components/BalitaStatusForm";

export default async function AdminBalitaDetailPage(
  props: PageProps<"/admin/balita/[id]">
) {
  const { id } = await props.params;

  const balita = await prisma.balita.findUnique({
    where: { id },
    include: {
      kader: { select: { nama: true } },
      catatanHarian: { orderBy: { hariKe: "asc" } },
      hasilLab: true,
    },
  });
  if (!balita) notFound();

  const terisi = balita.catatanHarian.filter((c) => c.statusInput === "TERISI");
  const rate = complianceRate(terisi.length);
  const hariIni = todayCatatan(balita.catatanHarian);
  const beratTerakhir = [...terisi].reverse()[0]?.beratBadan ?? null;
  const tinggiTerakhir = [...terisi].reverse()[0]?.tinggiBadan ?? null;
  const deltaBB = delta(beratTerakhir, balita.beratBadanAwal);
  const deltaTB = delta(tinggiTerakhir, balita.tinggiBadanAwal);

  const rataMakro = (
    field: "karbohidratGram" | "proteinGram" | "lemakGram"
  ): number | null => {
    if (terisi.length === 0) return null;
    const total = terisi.reduce((sum, c) => sum + (c[field] ?? 0), 0);
    return Math.round((total / terisi.length) * 10) / 10;
  };

  const baseline = balita.hasilLab.find((h) => h.tipe === "BASELINE");
  const endline = balita.hasilLab.find((h) => h.tipe === "ENDLINE");

  const bbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.beratBadan }));
  const tbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.tinggiBadan }));

  return (
    <div className="space-y-6">
      <Link href="/admin/balita" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <IconBack className="h-4 w-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">{balita.nama}</h1>
        <p className="text-sm text-slate-500">
          {balita.posyandu} · Kader: {balita.kader.nama} · {balita.usiaBulan} bln
        </p>
      </div>

      <Card>
        <BalitaStatusForm balitaId={balita.id} currentStatus={balita.status} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Tren Berat Badan</h2>
        {terisi.length > 0 ? (
          <TrendChart data={bbChartData} nilaiAwal={balita.beratBadanAwal} unit="kg" label="Berat badan" />
        ) : (
          <EmptyState>Belum ada data berat badan terisi.</EmptyState>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="BB Awal" value={`${balita.beratBadanAwal} kg`} />
          <Stat label="BB Terakhir" value={beratTerakhir ? `${beratTerakhir} kg` : "-"} />
          <Stat
            label="Delta"
            value={deltaBB !== null ? `${deltaBB > 0 ? "+" : ""}${deltaBB} kg` : "-"}
          />
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Compliance rate</span>
            <span>
              {terisi.length}/{DURASI_STUDI_HARI} hari ({rate}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand" style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Tren Tinggi Badan</h2>
        {terisi.length > 0 ? (
          <TrendChart
            data={tbChartData}
            nilaiAwal={balita.tinggiBadanAwal}
            unit="cm"
            label="Tinggi badan"
            color="#7c3aed"
          />
        ) : (
          <EmptyState>Belum ada data tinggi badan terisi.</EmptyState>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="TB Awal" value={`${balita.tinggiBadanAwal} cm`} />
          <Stat label="TB Terakhir" value={tinggiTerakhir ? `${tinggiTerakhir} cm` : "-"} />
          <Stat
            label="Delta"
            value={deltaTB !== null ? `${deltaTB > 0 ? "+" : ""}${deltaTB} cm` : "-"}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Rata-rata Asupan Harian</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Karbohidrat" value={rataMakro("karbohidratGram") !== null ? `${rataMakro("karbohidratGram")} g` : "-"} />
          <Stat label="Protein" value={rataMakro("proteinGram") !== null ? `${rataMakro("proteinGram")} g` : "-"} />
          <Stat label="Lemak" value={rataMakro("lemakGram") !== null ? `${rataMakro("lemakGram")} g` : "-"} />
        </div>
      </Card>

      {balita.status === "AKTIF" && hariIni && (
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">
            Input Harian ({formatTanggal(new Date())})
          </h2>
          <CatatanHarianForm
            balitaId={balita.id}
            catatanHarianId={hariIni.id}
            hariKe={hariIni.hariKe}
            defaultTinggiBadan={hariIni.tinggiBadan}
            defaultBeratBadan={hariIni.beratBadan}
            defaultKonsumsi={hariIni.konsumsiNuggetGram}
            defaultKarbohidrat={hariIni.karbohidratGram}
            defaultProtein={hariIni.proteinGram}
            defaultLemak={hariIni.lemakGram}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Hasil Lab (Hb, Zinc &amp; Fe)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabSummary label="Baseline (Hari-0)" data={baseline} />
          <LabSummary label="Endline (Hari-28)" data={endline} />
        </div>
        {balita.status === "AKTIF" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <HasilLabForm
              balitaId={balita.id}
              defaultTipe={!baseline ? "BASELINE" : !endline ? "ENDLINE" : "BASELINE"}
              hasBaseline={!!baseline}
              hasEndline={!!endline}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function LabSummary({
  label,
  data,
}: {
  label: string;
  data?: { hbValue: number; zincValue: number; feValue: number; tanggalPengukuran: Date };
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {data ? (
        <>
          <p className="mt-1 text-sm text-slate-900">Hb: {data.hbValue} g/dL</p>
          <p className="text-sm text-slate-900">Zinc: {data.zincValue} µg/dL</p>
          <p className="text-sm text-slate-900">Fe: {data.feValue} µg/dL</p>
          <p className="mt-1 text-xs text-slate-400">{formatTanggal(data.tanggalPengukuran)}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Belum diisi</p>
      )}
    </div>
  );
}
