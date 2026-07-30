# Ringkasan: Prototype PKM — DGA Rule Engine + Trend Engine + Composite Risk Score

## Konteks

PKM/GKM: *"Mendeteksi Dini Degradasi Aset Tegangan Tinggi... Unified Trend & Correlation
Analytics Berbasis AI untuk Menghasilkan Skor Risiko Komposit per Aset"*
(dokumen: `docs/qic-pd-unified-trend-analytics.md` di project `be-plant-maintenance`).

Solusi yang dipilih di PKM ("Alternatif A") butuh unsur AI (bukan cuma rule-based) supaya
nilai inovasinya tidak dianggap rendah oleh reviewer — makanya scope prototype mencakup 3 hal:

1. **DGA Rule Engine** — screening IEEE C57.104-2019 (Status 1/2/3) + IEC 60599/Duval Triangle.
   Rule-based murni, tidak butuh training.
2. **Trend Engine** — Moving Average + Compare Historis, digabung antara data PD dan DGA.
   Konsep di-reuse dari modul "Vibration Anomaly Detection" yang sudah ada di project Go.
3. **Composite Risk Score** — Isolation Forest (unsupervised ML, scikit-learn). Ini bagian
   AI-nya. Pendekatan **cross-sectional**: satu baris = satu (aset, periode sampling), bukan
   time-series panjang per aset — karena kebanyakan aset cuma punya 2-4 titik histori.

## Sumber Data

Data DGA riil dari 3 laporan lab PT Petrolab Services (bukan dummy):
- Desember 2023 (sampling November 2023, 23 unit trafo)
- Maret 2024 (sampling Februari 2024, 23 unit)
- Juli 2024 (sampling Juni 2024, 22 unit)

Total ~65 aset unik. Prototype notebook memakai subset 21 aset representatif yang mencakup
kategori: Normal, Partial Discharge, Thermal Cellulose, Stray Gassing, Furan End-of-Life.

**Catatan penting**: tabel `dga_trans` di database Go (`model/dissolve-gas-analysis.go`) adalah
skema EAV lama (`val_dga` cuma 1 scalar per baris, `id_dga` FK ke kategori test) — **tidak bisa**
dipakai langsung untuk breakdown per-gas. Nilai per-gas yang presisi hanya ada di PDF laporan
lab Petrolab. Ini gap yang sudah dicatat di root-cause analysis PKM.

Data PD (Partial Discharge) riil tidak pernah diberikan dalam sesi ini, jadi sinyal PD di
prototype masih **sintetis/placeholder** — perlu diganti data PD asli begitu mapping asset_id
PD↔DGA tersedia (juga gap yang tercatat di PKM, model `PartialDischargeAsset` punya flag
`IsDgaApplicable bool` tapi belum ada FK formal ke record DGA).

## Yang Sudah Dikerjakan

- PKM markdown sudah diupdate: Section 4.2 (sumber data historis, tabel real per laporan +
  tabel kasus fault ground truth), Section 4.4 (rancangan Trend Engine), Section 4.5
  (rancangan Composite Risk Score).
- Notebook prototype ditulis: `prototype/pkm-dga/dga_composite_score.ipynb` — 4 bagian
  (load data → rule engine → trend engine → isolation forest), lengkap dengan tabel batas
  IEEE (Tabel 3.2–3.5) yang direkonstruksi dan divalidasi terhadap 1 baris data riil (TR-40).
- **Belum dieksekusi** — belum diverifikasi jalan tanpa error atau apakah hasilnya (status_match%,
  anomaly score ranking) masuk akal.

## Yang Masih Perlu Divalidasi

- Reconstructed IEEE Table 1-4 values baru dicek silang ke 1 baris data (TR-40, kategori
  low-O2N2/age 1-9). Kombinasi age-bucket/O2N2 lain belum diverifikasi ke teks resmi
  IEEE C57.104-2019.
- Jalankan notebook end-to-end, cek `status_match` (rule engine vs kesimpulan lab asli) dan
  apakah `anomaly_score` benar memisahkan Partial Discharge/Thermal Cellulose (harus paling
  anomali) dari Stray Gassing (harus moderat) dan Normal (harus paling tidak anomali).
