import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { BeratBadanChart } from "@/components/BeratBadanChart";
import { IconBack } from "@/components/icons";
import { complianceRate, delta, formatTanggal } from "@/lib/utils";
import { todayCatatan } from "@/lib/data";
import { DURASI_STUDI_HARI } from "@/lib/constants";
import { HasilLabForm } from "@/components/HasilLabForm";

export default async function KaderBalitaDetailPage(
  props: PageProps<"/kader/balita/[id]">
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) redirect("/login");

  const balita = await prisma.balita.findUnique({
    where: { id },
    include: {
      catatanHarian: { orderBy: { hariKe: "asc" } },
      hasilLab: true,
    },
  });
  if (!balita) notFound();
  if (balita.kaderId !== session.user.id) redirect("/kader/dashboard");

  const terisi = balita.catatanHarian.filter((c) => c.statusInput === "TERISI");
  const rate = complianceRate(terisi.length);
  const hariIni = todayCatatan(balita.catatanHarian);
  const beratTerakhir = [...terisi].reverse()[0]?.beratBadan ?? null;
  const deltaBB = delta(beratTerakhir, balita.beratBadanAwal);

  const baseline = balita.hasilLab.find((h) => h.tipe === "BASELINE");
  const endline = balita.hasilLab.find((h) => h.tipe === "ENDLINE");

  const chartData = balita.catatanHarian.map((c) => ({
    hariKe: c.hariKe,
    beratBadan: c.beratBadan,
  }));

  return (
    <div className="space-y-6">
      <Link href="/kader/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <IconBack className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{balita.nama}</h1>
          <p className="text-sm text-slate-500">
            {balita.posyandu} · {balita.usiaBulan} bln · {balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
          </p>
        </div>
        <StatusBadge status={balita.status} />
      </div>

      {balita.status === "AKTIF" && (
        <Card className="border-brand/30 bg-brand/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {hariIni
                  ? `Hari ke-${hariIni.hariKe} — ${hariIni.statusInput === "TERISI" ? "sudah diisi" : "belum diisi"}`
                  : "Hari ini di luar rentang studi 28 hari"}
              </p>
              <p className="text-xs text-slate-500">{formatTanggal(new Date())}</p>
            </div>
            {hariIni && (
              <Link href={`/kader/balita/${balita.id}/input`}>
                <Button>{hariIni.statusInput === "TERISI" ? "Edit input" : "Input sekarang"}</Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Tren Berat Badan</h2>
        {terisi.length > 0 ? (
          <BeratBadanChart data={chartData} beratAwal={balita.beratBadanAwal} />
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
        <h2 className="mb-3 font-medium text-slate-900">Hasil Lab (Hb & Zinc)</h2>
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
  data?: { hbValue: number; zincValue: number; tanggalPengukuran: Date };
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {data ? (
        <>
          <p className="mt-1 text-sm text-slate-900">Hb: {data.hbValue} g/dL</p>
          <p className="text-sm text-slate-900">Zinc: {data.zincValue} µg/dL</p>
          <p className="mt-1 text-xs text-slate-400">{formatTanggal(data.tanggalPengukuran)}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Belum diisi</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "AKTIF") return <Badge tone="success">Aktif</Badge>;
  if (status === "DROPOUT") return <Badge tone="danger">Dropout</Badge>;
  return <Badge tone="default">Selesai</Badge>;
}
