// Port TypeScript dari DGA Rule Engine di dga_composite_score.ipynb (Bagian 2 & 3).
// Logic-nya identik dengan versi Python -- tabel ambang IEEE C57.104-2019 di tables.json
// diekspor langsung dari notebook (lihat _export_artifacts.py), bukan diketik ulang manual.
import tablesData from "./tables.json";

export const GAS_COLS = [
  "h2",
  "ch4",
  "c2h6",
  "c2h4",
  "c2h2",
  "co",
  "co2",
] as const;

export type GasKey = (typeof GAS_COLS)[number];
export type GasReading = Record<GasKey, number>;

type GasLimits = Record<GasKey, number>;

const TABLE1: Record<string, GasLimits> = tablesData.table1 as Record<string, GasLimits>;
const TABLE2: Record<string, GasLimits> = tablesData.table2 as Record<string, GasLimits>;
const TABLE3_DELTA: Record<"low" | "high", GasLimits> = tablesData.table3Delta as Record<
  "low" | "high",
  GasLimits
>;
const TABLE4_RATE: Record<"low" | "high", GasLimits> = tablesData.table4Rate as Record<
  "low" | "high",
  GasLimits
>;
export const FAULT_SEVERITY_RANK: Record<string, number> = tablesData.faultSeverityRank;

export type AgeBucket = "unknown" | "1-9" | "10-30" | ">30";
export type O2N2Class = "low" | "high";

export function ageBucket(ageYears: number | null): AgeBucket {
  if (ageYears === null || Number.isNaN(ageYears)) return "unknown";
  if (ageYears < 1) return "unknown";
  if (ageYears <= 9) return "1-9";
  if (ageYears <= 30) return "10-30";
  return ">30";
}

export function o2n2Class(o2: number, n2: number): O2N2Class {
  if (n2 === 0 || Number.isNaN(n2)) return "low";
  return o2 / n2 <= 0.2 ? "low" : "high";
}

function tableKey(cls: O2N2Class, bucket: AgeBucket) {
  return `${cls}|${bucket}`;
}

export interface RuleEngineInput {
  gas: GasReading;
  o2: number;
  n2: number;
  age: number | null;
  /** delta = current - previous reading, per gas. null kalau tidak ada histori sebelumnya. */
  delta: Partial<GasReading>;
  /** gas rate (ppm/tahun) = delta / (selisih hari antar sampel / 365). null kalau tidak ada histori. */
  rate: Partial<GasReading>;
}

export interface RuleEngineResult {
  o2n2Class: O2N2Class;
  ageBucket: AgeBucket;
  table1: GasLimits;
  table2: GasLimits;
  status: 1 | 2 | 3;
  faultType: string;
  exceedsTable1: GasKey[];
  exceedsTable2: GasKey[];
  exceedsDelta: GasKey[];
  exceedsRate: GasKey[];
}

export function evaluateDga(input: RuleEngineInput): RuleEngineResult {
  const cls = o2n2Class(input.o2, input.n2);
  const bucket = ageBucket(input.age);
  const table1 = TABLE1[tableKey(cls, bucket)];
  const table2 = TABLE2[tableKey(cls, bucket)];
  const deltaLimit = TABLE3_DELTA[cls];
  const rateLimit = TABLE4_RATE[cls];

  const exceedsTable1: GasKey[] = GAS_COLS.filter((g) => input.gas[g] > table1[g]);
  const exceedsTable2: GasKey[] = GAS_COLS.filter((g) => input.gas[g] > table2[g]);
  const exceedsDelta: GasKey[] = GAS_COLS.filter((g) => {
    const d = input.delta[g];
    return d !== undefined && d !== null && Math.abs(d) > deltaLimit[g];
  });
  const exceedsRate: GasKey[] = GAS_COLS.filter((g) => {
    const r = input.rate[g];
    return r !== undefined && r !== null && Math.abs(r) > rateLimit[g];
  });

  let status: 1 | 2 | 3 = 1;
  if (exceedsTable2.length > 0 || exceedsRate.length > 0) {
    status = 3;
  } else if (exceedsTable1.length > 0 || exceedsDelta.length > 0) {
    status = 2;
  }

  const faultType = inferFaultType(input.gas, table2, table1);

  return {
    o2n2Class: cls,
    ageBucket: bucket,
    table1,
    table2,
    status,
    faultType,
    exceedsTable1,
    exceedsTable2,
    exceedsDelta,
    exceedsRate,
  };
}

function inferFaultType(gas: GasReading, table2: GasLimits, table1: GasLimits): string {
  if (gas.h2 > table2.h2) return "Partial Discharge";
  if (gas.co > table2.co || gas.co2 > table2.co2) return "Thermal Cellulose";
  if ((["ch4", "c2h6", "c2h4"] as GasKey[]).some((g) => gas[g] > table2[g])) {
    return "Thermal Fault (Oil)";
  }
  if (GAS_COLS.some((g) => gas[g] > table1[g])) return "Stray Gassing";
  return "Normal";
}

/** "memburuk" = delta positif signifikan (gas naik), threshold 0.3x Tabel 3 (delta) -- sama
 *  dengan Trend Engine di notebook (Bagian 3). */
export function countGasWorsening(
  delta: Partial<GasReading>,
  cls: O2N2Class,
): { count: number; gases: GasKey[] } {
  const deltaLimit = TABLE3_DELTA[cls];
  const gases = GAS_COLS.filter((g) => {
    const d = delta[g];
    return d !== undefined && d !== null && d > deltaLimit[g] * 0.3;
  });
  return { count: gases.length, gases };
}
