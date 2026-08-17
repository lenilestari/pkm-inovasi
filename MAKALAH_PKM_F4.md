# MAKALAH INOVASI PKM — F4

> **Catatan revisi**: Section 5 (DO) dan 6 (CHECK) di versi ini sudah diupdate mengikuti progres
> prototype yang sebenarnya (per 2026-07-30) — sebelumnya masih tertulis "belum dilaksanakan"
> padahal rule engine, Trend Engine, Composite Risk Score, dan dashboard FE-nya **sudah
> dibangun, dites, dan di-deploy**. Lihat bukti langsung: [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/)
> (Dashboard), [/coba](https://pkm-inovasi.vercel.app/coba) (demo interaktif), [/metodologi](https://pkm-inovasi.vercel.app/metodologi)
> (penjelasan detail metode). Bagian lain (mapping PD-DGA riil, review SME Pemeliharaan,
> integrasi ke backend produksi) masih belum, dan tetap ditulis apa adanya sebagai gap terbuka.

## Header

| Field | Isi |
|---|---|
| **Nama Tim** | F4 |
| **Tanggal dibentuk** | 13 Februari 2025 |
| **Tema/Judul** | Mendeteksi Dini Degradasi Aset Tegangan Tinggi yang Terlewat karena Analisis PD dan DGA Terpisah, dengan Membangun Unified Trend & Correlation Analytics Berbasis AI untuk Menghasilkan Skor Risiko Komposit per Aset |
| **Unit Kerja (Dept./Komp.)** | 1. TI PSP<br>2. Pemeliharaan<br>3. [isi] |
| **Total Efisiensi** (Rp)** | Potensial: Rp 200.000.000 – Rp 350.000.000/tahun (estimasi, mencakup 2 jalur kegagalan aset kritis — PD & DGA — perlu validasi tim Pemeliharaan) |

**) Potensial/Riil — angka di atas masih potensial, belum riil karena proyek masih tahap Plan/Do awal (prototype sudah jalan, validasi dampak biaya riil belum dilakukan bersama Pemeliharaan).

## Keanggotaan Gugus Kendali Mutu

| Peran | Nama |
|---|---|
| Fasilitator | [isi] |
| Ketua | [isi] |
| Anggota | 1. [isi] (PD)<br>2. [isi] (DGA/Listrik)<br>3. [isi] (IT/Dev) |
| Usia Rata-rata | [isi] tahun |

## Abstraksi

Sistem Pemeliharaan saat ini punya dua modul pemantauan kondisi aset tegangan tinggi yang relevan untuk pengembangan tren: Partial Discharge (PD) dan Dissolve Gas Analysis (DGA). PD sudah punya evaluasi status berbasis threshold statis (watch/warning/critical), sedangkan DGA baru sebatas mencatat nilai gas terlarut sebagai data mentah tanpa interpretasi otomatis. Keduanya dinilai secara snapshot per titik waktu, tanpa tren historis, dan tidak ada mekanisme yang menghubungkan sinyal keduanya meski sering mengamati aset fisik yang sama (mis. transformator berdata PD sekaligus DGA). Akibatnya, indikasi degradasi dini yang muncul bersamaan di kedua parameter berpotensi tidak tertangkap karena masing-masing modul bekerja sendiri-sendiri.

Inovasi ini mengusulkan Unified Trend & Correlation Analytics untuk PD dan DGA, terdiri dari tiga kapabilitas: (1) fondasi evaluasi DGA berbasis rule engine rasio gas standar industri (IEC 60599/Duval Triangle) yang menghasilkan severity otomatis, setara PD; (2) Trend Engine generik, adaptasi Moving Average & Compare Historis dari modul Vibration Anomaly Detection, dipakai bersama PD dan DGA; dan (3) Composite Risk Score, kapabilitas machine learning unsupervised (Isolation Forest) yang mengkorelasikan tren PD dan DGA pada aset yang sama menjadi satu skor risiko gabungan — model belajar pola normal aset dari riwayat multi-parameternya sendiri, lalu mendeteksi kombinasi kondisi menyimpang tanpa ambang batas manual.

Kelayakan implementasi bertumpu pada data historis PD & DGA yang sudah tersimpan lokal per aset, cukup sebagai basis training tanpa integrasi eksternal atau labeling manual. Model dilatih per kelas aset dari fitur tren (bukan nilai mentah), dengan retraining berkala terjadwal, di atas stack backend existing (Go/Fiber) dan library ML ringan — tanpa lisensi atau komputasi tambahan. Skor komposit tampil sebagai lapisan tambahan di dashboard, melengkapi status PD/DGA existing, sehingga adopsi bertahap dan risiko rendah. Validasi awal via shadow mode terhadap kasus historis berujung kegagalan, mengukur seberapa dini sinyal ini muncul dibanding deteksi manual. Oil Analysis di luar scope karena karakteristik data berbeda.

**Update**: ketiga kapabilitas di atas sudah dibangun sebagai prototype dan divalidasi terhadap 69 aset/161 sampel data DGA riil dari 3 laporan lab PT Petrolab Services — lihat Section 5 & 6.

## Jadwal Rencana dan Realisasi Kegiatan — GKM F4

| Langkah | Kegiatan | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| P | 1. Menentukan Tema Dan Judul | X | | | | | | | |
| | 2. Mencari Penyebab Masalah | | X | X | | | | | |
| | 3. Menentukan Solusi | | | | X | | | | |
| | 4. Menetapkan Rencana Perbaikan | | | | | X | | | |
| D | 5. Melaksanakan Perbaikan/Pengembangan | | | | | | X | X | |
| C | 6. Meneliti Hasil Perbaikan/Pengembangan | | | | | | | X | |
| A | 7. Membuat Standar Baru | | | | | | | | X |
| | 8. Menetapkan Rencana Berikut | | | | | | | | X |

Ket: ▨ = Rencana Perbaikan, ■ = Realisasi. **Update**: Langkah 1–4 (P) selesai. Langkah 5 (D) dan 6 (C) **sudah terlaksana untuk bagian prototype** (rule engine, Trend Engine, Composite Risk Score, dashboard FE) — lihat Section 5 & 6 untuk detail dan evidence. Langkah 7–8 (A) masih rencana, menunggu review SME Pemeliharaan dan integrasi ke backend produksi.

## 1. Menentukan Tema & Judul

### 1.1 Pendahuluan

Ruang lingkup pekerjaan ini mencakup dua modul pemantauan kondisi aset pada sistem Pemeliharaan: Partial Discharge (PD) dan Dissolve Gas Analysis (DGA). Keduanya sudah mencatat data pengukuran historis; PD sudah punya evaluasi status berbasis threshold statis, sementara DGA belum. Belum ada lapisan analitik tren maupun korelasi lintas modul untuk keduanya. Proyek ini membangun lapisan analitik generik berbasis AI di atas PD dan DGA, tanpa mengubah struktur data historis yang sudah ada di PD.

### 1.2 Identifikasi Masalah

- Setiap modul (PD, DGA) menilai kondisi aset secara snapshot & terisolasi, tanpa tren
- DGA belum punya severity/status otomatis sama sekali — nilai gas hanya disimpan sebagai data mentah
- Tidak ada mekanisme yang menghubungkan sinyal PD dan DGA pada aset fisik yang sama
- Engineer harus membuka & membandingkan data PD dan DGA secara manual untuk melihat gambaran risiko utuh satu aset
- Potensi indikasi degradasi majemuk (muncul di PD dan DGA sekaligus) tidak tertangkap karena analisis berjalan sendiri-sendiri per modul

### 1.3 Stratifikasi Masalah

| Masalah | Frekuensi Kejadian* | Dampak Kerugian* |
|---|---|---|
| DGA belum punya severity/threshold otomatis | — | Tidak ada sinyal terstruktur yang bisa dipakai untuk tren |
| Tidak ada tren pada PD | — | Deteksi anomali terlambat per parameter |
| Tidak ada korelasi PD–DGA pada aset yang sama | — | Sinyal degradasi majemuk tidak tertangkap, gambaran risiko aset tidak utuh |
| Analisis lintas modul masih manual (engineer buka 2 modul terpisah) | — | Waktu analisis lebih lama, rawan terlewat |

*tergantung ketersediaan data historis insiden aktual — perlu dilengkapi angka dari tim Pemeliharaan*

### 1.4 Prioritas Masalah

Prioritas tertinggi: ketiadaan fondasi evaluasi otomatis di DGA, karena tanpa ini DGA tidak punya "sinyal" apa pun untuk dikorelasikan — masalah ini menjadi prasyarat sebelum korelasi PD–DGA bisa dibangun. Prioritas kedua: ketiadaan korelasi lintas modul itu sendiri. (Lengkapi dengan pareto berbasis data frekuensi kasus, jika tersedia.)

### 1.5 Dampak Masalah dan Harapan dari Pihak Terkait

| Pihak Terkait | Dampak Negatif | Harapan dari Pihak Terkait |
|---|---|---|
| Tim Pemeliharaan/Reliability | Analisis manual lintas modul memakan waktu, gambaran risiko aset terpecah-pecah | Satu skor risiko komposit per aset, otomatis dari data PD & DGA |
| Manajemen Operasional | Risiko unplanned shutdown dari degradasi majemuk yang tidak terdeteksi dini | Visibilitas risiko aset kritis yang lebih utuh & dini |
| Tim K3LH | Risiko keselamatan dari kegagalan mendadak peralatan tegangan tinggi | Early warning lintas parameter, bukan cuma 1 sinyal terpisah |

### 1.6 Sasaran

#### 1.6.1 Sasaran dan Target Kuantitatif

Setiap aset kritis yang punya data historis di PD dan DGA sekaligus otomatis mendapat 1 skor risiko komposit. Target prototype: minimal **69 aset/transformator** tercakup pada tahap uji coba (**tercapai** — 69 aset, 161 sampel, dari 3 laporan lab PT Petrolab Services Des 2023/Mar 2024/Jul 2024), dengan early warning aktif saat ≥2 parameter menunjukkan tren memburuk bersamaan (**tercapai** — lihat kolom `n_parameters_worsening` di prototype, 24 dari 161 sampel terflag ≥2 parameter memburuk bersamaan).

#### 1.6.2 Sasaran ditinjau dari Aspek Mutu

| Aspek | Sebelum Perbaikan | Sasaran | Status |
|---|---|---|---|
| Quality | PD & DGA dinilai terpisah, DGA tanpa severity otomatis | Skor risiko komposit berbasis AI per aset dari data PD & DGA | **Tercapai (prototype)** — 80% rule engine match ke lab, urutan anomaly_score sesuai keparahan |
| Cost | Biaya reaktif dari 2 jalur kegagalan independen | Estimasi hemat Rp 200-350 juta/tahun (perlu validasi) | Belum divalidasi — perlu data insiden riil dari Pemeliharaan |
| Delivery | Engineer cek 2 modul terpisah secara manual | Satu dashboard gabungan PD+DGA | **Tercapai (prototype)** — dashboard web, lihat evidence Section 5 |
| Safety | Degradasi majemuk baru diketahui setelah salah satu parameter kritis | Deteksi dini degradasi majemuk | **Tercapai (prototype)** — flag `n_parameters_worsening` |
| Morale | Beban kerja repetitif cek manual | Engineer tidak lagi cek modul manual satu-satu | Belum diukur — prototype belum dipakai harian oleh tim Pemeliharaan |
| Environment | — | — | — |
| Healthy | Penanganan darurat mendadak | Kurangi paparan risiko saat penanganan darurat, kerja lebih terencana | Belum diukur |

### 1.7 Sasaran ditinjau dari Kaidah SMART

| Aspek | Sasaran |
|---|---|
| Specific | Membangun Trend Engine generik + Composite Risk Score berbasis AI untuk PD dan DGA |
| Measurable | Skor risiko komposit tersedia otomatis untuk aset yang punya data di kedua modul; early warning muncul saat ≥2 parameter tren memburuk bersamaan |
| Achievable | Data historis PD sudah lengkap & siap pakai; DGA perlu fondasi rule engine (Langkah 4) sebelum ikut tren — dikerjakan sebagai bagian dari rencana perbaikan, bukan prasyarat di luar scope |
| Reasonable | Reuse Trend Engine dari modul Vibration Anomaly Detection, stack existing (Go/Fiber/GORM/SQL Server) + komponen ML ringan, biaya rendah |
| Time frame | Prototype selesai dalam [isi] minggu/bulan sesuai jadwal 8 langkah di atas (**prototype rule engine + Trend Engine + Composite Risk Score + dashboard FE sudah selesai**) |

### 1.8 Menentukan Tema

Digitalisasi proses monitoring kondisi aset tegangan tinggi melalui platform analitik tren & korelasi berbasis AI lintas modul PD dan DGA, menggantikan pendekatan analisis per-modul yang terisolasi dengan gambaran risiko komposit per aset.

## 2. Penyebab Masalah

### 2.1 Mencari Penyebab Masalah (Fishbone)

```
                 Method                             System/Machine
     Tiap modul dievaluasi terpisah,      Tidak ada layer yang hubungkan
     tidak ada standar korelasi           data PD-DGA per aset; DGA belum
     lintas parameter                     punya severity otomatis
                  \                                /
                   \                              /
                    >--- Risiko degradasi majemuk ---<
                    >   pada aset kritis tidak      <
                   /    tertangkap secara utuh        \
                  /                                    \
        Man/People                              Data
   Engineer cek modul satu-satu,          Data historis PD lengkap;
   korelasi manual di kepala masing-      DGA masih string mentah,
   masing individu                        belum terstruktur per jenis gas
```

Kesimpulan Penyebab Masalah: Akar masalah dominan ada di sisi System — ketiadaan mapping/relasi antar-modul terhadap aset fisik yang sama, ditambah DGA yang belum punya struktur evaluasi sama sekali, sehingga data yang sebenarnya sudah tersimpan tidak pernah "bertemu" untuk membentuk gambaran risiko utuh.

### 2.2 Mencari Penyebab Masalah Dominan

Penyebab dominan: isolasi data antar modul dan DGA yang belum punya severity otomatis — bukan karena data kurang, tapi karena (a) tidak ada identifier/mapping yang menyatukan record PD dan DGA ke satu entitas aset yang sama, dan (b) DGA belum punya fondasi evaluasi yang setara dengan PD.

## 3. Menentukan Solusi

### 3.1 Menyusun Alternatif Solusi

| Alternatif Solusi | Evaluasi | Kesimpulan |
|---|---|---|
| A. Bangun fondasi evaluasi DGA (rule engine IEC 60599/Duval Triangle) + Trend Engine generik (reuse MA+Compare dari vibration) + Composite Risk Score via Isolation Forest (unsupervised ML), berbasis mapping aset PD–DGA | Cakupan 2 modul sekaligus, kapabilitas AI genuine, ROI besar; butuh mapping asset_id konsisten & data historis cukup untuk training | Dipilih |
| B. Ulangi MA+Compare per modul terpisah tanpa korelasi (rule-based saja) | Lebih cepat dikerjakan, tapi dianggap replikasi ide vibration, tanpa unsur AI, nilai inovasi rendah | Ditolak |
| C. Adaptive threshold + auto-trigger follow-up action | Lebih canggih, closing-the-loop otomatis, tapi di luar scope prototype awal | Ditunda — roadmap lanjutan |

### 3.2 Menentukan Solusi Terbaik

Solusi A dipilih karena satu-satunya opsi yang menghadirkan kapabilitas AI genuine (bukan sekadar rule-based) sekaligus menutup gap struktural DGA yang selama ini jadi penghalang korelasi. Risiko utama: (1) asset_id antar PD dan DGA belum tentu konsisten formatnya — perlu mapping table sebelum korelasi dijalankan; (2) data historis per aset mungkin belum cukup untuk melatih model pada aset baru/jarang diinspeksi — akan pakai fallback rule-based threshold sampai data historis mencukupi (mis. ≥10 data poin); (3) bobot/formula skor komposit perlu divalidasi bersama SME Pemeliharaan sebelum go-live.

**Update status risiko (per prototype):**
1. **Belum diselesaikan — dan ternyata akar masalahnya lebih dalam dari dugaan awal.** Sempat diasumsikan risiko #1 ini murni soal data/administrasi (asset_id PD dan DGA beda format, tinggal dibuatkan mapping table). Setelah dapat sample data PD riil (8 aset: CLR P1B-P4, Rumah Panggung, SG 4002, TR SB2, LBS 4001) dan **dikonfirmasi langsung oleh tim listrik (17 Agustus 2026)**, ternyata ini **gap instrumentasi**: DGA (via Petrolab) menguji minyak trafo langsung, sementara sensor PD saat ini terpasang di **panel/switchgear**, bukan di titik yang sama dengan trafo yang diuji DGA. Jadi bukan sekadar "buat tabel mapping nama aset" — perlu keputusan penempatan titik ukur PD tambahan langsung di badan trafo yang sama dengan yang rutin diuji DGA, baru korelasi PD-DGA riil bisa dibangun untuk aset manapun. Detail temuan ada di `data_pd_riil/README.md`. Prototype tetap memakai data PD **simulasi** (diskalakan dari kadar H2 riil) untuk sementara.
2. **Teratasi berbeda dari rencana** — alih-alih fallback rule-based per aset, prototype memakai pendekatan cross-sectional (satu baris = satu aset+periode, bukan time-series per aset), sehingga 161 baris dari 69 aset cukup untuk melatih Isolation Forest meski tiap aset cuma punya 2-4 titik histori.
3. **Belum dilakukan** — review bersama SME Pemeliharaan untuk bobot/ambang skor komposit belum dijadwalkan.

## 4. Menetapkan Rencana Perbaikan

| Rencana Perbaikan (WHAT) | Tujuan Perbaikan (WHY) | Kapan (WHEN) | Dimana (WHERE) | PIC (WHO) |
|---|---|---|---|---|
| Strukturkan input nilai gas DGA per jenis (H2, CH4, C2H2, C2H4, C2H6, CO, CO2) menggantikan `ValDGA` string bebas | Prasyarat teknis wajib — tanpa ini rasio gas tidak bisa dihitung otomatis | [isi] | Database & Backend modul DGA | [PIC] |
| Bangun rule engine interpretasi fault DGA berbasis rasio gas standar industri (IEC 60599/Duval Triangle) | Hasilkan severity/fault_type otomatis, setara `Severity` di PD — murni rule-based karena metode sudah standar & terverifikasi industri | [isi] | Backend modul DGA | [PIC] |
| Bangun fungsi Trend Engine generik (Moving Average + Compare Historis) | Reuse 1 logika tren untuk PD dan DGA sekaligus | [isi] | Backend Pemeliharaan, shared package | [PIC] |
| Buat mapping asset_id lintas modul PD–DGA | Prasyarat korelasi lintas modul | [isi] | Database Pemeliharaan | [PIC] |
| Siapkan & latih model anomaly detection (Isolation Forest) | Hitung Composite Risk Score dari histori multi-parameter PD+DGA | [isi] | Backend/komponen ML terpisah | [PIC] |
| Bangun endpoint Composite Risk Score | Gabungkan tren PD+DGA + hasil model jadi 1 skor per aset | [isi] | Backend, endpoint baru | [PIC] |
| Tambah dashboard/tampilan FE skor komposit | Visibilitas ke user tanpa buka 2 modul terpisah | [isi] | FE Asset Health Management | [PIC FE] |
| Review bersama tim Pemeliharaan | Validasi bobot & ambang skor komposit | [isi] | Internal meeting | [PIC] |

### 4.1 Detail Metode Interpretasi Rule Engine DGA

Rule engine tidak cukup hanya menyebut "IEC 60599/Duval Triangle" — berikut metode yang perlu diimplementasikan, dari yang paling dasar sampai paling presisi:

| Metode | Basis Perhitungan | Output |
|---|---|---|
| Key Gas | Gas dominan: H2 (partial discharge), CH4+C2H4+C2H6 (thermal fault), C2H2 (arcing) | Indikasi jenis fault kasar |
| Rogers Ratio | 3 rasio: C2H2/C2H4, CH4/H2, C2H4/C2H6 | Kode fault (PD, D1, D2, T1-T3) |
| Doernenburg Ratio | 4 rasio + syarat kadar gas minimum sebelum rasio dianggap valid | Kode fault, lebih ketat dari Rogers (menghindari false positive saat gas masih rendah) |
| IEC 60599 Ratio | 3 rasio sama seperti Rogers (C2H2/C2H4, CH4/H2, C2H4/C2H6), batas nilai berbeda dari Rogers | Kode fault sesuai IEC — metode utama yang jadi acuan proyek ini |
| Duval Triangle 1 | %relatif CH4, C2H4, C2H2 dari total 3 gas → diplot sebagai titik pada segitiga | Zona: PD, D1, D2, T1, T2, T3, DT |
| Duval Pentagon | %relatif 5 gas (H2, CH4, C2H2, C2H4, C2H6) → diplot sebagai titik pada pentagon | Zona fault lebih presisi dari triangle, melengkapi triangle |
| TDCG (Total Dissolved Combustible Gas) | Total H2+CH4+C2H2+C2H4+C2H6+CO | Condition 1-4 (IEEE C57.104-2019) — indikator keparahan keseluruhan |
| Gassing Rate | Δkadar gas / Δwaktu antar sampel historis | Laju kenaikan gas → dasar mempercepat jadwal resampling |
| Delta Value | Selisih kadar gas antar 2 sampel berurutan | Deteksi tren naik meski kadar absolut masih di bawah batas (Status 2 di modul PD sudah pakai konsep serupa) |

**Catatan implementasi:** nilai ambang batas (ppm) pasti per metode harus divalidasi ulang terhadap teks lengkap standar IEC 60599 dan IEEE C57.104-2019 saat development — bukan diasumsikan dari ringkasan ini.

**Metode yang benar-benar dipakai vendor lab (Petrolab), dikonfirmasi dari laporan detail per trafo:** bukan Rogers/Duval Ratio, melainkan **individual gas threshold + delta value + gassing rate** ala IEEE C57.104-2019 — inilah yang jadi prioritas implementasi rule engine, dengan Rogers/Duval/Doernenburg sebagai lapisan tambahan (bukan pengganti). Detailnya:

- **Threshold ganda per gas** — tiap gas (H2, CH4, C2H6, C2H4, C2H2, CO, CO2) punya 4 tabel batas berbeda tergantung 2 faktor: rasio **O2/N2** (≤0.2 vs >0.2) dan **umur trafo** (Unknown / 1-9 / 10-30 / >30 tahun). Rule engine perlu tahu umur & rasio O2/N2 aset sebelum memilih tabel batas yang tepat — bukan satu ambang batas statis untuk semua trafo.
- **Status ditentukan dari 3 sinyal sekaligus**: kadar gas individual vs Table 1 (90th percentile)/Table 2 (95th percentile), Delta Value vs Table 3 (variasi minimum antar sampel), dan Gas Rate vs Table 4 (laju kenaikan ppm/tahun, dihitung dari 3-6 sampel dalam rentang 4-24 bulan).
- **Vocabulary fault_type nyata yang dipakai** (bukan kode PD/D1/D2/T1-T3 dari Rogers/Duval, tapi label naratif langsung): `Normal`, `Partial Discharge`, `Thermal Cellulose`, `Stray Gassing`, `Attention`, `Operational Load`, `Residual Gas`. Pola pemicu tiap label (dari teks "Source of Abnormality" di laporan riil):
  - H2 tinggi & melebihi Table 2 signifikan → **Partial Discharge**
  - CO & CO2 tinggi melebihi Table 2, disertai furan abnormal → **Thermal Cellulose** (dekomposisi kertas isolasi)
  - CH4/C2H6/C2H4 sedikit di atas Table 1 tapi delta & gas rate masih normal → **Stray Gassing** (pemanasan minyak <200°C, bukan fault aktif)
  - Kenaikan CO signifikan tapi kombustible gas lain & furan normal → dianggap dari pembebanan operasional, bukan fault (`Operational Load`)
- **NEI (Normalized Energy Intensity) paper & oil** — parameter turunan tambahan yang dihitung lab (satuan kJ/kL) untuk menormalisasi energi dekomposisi kertas/minyak terhadap % gas by volume; belum jelas apakah perlu direplikasi di rule engine kita atau cukup jadi referensi silang saat validasi.

**Update implementasi (prototype):** rule engine prototype sudah mengimplementasikan persis pendekatan "individual gas threshold + Delta Value + Gas Rate ala IEEE C57.104-2019" di atas (Tabel 1-4, klasifikasi O2/N2, age bucket) — bukan Rogers/Duval. Fault type yang **sudah** bisa dihasilkan rule engine: `Normal`, `Stray Gassing`, `Thermal Fault (Oil)`, `Thermal Cellulose`, `Partial Discharge`. Fault type yang **belum** bisa dihasilkan rule engine (masih cuma label ground-truth dari lab, belum ada logika turunannya): `Attention`, `Operational Load`, `Residual Gas`. NEI belum direplikasi — masih pertanyaan terbuka sesuai catatan di atas.

### 4.2 Sumber Data Historis DGA

Data historis untuk validasi rule engine dan training model Composite Risk Score diambil dari laporan pengujian minyak trafo pihak ketiga (PT Petrolab Services). Karena laporan tersebut berformat Oil Analysis (mencakup DGA, Furan Analysis, dan Oil Quality sekaligus dalam satu dokumen), **hanya data DGA** (kadar gas H2, CH4, C2H2, C2H4, C2H6, CO, CO2, serta status DGA per trafo) yang diekstrak dan dipakai untuk proyek ini — Furan Analysis dan Oil Quality tetap di luar scope, konsisten dengan batasan "Oil Analysis di luar scope" pada Abstraksi. Setiap laporan baru yang masuk diekstrak dengan cara yang sama (hanya kolom DGA) sebelum digabung menjadi satu dataset historis per aset.

**Sumber konkret yang sudah dikonfirmasi — 3 laporan Petrolab untuk PT Pupuk Sriwidjaja Palembang, per-trafo dengan rincian gas individual + delta + gas rate + 4 tabel limit (bukan cuma ringkasan):**

| Laporan | Periode Sampling | Jumlah Trafo | Contoh Unit |
|---|---|---|---|
| Petrolab Desember 2023 | November 2023 | 23 unit | TR-26/27/36/40-57, TR-Pepaya 214/215, TR-311B/312/312A, F6P & GP series |
| Petrolab Maret 2024 | Februari 2024 | 23 unit | 1N/2N/3N-TR-00x, TR-31/32/34/35, TR-45/45B-48, TR-317/325/329 Rasamala/Gurame, TR-AOP P4 |
| Petrolab Juli 2024 | Juni 2024 | 22 unit | TR 1 HV 1-4, TR-221, TR-YDPK, TR-Melati, TR-REL A/B/C, F5O-TR55/59/510/512/512A |

Total **~65 aset unik** (beberapa trafo muncul berulang lintas laporan karena resampling periodik — mis. 2N-TR-001, TR-45, F5O-TR55 tercatat di lebih dari satu laporan), memberi **2-4 titik waktu per aset** dalam rentang beberapa bulan hingga ~1 tahun — cukup untuk menghitung Delta Value & Gas Rate sesuai syarat IEEE C57.104-2019 (3-6 sampel, interval 4-24 bulan), dan cukup untuk basis Composite Risk Score cross-sectional (bandingkan fitur tren antar aset, bukan hanya deret waktu tunggal per aset).

**Update: sudah ditranskrip seluruhnya ke prototype** — hasil final **69 aset unik, 161 baris sampel** (melebihi estimasi ~65 aset di atas, karena transkripsi manual dari ketiga laporan berhasil menangkap seluruh trafo yang ada, bukan subset). Satu pengecualian: **TR-312** tidak ikut ditranskrip karena tahun pembuatan trafo tertulis "Unknown" di laporan asli, yang akan merusak perhitungan `age_bucket` kalau dipaksakan — jadi sengaja di-skip, bukan terlewat tanpa sadar.

**Kasus fault aktif riil yang ditemukan** (dipakai sebagai ground truth validasi rule engine sebelum dipercaya ke seluruh dataset):

| Aset | Fault Terindikasi | Bukti Data | Status di Prototype |
|---|---|---|---|
| TR-221, TR-YDPK, TR-Melati (216), TR-34, TR-40, TR-44, TR-AOP P4 | Partial Discharge (Status 3) | H2 melebihi Table 2 signifikan, mis. TR-221 H2 47.966→50.438 ppm naik antar sampel | ✅ Masuk dataset, rule engine & Composite Risk Score menandai semuanya sebagai kasus paling anomali |
| 2N-TR-002 | Attention → Accelerated Aging | CO2 di zona Table 1–2, furan memburuk antar periode | ✅ Masuk dataset (label lab: Attention) |
| TR-45B | Thermal Fault T2 / Stray Gassing | Delta C2H4 melebihi Table 3 | ✅ Masuk dataset (label lab: Stray Gassing) |
| TR 1 HV 4 | Thermal Cellulose | CO & CO2 melebihi Table 2, furan Accelerated Aging | ✅ Masuk dataset |
| F5O-TR55, F5O-TR512A | Stray Gassing (berulang lintas periode) | CH4/C2H6 di zona Table 1–2, delta & rate masih normal | ✅ Masuk dataset, dengan 4 titik waktu (2016/2020/2023/2024) |
| TR-311B, TR-312A, TR-312 | Furan End of Life (insulasi kritis) | CO2 tinggi + Total Furan >1500 ppb | ⚠️ TR-311B & TR-312A masuk dataset (label lab: Mild Overheating Paper / Attention). **TR-312 tidak masuk** — lihat catatan skip di atas |

Laporan Juli 2024 adalah yang paling sesuai dijadikan acuan skema field database, karena menunjukkan struktur kolom per-gas paling lengkap (Test Result, Delta, Gas Rate, dan 4 tabel limit per O2/N2 & usia trafo).

### 4.3 Rancangan Data Dummy untuk Prototype Rule Engine

**Kenapa perlu dummy data, bukan langsung pakai `dga_trans` asli:** kolom `val_dga` di tabel produksi sekarang masih string bebas (lihat `model/dissolve-gas-analysis.go`), belum terstruktur per gas — rule engine tidak bisa dites di atasnya. Dummy data dibuat sebagai dataset terpisah (file JSON/CSV, di luar DB produksi) yang merepresentasikan **bentuk skema terstruktur setelah Rencana Perbaikan #1 (baris 161) selesai** — jadi sekaligus jadi cetak biru skema kolom baru itu, sebelum ditulis sebagai migration asli.

**Pola yang ditiru:** modul Partial Discharge sudah punya seeder dummy data (`database/seeders/partial_discharge/08_measurements.go`) yang generate riwayat pengukuran realistis per aset — tanggal sampling mengikuti frekuensi inspeksi, dengan variasi acak terkontrol (`rng`). DGA akan pakai pola serupa, bukan reinvent.

**Update: rencana ini terlampaui.** Alih-alih dummy data, prototype akhirnya memakai **data DGA riil hasil transkripsi manual** dari 3 laporan Petrolab (Section 4.2) — jadi rule engine tervalidasi langsung terhadap ground truth lab asli (80% match), bukan cuma terhadap data sintetis. Struktur skema kolom (`asset_id, manufacture_year, sample_date, h2, ch4, c2h6, c2h4, c2h2, co, co2, o2, n2, lab_status, lab_fault_type`) tetap sesuai rancangan 2-level di bawah ini, jadi rancangan ini valid dipakai sebagai cetak biru migration ke tabel produksi.

**Struktur data (2 level, mirror pola `PartialDischargeAssetMeasurement` + `...Reading`):**

1. **Asset** (setara 1 trafo) — field: `asset_id`, `age_bucket` (`unknown` / `1-9` / `10-30` / `>30` tahun — 4 kategori ini menentukan tabel limit yang dipakai, lihat section 4.1), `o2n2_class` (`<=0.2` atau `>0.2` — faktor kedua penentu tabel limit).
2. **Sample** (setara 1 sesi DGA) — field: `asset_id`, `sample_date`, dan nilai per gas dalam ppm: `h2, ch4, c2h6, c2h4, c2h2, co, co2` (7 gas sesuai section 4.2). Sebagian besar aset punya 2-4 sample berurutan supaya Delta Value dan Gas Rate bisa dihitung.

**4 profil/archetype yang tercakup di dataset riil (bukan lagi rancangan, sudah ada datanya):**

| Profil | Pola gas | Contoh riil di dataset |
|---|---|---|
| Normal | Semua gas di bawah Table 1, delta & gas rate stabil | Mayoritas ~121 dari 161 baris |
| Stray Gassing | CH4/C2H6/C2H4 sedikit di atas Table 1, delta & gas rate tetap normal | 1N-TR-002, F5O-TR55, F5O-TR512A, TR-45B |
| Partial Discharge | H2 jauh melebihi Table 2, delta H2 tinggi | TR-221, TR-Melati (216), TR-YDPK, TR-34, TR-40, TR-44, TR-AOP P4 |
| Thermal Cellulose | CO & CO2 melebihi Table 2 | TR-1-HV-4 |

Ground truth (`expected_status`/`expected_fault_type`) untuk validasi rule engine memakai kesimpulan asli lab Petrolab (`lab_status`, `lab_fault_type`), bukan dihitung manual terpisah — hasil validasinya: **80% match (129/161 baris)**.

### 4.4 Rancangan Trend Engine (PD + DGA Gabungan)

Reuse fungsi Moving Average & Compare Historis dari modul Vibration Anomaly Detection, digeneralisasi untuk 2 sumber data:

- **Moving Average per parameter** — untuk DGA per jenis gas, untuk PD per parameter reading yang sudah ada. Window disesuaikan jumlah sampel tersedia (mayoritas aset baru punya 2-4 titik per laporan Petrolab, bukan deret waktu panjang).
- **Compare Historis** — bandingkan nilai/status terkini vs titik sebelumnya per aset → flag `memburuk`/`stabil`/`membaik` per parameter. Untuk DGA ini bertumpu langsung pada Delta Value (sudah dihitung di rule engine Bagian 4.1) — Trend Engine DGA sebagian "gratis" dari situ, tinggal digeneralisasi supaya PD lewat fungsi yang sama.
- **Output kunci**: per (aset, periode), hitung jumlah parameter PD+DGA yang memburuk bersamaan — inilah dasar syarat SMART "early warning saat ≥2 parameter tren memburuk bersamaan" (baris 1.6.1 & 1.7).

**Bukti dari data riil bahwa pola ini benar-benar terjadi:** TR-221 (H2 naik 2 sampel berturut, tetap Partial Discharge) dan 2N-TR-002 (Attention → Accelerated Aging furan lintas periode) — kandidat demo kasus di prototype.

**Update: sudah diimplementasikan dan dites.** `n_gas_worsening` (dari delta DGA) + `pd_worsening` (dari data PD) digabung jadi `n_parameters_worsening` — dari 161 sampel, **24 baris** terflag ≥2 parameter memburuk bersamaan. Satu catatan jujur: data PD yang dipakai untuk `pd_worsening` masih **simulasi** (lihat Section 3.2, risiko #1 yang belum teratasi), karena mapping asset_id PD-DGA riil belum ada — jadi Trend Engine gabungan ini sudah *berfungsi secara teknis*, tapi separuh inputnya (`pd_worsening`) belum berbasis sensor PD sungguhan.

### 4.5 Rancangan Composite Risk Score (Isolation Forest)

Pendekatan **cross-sectional**: satu baris fitur = satu (aset, periode sampling). Dengan ~65 aset × 2-4 periode (Section 4.2), dataset punya ~120-150 baris — cukup untuk `IsolationForest` unsupervised karena model belajar pola mayoritas normal vs minoritas menyimpang, bukan klasifikasi berlabel.

**Fitur input** (dari Trend Engine 4.4, bukan nilai mentah gas mentah):
- Delta & Gas Rate tiap gas DGA
- Status DGA numerik (1/2/3) dari rule engine
- Jumlah parameter PD+DGA yang memburuk bersamaan

**Validasi kualitatif** — karena kesimpulan lab Petrolab sudah berfungsi sebagai ground truth: baris aset Partial Discharge nyata (TR-221, TR-YDPK, TR-Melati, TR-34, TR-44, TR-AOP P4) harus mendapat `anomaly_score` terendah dibanding mayoritas "Normal Aging"; baris Stray Gassing (F5O-TR55/TR512A — anomali ringan, bukan fault aktif) idealnya dapat skor menengah, bukan seburuk Partial Discharge. Kecocokan urutan ini jadi bukti utama kelayakan model sebelum dipakai lebih lanjut.

**Update: SUDAH divalidasi dan urutannya BENAR.** Model dilatih di 161 baris (69 aset), fitur akhir yang dipakai: delta 7 gas, `rule_status`, `n_gas_worsening`, `n_parameters_worsening`, dan `rule_fault_severity` (ranking ordinal dari `rule_fault_type` — ditambahkan karena one-hot encoding sempat dicoba dan gagal, kategori langka jadi dianggap paling anomali cuma karena jarang, bukan karena parah). Hasil rata-rata `anomaly_score` per kategori, dari paling anomali ke paling tidak anomali:

| Kategori | Rata-rata anomaly_score |
|---|---|
| Partial Discharge (paling anomali) | ~-0.02 |
| Stray Gassing | ~0.03 |
| Thermal Cellulose | ~0.07 |
| Mild Overheating Paper | ~0.08 |
| Attention | ~0.12 |
| Normal (paling tidak anomali) | ~0.14 |

Urutan ini **sesuai persis** dengan yang diminta rancangan di atas — Partial Discharge paling anomali, Stray Gassing menengah, Normal paling tidak anomali. Bisa dicek langsung, live, di [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/).

---

## 5. DO — Pelaksanaan Perbaikan

> **Status: prototype sudah dilaksanakan dan di-deploy** (rule engine, Trend Engine, Composite Risk Score, dashboard FE). Integrasi ke backend produksi (Go/Fiber be-plant-maintenance) dan mapping asset_id PD-DGA riil **belum** dilaksanakan — keduanya jadi prasyarat sebelum prototype ini naik status dari "demo" ke "produksi".

| Rencana Perbaikan (WHAT) | Tujuan (WHY) | Langkah Perbaikan (HOW) | Kapan (WHEN) | Dimana (WHERE) | PIC (WHO) & Evidence |
|---|---|---|---|---|---|
| Strukturisasi data gas DGA | Prasyarat rule engine | Transkripsi manual 3 laporan Petrolab (Des 2023/Mar 2024/Jul 2024) jadi dataset terstruktur per gas (H2/CH4/C2H6/C2H4/C2H2/CO/CO2) | Selesai | Notebook `dga_composite_score.ipynb` (prototype), belum di database produksi | **Selesai (prototype)** — 69 aset, 161 baris. Evidence: file notebook + [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/) tabel data |
| Rule engine IEC 60599/Duval Triangle | Severity DGA otomatis | Implementasi metode yang benar-benar dipakai vendor: individual gas threshold (Tabel 1-4 IEEE C57.104-2019) + Delta Value + Gas Rate, per klasifikasi O2/N2 & usia trafo | Selesai | Notebook (Python) + port TypeScript di web app (`webapp/src/lib/rule-engine.ts`) | **Selesai (prototype)** — status_match 80% (129/161 baris) vs kesimpulan lab asli. Evidence: [/metodologi](https://pkm-inovasi.vercel.app/metodologi) |
| Trend Engine generik | Tren PD & DGA | Moving Average + Delta per gas (`n_gas_worsening`) digabung dengan tren PD (`pd_worsening`) jadi `n_parameters_worsening` | Selesai | Notebook + web app | **Selesai (prototype)**, dengan catatan `pd_worsening` masih dari data PD simulasi (lihat kolom Evidence Section 3.2). 24/161 baris terflag ≥2 parameter memburuk bersamaan |
| Mapping asset_id PD–DGA | Korelasi lintas modul | Ditemukan sample data PD riil (8 aset: CLR P1B-P4, Rumah Panggung, SG 4002, TR SB2, LBS 4001), dikonfirmasi tim listrik (17 Ags 2026): akar masalahnya **gap instrumentasi**, bukan cuma beda penamaan — DGA uji oil trafo, PD saat ini terpasang di panel/switchgear, bukan di titik yang sama | [isi] | Database Pemeliharaan + `data_pd_riil/` (dokumentasi temuan) | **Sebagian jalan (investigasi), belum selesai** — root cause sudah diketahui, solusinya (titik ukur PD tambahan di badan trafo) belum diputuskan/dilaksanakan. Evidence: `data_pd_riil/README.md` |
| Model Isolation Forest | Composite Risk Score | Dilatih di 161 baris (69 aset) dari fitur delta gas + status rule engine + parameter memburuk + severity ordinal; diekspor ke ONNX untuk jalan di browser | Selesai | Notebook (`scikit-learn`) + web app (`onnxruntime-web`) | **Selesai (prototype)**, tervalidasi kualitatif (lihat Section 4.5 & 6). Evidence: [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/) grafik anomaly_score per kategori |
| Endpoint & dashboard FE | Visibilitas skor komposit | Web app Next.js + shadcn/ui: Dashboard (ringkasan + tabel), Coba Sendiri (demo interaktif input manual), Metodologi (penjelasan lengkap) | Selesai | Prototype berdiri sendiri (Vercel), belum terintegrasi ke FE Asset Health Management produksi | **Selesai (prototype)**. Evidence: [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/), [/coba](https://pkm-inovasi.vercel.app/coba), repo GitHub `lenilestari/pkm-inovasi` |
| Review bersama tim Pemeliharaan | Validasi bobot & ambang skor komposit | — | [isi] | Internal meeting | **Belum dilaksanakan** — [belum ada evidence] |

## 6. CHECK — Pemeriksaan Hasil Perbaikan

> **Status: hasil teknis sudah bisa diperiksa** (Q, S, D di bawah sudah ada evidence konkret dari prototype). C (Cost) dan M (Morale) **belum bisa diisi** karena butuh data operasional riil dari tim Pemeliharaan yang belum tersedia untuk prototype berdiri sendiri ini.

### Alur Perbandingan Sebelum dan Sesudah Inovasi

- **Sebelum**: engineer buka modul PD dan modul DGA terpisah, bandingkan manual di kepala, DGA tanpa severity otomatis (cuma angka mentah).
- **Sesudah (prototype)**: satu dashboard web menampilkan status DGA otomatis (rule engine), tren gabungan PD+DGA, dan 1 skor risiko komposit per aset — bisa dicoba langsung di [/coba](https://pkm-inovasi.vercel.app/coba) dengan input manual, hasilnya (status, fault type, skor, dan narasi penjelasan) muncul seketika di browser.

### Pemeriksaan Hasil Perbaikan (QCDSME)

| Aspek | Kondisi Sebelum Perbaikan | Evidence | Kondisi Setelah Perbaikan | Evidence |
|---|---|---|---|---|
| Q | PD & DGA dinilai terpisah, DGA tanpa severity otomatis, snapshot saja | — | Rule engine otomatis (80% match ke lab), Composite Risk Score dengan urutan severity yang benar (Partial Discharge paling anomali, Normal paling tidak anomali) | [pkm-inovasi.vercel.app](https://pkm-inovasi.vercel.app/) — grafik & tabel 161 sampel |
| C | Biaya reaktif dari 2 jalur kegagalan independen | — | Belum bisa diukur — perlu data insiden riil & validasi tim Pemeliharaan | [isi setelah validasi Pemeliharaan] |
| S | Degradasi majemuk baru diketahui setelah salah satu parameter kritis | — | Sistem otomatis mendeteksi ≥2 parameter memburuk bersamaan (24/161 sampel di data historis) | Kolom `n_parameters_worsening` di [/metodologi](https://pkm-inovasi.vercel.app/metodologi) |
| D | Cek manual 2 modul terpisah | — | Satu dashboard web, hasil rule engine + risk score tampil otomatis dari input gas — bisa dites siapa saja | [/coba](https://pkm-inovasi.vercel.app/coba) |
| M | Beban analisis manual lintas modul | — | Belum diukur — prototype belum dipakai harian oleh tim Pemeliharaan | [isi setelah uji coba operasional] |
| E | — | — | — | — |

## 7. Standardisasi

> Status: draf standar tentatif — final setelah mapping asset_id PD-DGA riil, review SME Pemeliharaan, dan integrasi ke backend produksi selesai.

### Standar Masukan

Data historis PD (nilai + timestamp per parameter) dan data DGA terstruktur per jenis gas (H2, CH4, C2H2, C2H4, C2H6, CO, CO2), keduanya terhubung ke `asset_id` yang konsisten lintas modul.

### Standar Proses

| No | Proses | PIC |
|---|---|---|
| 1 | Input nilai gas DGA wajib terstruktur per jenis, tidak lagi string bebas | [PIC] |
| 2 | Setiap penambahan data PD/DGA otomatis memicu perhitungan ulang Trend Engine untuk aset terkait | [PIC] |
| 3 | Composite Risk Score dihitung ulang berkala (mis. harian/mingguan) untuk aset dengan data di kedua modul | [PIC] |
| 4 | Review bobot/ambang skor komposit dilakukan berkala bersama SME Pemeliharaan | [PIC] |

### Standar Keluaran

Satu skor risiko komposit per aset kritis (yang punya data PD & DGA), ditampilkan di dashboard FE, dengan early warning otomatis saat ≥2 parameter menunjukkan tren memburuk bersamaan.

## 8. Rencana Perbaikan Selanjutnya

Jadwal Rencana dan Realisasi Kegiatan Gugus Inovasi Lanjutan:

| Langkah | Kegiatan | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| P | 1. Menentukan Tema Dan Judul | | | | | | | | |
| | 2. Mencari Penyebab Masalah | | | | | | | | |
| | 3. Menentukan Solusi | | | | | | | | |
| | 4. Menetapkan Rencana Perbaikan | | | | | | | | |
| D | 5. Melaksanakan Perbaikan/Pengembangan | | | | | | | | |
| C | 6. Meneliti Hasil Perbaikan/Pengembangan | | | | | | | | |
| A | 7. Membuat Standar Baru | | | | | | | | |
| | 8. Menetapkan Rencana Berikut | | | | | | | | |

Kandidat rencana lanjutan (di luar scope prototype ini):

- **Mapping asset_id PD-DGA riil** — prasyarat nomor satu sebelum Composite Risk Score bisa pakai data PD sungguhan, bukan simulasi
- **Integrasi prototype ke backend produksi** (Go/Fiber be-plant-maintenance) — prototype saat ini berdiri sendiri (Next.js + Vercel)
- Lengkapi fault_type rule engine untuk `Operational Load` dan `Residual Gas` (Section 4.1) yang belum punya logika turunan
- Tambahkan aset TR-312 yang sempat di-skip karena tahun pembuatan "Unknown" di laporan asli (Section 4.2) — perlu konfirmasi manual tahun pembuatannya ke Pemeliharaan
- Integrasi Oil Analysis ke Unified Trend & Correlation Analytics (dikeluarkan dari scope saat ini karena karakteristik data berbeda; jadi kandidat gugus inovasi terpisah)
- Adaptive threshold berbasis baseline statistik per aset (menggantikan threshold statis yang tersisa)
- Auto-generate entry `follow_up_action` otomatis saat skor komposit melewati ambang tertentu

---

Bagian yang masih perlu dilengkapi manual: Departemen/Unit Kerja #3, keanggotaan gugus (Fasilitator, Ketua, Anggota, Usia Rata-rata), PIC & tanggal di tiap baris rencana perbaikan (Langkah 4 & 5), validasi angka Total Efisiensi dengan tim Pemeliharaan, serta jadwal mapping asset_id PD-DGA riil dan review SME Pemeliharaan sebelum submit final.
