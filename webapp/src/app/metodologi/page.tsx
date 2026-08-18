import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FieldDef {
  field: string;
  arti: string;
}

const RAW_FIELDS: FieldDef[] = [
  { field: "asset_id", arti: "Kode ID trafo (mis. TR-40, F5O-TR55), dari laporan lab Petrolab." },
  { field: "manufacture_year", arti: "Tahun pembuatan trafo, dipakai hitung usia (age) saat sampling." },
  { field: "sample_date", arti: "Tanggal minyak trafo diambil untuk diuji lab." },
  {
    field: "h2, ch4, c2h6, c2h4, c2h2, co, co2",
    arti: "Kadar 7 gas terlarut dalam minyak (ppm) hasil uji DGA: Hidrogen, Metana, Etana, Etilena, Asetilena, Karbon Monoksida, Karbon Dioksida.",
  },
  { field: "o2, n2", arti: "Kadar Oksigen & Nitrogen (ppm), dipakai hitung rasio O2/N2 (indikasi kondisi sil trafo)." },
  {
    field: "lab_status, lab_fault_type",
    arti: "Kesimpulan RESMI dari lab Petrolab (ground truth), status 1/2/3 dan nama fault. Ini yang dipakai untuk validasi rule engine.",
  },
];

const DERIVED_FIELDS: FieldDef[] = [
  { field: "age", arti: "sample_date.year - manufacture_year." },
  {
    field: "o2n2_class",
    arti: "\"low\" kalau O2/N2 <= 0.2, selain itu \"high\". Kelas ini menentukan tabel ambang IEEE mana yang dipakai (trafo dengan pengaman gas/nitrogen beda ambangnya).",
  },
  {
    field: "age_bucket",
    arti: "Kelompok usia trafo: unknown (<1 th) / 1-9 / 10-30 / >30 tahun, tabel ambang IEEE juga beda per kelompok usia.",
  },
  {
    field: "delta_<gas>",
    arti: "Selisih kadar gas vs sampel sebelumnya di aset yang sama (pandas .diff() diurutkan tanggal). Kosong (null) kalau ini sampel pertama aset tsb.",
  },
  {
    field: "rule_status, rule_fault_type",
    arti: "Hasil DGA Rule Engine kita sendiri (bukan dari lab), lihat Bagian 1 di bawah untuk logikanya.",
  },
  { field: "status_match", arti: "True kalau rule_status == lab_status, ukuran akurasi rule engine kita vs kesimpulan lab asli." },
  {
    field: "n_gas_worsening",
    arti: "Jumlah gas (dari 7) yang delta-nya naik signifikan (> 0.3 x ambang Delta Value Tabel 3) dibanding sampel sebelumnya.",
  },
  {
    field: "pd_worsening",
    arti: "1/0, apakah level keparahan Partial Discharge (dari data PD) naik dibanding sampel sebelumnya. Lihat Bagian 2 (data PD masih simulasi).",
  },
  {
    field: "n_parameters_worsening",
    arti: "n_gas_worsening + pd_worsening, total parameter yang memburuk bersamaan. Ini fitur trend gabungan DGA + PD.",
  },
  {
    field: "rule_fault_severity",
    arti: "Ranking ordinal dari rule_fault_type: Normal=0, Stray Gassing/Thermal Fault (Oil)=1, Thermal Cellulose=2, Partial Discharge=3. Lihat Bagian 3 kenapa ordinal, bukan one-hot.",
  },
  {
    field: "anomaly_score, anomaly_score_raw",
    arti: "Output model Isolation Forest. anomaly_score: -1 (anomali) / 1 (normal). anomaly_score_raw: skor kontinu, makin negatif makin dianggap anomali.",
  },
];

function FieldTable({ rows }: { rows: FieldDef[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border/70">
            <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Field</th>
            <th className="text-left font-medium px-3 py-2">Arti</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.field} className="border-b border-border/40 last:border-0 align-top">
              <td className="px-3 py-2 font-data whitespace-nowrap">{r.field}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.arti}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 text-sm list-decimal list-inside marker:text-muted-foreground">
      {steps.map((s, i) => (
        <li key={i} className="pl-1 leading-relaxed">
          {s}
        </li>
      ))}
    </ol>
  );
}

export default function MetodologiPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold">Metodologi</h1>
        <p className="text-muted-foreground mt-1">
          Penjelasan lengkap: arti tiap kolom data, dan logika perhitungan di balik DGA Rule
          Engine, Trend Engine, dan Composite Risk Score.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Contoh: Format Mentah DGA vs PD</CardTitle>
          <CardDescription>
            Sekilas kelihatan sama-sama &quot;data sensor trafo&quot;, tapi strukturnya jauh
            berbeda -- ini salah satu alasan kenapa keduanya belum bisa langsung digabung mentah.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border/70 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              DGA -- 1 baris riil (TR-44, 2023-11-23)
            </p>
            <pre className="text-xs font-data overflow-x-auto whitespace-pre">
{`asset_id       TR-44
sample_date    2023-11-23
h2 (ppm)       8385
ch4 (ppm)      1428
c2h6 (ppm)     543
c2h4 (ppm)     8
c2h2 (ppm)     2.93
co (ppm)       488
co2 (ppm)      11733
o2 (ppm)       117
n2 (ppm)       45701
lab_fault_type Partial Discharge`}
            </pre>
          </div>
          <div className="rounded-md border border-border/70 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-fault-attention mb-2">
              PD (simulasi) -- 1 dari 6 titik ukur per sampel
            </p>
            <pre className="text-xs font-data overflow-x-auto whitespace-pre">
{`asset_id           TR-26
measured_at        2023-03-27
method / unit      UHF / mV
value              18.548
reading_point_name UHF R-Top
phase / position   R / Top
overall_severity   Normal
threshold_watch    50.0
threshold_warning  200.0
threshold_critical 500.0`}
            </pre>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            DGA: 1 baris = 1 sampel minyak (7 gas ppm sekaligus). PD: 1 baris = 1 dari 6 titik ukur
            (3 fasa &times; 2 posisi) per sampel, satuan mV bukan ppm, plus ambang Watch/Warning/
            Critical per titik. Data PD riil di lapangan (lihat catatan transparansi) malah lebih
            beragam lagi -- tiap alat ukur (panel/switchgear/trafo) punya nama titik ukur sendiri,
            tidak seragam seperti simulasi ini.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Kolom Data Mentah (dari laporan lab)</CardTitle>
          <CardDescription>Field yang langsung ditranskrip dari PDF laporan Petrolab.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldTable rows={RAW_FIELDS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Kolom Hasil Perhitungan (turunan)</CardTitle>
          <CardDescription>Field yang dihitung oleh pipeline kita, bukan dari lab.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldTable rows={DERIVED_FIELDS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Bagian 1, DGA Rule Engine</CardTitle>
          <CardDescription>
            Rule-based, mengikuti standar IEEE C57.104-2019 + interpretasi IEC 60599. Tidak ada
            training/ML di bagian ini, murni ambang batas dari standar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepList
            steps={[
              "Hitung age = tahun sampling - tahun pembuatan trafo, lalu kelompokkan ke age_bucket (unknown / 1-9 / 10-30 / >30 tahun).",
              "Hitung o2n2_class dari rasio O2/N2 (\"low\" jika <= 0.2, \"high\" jika lebih), rasio ini menandakan apakah trafo pakai pengaman gas nitrogen atau tidak, yang mempengaruhi ambang batas gas normal.",
              "Ambil 4 tabel ambang IEEE sesuai (o2n2_class, age_bucket): Tabel 1 (90th percentile, batas \"masih wajar\"), Tabel 2 (95th percentile, batas \"jelas tidak wajar\"), Tabel 3 (Delta Value maksimum antar sampel), Tabel 4 (Gas Rate/laju kenaikan ppm per tahun maksimum).",
              "Tentukan Status: 3 (Kritis) kalau ada gas yang melebihi Tabel 2 ATAU laju kenaikannya (gas rate) melebihi Tabel 4. Status 2 (Waspada) kalau ada gas melebihi Tabel 1 ATAU delta-nya melebihi Tabel 3. Selain itu Status 1 (Normal).",
              "Tentukan Fault Type dari gas yang paling menonjol melebihi Tabel 2, urutan pengecekan: H2 tinggi -> Partial Discharge; CO/CO2 tinggi -> Thermal Cellulose; CH4/C2H6/C2H4 tinggi -> Thermal Fault (Oil); kalau cuma melebihi Tabel 1 (belum Tabel 2) -> Stray Gassing; kalau semua masih di bawah Tabel 1 -> Normal.",
              "Bandingkan rule_status hasil di atas dengan lab_status (kesimpulan resmi lab) -> status_match. Divalidasi di 161 sampel: 80% cocok (129/161).",
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Bagian 2, Trend Engine (DGA + Partial Discharge)</CardTitle>
          <CardDescription>
            Moving Average + Compare Historis, digabung antara sinyal DGA dan sinyal PD jadi satu
            angka: n_parameters_worsening.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Sisi DGA</p>
            <StepList
              steps={[
                "Untuk tiap gas, hitung moving average (window 3 sampel), buat smoothing, meredam noise pengukuran.",
                "Hitung delta_<gas> = nilai sekarang - nilai sampel sebelumnya (per aset, diurutkan tanggal).",
                "Tandai \"memburuk\" kalau delta > 0.3 x ambang Delta Value (Tabel 3) untuk kelas o2n2_class aset itu, 0.3x dipilih supaya sensitif ke tren naik meski belum sampai level pelanggaran resmi Tabel 3.",
                "n_gas_worsening = jumlah gas (dari 7) yang \"memburuk\" bersamaan pada satu sampel.",
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Sisi Partial Discharge (PD)</p>
            <StepList
              steps={[
                "Data PD (per pengukuran) punya 6 titik baca: 3 fasa (R/S/T) x 2 posisi (Top/Bottom). Diambil nilai maksimum (worst-case reading) sebagai representasi 1 sampel.",
                "Tiap pembacaan dikategorikan severity: Normal / Watch / Warning / Critical, berdasarkan ambang alat ukur (metode UHF, satuan mV).",
                "pd_worsening = 1 kalau level severity naik dibanding sampel sebelumnya (mis. Watch -> Warning), ATAU nilai PD naik signifikan (>= 0.3 x ambang Watch) walau levelnya belum naik.",
              ]}
            />
          </div>
          <Alert>
            <AlertTitle>Data PD masih simulasi</AlertTitle>
            <AlertDescription>
              Modul PD di database operasional isinya data dummy dengan asset_id acak yang tidak
              match ke 69 trafo riil ini, jadi belum bisa di-join langsung. Nilai PD di sini
              disimulasikan (skala log mengikuti kadar H2 riil supaya trennya masuk akal), BUKAN
              pembacaan sensor sungguhan. Harus diganti begitu mapping asset_id PD-DGA riil
              tersedia.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Gabungan: <code className="font-data">n_parameters_worsening = n_gas_worsening + pd_worsening</code> --
            angka inilah yang jadi salah satu fitur utama masuk ke Composite Risk Score di bawah.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Bagian 3, Composite Risk Score (Isolation Forest)</CardTitle>
          <CardDescription>
            Unsur AI/unsupervised ML di prototype ini, scikit-learn <code className="font-data">IsolationForest</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepList
            steps={[
              "Pendekatan cross-sectional: satu baris = satu (aset, periode sampling), bukan time-series panjang per aset, karena kebanyakan aset cuma punya 2-4 titik histori (terlalu pendek untuk time-series murni).",
              "Fitur yang dipakai: delta 7 gas (delta_h2 .. delta_co2), rule_status (1/2/3), n_gas_worsening, n_parameters_worsening, dan rule_fault_severity (ranking ordinal dari rule_fault_type: Normal=0, Stray Gassing/Thermal Fault (Oil)=1, Thermal Cellulose=2, Partial Discharge=3).",
              "rule_fault_severity dipakai dalam bentuk ORDINAL, bukan one-hot encoding, karena one-hot pernah dicoba dan hasilnya salah: kategori langka (mis. Thermal Cellulose yang cuma 2 baris) jadi dianggap PALING anomali oleh Isolation Forest cuma karena jarang muncul, bukan karena benar-benar paling parah. Ranking ordinal menghindari jebakan \"rarity vs severity\" ini, dan tetap konsisten dengan urutan bahaya Duval/IEEE.",
              "Model IsolationForest (n_estimators=200, contamination=\"auto\") dilatih (fit) di 161 baris fitur ini sekaligus, lalu decision_function() dipanggil di baris yang sama, ini unsupervised, TIDAK memakai lab_fault_type sebagai label saat training (supaya model tidak \"mengintip\" jawaban).",
              "anomaly_score_raw yang keluar: makin negatif = makin dianggap menyimpang dari pola mayoritas (\"normal\"). Divalidasi: rata-rata skor per lab_fault_type sudah berurutan benar, Partial Discharge paling anomali, lalu Stray Gassing, Thermal Cellulose, Mild Overheating Paper, Attention, Normal paling tidak anomali.",
              "Model yang sama persis (bukan reimplementasi terpisah) diekspor ke format ONNX supaya bisa jalan langsung di browser, itulah yang dipakai di halaman \"Coba Sendiri\". Sudah diverifikasi outputnya identik dengan hasil scikit-learn (beda cuma presisi float32 di digit ke-6).",
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Ringkasan Alur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/70 bg-card p-4 font-data text-xs sm:text-sm overflow-x-auto">
            <pre className="whitespace-pre">
{`Laporan lab (PDF)                Data PD (simulasi)
       |                                |
       v                                v
 raw_rows (gas ppm, o2, n2,       reading UHF per fasa/posisi
 lab_status, lab_fault_type)      -> worst-case per sampel
       |                                |
       v                                |
 [1] DGA RULE ENGINE                    |
 Tabel 1-4 IEEE -> rule_status,         |
 rule_fault_type                       |
       |                                |
       v                                v
 [2] TREND ENGINE  <---------------------
 delta per gas -> n_gas_worsening
 + pd_worsening -> n_parameters_worsening
       |
       v
 [3] COMPOSITE RISK SCORE
 IsolationForest(delta gas + rule_status +
 n_gas_worsening + n_parameters_worsening +
 rule_fault_severity) -> anomaly_score_raw`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
