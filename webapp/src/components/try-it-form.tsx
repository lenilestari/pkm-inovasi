"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GAS_COLS,
  GasKey,
  GasReading,
  evaluateDga,
  countGasWorsening,
  FAULT_SEVERITY_RANK,
} from "@/lib/rule-engine";
import { computeRiskScore } from "@/lib/risk-score";
import { buildNarrative } from "@/lib/explain";

const GAS_LABELS: Record<GasKey, string> = {
  h2: "H2 (Hidrogen)",
  ch4: "CH4 (Metana)",
  c2h6: "C2H6 (Etana)",
  c2h4: "C2H4 (Etilena)",
  c2h2: "C2H2 (Asetilena)",
  co: "CO (Karbon Monoksida)",
  co2: "CO2 (Karbon Dioksida)",
};

const EMPTY_GAS: Record<GasKey, string> = {
  h2: "",
  ch4: "",
  c2h6: "",
  c2h4: "",
  c2h2: "",
  co: "",
  co2: "",
};

// --- PD Severity Logic -------------------------------------------------------
// Threshold indikatif (dummy) � belum dikonfirmasi dari vendor alat ukur.
// Mengikuti pola data riil di data_pd_riil/*.csv (~7-42 dBmV, label "Noise").
export type PdSeverityLevel = "normal" | "waspada" | "kritis";

export interface PdSeverity {
  level: PdSeverityLevel;
  contribution: 0 | 1 | 2;
  label: string;
  colorClass: string;
}

export function classifyPdSeverity(dbmvStr: string): PdSeverity {
  const v = parseFloat(dbmvStr);
  if (!dbmvStr || isNaN(v) || v <= 0) {
    return { level: "normal", contribution: 0, label: "Tidak terukur", colorClass: "text-muted-foreground" };
  }
  if (v <= 20) {
    return { level: "normal", contribution: 0, label: `Normal`, colorClass: "text-green-600 dark:text-green-400" };
  }
  if (v <= 40) {
    return { level: "waspada", contribution: 1, label: `Waspada`, colorClass: "text-yellow-600 dark:text-yellow-400" };
  }
  return { level: "kritis", contribution: 2, label: `Kritis`, colorClass: "text-red-600 dark:text-red-400" };
}

// --- Presets -----------------------------------------------------------------
interface ExamplePreset {
  label: string;
  faultType: string;
  assetId: string;
  manufactureYear: string;
  sampleDate: string;
  curr: Record<GasKey, string>;
  o2: string;
  n2: string;
  pdDbmv: string;
  ruleEngineCaveat?: string;
}

const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    label: "Normal",
    faultType: "Normal",
    assetId: "1N-TR-001",
    manufactureYear: "2014",
    sampleDate: "2024-02-06",
    curr: { h2: "3", ch4: "10", c2h6: "3", c2h4: "8", c2h2: "0", co: "702", co2: "6854" },
    o2: "1694",
    n2: "71536",
    pdDbmv: "8",
  },
  {
    label: "Stray Gassing",
    faultType: "Stray Gassing",
    assetId: "TR-45B",
    manufactureYear: "1976",
    sampleDate: "2024-02-06",
    curr: { h2: "2", ch4: "9", c2h6: "3", c2h4: "100", c2h2: "0", co: "16", co2: "10215" },
    o2: "117",
    n2: "64349",
    pdDbmv: "12",
  },
  {
    label: "Mild Overheating Paper",
    faultType: "Mild Overheating Paper",
    assetId: "TR-311B",
    manufactureYear: "1993",
    sampleDate: "2023-03-29",
    curr: { h2: "85", ch4: "14", c2h6: "3", c2h4: "8", c2h2: "0", co: "480", co2: "18735" },
    o2: "1367",
    n2: "70057",
    pdDbmv: "18",
    ruleEngineCaveat:
      "Rule engine kami cuma bisa hasilkan 5 kategori (Normal, Stray Gassing, Thermal Fault (Oil), Thermal Cellulose, Partial Discharge) -- \"Mild Overheating Paper\" cuma ada sebagai kesimpulan lab, bukan output rule engine kami. Contoh ini sengaja dipasang untuk menunjukkan keterbatasan itu secara jujur, bukan disembunyikan.",
  },
  {
    label: "Attention",
    faultType: "Attention",
    assetId: "TR-312A",
    manufactureYear: "1985",
    sampleDate: "2023-03-29",
    curr: { h2: "2", ch4: "3", c2h6: "4", c2h4: "16", c2h2: "0", co: "271", co2: "5545" },
    o2: "25555",
    n2: "60244",
    pdDbmv: "22",
    ruleEngineCaveat:
      "Rule engine kami cuma bisa hasilkan 5 kategori (Normal, Stray Gassing, Thermal Fault (Oil), Thermal Cellulose, Partial Discharge) -- \"Attention\" cuma ada sebagai flag ketidakpastian dari lab, bukan output rule engine kami. Contoh ini sengaja dipasang untuk menunjukkan keterbatasan itu secara jujur, bukan disembunyikan.",
  },
  {
    label: "Thermal Cellulose",
    faultType: "Thermal Cellulose",
    assetId: "TR-1-HV-4",
    manufactureYear: "2021",
    sampleDate: "2024-06-05",
    curr: { h2: "2", ch4: "29", c2h6: "3", c2h4: "8", c2h2: "0", co: "1325", co2: "7152" },
    o2: "1125",
    n2: "81304",
    pdDbmv: "15",
  },
  {
    label: "Partial Discharge",
    faultType: "Partial Discharge",
    assetId: "TR-44",
    manufactureYear: "1976",
    sampleDate: "2023-11-23",
    curr: { h2: "8385", ch4: "1428", c2h6: "543", c2h4: "8", c2h2: "2.93", co: "488", co2: "11733" },
    o2: "117",
    n2: "45701",
    // dummy indikatif: PD berat ? 47 dBmV (> 40 = Kritis)
    pdDbmv: "47",
  },
];

// --- Sub-components -----------------------------------------------------------

function GasFieldset({
  title,
  values,
  onChange,
}: {
  title: string;
  values: Record<GasKey, string>;
  onChange: (g: GasKey, v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GAS_COLS.map((g) => (
          <div key={g} className="space-y-1">
            <Label htmlFor={`${title}-${g}`} className="text-xs text-muted-foreground">
              {GAS_LABELS[g]}
            </Label>
            <Input
              id={`${title}-${g}`}
              type="number"
              step="any"
              value={values[g]}
              onChange={(e) => onChange(g, e.target.value)}
              placeholder="ppm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Slider visual dBmV 0�60, dibagi 3 zona: Normal | Waspada | Kritis */
function PdMeter({ dbmv }: { dbmv: number }) {
  const clamped = Math.min(dbmv, 60);
  const pct = (clamped / 60) * 100;
  return (
    <div className="relative h-3 rounded-full overflow-hidden bg-muted mt-1">
      {/* Zona warna */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" style={{ maxWidth: `${(20 / 60) * 100}%`, background: "hsl(142 71% 45%)", opacity: 0.35 }} />
        <div className="flex-1" style={{ maxWidth: `${(20 / 60) * 100}%`, background: "hsl(48 96% 53%)", opacity: 0.45 }} />
        <div className="flex-1" style={{ background: "hsl(0 84% 60%)", opacity: 0.35 }} />
      </div>
      {/* Indikator posisi */}
      {dbmv > 0 && (
        <div
          className="absolute top-0 bottom-0 w-1.5 rounded-sm bg-foreground shadow-sm transition-all duration-300"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      )}
    </div>
  );
}

const STATUS_LABEL: Record<number, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  1: { label: "Status 1 - Normal", variant: "secondary" },
  2: { label: "Status 2 - Waspada", variant: "default" },
  3: { label: "Status 3 - Kritis", variant: "destructive" },
};

// --- Main Component -----------------------------------------------------------

export function TryItForm() {
  const [manufactureYear, setManufactureYear] = useState("2010");
  const [prevDate, setPrevDate] = useState("");
  const [prevGas, setPrevGas] = useState<Record<GasKey, string>>({ ...EMPTY_GAS });
  const [currDate, setCurrDate] = useState(new Date().toISOString().slice(0, 10));
  const [currGas, setCurrGas] = useState<Record<GasKey, string>>({ ...EMPTY_GAS });
  const [o2, setO2] = useState("");
  const [n2, setN2] = useState("");
  const [pdDbmv, setPdDbmv] = useState("");
  const [presetCaveat, setPresetCaveat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type ResultType = {
    status: number;
    faultType: string;
    o2n2Class: string;
    ageBucket: string;
    exceedsTable1: GasKey[];
    exceedsTable2: GasKey[];
    exceedsDelta: GasKey[];
    exceedsRate: GasKey[];
    nGasWorsening: number;
    worseningGases: GasKey[];
    pdSeverity: PdSeverity;
    pdDbmvNum: number;
    nParametersWorsening: number;
    anomalyScoreRaw: number;
    isAnomaly: boolean;
    riskLabel: string;
    riskVariant: "default" | "secondary" | "destructive";
    // untuk tren
    delta: Partial<GasReading>;
    rate: Partial<GasReading>;
    hasTrend: boolean;
  };
  const [result, setResult] = useState<null | ResultType>(null);

  function loadPreset(preset: ExamplePreset) {
    setCurrGas(preset.curr);
    setO2(preset.o2);
    setN2(preset.n2);
    setManufactureYear(preset.manufactureYear);
    setCurrDate(preset.sampleDate);
    setPrevDate("");
    setPrevGas({ ...EMPTY_GAS });
    setPdDbmv(preset.pdDbmv);
    setPresetCaveat(preset.ruleEngineCaveat ?? null);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const gasNow: GasReading = Object.fromEntries(
      GAS_COLS.map((g) => [g, Number(currGas[g] || 0)]),
    ) as unknown as GasReading;
    const o2n = Number(o2 || 0);
    const n2n = Number(n2 || 0);
    const year = Number(manufactureYear || 0);
    const age = currDate ? new Date(currDate).getFullYear() - year : null;

    const hasPrev = GAS_COLS.some((g) => prevGas[g] !== "") && prevDate !== "";
    let delta: Partial<GasReading> = {};
    let rate: Partial<GasReading> = {};
    if (hasPrev) {
      const gasPrev: GasReading = Object.fromEntries(
        GAS_COLS.map((g) => [g, Number(prevGas[g] || 0)]),
      ) as unknown as GasReading;
      const days =
        (new Date(currDate).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24);
      delta = Object.fromEntries(GAS_COLS.map((g) => [g, gasNow[g] - gasPrev[g]])) as Partial<GasReading>;
      if (days > 0) {
        rate = Object.fromEntries(
          GAS_COLS.map((g) => [g, ((gasNow[g] - gasPrev[g]) / days) * 365]),
        ) as Partial<GasReading>;
      }
    }

    const rule = evaluateDga({ gas: gasNow, o2: o2n, n2: n2n, age, delta, rate });
    const worsening = countGasWorsening(delta, rule.o2n2Class);

    // PD: klasifikasi dBmV ? contribution ke nParametersWorsening
    const pdSev = classifyPdSeverity(pdDbmv);
    const pdDbmvNum = parseFloat(pdDbmv) || 0;
    const nParametersWorsening = worsening.count + pdSev.contribution;
    const ruleFaultSeverity = FAULT_SEVERITY_RANK[rule.faultType] ?? 0;

    setLoading(true);
    try {
      const { anomalyScoreRaw, isAnomaly } = await computeRiskScore({
        deltaH2: delta.h2 ?? 0,
        deltaCh4: delta.ch4 ?? 0,
        deltaC2h6: delta.c2h6 ?? 0,
        deltaC2h4: delta.c2h4 ?? 0,
        deltaC2h2: delta.c2h2 ?? 0,
        deltaCo: delta.co ?? 0,
        deltaCo2: delta.co2 ?? 0,
        ruleStatus: rule.status,
        nGasWorsening: worsening.count,
        nParametersWorsening,
        ruleFaultSeverity,
      });

      let riskLabel = "Normal";
      let riskVariant: "default" | "secondary" | "destructive" = "secondary";
      if (anomalyScoreRaw <= -0.02) {
        riskLabel = "Kritis / Sangat Anomali";
        riskVariant = "destructive";
      } else if (anomalyScoreRaw <= 0.1) {
        riskLabel = "Waspada";
        riskVariant = "default";
      }

      setResult({
        status: rule.status,
        faultType: rule.faultType,
        o2n2Class: rule.o2n2Class,
        ageBucket: rule.ageBucket,
        exceedsTable1: rule.exceedsTable1,
        exceedsTable2: rule.exceedsTable2,
        exceedsDelta: rule.exceedsDelta,
        exceedsRate: rule.exceedsRate,
        nGasWorsening: worsening.count,
        worseningGases: worsening.gases,
        pdSeverity: pdSev,
        pdDbmvNum,
        nParametersWorsening,
        anomalyScoreRaw,
        isAnomaly,
        riskLabel,
        riskVariant,
        delta,
        rate,
        hasTrend: hasPrev,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Live preview PD severity sebelum submit
  const livePd = classifyPdSeverity(pdDbmv);
  const livePdNum = parseFloat(pdDbmv) || 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* -- FORM -- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Input Pembacaan DGA + PD</CardTitle>
          <CardDescription>
            Isi nilai gas terlarut DGA (ppm) dan nilai sensor Partial Discharge (dBmV).
            Semua dihitung langsung di browser � tidak dikirim ke server manapun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Patokan nilai riil per kategori (klik ? isi form otomatis)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXAMPLE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="rounded-md border border-border/70 bg-card px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span className="block text-sm font-medium">{p.faultType}</span>
                  <span className="block text-xs text-muted-foreground font-data">
                    {p.assetId} &middot; {p.sampleDate}
                  </span>
                </button>
              ))}
            </div>
            {presetCaveat && (
              <Alert className="mt-3">
                <AlertTitle>Catatan keterbatasan rule engine</AlertTitle>
                <AlertDescription>{presetCaveat}</AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="year">Tahun Pembuatan Trafo</Label>
                <Input id="year" type="number" value={manufactureYear} onChange={(e) => setManufactureYear(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="o2">O2 (ppm)</Label>
                <Input id="o2" type="number" value={o2} onChange={(e) => setO2(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="n2">N2 (ppm)</Label>
                <Input id="n2" type="number" value={n2} onChange={(e) => setN2(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currDate">Tanggal Sampling Sekarang</Label>
                <Input id="currDate" type="date" value={currDate} onChange={(e) => setCurrDate(e.target.value)} />
              </div>
            </div>

            <GasFieldset
              title="Pembacaan Sekarang"
              values={currGas}
              onChange={(g, v) => setCurrGas((s) => ({ ...s, [g]: v }))}
            />

            <Separator />

            <div className="space-y-1">
              <Label htmlFor="prevDate">Tanggal Sampling Sebelumnya (opsional)</Label>
              <Input id="prevDate" type="date" value={prevDate} onChange={(e) => setPrevDate(e.target.value)} />
            </div>
            <GasFieldset
              title="Pembacaan Sebelumnya (opsional)"
              values={prevGas}
              onChange={(g, v) => setPrevGas((s) => ({ ...s, [g]: v }))}
            />

            <Separator />

            {/* -- Input PD ----------------------------------------------- */}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Sensor Partial Discharge (opsional)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nilai bacaan sensor PD dalam dBmV. Kosongkan jika tidak tersedia.
                </p>
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-1 w-36">
                  <Label htmlFor="pdDbmv">Nilai PD Max (dBmV)</Label>
                  <Input
                    id="pdDbmv"
                    type="number"
                    step="any"
                    min="0"
                    value={pdDbmv}
                    onChange={(e) => setPdDbmv(e.target.value)}
                    placeholder="contoh: 35"
                  />
                </div>
                <div className="flex-1 pb-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${livePd.colorClass}`}>
                      {livePd.level === "normal" && "? Normal"}
                      {livePd.level === "waspada" && "? Waspada"}
                      {livePd.level === "kritis" && "� Kritis"}
                      {livePdNum > 0 ? ` � ${livePdNum} dBmV` : ""}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      +{livePd.contribution} n_param
                    </Badge>
                  </div>
                  <PdMeter dbmv={livePdNum} />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span>0</span>
                    <span className="text-green-600 dark:text-green-400">Normal =20</span>
                    <span className="text-yellow-600 dark:text-yellow-400">Waspada 20�40</span>
                    <span className="text-red-600 dark:text-red-400">&gt;40 Kritis</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/70 italic">
                Threshold ini indikatif (dummy) � belum dikonfirmasi dari vendor. Data PD riil
                belum overlap dengan dataset DGA (beda aset/titik ukur), nilai di sini simulatif.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Menghitung..." : "Hitung Rule Engine + Risk Score"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* -- HASIL -- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Hasil</CardTitle>
          <CardDescription>
            Rule Engine IEEE C57.104-2019 + IsolationForest (ONNX) � identik dengan notebook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Gagal menghitung</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!result && !error && (
            <p className="text-sm text-muted-foreground">
              Isi form di kiri lalu klik &quot;Hitung&quot;, atau pakai salah satu contoh preset.
            </p>
          )}

          {result && (
            <>
              {/* -- Skor Utama -- */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">DGA Rule Engine</p>
                  <Badge variant={STATUS_LABEL[result.status].variant}>
                    {STATUS_LABEL[result.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fault Type</p>
                  <Badge variant="outline">{result.faultType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Composite Risk Score</p>
                  <Badge variant={result.riskVariant}>{result.riskLabel}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">anomaly_score_raw</p>
                  <code className="text-sm font-data">{result.anomalyScoreRaw.toFixed(4)}</code>
                </div>
              </div>

              <Separator />

              {/* -- PD Summary -- */}
              <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Partial Discharge
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${result.pdSeverity.colorClass}`}>
                    {result.pdSeverity.level === "normal" && "? Normal"}
                    {result.pdSeverity.level === "waspada" && "? Waspada"}
                    {result.pdSeverity.level === "kritis" && "� Kritis"}
                    {result.pdDbmvNum > 0 && ` � ${result.pdDbmvNum} dBmV`}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    +{result.pdSeverity.contribution} n_param
                  </Badge>
                </div>
                {result.pdDbmvNum > 0 && <PdMeter dbmv={result.pdDbmvNum} />}
                <p className="text-xs text-muted-foreground">
                  n_parameters_worsening ={" "}
                  <span className="font-data font-semibold">{result.nParametersWorsening}</span>
                  {" "}({result.nGasWorsening} gas DGA naik + {result.pdSeverity.contribution} PD)
                </p>
              </div>

              {/* -- Tren Gas -- */}
              {result.hasTrend ? (
                <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tren Gas (Delta + Rate)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-data">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 pr-3">Gas</th>
                          <th className="text-right pr-3">? (ppm)</th>
                          <th className="text-right pr-3">Rate (ppm/thn)</th>
                          <th className="text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GAS_COLS.map((g) => {
                          const d = result.delta[g] ?? null;
                          const r = result.rate[g] ?? null;
                          const isWorsen = result.worseningGases.includes(g);
                          const excDs = result.exceedsDelta.includes(g);
                          const excRt = result.exceedsRate.includes(g);
                          return (
                            <tr key={g} className="border-t border-border/30">
                              <td className="py-1 pr-3 font-medium uppercase">{g}</td>
                              <td className={`text-right pr-3 ${d !== null && d > 0 ? "text-orange-500" : ""}`}>
                                {d !== null ? (d > 0 ? "+" : "") + d.toFixed(1) : "�"}
                              </td>
                              <td className={`text-right pr-3 ${excRt ? "text-red-500 font-semibold" : ""}`}>
                                {r !== null ? (r > 0 ? "+" : "") + r.toFixed(1) : "�"}
                              </td>
                              <td>
                                {excRt ? (
                                  <span className="text-red-500">? Lewati batas rate</span>
                                ) : excDs ? (
                                  <span className="text-orange-500">? Lewati batas delta</span>
                                ) : isWorsen ? (
                                  <span className="text-yellow-600 dark:text-yellow-400">? Naik</span>
                                ) : d !== null && d < 0 ? (
                                  <span className="text-green-600 dark:text-green-400">? Turun</span>
                                ) : (
                                  <span className="text-muted-foreground">� Stabil</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {result.exceedsDelta.length > 0 && (
                    <p className="text-xs text-orange-500">
                      ? Melampaui batas delta: {result.exceedsDelta.join(", ")}
                    </p>
                  )}
                  {result.exceedsRate.length > 0 && (
                    <p className="text-xs text-red-500 font-medium">
                      ? Melampaui batas rate: {result.exceedsRate.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Tren gas tidak tersedia � isi &quot;Pembacaan Sebelumnya&quot; untuk melihat
                    analisis delta &amp; rate per gas.
                  </p>
                </div>
              )}

              <Separator />

              {/* -- Kesimpulan -- */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Kesimpulan
                </p>
                <div className="space-y-2.5 text-sm leading-relaxed">
                  {buildNarrative(result).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
