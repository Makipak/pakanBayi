import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState } from "@/components/ui";
import { BalitaForm } from "@/components/BalitaForm";
import { complianceRate } from "@/lib/utils";

export default async function AdminBalitaPage() {
  const [balitaList, kaderList] = await Promise.all([
    prisma.balita.findMany({
      include: { kader: { select: { nama: true } }, catatanHarian: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: "KADER" }, select: { id: true, nama: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Data Balita</h1>
          <p className="text-sm text-slate-500">{balitaList.length} balita terdaftar</p>
        </div>
      </div>

      <BalitaForm kaderList={kaderList} />

      {balitaList.length === 0 ? (
        <EmptyState>Belum ada data balita.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {balitaList.map((b) => {
            const terisi = b.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
            const rate = complianceRate(terisi);
            return (
              <Link key={b.id} href={`/admin/balita/${b.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{b.nama}</p>
                      <p className="text-xs text-slate-500">
                        {b.posyandu} · Kader: {b.kader.nama}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Compliance: {terisi}/28 hari ({rate}%)
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "AKTIF") return <Badge tone="success">Aktif</Badge>;
  if (status === "DROPOUT") return <Badge tone="danger">Dropout</Badge>;
  return <Badge tone="default">Selesai</Badge>;
}
