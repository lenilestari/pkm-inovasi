"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
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
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
  lab_status: number;
  lab_fault_type: string;
  rule_status: number;
  rule_fault_type: string;
  status_match: boolean;
  n_gas_worsening: number;
  pd_value_max: number | null;
  pd_overall_severity: string | null;
  pd_worsening: number;
  n_parameters_worsening: number;
  anomaly_score_raw: number;
}

const rows = dataset.rows as unknown as Row[];

const GAS_TREND_LINES: { key: keyof Row; name: string; color: string }[] = [
  { key: "h2", name: "H2", color: "#dc2626" },
  { key: "ch4", name: "CH4", color: "#f59e0b" },
  { key: "c2h6", name: "C2H6", color: "#16a34a" },
  { key: "c2h4", name: "C2H4", color: "#0ea5e9" },
  { key: "c2h2", name: "C2H2", color: "#a855f7" },
  { key: "co", name: "CO", color: "#78716c" },
  { key: "co2", name: "CO2", color: "#1f2937" },
];

function useAssetOptions() {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.asset_id, (counts.get(r.asset_id) ?? 0) + 1);
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([asset_id, count]) => ({ asset_id, count }));
  }, []);
}

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
  const assetOptions = useAssetOptions();
  const [trendAsset, setTrendAsset] = useState(assetOptions[0]?.asset_id ?? "");

  const trendData = useMemo(() => {
    return rows
      .filter((r) => r.asset_id === trendAsset)
      .sort((a, b) => a.sample_date.localeCompare(b.sample_date));
  }, [trendAsset]);

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
          <CardTitle className="font-display">Tren per Aset (Trend Engine)</CardTitle>
          <CardDescription>
            Kadar 7 gas DGA dari waktu ke waktu untuk 1 aset -- ini yang jadi bahan Delta Value &amp;
            &quot;gas memburuk&quot; di Trend Engine (Bagian 2 Metodologi). Pilih aset yang punya
            &ge;2 titik sampling.
          </CardDescription>
          <select
            value={trendAsset}
            onChange={(e) => setTrendAsset(e.target.value)}
            className="mt-2 h-9 max-w-xs rounded-md border border-input bg-transparent px-3 text-sm font-data"
          >
            {assetOptions.map((a) => (
              <option key={a.asset_id} value={a.asset_id}>
                {a.asset_id} ({a.count} sampel)
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="sample_date"
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                  label={{ value: "ppm", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {GAS_TREND_LINES.map((g) => (
                  <Line
                    key={g.key}
                    type="monotone"
                    dataKey={g.key}
                    name={g.name}
                    stroke={g.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {trendData.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Kesimpulan lab per titik: {trendData.map((r) => `${r.sample_date} = ${r.lab_fault_type}`).join(", ")}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-border/60">
            <p className="text-sm font-medium">
              Tren PD <span className="text-fault-attention font-normal">(SIMULASI, bukan sensor riil)</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Nilai PD (mV) untuk aset yang sama, tanggal yang sama -- garis putus-putus menandai
              ini bukan data sensor sungguhan.
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="sample_date"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                    label={{ value: "mV", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    formatter={(value, _name, item) => [
                      `${Number(value).toFixed(1)} mV (${item.payload.pd_overall_severity ?? "-"})`,
                      "PD (simulasi)",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pd_value_max"
                    name="PD (simulasi, mV)"
                    stroke="var(--fault-attention)"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60">
            <p className="text-sm font-medium">Tren Skor Gabungan (Composite Risk Score)</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              <code className="font-data">anomaly_score_raw</code> dari model AI -- angka tunggal
              hasil menggabungkan tren gas DGA (riil) di atas dengan tren PD (simulasi) di atas.
              Makin rendah/negatif, makin dianggap anomali. Zona warna: <span className="text-fault-pd font-medium">merah = Kritis (&le; -0,02)</span>,
              <span className="text-fault-thermal-oil font-medium"> kuning = Waspada (-0,02 s/d 0,1)</span>,
              <span className="text-fault-normal font-medium"> hijau = Normal (&gt; 0,1)</span> -- sama
              persis ambang yang dipakai di halaman Coba Sendiri.
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="sample_date"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                  />
                  <YAxis
                    domain={[-0.35, 0.22]}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
                    label={{ value: "skor", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <ReferenceArea y1={-0.35} y2={-0.02} fill="var(--fault-pd)" fillOpacity={0.08} />
                  <ReferenceArea y1={-0.02} y2={0.1} fill="var(--fault-thermal-oil)" fillOpacity={0.08} />
                  <ReferenceArea y1={0.1} y2={0.22} fill="var(--fault-normal)" fillOpacity={0.08} />
                  <ReferenceLine y={-0.02} stroke="var(--fault-pd)" strokeDasharray="3 3" />
                  <ReferenceLine y={0.1} stroke="var(--fault-thermal-oil)" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    formatter={(value) => {
                      const v = Number(value);
                      const zone = v <= -0.02 ? "Kritis" : v <= 0.1 ? "Waspada" : "Normal";
                      return [`${v.toFixed(4)} (${zone})`, "anomaly_score_raw"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="anomaly_score_raw"
                    name="Skor Gabungan (AI)"
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Log Data, 69 Aset (161 Sampel)</CardTitle>
          <CardDescription>
            Ditranskrip verbatim dari 3 laporan lab PT Petrolab Services (Des 2023, Mar 2024, Jul
            2024). Kolom &quot;Gas Memburuk&quot; dan &quot;Match&quot;-&quot;Score&quot; murni
            dari data DGA riil; kolom &quot;PD&quot; ditandai terpisah karena masih data simulasi
            (lihat Alert transparansi di atas).
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
                  <th className="text-center font-medium px-3 py-2" title="Jumlah gas DGA yang memburuk (data riil)">
                    Gas Memburuk
                  </th>
                  <th className="text-center font-medium px-3 py-2 text-fault-attention" title="Indikasi PD memburuk -- data SIMULASI, bukan sensor riil">
                    PD (simulasi)
                  </th>
                  <th className="text-center font-semibold px-3 py-2" title="n_gas_worsening + pd_worsening">
                    Total Memburuk
                  </th>
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
                    <td className="px-3 py-2 text-center tabular-nums">{r.n_gas_worsening}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-fault-attention">
                      {r.pd_worsening}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums font-semibold">
                      {r.n_parameters_worsening}
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
