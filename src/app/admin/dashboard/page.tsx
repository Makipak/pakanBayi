import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { complianceRate, delta } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [balitaList, kaderCount] = await Promise.all([
    prisma.balita.findMany({
      include: { catatanHarian: true, hasilLab: true },
    }),
    prisma.user.count({ where: { role: "KADER" } }),
  ]);

  const totalBalita = balitaList.length;
  const aktif = balitaList.filter((b) => b.status === "AKTIF").length;
  const dropout = balitaList.filter((b) => b.status === "DROPOUT").length;

  const complianceRates = balitaList.map((b) => {
    const terisi = b.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
    return complianceRate(terisi);
  });
  const avgCompliance = complianceRates.length
    ? Math.round((complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length) * 10) / 10
    : 0;

  const deltaBBList = balitaList
    .map((b) => {
      const terisi = b.catatanHarian
        .filter((c) => c.statusInput === "TERISI")
        .sort((a, c) => a.hariKe - c.hariKe);
      const terakhir = terisi[terisi.length - 1]?.beratBadan;
      return delta(terakhir, b.beratBadanAwal);
    })
    .filter((d): d is number => d !== null);
  const avgDeltaBB = deltaBBList.length
    ? Math.round((deltaBBList.reduce((a, b) => a + b, 0) / deltaBBList.length) * 100) / 100
    : 0;

  const labLengkap = balitaList.filter(
    (b) => b.hasilLab.some((l) => l.tipe === "BASELINE") && b.hasilLab.some((l) => l.tipe === "ENDLINE")
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Agregat</h1>
        <p className="text-sm text-slate-500">Ringkasan seluruh balita &amp; progres studi</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Balita" value={String(totalBalita)} />
        <StatCard label="Aktif" value={String(aktif)} />
        <StatCard label="Dropout" value={String(dropout)} />
        <StatCard label="Jumlah Kader" value={String(kaderCount)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Rata-rata Compliance Rate" value={`${avgCompliance}%`} />
        <StatCard
          label="Rata-rata Delta Berat Badan"
          value={`${avgDeltaBB > 0 ? "+" : ""}${avgDeltaBB} kg`}
        />
        <StatCard label="Lab Lengkap (Baseline + Endline)" value={`${labLengkap}/${totalBalita}`} />
      </div>

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Compliance per Balita</h2>
        <div className="space-y-2">
          {balitaList
            .sort((a, b) => {
              const ta = a.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
              const tb = b.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
              return ta - tb;
            })
            .slice(0, 10)
            .map((b) => {
              const terisi = b.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
              const rate = complianceRate(terisi);
              return (
                <div key={b.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate text-slate-700">{b.nama}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs text-slate-500">{rate}%</span>
                </div>
              );
            })}
        </div>
        <p className="mt-2 text-xs text-slate-400">Menampilkan 10 balita dengan compliance terendah.</p>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </Card>
  );
}
