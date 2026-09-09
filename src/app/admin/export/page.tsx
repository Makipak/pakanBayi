import { Card } from "@/components/ui";
import { IconDownload } from "@/components/icons";

export default function AdminExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Export Data</h1>
        <p className="text-sm text-slate-500">
          Unduh data untuk analisis statistik (SPSS/Excel)
        </p>
      </div>

      <Card>
        <h2 className="font-medium text-slate-900">Ringkasan per Balita</h2>
        <p className="mt-1 text-sm text-slate-500">
          Satu baris per balita: baseline/endline BB, Hb, Zinc, delta, compliance rate.
        </p>
        <a
          href="/api/export/ringkasan"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <IconDownload className="h-4 w-4" /> Download CSV Ringkasan
        </a>
      </Card>

      <Card>
        <h2 className="font-medium text-slate-900">Detail Catatan Harian</h2>
        <p className="mt-1 text-sm text-slate-500">
          Semua baris CatatanHarian (28 hari x jumlah balita), termasuk yang belum terisi.
        </p>
        <a
          href="/api/export/harian"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <IconDownload className="h-4 w-4" /> Download CSV Detail Harian
        </a>
      </Card>
    </div>
  );
}
