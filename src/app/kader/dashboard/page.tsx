import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState } from "@/components/ui";
import { complianceRate } from "@/lib/utils";
import { DURASI_STUDI_HARI } from "@/lib/constants";

export default async function KaderDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const balitaList = await prisma.balita.findMany({
    where: { kaderId: session.user.id },
    include: {
      catatanHarian: { select: { statusInput: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Balita Saya</h1>
        <p className="text-sm text-slate-500">
          {balitaList.length} balita ditangani — {session.user.name}
        </p>
      </div>

      {balitaList.length === 0 ? (
        <EmptyState>Belum ada balita yang di-assign ke kamu oleh Admin.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {balitaList.map((b) => {
            const terisi = b.catatanHarian.filter((c) => c.statusInput === "TERISI").length;
            const rate = complianceRate(terisi);
            return (
              <Link key={b.id} href={`/kader/balita/${b.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{b.nama}</p>
                      <p className="text-xs text-slate-500">
                        {b.posyandu} · {b.usiaBulan} bln · {b.jenisKelamin}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Compliance</span>
                      <span>
                        {terisi}/{DURASI_STUDI_HARI} hari ({rate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-brand"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                  </div>
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
