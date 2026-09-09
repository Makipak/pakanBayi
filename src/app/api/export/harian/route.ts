import Papa from "papaparse";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const catatan = await prisma.catatanHarian.findMany({
    include: {
      balita: { select: { nama: true, posyandu: true, kader: { select: { nama: true } } } },
      input: { select: { nama: true } },
    },
    orderBy: [{ balitaId: "asc" }, { hariKe: "asc" }],
  });

  const rows = catatan.map((c) => ({
    id_balita: c.balitaId,
    nama_balita: c.balita.nama,
    posyandu: c.balita.posyandu,
    kader: c.balita.kader.nama,
    hari_ke: c.hariKe,
    tanggal: c.tanggal.toISOString().slice(0, 10),
    berat_badan_kg: c.beratBadan ?? "",
    konsumsi_nugget_gram: c.konsumsiNuggetGram ?? "",
    status_input: c.statusInput,
    diinput_oleh: c.input?.nama ?? "",
  }));

  const csv = Papa.unparse(rows);
  const filename = `catatan-harian-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
