import Papa from "papaparse";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { complianceRate, delta } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const balitaList = await prisma.balita.findMany({
    include: {
      kader: { select: { nama: true, username: true } },
      catatanHarian: true,
      hasilLab: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = balitaList.map((b) => {
    const terisi = b.catatanHarian
      .filter((c) => c.statusInput === "TERISI")
      .sort((a, c) => a.hariKe - c.hariKe);
    const beratTerakhir = terisi[terisi.length - 1]?.beratBadan ?? null;
    const rataKonsumsi = terisi.length
      ? Math.round(
          (terisi.reduce((sum, c) => sum + (c.konsumsiNuggetGram ?? 0), 0) / terisi.length) * 100
        ) / 100
      : null;

    const baseline = b.hasilLab.find((h) => h.tipe === "BASELINE");
    const endline = b.hasilLab.find((h) => h.tipe === "ENDLINE");

    return {
      id_balita: b.id,
      nama: b.nama,
      usia_bulan: b.usiaBulan,
      jenis_kelamin: b.jenisKelamin,
      posyandu: b.posyandu,
      kader: b.kader.nama,
      status: b.status,
      tinggi_badan_awal_cm: b.tinggiBadanAwal,
      berat_badan_awal_kg: b.beratBadanAwal,
      berat_badan_terakhir_kg: beratTerakhir ?? "",
      delta_berat_badan_kg: delta(beratTerakhir, b.beratBadanAwal) ?? "",
      rata_rata_konsumsi_nugget_gram: rataKonsumsi ?? "",
      jumlah_hari_terisi: terisi.length,
      compliance_rate_persen: complianceRate(terisi.length),
      hb_baseline: baseline?.hbValue ?? "",
      hb_endline: endline?.hbValue ?? "",
      delta_hb: delta(endline?.hbValue, baseline?.hbValue ?? 0) ?? "",
      zinc_baseline: baseline?.zincValue ?? "",
      zinc_endline: endline?.zincValue ?? "",
      delta_zinc: delta(endline?.zincValue, baseline?.zincValue ?? 0) ?? "",
    };
  });

  const csv = Papa.unparse(rows);
  const filename = `ringkasan-balita-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
