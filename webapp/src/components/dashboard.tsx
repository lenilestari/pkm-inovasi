"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FaultGlossary } from "@/components/fault-glossary";
import dataset from "@/lib/dataset.json";

interface Row {
  asset_id: string;
  sample_date: string;
  manufacture_year: number;
  age: number;
  lab_status: number;
  lab_fault_type: string;
  rule_status: number;
  rule_fault_type: string;
  status_match: boolean;
  n_gas_worsening: number;
  n_parameters_worsening: number;
  anomaly_score_raw: number;
}

const rows = dataset.rows as unknown as Row[];

const FAULT_COLOR_VAR: Record<string, string> = {
  "Partial Discharge": "var(--fault-pd)",
  "Stray Gassing": "var(--fault-stray)",
  "Thermal Cellulose": "var(--fault-thermal-cellulose)",
  "Thermal Fault (Oil)": "var(--fault-thermal-oil)",
  "Mild Overheating Paper": "var(--fault-mild)",
  Attention: "var(--fault-attention)",
  Normal: "var(--fault-normal)",
};

function faultColor(fault: string) {
  return FAULT_COLOR_VAR[fault] ?? "var(--muted-foreground)";
}

function useSummary() {
  return useMemo(() => {
    const nAssets = new Set(rows.map((r) => r.asset_id)).size;
    const nSamples = rows.length;
    const matchRate = rows.filter((r) => r.status_match).length / nSamples;
    const nCritical = rows.filter((r) => r.lab_fault_type === "Partial Discharge").length;

    const byFault = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      const acc = byFault.get(r.lab_fault_type) ?? { sum: 0, count: 0 };
      acc.sum += r.anomaly_score_raw;
      acc.count += 1;
      byFault.set(r.lab_fault_type, acc);
    }
    const chartData = Array.from(byFault.entries())
      .map(([fault, { sum, count }]) => ({ fault, mean: sum / count, count }))
      .sort((a, b) => a.mean - b.mean);

    const distribution = Array.from(byFault.entries())
      .map(([fault, { count }]) => ({ fault, count, pct: (count / nSamples) * 100 }))
      .sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...distribution.map((d) => d.count));

    return { nAssets, nSamples, matchRate, chartData, nCritical, distribution, maxCount };
  }, []);
}

function StatChip({ label, value, colorVar }: { label: string; value: string; colorVar?: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: colorVar ?? "var(--fault-normal)" }}
        />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function Dashboard() {
  const { nAssets, nSamples, matchRate, chartData, nCritical, distribution, maxCount } = useSummary();
  const [filter, setFilter] = useState("");

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.asset_id.toLowerCase().includes(q) || r.lab_fault_type.toLowerCase().includes(q),
    );
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatChip label="Aset Trafo" value={String(nAssets)} />
        <StatChip label="Total Sampel" value={String(nSamples)} />
        <StatChip
          label="Rule Engine Match"
          value={`${(matchRate * 100).toFixed(0)}%`}
          colorVar="var(--fault-thermal-oil)"
        />
        <StatChip label="Kategori Fault" value={String(chartData.length)} />
        <StatChip
          label="Partial Discharge"
          value={String(nCritical)}
          colorVar="var(--fault-pd)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Distribusi Kesimpulan Lab</CardTitle>
          <CardDescription>
            161 sampel, dikelompokkan per kesimpulan resmi lab Petrolab (<code className="font-data">lab_fault_type</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {distribution.map((d) => (
            <div key={d.fault} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-sm truncate">{d.fault}</span>
              <div className="flex-1 h-4 rounded-sm bg-muted overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    backgroundColor: faultColor(d.fault),
                  }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-data tabular-nums">
                {d.count} &middot; {d.pct.toFixed(1)}%
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Attention = flag ketidakpastian lab, bukan jenis kerusakan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Composite Risk Score per Kategori Fault</CardTitle>
          <CardDescription>
            Rata-rata <code className="font-data">anomaly_score</code> dari Isolation Forest --
            makin rendah (kiri) makin dianggap anomali. Urutan yang benar: Partial Discharge
            paling anomali, Normal paling tidak anomali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                />
                <YAxis
                  type="category"
                  dataKey="fault"
                  width={160}
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value) => [Number(value).toFixed(4), "mean anomaly_score"]}
                  labelFormatter={(label) => `Fault type: ${label}`}
                />
                <Bar dataKey="mean" name="mean anomaly_score" radius={[0, 3, 3, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.fault} fill={faultColor(d.fault)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <FaultGlossary />

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Log Data -- 69 Aset (161 Sampel)</CardTitle>
          <CardDescription>
            Ditranskrip verbatim dari 3 laporan lab PT Petrolab Services (Des 2023, Mar 2024, Jul
            2024).
          </CardDescription>
          <Input
            placeholder="Cari asset_id atau fault type..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2 max-w-sm font-data"
          />
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="max-h-120 overflow-auto rounded-md border border-border/70">
            <table className="w-full text-sm font-data">
              <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/70">
                  <th className="text-left font-medium px-3 py-2">Asset</th>
                  <th className="text-left font-medium px-3 py-2">Tanggal</th>
                  <th className="text-left font-medium px-3 py-2">Lab</th>
                  <th className="text-left font-medium px-3 py-2">Rule Engine</th>
                  <th className="text-left font-medium px-3 py-2">Match</th>
                  <th className="text-right font-medium px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr
                    key={`${r.asset_id}-${r.sample_date}-${i}`}
                    className="border-b border-border/40 last:border-0"
                    style={{ borderLeft: `3px solid ${faultColor(r.lab_fault_type)}` }}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{r.asset_id}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {r.sample_date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-sans"
                        style={{
                          color: faultColor(r.lab_fault_type),
                          backgroundColor: "color-mix(in oklch, currentColor 14%, transparent)",
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: faultColor(r.lab_fault_type) }}
                        />
                        {r.lab_fault_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {r.rule_fault_type}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.status_match ? (
                        <span style={{ color: "var(--fault-normal)" }}>cocok</span>
                      ) : (
                        <span style={{ color: "var(--fault-pd)" }}>beda</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.anomaly_score_raw.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
