import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { TrendChart } from "@/components/TrendChart";
import { IconBack } from "@/components/icons";
import { complianceRate, delta, formatTanggal } from "@/lib/utils";
import { todayCatatan } from "@/lib/data";
import { DURASI_STUDI_HARI, HARI_LAB, LABEL_LAB, TIPE_LAB } from "@/lib/constants";
import { HasilLabForm } from "@/components/HasilLabForm";
import { OnboardingForm } from "@/components/OnboardingForm";

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
  const pertengahan = balita.hasilLab.find((h) => h.tipe === "PERTENGAHAN");
  const endline = balita.hasilLab.find((h) => h.tipe === "ENDLINE");

  // Hari ke-1 (onboarding): input harian + Baseline digabung satu form (lihat
  // OnboardingForm) — selama ini belum pernah diisi, halaman detail balita
  // menampilkan form itu saja, bukan dashboard di bawah ini.
  const hari1 = balita.catatanHarian.find((c) => c.hariKe === 1);
  const day1BelumSelesai = !hari1 || hari1.statusInput !== "TERISI" || !baseline;

  // Tipe lab yang "due" hari ini (kalau ada) — form input hanya muncul untuk ini.
  // BASELINE tidak ikut di sini karena sudah ditangani lewat OnboardingForm di atas.
  const tipeLabHariIni = TIPE_LAB.filter((t) => t !== "BASELINE").find(
    (t) => hariIni?.hariKe === HARI_LAB[t]
  );

  const bbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.beratBadan }));
  const tbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.tinggiBadan }));

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

      {balita.status === "AKTIF" && day1BelumSelesai && hari1 ? (
        <Card>
          <OnboardingForm balitaId={balita.id} catatanHarianId={hari1.id} />
        </Card>
      ) : (
        <>
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

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Hasil Lab (Hb, Zinc &amp; Fe)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LabSummary label={`${LABEL_LAB.BASELINE} (Hari-${HARI_LAB.BASELINE})`} data={baseline} />
          <LabSummary
            label={`${LABEL_LAB.PERTENGAHAN} (Hari-${HARI_LAB.PERTENGAHAN})`}
            data={pertengahan}
          />
          <LabSummary label={`${LABEL_LAB.ENDLINE} (Hari-${HARI_LAB.ENDLINE})`} data={endline} />
        </div>
        {balita.status === "AKTIF" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {tipeLabHariIni ? (
              <HasilLabForm
                balitaId={balita.id}
                tipe={tipeLabHariIni}
                label={LABEL_LAB[tipeLabHariIni]}
                sudahDiisi={!!balita.hasilLab.find((h) => h.tipe === tipeLabHariIni)}
              />
            ) : (
              <p className="text-xs text-slate-400">
                Form input hasil lab otomatis terbuka pas Hari ke-{HARI_LAB.BASELINE} (
                {LABEL_LAB.BASELINE}), Hari ke-{HARI_LAB.PERTENGAHAN} ({LABEL_LAB.PERTENGAHAN}), dan
                Hari ke-{HARI_LAB.ENDLINE} ({LABEL_LAB.ENDLINE}) — supaya tidak ada yang tidak sengaja
                kepencet/keganti di hari lain.
              </p>
            )}
          </div>
        )}
      </Card>
        </>
      )}
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

function StatusBadge({ status }: { status: string }) {
  if (status === "AKTIF") return <Badge tone="success">Aktif</Badge>;
  if (status === "DROPOUT") return <Badge tone="danger">Dropout</Badge>;
  return <Badge tone="default">Selesai</Badge>;
}
