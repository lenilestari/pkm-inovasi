// Generator narasi otomatis dari hasil Rule Engine + Composite Risk Score -- bukan panggil AI/LLM
// (aplikasi ini 100% client-side, tanpa server), tapi rangkaian kalimat deterministik dari
// angka yang sama yang sudah ditampilkan di badge, supaya orang awam gampang paham artinya.
import type { GasKey } from "./rule-engine";

export const GAS_SHORT_NAMES: Record<GasKey, string> = {
  h2: "H2",
  ch4: "CH4",
  c2h6: "C2H6",
  c2h4: "C2H4",
  c2h2: "C2H2",
  co: "CO",
  co2: "CO2",
};

const FAULT_EXPLANATION: Record<string, string> = {
  "Partial Discharge":
    "disimpulkan karena H2 (Hidrogen) jauh melebihi ambang -- H2 adalah \"tanda tangan\" gas dari fenomena percikan listrik (partial discharge) di dalam isolasi. Bukan panas biasa, tapi ada loncatan listrik kecil yang terjadi berulang.",
  "Thermal Cellulose":
    "disimpulkan karena CO dan/atau CO2 melebihi ambang -- ini tanda kertas/isolasi selulosa di dalam trafo mengalami dekomposisi akibat panas berlebih. Lebih serius dari sekadar panas di minyak, karena kertas yang rusak tidak bisa \"sembuh\".",
  "Thermal Fault (Oil)":
    "disimpulkan karena CH4, C2H6, atau C2H4 melebihi ambang -- indikasi panas berlebih di minyak (bukan di kertas isolasi), suhu sedang sampai tinggi, biasanya dari sambungan longgar atau arus sirkulasi berlebih.",
  "Stray Gassing":
    "disimpulkan karena ada gas yang sedikit melebihi Tabel 1 (belum sampai Tabel 2) -- indikasi panas ringan di bawah 200°C dari proses normal trafo, bukan fault aktif. Risiko rendah, wajar terjadi di trafo yang sudah lama beroperasi.",
  Normal:
    "semua kadar gas masih dalam batas wajar (di bawah Tabel 1) -- tidak ada indikasi fault jenis apa pun.",
};

// Rentang anomaly_score_raw dari 161 sampel training (lihat dashboard) -- referensi buat
// menakar posisi 1 hasil baru relatif terhadap seluruh dataset.
const DATASET_SCORE_MIN = -0.3328;
const DATASET_SCORE_MAX = 0.197;

export interface NarrativeInput {
  status: number;
  faultType: string;
  o2n2Class: string;
  ageBucket: string;
  exceedsTable1: GasKey[];
  exceedsTable2: GasKey[];
  nGasWorsening: number;
  worseningGases: GasKey[];
  anomalyScoreRaw: number;
  riskLabel: string;
}

function gasList(keys: GasKey[]) {
  return keys.map((g) => GAS_SHORT_NAMES[g]).join(", ");
}

export function buildNarrative(r: NarrativeInput): string[] {
  const paragraphs: string[] = [];

  if (r.status === 3) {
    paragraphs.push(
      "Status 3 - Kritis: level tertinggi di rule engine. Ini muncul karena ada gas yang melebihi Tabel 2 (batas 95th percentile -- level \"jelas tidak wajar\"), bukan cuma Tabel 1 (90th percentile, \"mulai mencurigakan\").",
    );
  } else if (r.status === 2) {
    paragraphs.push(
      "Status 2 - Waspada: ada gas yang melebihi Tabel 1 (90th percentile) atau delta antar sampel melebihi ambang wajar, tapi belum ada yang sampai melewati Tabel 2. Perlu dipantau lebih ketat, belum darurat.",
    );
  } else {
    paragraphs.push(
      "Status 1 - Normal: semua kadar gas dan delta antar sampel masih dalam batas wajar (di bawah Tabel 1). Tidak ada indikasi masalah dari sisi rule engine.",
    );
  }

  paragraphs.push(
    `Fault Type: ${r.faultType} -- ${FAULT_EXPLANATION[r.faultType] ?? "belum ada penjelasan untuk kategori ini."}`,
  );

  const scoreRange = DATASET_SCORE_MAX - DATASET_SCORE_MIN;
  const pct = Math.max(0, Math.min(1, (r.anomalyScoreRaw - DATASET_SCORE_MIN) / scoreRange));
  const posText =
    pct < 0.15
      ? "dekat ke ujung PALING anomali"
      : pct < 0.4
        ? "condong ke sisi anomali"
        : pct < 0.7
          ? "di tengah-tengah, tidak terlalu ekstrem ke arah mana pun"
          : "condong ke sisi normal";
  const agree =
    (r.status === 3 && r.anomalyScoreRaw < 0) || (r.status === 1 && pct > 0.6);
  paragraphs.push(
    `Composite Risk Score: ${r.riskLabel}, skor ${r.anomalyScoreRaw.toFixed(4)} -- ini angka dari model AI (Isolation Forest) yang independen dari rule engine. Sebagai perbandingan, skor di 161 sampel training kita rentangnya sekitar ${DATASET_SCORE_MIN.toFixed(2)} (paling parah) sampai ${DATASET_SCORE_MAX.toFixed(2)} (paling normal) -- jadi skor ini ${posText}. ${
      agree
        ? "Rule engine dan model AI SEPAKAT -- itu yang bikin kesimpulan ini kuat, bukan kebetulan satu metode saja."
        : "Rule engine dan model AI belum sepenuhnya sejalan -- sebaiknya jangan cuma andalkan satu metode, cek manual juga."
    }`,
  );

  paragraphs.push(
    `Klasifikasi O2/N2: ${r.o2n2Class} · usia: ${r.ageBucket} -- ini konteks trafo yang menentukan tabel ambang batas mana yang dipakai (trafo tua vs baru, dan tipe pengaman O2/N2, punya standar "wajar" yang berbeda).`,
  );

  if (r.exceedsTable2.length > 0) {
    paragraphs.push(
      `Melebihi Tabel 2 (95th percentile): ${gasList(r.exceedsTable2)} -- gas ini levelnya sudah di zona "jelas tidak wajar".`,
    );
  }
  if (r.exceedsTable1.length > 0) {
    paragraphs.push(
      `Melebihi Tabel 1 (90th percentile): ${gasList(r.exceedsTable1)} -- ${r.exceedsTable1.length} gas total sudah di luar batas normal, meski levelnya beda-beda.`,
    );
  }
  if (r.exceedsTable1.length === 0 && r.exceedsTable2.length === 0) {
    paragraphs.push("Tidak ada gas yang melebihi ambang Tabel 1 maupun Tabel 2 -- kadar gas seluruhnya masih wajar.");
  }

  if (r.nGasWorsening > 0) {
    paragraphs.push(
      `Jumlah gas yang "memburuk": ${r.nGasWorsening} (${gasList(r.worseningGases)}) -- dibanding pembacaan sebelumnya, gas-gas ini naik signifikan. ${
        r.nGasWorsening >= 2
          ? "Ini yang paling penting secara operasional -- artinya kondisinya SEDANG AKTIF memburuk, bukan cuma kebetulan tinggi lalu stabil."
          : "Baru 1 gas yang naik, perlu dipantau apakah berlanjut di sampel berikutnya."
      }`,
    );
  } else {
    paragraphs.push(
      "Tidak ada gas yang \"memburuk\" secara signifikan dibanding pembacaan sebelumnya (atau belum ada data pembacaan sebelumnya) -- trennya stabil.",
    );
  }

  return paragraphs;
}
