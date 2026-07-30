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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const FAULT_COLORS: Record<string, string> = {
  "Partial Discharge": "#dc2626",
  "Stray Gassing": "#f59e0b",
  "Thermal Cellulose": "#ea580c",
  "Thermal Fault (Oil)": "#eab308",
  "Mild Overheating Paper": "#f97316",
  Attention: "#0ea5e9",
  Normal: "#16a34a",
};

function useSummary() {
  return useMemo(() => {
    const nAssets = new Set(rows.map((r) => r.asset_id)).size;
    const nSamples = rows.length;
    const matchRate = rows.filter((r) => r.status_match).length / nSamples;

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

    return { nAssets, nSamples, matchRate, chartData };
  }, []);
}

export function Dashboard() {
  const { nAssets, nSamples, matchRate, chartData } = useSummary();
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aset Trafo</CardDescription>
            <CardTitle className="text-3xl">{nAssets}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sampel</CardDescription>
            <CardTitle className="text-3xl">{nSamples}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rule Engine Match</CardDescription>
            <CardTitle className="text-3xl">{(matchRate * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kategori Fault</CardDescription>
            <CardTitle className="text-3xl">{chartData.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rata-rata Composite Risk Score per Kategori Fault</CardTitle>
          <CardDescription>
            Makin rendah (ke kiri) = makin dianggap anomali oleh Isolation Forest. Urutan yang
            benar: Partial Discharge paling anomali, Normal paling tidak anomali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="fault" width={160} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [Number(value).toFixed(4), "mean anomaly_score"]}
                  labelFormatter={(label) => `Fault type: ${label}`}
                />
                <Bar dataKey="mean" name="mean anomaly_score" radius={[0, 4, 4, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.fault} fill={FAULT_COLORS[d.fault] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data 69 Aset (161 sampel)</CardTitle>
          <CardDescription>
            Ditranskrip verbatim dari 3 laporan lab PT Petrolab Services (Des 2023, Mar 2024, Jul
            2024).
          </CardDescription>
          <Input
            placeholder="Cari asset_id atau fault type..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2 max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead>Rule Engine</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="text-right">Anomaly Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r, i) => (
                  <TableRow key={`${r.asset_id}-${r.sample_date}-${i}`}>
                    <TableCell className="font-medium">{r.asset_id}</TableCell>
                    <TableCell>{r.sample_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: FAULT_COLORS[r.lab_fault_type] }}>
                        {r.lab_fault_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.rule_fault_type}</TableCell>
                    <TableCell>
                      {r.status_match ? (
                        <Badge variant="secondary">cocok</Badge>
                      ) : (
                        <Badge variant="destructive">beda</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.anomaly_score_raw.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
