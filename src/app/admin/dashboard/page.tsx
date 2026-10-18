import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { complianceRate, delta } from "@/lib/utils";

const COMPLIANCE_PAGE_SIZE = 10;

export default async function AdminDashboardPage(props: PageProps<"/admin/dashboard">) {
  const { page: pageParam } = await props.searchParams;
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;

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

  // Compliance per balita: urut dari yang terendah (nama sebagai pengurut kedua supaya
  // urutan stabil antar-halaman, mis. saat semua balita masih 0%).
  const complianceList = balitaList
    .map((b) => ({
      id: b.id,
      nama: b.nama,
      terisi: b.catatanHarian.filter((c) => c.statusInput === "TERISI").length,
    }))
    .sort((a, b) => a.terisi - b.terisi || a.nama.localeCompare(b.nama, "id"));
  const totalPages = Math.max(1, Math.ceil(complianceList.length / COMPLIANCE_PAGE_SIZE));
  const currentPage = Math.min(Math.max(parseInt(rawPage ?? "1", 10) || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * COMPLIANCE_PAGE_SIZE;
  const pageItems = complianceList.slice(startIndex, startIndex + COMPLIANCE_PAGE_SIZE);

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
          {pageItems.map((b) => {
            const rate = complianceRate(b.terisi);
            return (
              <div key={b.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate text-slate-700">{b.nama}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-brand" style={{ width: `${Math.min(rate, 100)}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-slate-500">{rate}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Diurutkan dari compliance terendah — menampilkan{" "}
            {complianceList.length === 0 ? 0 : startIndex + 1}–{startIndex + pageItems.length} dari{" "}
            {complianceList.length} balita.
          </p>
          <Pagination current={currentPage} total={totalPages} />
        </div>
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

// Daftar nomor halaman: semua halaman kalau <= 7, selain itu 1 … (sekitar halaman aktif) … terakhir.
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

function Pagination({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;
  const href = (p: number) => `/admin/dashboard?page=${p}`;
  const base = "rounded-lg border px-3 py-1.5 text-sm";
  const idle = `${base} border-slate-200 text-slate-700 hover:bg-slate-50`;
  const off = `${base} pointer-events-none border-slate-100 text-slate-300`;
  return (
    <nav aria-label="Halaman compliance" className="flex flex-wrap items-center gap-1">
      {current > 1 ? (
        <Link href={href(current - 1)} scroll={false} className={idle} aria-label="Halaman sebelumnya">
          Sebelumnya
        </Link>
      ) : (
        <span className={off}>Sebelumnya</span>
      )}
      {pageWindow(current, total).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-slate-400">
            …
          </span>
        ) : p === current ? (
          <span key={p} aria-current="page" className={`${base} border-brand bg-brand text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} scroll={false} className={idle} aria-label={`Halaman ${p}`}>
            {p}
          </Link>
        )
      )}
      {current < total ? (
        <Link href={href(current + 1)} scroll={false} className={idle} aria-label="Halaman berikutnya">
          Berikutnya
        </Link>
      ) : (
        <span className={off}>Berikutnya</span>
      )}
    </nav>
  );
}
