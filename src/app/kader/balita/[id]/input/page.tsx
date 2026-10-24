import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { IconBack } from "@/components/icons";
import { pilihHari, sudahTiba } from "@/lib/data";
import { formatTanggal } from "@/lib/utils";
import { CatatanHarianForm } from "@/components/CatatanHarianForm";

export default async function InputHarianPage(
  props: PageProps<"/kader/balita/[id]/input">
) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  const balita = await prisma.balita.findUnique({
    where: { id },
    include: { catatanHarian: true },
  });
  if (!balita) notFound();
  if (balita.kaderId !== session.user.id) redirect("/kader/dashboard");

  const hariIni = pilihHari(balita.catatanHarian, sp.hari);

  return (
    <div className="space-y-6">
      <Link
        href={`/kader/balita/${balita.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500"
      >
        <IconBack className="h-4 w-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Input Harian</h1>
        <p className="text-sm text-slate-500">
          {balita.nama}
          {hariIni && ` · Hari ke-${hariIni.hariKe} (${formatTanggal(hariIni.tanggal)})`}
        </p>
      </div>

      <Card id="input-harian">
        {balita.status !== "AKTIF" ? (
          <EmptyState>Balita berstatus {balita.status.toLowerCase()}, input dinonaktifkan.</EmptyState>
        ) : !hariIni ? (
          <EmptyState>Hari ini di luar rentang studi 28 hari untuk balita ini.</EmptyState>
        ) : !sudahTiba(hariIni.tanggal) ? (
          <EmptyState>
            Hari ke-{hariIni.hariKe} baru tiba pada {formatTanggal(hariIni.tanggal)}. Pilih hari lain di kalender.
          </EmptyState>
        ) : (
          <CatatanHarianForm
            key={hariIni.id}
            balitaId={balita.id}
            catatanHarianId={hariIni.id}
            hariKe={hariIni.hariKe}
            defaultTinggiBadan={hariIni.tinggiBadan}
            defaultBeratBadan={hariIni.beratBadan}
            defaultKonsumsi={hariIni.konsumsiNuggetGram}
            defaultEnergi={hariIni.energiKkal}
            defaultKarbohidrat={hariIni.karbohidratGram}
            defaultProtein={hariIni.proteinGram}
            defaultLemak={hariIni.lemakGram}
          />
        )}
      </Card>
    </div>
  );
}
