import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { KaderForm } from "@/components/KaderForm";
import { KaderRow } from "@/components/KaderRow";

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
            <KaderRow
              key={k.id}
              kaderId={k.id}
              nama={k.nama}
              username={k.username}
              jumlahBalita={k._count.balita}
            />
          ))}
        </div>
      )}
    </div>
  );
}
