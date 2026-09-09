import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { KaderForm } from "@/components/KaderForm";
import { KaderDeleteButton } from "@/components/KaderDeleteButton";

export default async function AdminKaderPage() {
  const kaderList = await prisma.user.findMany({
    where: { role: "KADER" },
    include: { _count: { select: { balita: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kelola Akun Kader</h1>
        <p className="text-sm text-slate-500">{kaderList.length} kader terdaftar</p>
      </div>

      <KaderForm />

      {kaderList.length === 0 ? (
        <EmptyState>Belum ada akun kader.</EmptyState>
      ) : (
        <div className="space-y-3">
          {kaderList.map((k) => (
            <Card key={k.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{k.nama}</p>
                <p className="text-xs text-slate-500">
                  @{k.username} · {k._count.balita} balita ditangani
                </p>
              </div>
              <KaderDeleteButton kaderId={k.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
