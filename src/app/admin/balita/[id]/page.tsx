import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { TrendChart } from "@/components/TrendChart";
import { IconBack } from "@/components/icons";
import { complianceRate, delta, formatTanggal } from "@/lib/utils";
import { todayCatatan } from "@/lib/data";
import { DURASI_STUDI_HARI, HARI_LAB, LABEL_LAB, TIPE_LAB } from "@/lib/constants";
import { HasilLabForm } from "@/components/HasilLabForm";
import { CatatanHarianForm } from "@/components/CatatanHarianForm";
import { BalitaStatusForm } from "@/components/BalitaStatusForm";

export default async function AdminBalitaDetailPage(
  props: PageProps<"/admin/balita/[id]">
) {
  const { id } = await props.params;

  const balita = await prisma.balita.findUnique({
    where: { id },
    include: {
      kader: { select: { nama: true } },
      catatanHarian: { orderBy: { hariKe: "asc" } },
      hasilLab: true,
      riwayatPemeriksaanAwal: true,
    },
  });
  if (!balita) notFound();

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
  // Tipe lab yang "due" hari ini (kalau ada) — form input hanya muncul untuk ini.
  const tipeLabHariIni = TIPE_LAB.find((t) => hariIni?.hariKe === HARI_LAB[t]);

  const bbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.beratBadan }));
  const tbChartData = balita.catatanHarian.map((c) => ({ hariKe: c.hariKe, nilai: c.tinggiBadan }));

  return (
    <div className="space-y-6">
      <Link href="/admin/balita" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <IconBack className="h-4 w-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">{balita.nama}</h1>
        <p className="text-sm text-slate-500">
          {balita.posyandu} · Kader: {balita.kader.nama} · {balita.usiaBulan} bln
        </p>
      </div>

      <Card>
        <BalitaStatusForm balitaId={balita.id} currentStatus={balita.status} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-slate-900">Data Identitas &amp; Kontak</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <InfoRow label="Tanggal Lahir" value={balita.tanggalLahir ? formatTanggal(balita.tanggalLahir) : null} />
          <InfoRow label="Nama Ibu Kandung" value={balita.namaIbu} />
          <InfoRow label="No. Telp" value={balita.noTelp} />
          <InfoRow label="Alamat" value={balita.alamat} className="sm:col-span-2" />
          <InfoRow label="Provinsi" value={balita.provinsi} />
          <InfoRow label="Kab/Kota" value={balita.kabupatenKota} />
          <InfoRow label="Kecamatan" value={balita.kecamatan} />
          <InfoRow label="Puskesmas" value={balita.puskesmas} />
          <InfoRow label="Desa/Kel" value={balita.desaKelurahan} />
          <InfoRow label="RT/RW" value={balita.rt || balita.rw ? `${balita.rt ?? "-"}/${balita.rw ?? "-"}` : null} />
        </dl>
      </Card>

      {balita.riwayatPemeriksaanAwal && (
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">
            Riwayat Pemeriksaan Sebelum Proyek Ini
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <InfoRow
              label="Usia Saat Ukur"
              value={
                balita.riwayatPemeriksaanAwal.usiaSaatUkurBulan !== null
                  ? `${balita.riwayatPemeriksaanAwal.usiaSaatUkurBulan} bln`
                  : null
              }
            />
            <InfoRow
              label="Tanggal Pengukuran"
              value={
                balita.riwayatPemeriksaanAwal.tanggalPengukuran
                  ? formatTanggal(balita.riwayatPemeriksaanAwal.tanggalPengukuran)
                  : null
              }
            />
            <InfoRow label="Berat" value={fmtNum(balita.riwayatPemeriksaanAwal.berat, "kg")} />
            <InfoRow label="Tinggi" value={fmtNum(balita.riwayatPemeriksaanAwal.tinggi, "cm")} />
            <InfoRow label="Cara Ukur" value={balita.riwayatPemeriksaanAwal.caraUkur} />
            <InfoRow label="LiLA" value={fmtNum(balita.riwayatPemeriksaanAwal.lila, "cm")} />
            <InfoRow label="BB/U" value={balita.riwayatPemeriksaanAwal.bbU} />
            <InfoRow label="ZS BB/U" value={fmtNum(balita.riwayatPemeriksaanAwal.zsBbU)} />
            <InfoRow label="TB/U" value={balita.riwayatPemeriksaanAwal.tbU} />
            <InfoRow label="ZS TB/U" value={fmtNum(balita.riwayatPemeriksaanAwal.zsTbU)} />
            <InfoRow label="BB/TB" value={balita.riwayatPemeriksaanAwal.bbTb} />
            <InfoRow label="ZS BB/TB" value={fmtNum(balita.riwayatPemeriksaanAwal.zsBbTb)} />
            <InfoRow
              label="Naik Berat Badan"
              value={fmtBool(balita.riwayatPemeriksaanAwal.naikBeratBadan)}
            />
            <InfoRow
              label="Jml Vit A"
              value={
                balita.riwayatPemeriksaanAwal.jmlVitA !== null
                  ? String(balita.riwayatPemeriksaanAwal.jmlVitA)
                  : null
              }
            />
            <InfoRow label="KPSP" value={balita.riwayatPemeriksaanAwal.kpsp} />
            <InfoRow label="KIA" value={fmtBool(balita.riwayatPemeriksaanAwal.kia)} />
            <InfoRow label="Kelas Ibu Balita" value={fmtBool(balita.riwayatPemeriksaanAwal.kelasIbuBalita)} />
            <InfoRow label="MBG" value={fmtBool(balita.riwayatPemeriksaanAwal.mbg)} />
            <InfoRow label="Detail" value={balita.riwayatPemeriksaanAwal.detail} className="sm:col-span-2" />
          </dl>
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

      {balita.status === "AKTIF" && hariIni && (
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">
            Input Harian ({formatTanggal(new Date())})
          </h2>
          <CatatanHarianForm
            balitaId={balita.id}
            catatanHarianId={hariIni.id}
            hariKe={hariIni.hariKe}
            defaultTinggiBadan={hariIni.tinggiBadan}
            defaultBeratBadan={hariIni.beratBadan}
            defaultKonsumsi={hariIni.konsumsiNuggetGram}
            defaultKarbohidrat={hariIni.karbohidratGram}
            defaultProtein={hariIni.proteinGram}
            defaultLemak={hariIni.lemakGram}
          />
        </Card>
      )}

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

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value ? value : <span className="text-slate-300">-</span>}</dd>
    </div>
  );
}

function fmtNum(value: number | null | undefined, unit?: string): string | null {
  if (value === null || value === undefined) return null;
  return unit ? `${value} ${unit}` : String(value);
}

function fmtBool(value: boolean | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value ? "Ya" : "Tidak";
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
