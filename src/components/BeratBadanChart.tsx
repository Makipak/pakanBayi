"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = {
  hariKe: number;
  beratBadan: number | null;
};

export function BeratBadanChart({
  data,
  beratAwal,
}: {
  data: ChartPoint[];
  beratAwal: number;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="hariKe"
            tick={{ fontSize: 11 }}
            label={{ value: "Hari ke-", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            domain={["dataMin - 1", "dataMax + 1"]}
            width={36}
          />
          <Tooltip
            formatter={(value) => [`${value} kg`, "Berat badan"]}
            labelFormatter={(label) => `Hari ke-${label}`}
          />
          <ReferenceLine
            y={beratAwal}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: "Baseline", position: "insideTopLeft", fontSize: 10, fill: "#64748b" }}
          />
          <Line
            type="monotone"
            dataKey="beratBadan"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
