// Live scoring pakai model IsolationForest hasil training sklearn (lihat
// dga_composite_score.ipynb, Bagian 4) yang diekspor ke ONNX -- BUKAN reimplementasi
// terpisah, jadi hasilnya identik dengan skor di notebook untuk fitur yang sama.
"use client";

import * as ort from "onnxruntime-web";

ort.env.wasm.wasmPaths = "/ort/";
// Single-threaded: menghindari kebutuhan header COOP/COEP (SharedArrayBuffer) yang
// tidak diset default oleh Vercel static hosting. Model ini kecil, cukup cepat 1 thread.
ort.env.wasm.numThreads = 1;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create("/model/isolation_forest.onnx", {
      executionProviders: ["wasm"],
    });
  }
  return sessionPromise;
}

/** Urutan fitur HARUS sama dengan feature_cols di notebook cell 11:
 *  [delta_h2..delta_co2, rule_status, n_gas_worsening, n_parameters_worsening, rule_fault_severity] */
export interface RiskScoreFeatures {
  deltaH2: number;
  deltaCh4: number;
  deltaC2h6: number;
  deltaC2h4: number;
  deltaC2h2: number;
  deltaCo: number;
  deltaCo2: number;
  ruleStatus: number;
  nGasWorsening: number;
  nParametersWorsening: number;
  ruleFaultSeverity: number;
}

export interface RiskScoreResult {
  anomalyScoreRaw: number;
  isAnomaly: boolean;
}

export async function computeRiskScore(features: RiskScoreFeatures): Promise<RiskScoreResult> {
  const session = await getSession();
  const values = new Float32Array([
    features.deltaH2,
    features.deltaCh4,
    features.deltaC2h6,
    features.deltaC2h4,
    features.deltaC2h2,
    features.deltaCo,
    features.deltaCo2,
    features.ruleStatus,
    features.nGasWorsening,
    features.nParametersWorsening,
    features.ruleFaultSeverity,
  ]);
  const inputName = session.inputNames[0];
  const tensor = new ort.Tensor("float32", values, [1, values.length]);
  const output = await session.run({ [inputName]: tensor });

  let label: number | undefined;
  let score: number | undefined;
  for (const name of session.outputNames) {
    const data = output[name].data as unknown as ArrayLike<number> | BigInt64Array;
    const arr = Array.from(data as ArrayLike<number>).map((v) => Number(v));
    if (name === "label" || (label === undefined && Number.isInteger(arr[0]) && Math.abs(arr[0]) === 1)) {
      label = arr[0];
    } else {
      score = arr[0];
    }
  }

  return {
    anomalyScoreRaw: score ?? 0,
    isAnomaly: label === -1,
  };
}
