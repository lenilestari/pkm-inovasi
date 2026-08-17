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

interface ExamplePreset {
  label: string;
  faultType: string;
  assetId: string;
  manufactureYear: string;
  sampleDate: string;
  curr: Record<GasKey, string>;
  o2: string;
  n2: string;
}

// Semua patokan di bawah ini nilai RIIL langsung dari dataset 69 aset (bukan dikarang) --
// satu contoh representatif per kategori fault_type yang benar-benar ada di data lab Petrolab.
const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    label: "Normal",
    faultType: "Normal",
    assetId: "TR-26",
    manufactureYear: "1974",
    sampleDate: "2023-11-23",
    curr: { h2: "2", ch4: "189", c2h6: "391", c2h4: "14", c2h2: "0", co: "297", co2: "2016" },
    o2: "117",
    n2: "83716",
  },
  {
    label: "Stray Gassing",
    faultType: "Stray Gassing",
    assetId: "TR-Kolam-Renang",
    manufactureYear: "2010",
    sampleDate: "2024-03-05",
    curr: { h2: "5", ch4: "25", c2h6: "26", c2h4: "28", c2h2: "0", co: "345", co2: "2415" },
    o2: "363",
    n2: "63626",
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
  },
];

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

const STATUS_LABEL: Record<number, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  1: { label: "Status 1 - Normal", variant: "secondary" },
  2: { label: "Status 2 - Waspada", variant: "default" },
  3: { label: "Status 3 - Kritis", variant: "destructive" },
};

export function TryItForm() {
  const [manufactureYear, setManufactureYear] = useState("2010");
  const [prevDate, setPrevDate] = useState("");
  const [prevGas, setPrevGas] = useState<Record<GasKey, string>>({ ...EMPTY_GAS });
  const [currDate, setCurrDate] = useState(new Date().toISOString().slice(0, 10));
  const [currGas, setCurrGas] = useState<Record<GasKey, string>>({ ...EMPTY_GAS });
  const [o2, setO2] = useState("");
  const [n2, setN2] = useState("");
  const [pdWorsening, setPdWorsening] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    status: number;
    faultType: string;
    o2n2Class: string;
    ageBucket: string;
    exceedsTable1: GasKey[];
    exceedsTable2: GasKey[];
    nGasWorsening: number;
    worseningGases: GasKey[];
    anomalyScoreRaw: number;
    isAnomaly: boolean;
    riskLabel: string;
    riskVariant: "default" | "secondary" | "destructive";
  }>(null);

  function loadPreset(preset: ExamplePreset) {
    setCurrGas(preset.curr);
    setO2(preset.o2);
    setN2(preset.n2);
    setManufactureYear(preset.manufactureYear);
    setCurrDate(preset.sampleDate);
    setPrevDate("");
    setPrevGas({ ...EMPTY_GAS });
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
    const nParametersWorsening = worsening.count + (pdWorsening ? 1 : 0);
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
        nGasWorsening: worsening.count,
        worseningGases: worsening.gases,
        anomalyScoreRaw,
        isAnomaly,
        riskLabel,
        riskVariant,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Input Pembacaan DGA</CardTitle>
          <CardDescription>
            Isi nilai gas terlarut (ppm) hasil uji lab. Pembacaan sebelumnya opsional, kalau
            diisi, Delta Value / Gas Rate ikut dihitung (dipakai Rule Engine &amp; Risk Score).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Patokan, nilai riil per kategori (klik buat isi form otomatis)
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

            <GasFieldset title="Pembacaan Sekarang" values={currGas} onChange={(g, v) => setCurrGas((s) => ({ ...s, [g]: v }))} />

            <Separator />

            <div className="space-y-1">
              <Label htmlFor="prevDate">Tanggal Sampling Sebelumnya (opsional)</Label>
              <Input id="prevDate" type="date" value={prevDate} onChange={(e) => setPrevDate(e.target.value)} />
            </div>
            <GasFieldset title="Pembacaan Sebelumnya (opsional)" values={prevGas} onChange={(g, v) => setPrevGas((s) => ({ ...s, [g]: v }))} />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pdWorsening} onChange={(e) => setPdWorsening(e.target.checked)} className="size-4" />
              Indikasi pembacaan Partial Discharge (sensor UHF/dsb.) memburuk sejak sampel sebelumnya
              <span className="text-muted-foreground">(opsional, manual, lihat catatan data PD di halaman utama)</span>
            </label>

            <Button type="submit" disabled={loading}>
              {loading ? "Menghitung..." : "Hitung Rule Engine + Risk Score"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Hasil</CardTitle>
          <CardDescription>
            Rule Engine (IEEE C57.104-2019) dijalankan langsung di browser. Composite Risk Score
            dihitung oleh model IsolationForest yang sama persis dengan notebook (diekspor ke
            ONNX, bukan reimplementasi terpisah).
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
