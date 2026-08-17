import { TryItForm } from "@/components/try-it-form";

export default function CobaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coba Sendiri</h1>
        <p className="text-muted-foreground mt-1">
          Masukkan nilai gas hasil uji DGA (ppm), lihat hasil DGA Rule Engine dan Composite Risk
          Score secara langsung, dihitung di browser kamu, tidak dikirim ke server manapun.
        </p>
      </div>
      <TryItForm />
    </div>
  );
}
