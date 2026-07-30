# Deteksi Dini Degradasi Trafo Tegangan Tinggi — DGA + Partial Discharge

Prototype riset untuk PKM/GKM: **"Mendeteksi Dini Degradasi Aset Tegangan Tinggi... Unified
Trend & Correlation Analytics Berbasis AI untuk Menghasilkan Skor Risiko Komposit per Aset"**.

Repo ini berisi dua bagian yang saling terhubung:

1. **Notebook riset** (`dga_composite_score.ipynb`) — tempat semua analisis dikembangkan &
   divalidasi: DGA Rule Engine, Trend Engine, dan Composite Risk Score (Isolation Forest).
2. **Web app demo** (`webapp/`) — dashboard + form interaktif (Next.js + shadcn/ui) yang
   menjalankan ulang rule engine & model yang sama persis di browser, untuk keperluan
   presentasi/demo ke penguji PKM. Bisa di-deploy ke Vercel.

---

## 1. Latar Belakang & Pendekatan

Solusi yang dipilih ("Alternatif A") butuh unsur AI (bukan cuma rule-based) supaya nilai
inovasinya tidak dianggap rendah oleh reviewer. Scope prototype mencakup 3 komponen:

| Komponen | Metode | Peran |
|---|---|---|
| **DGA Rule Engine** | Rule-based, IEEE C57.104-2019 (Tabel 1-4) + IEC 60599 | Screening Status 1/2/3 & Fault Type dari kadar gas terlarut |
| **Trend Engine** | Moving Average + Compare Historis | Deteksi gas/parameter yang "memburuk" antar sampel |
| **Composite Risk Score** | Isolation Forest (unsupervised ML, scikit-learn) | Unsur AI — skor anomali per (aset, periode sampling) |

Pendekatan **cross-sectional**: satu baris = satu (aset, periode sampling), bukan time-series
panjang per aset, karena kebanyakan aset cuma punya 2-4 titik histori.

## 2. Sumber Data & Transparansi

- **Data DGA (nilai gas per aset): RIIL**, ditranskrip verbatim dari 3 laporan lab
  PT Petrolab Services:
  - Desember 2023 (sampling Nov 2023)
  - Maret 2024 (sampling Feb 2024)
  - Juli 2024 (sampling Jun 2024)

  Total **69 aset unik, 161 baris sampel**. Tidak ada nilai gas yang direkayasa/dibulatkan
  untuk membuat hasil terlihat lebih baik — kalau rule engine salah, itu ditampilkan apa
  adanya (lihat `status_match` di ringkasan hasil).

- **Data Partial Discharge (PD): SIMULASI**, dibuat oleh `simulate_pd_data.py`. Modul PD di
  database operasional (`be-plant-maintenance`) ternyata isinya data dummy dengan `asset_id`
  acak yang tidak match dengan 69 trafo riil di atas, jadi belum bisa di-join langsung. Nilai
  PD disimulasikan dengan skala log mengikuti kadar H2 riil (supaya trennya masuk akal), tapi
  ini **bukan pembacaan sensor sungguhan** — harus diganti begitu mapping `asset_id` PD↔DGA
  riil tersedia.

Setiap bagian notebook & web app yang memakai data ini punya catatan eksplisit mana yang riil
dan mana yang simulasi — prinsipnya: **jujur ke pembaca/penguji, bukan menyembunyikan gap**.

## 3. Struktur Folder

```
pkm-inovasi/
├── dga_composite_score.ipynb   # Notebook utama: rule engine + trend engine + risk score
├── dga_composite_score.html    # Export HTML notebook (buka langsung di browser, tanpa Jupyter)
├── simulate_pd_data.py         # Generator data PD simulasi (lihat catatan transparansi di atas)
├── simulated_pd_data.csv       # Output simulate_pd_data.py (di-generate ulang, bukan sumber asli)
├── _export_artifacts.py        # Re-build pipeline notebook -> ekspor dataset.json, tables.json,
│                                # dan model Isolation Forest ke ONNX (dipakai oleh webapp/)
├── webapp_artifacts/           # Output _export_artifacts.py (disalin ke webapp/public & src/lib)
└── webapp/                     # Web app Next.js + shadcn/ui (dashboard + demo interaktif)
```

## 4. Menjalankan Notebook

Butuh Python 3.10+ dengan `pandas`, `numpy`, `matplotlib`, `scikit-learn`, `jupyter`.

```bash
cd pkm-inovasi
python simulate_pd_data.py                # generate ulang simulated_pd_data.csv
jupyter nbconvert --to notebook --execute --inplace dga_composite_score.ipynb
jupyter nbconvert --to html dga_composite_score.ipynb   # opsional, buat lihat tanpa Jupyter
```

Buka `dga_composite_score.ipynb` di VS Code/Jupyter Lab, atau `dga_composite_score.html`
langsung di browser untuk lihat hasilnya (tabel, grafik, ranking anomaly score).

### Hasil validasi terakhir

- **Rule Engine**: `status_match` 80% (129/161 baris) dibanding kesimpulan lab asli.
- **Composite Risk Score**: rata-rata `anomaly_score` per kategori fault sudah berurutan
  sesuai keparahan — Partial Discharge paling anomali, lalu Stray Gassing, Thermal
  Cellulose, Mild Overheating Paper, Attention, dan Normal paling tidak anomali.

Kalau ada perubahan data (nambah aset baru dsb.), jalankan ulang urutan di atas, lalu jalankan
`python _export_artifacts.py` untuk regenerasi artifact yang dipakai `webapp/`.

## 5. Web App Demo (`webapp/`)

Dashboard + halaman "Coba Sendiri" yang menjalankan DGA Rule Engine (di-port ke TypeScript)
dan Composite Risk Score (model Isolation Forest yang sama persis, diekspor ke ONNX — bukan
reimplementasi terpisah) langsung di browser, tanpa backend.

```bash
cd webapp
npm install
npm run dev      # http://localhost:3000
```

- `/` — ringkasan 69 aset, grafik anomaly_score per kategori fault, tabel data lengkap.
- `/coba` — form input nilai gas (ppm), hasil rule engine + risk score dihitung live, ada
  contoh preset (Normal / Partial Discharge / Thermal Cellulose).

Deploy ke Vercel: push `webapp/` ke GitHub lalu import di [vercel.com/new](https://vercel.com/new),
atau langsung `npx vercel --prod` dari dalam folder `webapp`. Build sudah diverifikasi
menghasilkan static content (ringan, cocok untuk tier gratis Vercel).

## 6. Batasan yang Diketahui (jangan disembunyikan ke penguji)

- Data PD masih simulasi untuk semua 69 aset (lihat Bagian 2) — bukan pembacaan sensor riil.
- `status_match` rule engine 80%, belum 100% — beberapa kombinasi usia/rasio O2-N2 di Tabel
  1-4 IEEE mungkin masih perlu dikoreksi lebih lanjut.
- Beberapa tanggal sampling di data transkripsi diasumsikan berdasarkan pencocokan jumlah
  kolom hasil tes (saat DGA tidak dilakukan di semua tanggal oil-quality) — disarankan
  spot-check ke PDF laporan asli sebelum dipakai untuk klaim formal di makalah PKM.
- Notebook masih memakai subset transkripsi manual dari 3 laporan Petrolab; kalau ada laporan
  lab baru, ulangi alur di Bagian 4 (`_export_artifacts.py`) untuk menyinkronkan `webapp/`.
