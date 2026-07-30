// Live scoring pakai model IsolationForest hasil training sklearn (lihat
// dga_composite_score.ipynb, Bagian 4) yang diekspor ke ONNX -- BUKAN reimplementasi
// terpisah, jadi hasilnya identik dengan skor di notebook untuk fitur yang sama.
"use client";

import type * as OrtWasm from "onnxruntime-web/wasm";

// Import DINAMIS (bukan top-level) -- onnxruntime-web punya efek samping di level modul
// (resolve import.meta.url ke path .wasm) yang bikin Next.js gagal saat prerender halaman
// ini di server (Node, bukan browser). Dengan dynamic import(), kode itu cuma jalan saat
// benar-benar dipanggil di browser (lihat computeRiskScore).
let ortPromise: Promise<typeof OrtWasm> | null = null;

function loadOrt() {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web/wasm").then((ort) => {
      ort.env.wasm.wasmPaths = "/ort/";
      // Single-threaded: menghindari kebutuhan header COOP/COEP (SharedArrayBuffer) yang
      // tidak diset default oleh Vercel static hosting. Model kecil, cukup cepat 1 thread.
      ort.env.wasm.numThreads = 1;
      return ort;
    });
  }
  return ortPromise;
}

let sessionPromise: Promise<OrtWasm.InferenceSession> | null = null;

async function getSession() {
  if (!sessionPromise) {
    const ort = await loadOrt();
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
  const ort = await loadOrt();
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
