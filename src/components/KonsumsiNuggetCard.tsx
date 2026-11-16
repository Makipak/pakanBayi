import { Badge, Card, EmptyState } from "@/components/ui";
import { DURASI_STUDI_HARI, TARGET_NUGGET_GRAM } from "@/lib/constants";
import { LABEL_KONSUMSI, ringkasKonsumsiNugget, type StatusKonsumsi } from "@/lib/utils";

const TONE: Record<StatusKonsumsi, "success" | "warning" | "danger" | "default"> = {
  HABIS: "success",
  HAMPIR_HABIS: "success",
  SEBAGIAN: "warning",
  SEDIKIT: "danger",
};

const BAR: Record<StatusKonsumsi, string> = {
  HABIS: "bg-emerald-500",
  HAMPIR_HABIS: "bg-emerald-400",
  SEBAGIAN: "bg-amber-400",
  SEDIKIT: "bg-red-400",
};

/** Ringkasan konsumsi nugget selama studi: rata-rata gram/hari terhadap target. */
export function KonsumsiNuggetCard({
  catatan,
}: {
  catatan: { statusInput: string; konsumsiNuggetGram: number | null }[];
}) {
  const r = ringkasKonsumsiNugget(catatan);
  return (
    <Card>
      <h2 className="mb-3 font-medium text-slate-900">Konsumsi Nugget ({DURASI_STUDI_HARI} Hari)</h2>
      {!r ? (
        <EmptyState>Belum ada data konsumsi nugget terisi.</EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold text-slate-900">
              {r.rataGram} <span className="text-base font-normal text-slate-500">gr / hari</span>
            </p>
            <Badge tone={TONE[r.status]}>{LABEL_KONSUMSI[r.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {r.persenTarget}% dari target {TARGET_NUGGET_GRAM} gr per hari
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${BAR[r.status]}`}
              style={{ width: `${Math.min(100, r.persenTarget)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900">{r.totalGram} gr</p>
              <p className="text-xs text-slate-500">Total dikonsumsi</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {r.hariHabisPenuh}/{r.hariTerisi}
              </p>
              <p className="text-xs text-slate-500">Hari habis penuh</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {r.hariTerisi}/{DURASI_STUDI_HARI}
              </p>
              <p className="text-xs text-slate-500">Hari terisi</p>
            </div>
          </div>
          {r.hariTerisi < DURASI_STUDI_HARI && (
            <p className="mt-3 text-xs text-slate-400">
              Rata-rata dihitung dari {r.hariTerisi} hari yang sudah terisi; belum final sampai {DURASI_STUDI_HARI} hari lengkap.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
