import { Dashboard } from "@/components/dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deteksi Dini Degradasi Trafo -- Prototype PKM</h1>
        <p className="text-muted-foreground mt-1">
          DGA Rule Engine (IEEE C57.104-2019) + Trend Engine + Composite Risk Score (Isolation
          Forest, unsupervised), dijalankan di atas data DGA riil 69 aset trafo.
        </p>
      </div>
      <Alert>
        <AlertTitle>Transparansi data</AlertTitle>
        <AlertDescription>
          Data DGA (nilai gas per aset) ditranskrip verbatim dari 3 laporan lab PT Petrolab
          Services -- tidak ada nilai yang direkayasa. Data Partial Discharge yang berkontribusi ke
          `n_parameters_worsening` masih SIMULASI (belum ada mapping sensor PD riil ke aset ini),
          didisclose apa adanya, bukan disembunyikan.
        </AlertDescription>
      </Alert>
      <Dashboard />
    </div>
  );
}
