import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FaultEntry {
  name: string;
  colorVar: string;
  severity: number;
  description: string;
}

const FAULT_ENTRIES: FaultEntry[] = [
  {
    name: "Normal",
    colorVar: "var(--fault-normal)",
    severity: 0,
    description:
      "Kadar semua gas masih dalam batas wajar, tidak ada indikasi masalah.",
  },
  {
    name: "Stray Gassing",
    colorVar: "var(--fault-stray)",
    severity: 1,
    description:
      "Gas mulai terbentuk akibat panas ringan (di bawah 200°C) dari proses normal trafo -- bukan karena ada fault aktif. Risiko rendah, sering muncul di trafo yang sudah lama beroperasi.",
  },
  {
    name: "Thermal Fault (Oil)",
    colorVar: "var(--fault-thermal-oil)",
    severity: 1,
    description:
      "Panas berlebih di minyak, suhu sedang sampai tinggi -- biasanya karena sambungan longgar atau arus sirkulasi berlebih. Terdeteksi dari CH4, C2H6, C2H4 yang naik.",
  },
  {
    name: "Thermal Cellulose",
    colorVar: "var(--fault-thermal-cellulose)",
    severity: 2,
    description:
      "Panas berlebih yang mengenai kertas/isolasi selulosa, ditandai CO dan CO2 tinggi. Lebih serius karena kertas yang rusak tidak bisa “sembuh” seperti minyak.",
  },
  {
    name: "Mild Overheating Paper",
    colorVar: "var(--fault-mild)",
    severity: 2,
    description:
      "Mirip Thermal Cellulose tapi lebih ringan/awal -- kertas isolasi mulai terdegradasi, belum parah.",
  },
  {
    name: "Attention",
    colorVar: "var(--fault-attention)",
    severity: -1,
    description:
      "Flag peringatan dari lab untuk kasus borderline/ambigu (kadang dikombinasikan hasil uji Furan), belum jelas masuk kategori fault spesifik yang mana -- bukan bagian dari tangga keparahan di atas.",
  },
  {
    name: "Partial Discharge",
    colorVar: "var(--fault-pd)",
    severity: 3,
    description:
      "Paling berbahaya: ada percikan listrik kecil di isolasi (void, kontaminasi, cacat isolasi) yang bisa merambat jadi kegagalan total. Ditandai H2 sangat tinggi -- makanya paling anomali di Composite Risk Score.",
  },
];

export function FaultGlossary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Kamus Fault Type</CardTitle>
        <CardDescription>
          Kesimpulan jenis gangguan dari kadar gas terlarut, diurutkan dari paling ringan ke
          paling berbahaya. &quot;Attention&quot; di luar urutan -- itu flag ketidakpastian lab,
          bukan level keparahan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {FAULT_ENTRIES.map((f) => (
            <div key={f.name} className="flex gap-3">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: f.colorVar }}
                aria-hidden
              />
              <div>
                <dt className="font-medium text-sm">
                  {f.name}
                  {f.severity >= 0 && (
                    <span className="ml-2 font-data text-[10px] text-muted-foreground">
                      severity {f.severity}
                    </span>
                  )}
                </dt>
                <dd className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {f.description}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
