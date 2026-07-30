import Link from "next/link";
import { Dashboard } from "@/components/dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-5 py-4">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
          Deteksi dini degradasi trafo, sebelum jadi kegagalan.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          DGA Rule Engine (IEEE C57.104-2019) + Trend Engine + Composite Risk Score (Isolation
          Forest, unsupervised) -- dijalankan di atas data uji minyak trafo riil dari 69 aset,
          bukan data buatan.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild>
            <Link href="/coba">Coba Sendiri</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/metodologi">Lihat Metodologi</Link>
          </Button>
        </div>
      </section>

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
