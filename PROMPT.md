# Prompt untuk Claude Code di Project Ini

Buka Claude Code di folder `C:\laragon\www\pkm-inovasi` ini, lalu paste prompt di bawah.

```
Saya punya prototype Jupyter Notebook (dga_composite_score.ipynb, ada di folder ini) untuk
keperluan makalah PKM/GKM tentang deteksi dini degradasi trafo tegangan tinggi menggunakan
analisa DGA (Dissolve Gas Analysis) + Partial Discharge. Baca juga RINGKASAN.md untuk konteks
lengkapnya.

Notebook ini berisi 4 bagian:
1. Data riil 21 trafo dari 3 laporan lab Petrolab (DGA ppm per gas: H2, CH4, C2H6, C2H4,
   C2H2, CO, CO2, O2, N2), dengan label ground-truth dari kesimpulan lab asli
   (Normal / Partial Discharge / Thermal Cellulose / Stray Gassing / Attention).
2. DGA Rule Engine mengikuti standar IEEE C57.104-2019: screening Status 1/2/3 berdasarkan
   kadar gas individual (Tabel 1 = 90th percentile, Tabel 2 = 95th percentile, tergantung
   rasio O2/N2 dan usia trafo), Delta Value (Tabel 3), dan Gas Rate (Tabel 4).
3. Trend Engine: Moving Average + Compare Historis per gas, plus hitung jumlah parameter
   yang "memburuk" bersamaan (delta melebihi ambang).
4. Composite Risk Score: Isolation Forest (unsupervised, scikit-learn) di atas fitur trend,
   pendekatan cross-sectional (baris = aset + periode sampling, karena histori tiap aset
   pendek, cuma 2-4 titik).

Tolong jalankan notebook ini, cek errornya, dan bantu saya:
1. Install dependency yang dibutuhkan (pandas, numpy, matplotlib, scikit-learn, jupyter).
2. Jalankan seluruh cell, pastikan tidak ada error.
3. Laporkan hasil validasi:
   - Berapa persen `status_match` (rule engine cocok dengan kesimpulan lab asli)?
   - Apakah `anomaly_score` dari Isolation Forest berhasil membedakan kategori fault
     (Partial Discharge & Thermal Cellulose harus paling anomali/skor paling negatif,
     Stray Gassing moderat, Normal paling tidak anomali)?
4. Kalau ada baris yang rule-engine-nya SALAH (status_match = False), analisis kemungkinan
   penyebabnya — apakah tabel batas IEEE (Tabel 1-4) di notebook perlu dikoreksi untuk
   kombinasi usia/O2N2 tertentu (catatan: baru divalidasi silang untuk 1 baris data, TR-40,
   kategori low-O2N2 & usia 1-9 tahun).
5. Kolom `pd_worsening_synthetic` di notebook itu data PLACEHOLDER/sintetis (bukan data PD
   asli) — kalau saya kasih data PD asli nanti, tolong bantu integrasikan ke feature
   Composite Risk Score.

Project ini TERPISAH dari project utama saya (be-plant-maintenance, ada di
C:\laragon\www\be-plant-maintenance) — jangan sentuh atau ubah apapun di folder itu, semua
data yang dibutuhkan sudah ada di dalam notebook ini.
```
