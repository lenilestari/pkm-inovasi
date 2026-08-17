# Deck Presentasi — SRINOVA 2026 — Tim F4 (PKM) — **v3**

**Judul Inovasi:** Unified Trend & Correlation Analytics Berbasis AI untuk Partial Discharge (PD)
dan Dissolve Gas Analysis (DGA) — Composite Risk Score per Aset Transformator Tegangan Tinggi

**Kategori:** PKM · **Alokasi waktu:** 10 menit presentasi + 12 menit tanya jawab (Kategori A)

**Audiens:** Tim manajemen Pemeliharaan & Operasional (paham domain trafo, bukan ahli AI)

**Struktur:** 10 slide inti (±1 menit/slide) + 2 slide backup untuk sesi tanya jawab

---

## Perubahan v2 → v3 — semua dicek langsung ke `dataset.json` dan kode `rule-engine.ts`, bukan diasumsikan

| # | Perubahan | Kenapa |
|---|---|---|
| 1 | **Baris "Thermal Fault (Oil)" dihapus dari tabel pareto (Slide 3)** | Dicek langsung: 0 dari 161 baris `lab_fault_type` berlabel ini — kategori ini cuma pernah muncul sebagai *output rule engine*, tidak pernah sebagai kesimpulan lab. Klaim v2 bahwa ini "dikutip di v1 lewat TR-45B" juga salah: `lab_fault_type` TR-45B di data kita adalah **Stray Gassing**, bukan Thermal Fault (Oil). |
| 2 | **"24 kasus early-warning" diperbaiki jadi 23** (Slide B1) | Dicek ulang langsung ke notebook & dataset: `n_parameters_worsening >= 2` = **23 baris**, bukan 24. |
| 3 | **"Mild Overheating Paper" dihapus dari daftar output Rule Engine (Slide 5)** | Dicek langsung ke `rule-engine.ts`: fungsi `inferFaultType` cuma bisa mengembalikan 5 nilai — Normal, Stray Gassing, Thermal Fault (Oil), Thermal Cellulose, Partial Discharge. "Mild Overheating Paper" cuma pernah ada sebagai label kesimpulan lab, rule engine kita tidak pernah menghasilkannya. |
| 4 | **Klaim "4 periode sampling F5O-TR55/TR512A, 2016–2024" DIKEMBALIKAN** | v2 menghapus ini dengan alasan "bertentangan dengan 3 laporan lab" — alasan itu salah. Dicek ulang: kedua aset ini memang punya 4 titik sampling nyata (2016-11-18, 2020-09-17, 2023-05-23, 2024-06-05) karena laporan Petrolab mencantumkan histori sampling lama per trafo, bukan cuma tanggal terbit laporan. Ditambahkan kembali sebagai poin sekunder di Slide 7. |
| 5 | **Klaim "Duval dipakai untuk urutan keparahan" dilunakkan** (catatan penyampaian Slide 5) | Yang benar: urutan ordinal kami (`rule_fault_severity`) **terinspirasi** dari severity ordering Duval/IEEE, BUKAN implementasi Duval Triangle/Pentagon penuh (tidak ada plot segitiga/pentagon di kode kami). Kalimat lama berisiko diinterpretasikan berlebihan kalau juri minta lihat perhitungan Duval-nya. |
| 6 | Skor anomali TR-44/TR-34/TR-221/TR-1-HV-1 di Slide 7 | **Diverifikasi ulang, semua sudah tepat** — tidak diubah. |

**Semua item "perlu verifikasi" di checklist v2 sudah selesai dicek** — tidak ada lagi yang menggantung.

---

## Pemetaan ke 5 kriteria penilaian SRINOVA

| Kriteria Juri | Slide |
|---|---|
| 1. Identifikasi Masalah/Peluang | 2, 3 |
| 2. Metodologi | 4, 5, 6 |
| 3. Implementasi | 7, 8, 9 |
| 4. Dampak | 3, 7 |
| 5. Replikasi & Sustainability | 9, 10 |

---

# SLIDE 1 — Cover

**Eyebrow:** TIM F4 · KATEGORI PKM · SRINOVA 2026

**Judul:** Unified Trend & Correlation Analytics untuk PD & DGA

**Sub-judul:** Composite Risk Score per Aset Transformator Tegangan Tinggi

**Tagline:** Menyatukan dua sinyal yang selama ini terpisah — menangkap degradasi yang selama ini terlewat.

> *Penyampaian: tenang, sebut nama tim & kategori, langsung ke Slide 2. Jangan basa-basi — waktu 10 menit.*

---

# SLIDE 2 — Masalah

**Eyebrow:** MASALAH · KRITERIA 1

**Judul:** Dua Modul, Dua Dunia Terpisah

**Kartu kiri — Partial Discharge (PD)**
Sudah punya evaluasi status otomatis: Watch / Warning / Critical.

**Kartu kanan — Dissolve Gas Analysis (DGA)**
Nilai gas hanya dicatat mentah. Tanpa severity, tanpa status, tanpa interpretasi otomatis.

**Jembatan putus di antara keduanya (visual: garis putus-putus)**
Aset fisik yang sama. Dinilai snapshot per titik waktu. Tidak ada tren, tidak ada korelasi.
Engineer harus buka dan bandingkan 2 modul secara manual untuk menilai risiko 1 aset.

**Headline penutup:**
> *"Kalau tanda degradasi muncul bersamaan di PD dan DGA — siapa yang menyadari?"*

> *Penyampaian: slide ini harus "kena" ke audiens Pemeliharaan — merekalah yang paling paham rasanya cek 2 sistem terpisah. Beri jeda setelah kalimat penutup.*

---

# SLIDE 3 — Urgensi

**Eyebrow:** URGENSI · KRITERIA 1 & 4

**Judul:** 28 dari 161 Sampel Menunjukkan Fault Terkonfirmasi

**Tiga stat tile besar:**

| 69 | 161 | 17,4% |
|---|---|---|
| aset trafo unik | sampel DGA riil | fault terkonfirmasi |

**Distribusi kategori (bar horizontal, data riil hasil transkrip — 6 kategori, total 161 sampel):**

| Kategori | Jumlah | % |
|---|---|---|
| Normal | 121 | 75,2% |
| Partial Discharge | 16 | 9,9% |
| Attention *(flag ketidakpastian lab)* | 12 | 7,5% |
| Stray Gassing | 7 | 4,3% |
| Mild Overheating Paper | 3 | 1,9% |
| Thermal Cellulose | 2 | 1,2% |

**Tiga poin pendek di bawah:**

- **40 sampel (25%) non-Normal**; dikurangi 12 *Attention*, tersisa **28 fault terkonfirmasi (17,4%)**
- **Partial Discharge = kategori paling berbahaya sekaligus paling sering** — 16 kasus, **57% dari seluruh fault terkonfirmasi**
- Tanpa rule engine, semua sinyal ini hanya **angka mentah di database** — tidak pernah terstruktur

**Risiko bila dibiarkan:** unplanned shutdown · perbaikan darurat · risiko K3LH · kegagalan yang baru diketahui setelah terlambat

> *Penyampaian: pakai 17,4% sebagai angka utama — lebih konservatif dan tidak bisa diserang. Kalau juri tanya "kok tadi 25%", jelaskan Attention adalah flag ketidakpastian lab, dan kita sengaja tidak menghitungnya sebagai fault. Kejujuran ini justru menaikkan kredibilitas.*

---

# SLIDE 4 — Solusi

**Eyebrow:** SOLUSI · KRITERIA 2

**Judul:** Tiga Kapabilitas yang Saling Melengkapi

**Kartu 01 — DGA Rule Engine**
Evaluasi otomatis untuk DGA, setara yang sudah ada di PD. Berbasis IEEE C57.104-2019.

**Kartu 02 — Trend Engine Generik**
Moving Average + Compare Historis, **hasil reuse** dari modul *Vibration Anomaly Detection* yang sudah jalan di produksi. Dipakai bersama untuk PD dan DGA.

**Kartu 03 — Composite Risk Score**
Model machine learning *unsupervised* (Isolation Forest) yang menggabungkan tren PD + DGA jadi **satu skor risiko per aset**.

**Panel penegas di bawah:**
> **Kenapa ini AI sungguhan, bukan if-else berbaju baru:** model belajar sendiri pola "normal" dari riwayat multi-parameter tiap aset, lalu mendeteksi kombinasi kondisi yang menyimpang — **tanpa label manual, tanpa ambang batas yang diset tangan**.

> *Penyampaian: tegaskan panel bawah. Reviewer sering skeptis inovasi digital cuma rebranding rule-based. Di sini ada model ML sungguhan yang sudah dilatih, diekspor ke ONNX, dan tervalidasi (Slide 7).*

---

# SLIDE 5 — Cara Kerja #1

**Eyebrow:** CARA KERJA 1 · KRITERIA 2

**Judul:** DGA Rule Engine — Standar IEEE C57.104-2019

**Sub-judul:** Metode yang **benar-benar dipakai vendor lab kita** (PT Petrolab Services) — dikonfirmasi dari laporan riil, bukan diasumsikan dari teori.

**Alur 3 langkah (visual: 3 kotak → panah → output):**

**1 · Threshold ganda per gas**
7 gas (H2, CH4, C2H6, C2H4, C2H2, CO, CO2). Ambang bergantung 2 faktor: rasio **O2/N2** (≤0,2 vs >0,2) dan **usia trafo** (<1 / 1–9 / 10–30 / >30 tahun).

**2 · Delta Value**
Selisih terhadap sampel sebelumnya (Tabel 3). Flag bila delta melampaui 30% batas tabel.

**3 · Gas Rate**
Laju kenaikan per satuan waktu (Tabel 4).

**→ Output:** Status **Normal / Warning / Critical** + **Fault Type** — 5 kategori yang benar-benar bisa dihasilkan rule engine kami: **Normal, Stray Gassing, Thermal Fault (Oil), Thermal Cellulose, Partial Discharge**.

**Kalimat kunci:**
> DGA yang tadinya cuma "angka mentah" sekarang punya severity otomatis **setara** dengan modul PD.

> *Penyampaian bila ditanya "kenapa tidak Rogers Ratio / Duval Triangle": jawab — basis threshold kami IEEE C57.104-2019 karena itulah metode yang dipakai laporan lab kami sendiri. Urutan keparahan fault type kami (Normal < Stray Gassing/Thermal < Thermal Cellulose < Partial Discharge) TERINSPIRASI dari severity ordering Duval/IEEE — tapi kami tidak mengimplementasikan Duval Triangle/Pentagon secara penuh (tidak ada plot segitiga). Kalau juri minta lihat perhitungan Duval, jawab jujur: itu belum ada, yang ada adalah urutan ordinal yang konsisten dengan konsepnya.*

---

# SLIDE 6 — Cara Kerja #2

**Eyebrow:** CARA KERJA 2 · KRITERIA 2

**Judul:** Composite Risk Score — Isolation Forest

**Kartu kiri — Apa yang masuk ke model**
Bukan nilai gas mentah, melainkan **sinyal yang sudah diolah** (11 fitur total):
- Delta tiap gas (7 fitur)
- Status hasil rule engine
- Jumlah gas yang memburuk
- Jumlah parameter PD+DGA memburuk bersamaan
- Peringkat keparahan fault *(ordinal, bukan one-hot)*

**Kartu kanan — Kenapa unsupervised**
- Model belajar pola mayoritas "normal", lalu memberi skor anomali — **makin negatif, makin menyimpang**
- **Tidak butuh label manual**
- **Tidak butuh riwayat insiden kegagalan** untuk training
- Pendekatan *cross-sectional*: satu baris = satu (aset, periode sampling), 161 baris

**Catatan teknis kecil (kredibilitas):**
Encoding ordinal dipilih karena one-hot menimbulkan *rareness bias* — fault yang jarang muncul otomatis dianggap anomali hanya karena jarang.

> *Penyampaian: tekankan kata "reuse" pada Trend Engine — ini bukan bikin dari nol, tapi adaptasi modul yang SUDAH terbukti jalan di produksi. Ini sekaligus bukti awal untuk argumen Replikasi di Slide 10.*

---

# SLIDE 7 — Bukti Validasi ⭐

**Eyebrow:** BUKTI VALIDASI · KRITERIA 3 & 4

**Judul:** 80% Cocok dengan Kesimpulan Ahli Lab

**Stat tile utama:**

| 129/161 | 3 laporan | 69 aset |
|---|---|---|
| **80% match** rule engine vs kesimpulan lab | PT Petrolab Services (Des 2023 · Mar 2024 · Jul 2024) | ditranskrip verbatim, tanpa rekayasa |

**Validasi model AI:** urutan `anomaly_score` **persis sesuai keparahan** — Partial Discharge paling anomali, lalu Stray Gassing, Thermal Cellulose, Attention, dan Normal paling tidak anomali. Model ONNX terverifikasi identik dengan output scikit-learn (selisih 0,000000).

**Kasus konkret dari dashboard live:**

| Aset | Skor Anomali | Kesimpulan |
|---|---|---|
| **TR-44** | **−0,3328** | Partial Discharge — paling anomali |
| **TR-34** | −0,2416 | Partial Discharge |
| TR-221 | −0,1687 | Partial Discharge |
| TR-1-HV-1 | +0,1970 | Normal |

**Bonus — bukti histori jangka panjang:** F5O-TR55 dan F5O-TR512A punya **4 titik sampling nyata membentang 2016 → 2020 → 2023 → 2024** (bukan cuma dari 3 laporan terakhir — laporan Petrolab mencantumkan histori sampling lama per trafo). Keduanya konsisten berlabel **Stray Gassing** sejak 2023, dan model kami menempatkannya di skor menengah — bukan seburuk Partial Discharge, tapi juga bukan Normal. Ini bukti model bisa membedakan "anomali ringan yang stabil" dari "anomali yang memburuk aktif".

**⚠ Panel transparansi (warna berbeda, tidak disembunyikan):**

> **Apa yang riil, apa yang belum:**
> **RIIL** — seluruh nilai gas DGA berasal dari 3 laporan lab pihak ketiga. Tidak ada angka fabrikasi.
> **BELUM RIIL** — nilai Partial Discharge masih **simulasi**; sensor PD produksi belum ter-mapping ke asset_id DGA.
> **Konsekuensinya** — validasi 80% dan urutan skor **sepenuhnya berbasis data DGA riil**. Kontribusi PD ke skor gabungan baru bisa diklaim setelah mapping asset_id selesai — dan itulah **langkah Do #1** kami.
> **Sudah dicek ke lapangan** — bukan cuma dugaan: dikonfirmasi tim listrik, akar masalahnya bukan sekadar beda format penamaan, tapi **gap instrumentasi** — DGA menguji minyak trafo langsung, sementara sensor PD saat ini terpasang di panel/switchgear, bukan di titik yang sama. Cakupan pengukuran keduanya juga masih reaktif (baru diukur kalau ada tanda-tanda masalah), belum menyeluruh ke semua aset — tapi ada rencana diperluas ke depan.

> *Penyampaian: ini slide paling penting di deck. SEBUTKAN panel transparansi dengan suara jelas, jangan dilewat — website kami mengakuinya terbuka di halaman /metodologi, jadi juri bisa menemukannya sendiri. Mendahului = kredibilitas; didahului = kehilangan kepercayaan. Frasa yang dipakai: "Kami sengaja tidak mengklaim lebih dari yang bisa kami buktikan."*

---

# SLIDE 8 — Prototype Live

**Eyebrow:** BUKTI IMPLEMENTASI · KRITERIA 3

**Judul:** Bukan Konsep — Prototype Sudah Live dan Bisa Dicoba Sekarang

**Visual utama:** screenshot dashboard + QR code besar

**Tiga kartu rute:**

**`/` — Dashboard**
Ringkasan 69 aset, distribusi kategori, tabel skor risiko terurut.

**`/coba` — Demo Interaktif**
Masukkan nilai gas sendiri — hasil rule engine + skor AI **seketika**. Dihitung **di browser**, tidak dikirim ke server mana pun.

**`/metodologi` — Metode Lengkap**
Tabel ambang, fitur model, hasil validasi, dan batasan yang diakui terbuka.

**URL:** `https://pkm-inovasi.vercel.app/`

> *Penyampaian: KALAU ADA KESEMPATAN, buka `/coba` live di depan juri dan minta salah satu juri menyebut angka gas sembarang. Jauh lebih meyakinkan daripada screenshot. Siapkan laptop dengan halaman sudah terbuka + hotspot cadangan.*

---

# SLIDE 9 — Adopsi & Risiko

**Eyebrow:** KEMUDAHAN ADOPSI · KRITERIA 3 & 5

**Judul:** Additive, Bukan Replacement

**Empat kartu ringkas:**

**Tanpa biaya baru**
Pakai stack backend existing (Go / Fiber / GORM). Tanpa lisensi, tanpa komputasi tambahan.

**Model sangat ringan**
Isolation Forest via ONNX — terbukti jalan **client-side di browser**.

**Lapisan tambahan**
Tampil sebagai layer baru di dashboard. **Tidak mengganti** sistem PD/DGA yang sudah berjalan.

**Divalidasi dulu**
Shadow mode terhadap kasus historis sebelum dipercaya untuk keputusan operasional apa pun.

**Kalimat kunci:**
> *"Kalau ternyata modelnya belum optimal, sistem PD dan DGA existing tetap jalan seperti biasa — tidak ada yang rusak."*

> *Penyampaian: slide ini menjawab keraguan "nanti kalau AI-nya salah gimana". Tekankan additive, bukan replacement.*

---

# SLIDE 10 — Replikasi, Sustainability & Ask

**Eyebrow:** KEBERLANJUTAN · KRITERIA 5

**Judul:** Fondasinya Sudah Ada — Yang Kami Butuhkan Berikutnya

**Kolom kiri — Replikasi & Sustainability**

**Replikasi**
Pola "Trend Engine generik" **sudah terbukti reusable** — engine PD+DGA ini sendiri hasil adaptasi modul *Vibration Anomaly Detection*. Bisa diperluas ke aset kritis lain yang punya 2+ parameter kondisi terpisah.

**Sustainability**
Retraining berkala terjadwal · Kepemilikan bersama **TI PSP** (sistem & model) + **Pemeliharaan** (validasi domain, SME review) · Standardisasi skema data per `asset_id` sebagai fondasi ekspansi.

**Kolom kanan — Status & Permintaan**

**Status jujur:** tahap **Plan (P)** di siklus 8 Langkah PKM — **tapi prototype teknis sudah dibangun, dites, dan divalidasi** terhadap data riil.

**Yang kami minta:**
1. **Kesempatan lanjut** ke tahap penilaian berikutnya SRINOVA 2026
2. **Dukungan akses data** Pemeliharaan untuk mapping asset_id PD–DGA riil
3. **Waktu & resource** untuk masuk tahap Do — integrasi ke sistem produksi

**Kalimat penutup:**
> *"Fondasinya sudah kami bangun dan buktikan sendiri. Yang kami butuhkan sekarang adalah dukungan membawanya dari prototype ke produksi."*

> *Penyampaian: tutup dengan nada percaya diri, bukan memohon. Sebut eksplisit kata "replikasi" dan "sustainability" agar juri mudah mencocokkan ke rubrik. Banyak tim melewatkan kriteria ini.*

---

# SLIDE B1 — BACKUP: Kerangka Dampak Finansial

**Eyebrow:** BACKUP · DIBUKA SAAT TANYA JAWAB

**Judul:** Kerangka Perhitungan Dampak

```
Total Efisiensi / tahun
  =  Jumlah kejadian berpotensi dicegah / tahun
  ×  Rata-rata biaya per kejadian
     (downtime tak terjadwal + perbaikan darurat + risiko K3)
```

**Basis jumlah kejadian — dari data kami sendiri:**
- **16 kasus Partial Discharge** (kategori paling kritis) dari 161 sampel
- **23 kasus early-warning** (≥2 parameter memburuk bersamaan)

**Yang belum kami punya — dan kami sebutkan terbuka:**
Angka **biaya rata-rata per kejadian** (downtime, perbaikan darurat, dampak K3) belum divalidasi bersama tim Pemeliharaan. Kami sengaja **tidak menampilkan angka rupiah** sebelum divalidasi.

**Inilah salah satu alasan kami butuh tahap Do:** memvalidasi angka ini bersama pemilik proses, bukan mengarangnya sendiri.

> *Penyampaian: kalau juri mendesak angka, jawab — "kami bisa hitung begitu tim Pemeliharaan memberikan biaya rata-rata per kejadian; strukturnya sudah siap, tinggal satu variabel." JANGAN karang angka di tempat.*

---

# SLIDE B2 — BACKUP: Antisipasi Pertanyaan Juri

**Eyebrow:** BACKUP · DIBUKA SAAT TANYA JAWAB

**Judul:** Pertanyaan yang Kami Antisipasi

**Q: Dampak DGA-PD Risk Monitor bagi Pusri — misalnya efisiensi anggaran maintenance, seberapa besar?**
Kami sengaja **tidak menyebut angka rupiah pasti** di slide utama, karena biaya rata-rata per kejadian (downtime, perbaikan darurat, K3) belum divalidasi bersama tim Pemeliharaan — itu langkah Do berikutnya. Yang sudah kami punya: **basis kuantitatif nyata** dari data historis kami sendiri — 16 dari 161 sampel adalah Partial Discharge (fault paling kritis, berpotensi jadi kegagalan total), dan 23 sampel terflag early-warning (≥2 parameter memburuk bersamaan) yang selama ini tidak tertangkap sinyal terstrukturnya sama sekali. Begitu Pemeliharaan memberi angka biaya rata-rata per kejadian unplanned shutdown, kerangka perhitungan kami (Slide B1) tinggal diisi satu variabel itu untuk dapat angka pasti. Estimasi awal makalah kami Rp 200–350 juta/tahun tetap **potensial, bukan riil**, dan kami tidak akan mengklaimnya sebagai final sebelum divalidasi.

**Q: Apakah monitor-nya sudah berjalan?**
**Prototype-nya sudah jalan dan bisa dicoba sekarang juga** — bukan konsep di atas kertas. Web app-nya live di `pkm-inovasi.vercel.app`, sudah divalidasi terhadap 69 aset/161 sampel data DGA riil (80% match ke kesimpulan lab), dan model AI-nya sudah tervalidasi urutan severity-nya benar. **Yang belum**: integrasi ke sistem monitoring produksi harian (dashboard Asset Health Management existing, backend Go/Fiber) dan mapping data PD riil — itu dua hal yang jadi fokus tahap Do berikutnya, bukan karena teknologinya belum siap, tapi karena butuh dukungan akses data & waktu integrasi dari tim terkait.

**Q: Metode apa yang dipakai untuk monitoring?**
Tiga metode digabung jadi satu alur: **(1) DGA Rule Engine** — threshold individual per gas (H2, CH4, C2H6, C2H4, C2H2, CO, CO2) ditambah Delta Value dan Gas Rate, mengikuti standar IEEE C57.104-2019, disesuaikan usia trafo & rasio O2/N2 — ini metode yang sama persis dipakai vendor lab kami sendiri. **(2) Trend Engine** — Moving Average + Compare Historis, mendeteksi parameter PD dan DGA yang memburuk bersamaan dari waktu ke waktu (reuse dari modul Vibration Anomaly Detection yang sudah ada). **(3) Composite Risk Score** — model machine learning unsupervised (Isolation Forest) yang menggabungkan semua sinyal tren tadi jadi satu skor risiko per aset, belajar sendiri pola normalnya tanpa perlu label manual.

**Q: 80% match berarti 20% meleset. Apa yang terjadi di 32 baris sisanya?**
Mayoritas ketidakcocokan ada di kasus *borderline* dan baris berlabel *Attention* — di mana lab sendiri menyatakan ketidakpastian. Rule engine kami cenderung lebih konservatif (menaikkan status) daripada melewatkan. Untuk deteksi dini, *false positive* jauh lebih murah daripada *false negative*.

**Q: "Attention" itu apa? Kenapa tidak dihitung fault?**
Attention adalah flag ketidakpastian dari lab, bukan jenis kerusakan. Kami sengaja mengeluarkannya dari hitungan fault agar klaim kami konservatif — karena itu angka utama kami 17,4%, bukan 25%.

**Q: Tiap aset cuma punya 2–4 titik data. Cukup untuk analisis tren?**
Untuk *time-series forecasting*, tidak cukup — dan kami tidak mengklaimnya. Pendekatan kami **cross-sectional**: satu baris = satu (aset, periode), 161 baris dengan 11 fitur. Ini rasio yang wajar untuk *unsupervised anomaly detection*. Nilai tren dipakai sebagai **fitur** (delta, jumlah parameter memburuk), bukan sebagai basis peramalan. Beberapa aset (mis. F5O-TR55) malah punya histori sampai 4 titik membentang 8 tahun.

**Q: Kenapa Isolation Forest, bukan model yang lebih canggih?**
Karena kami tidak punya label kegagalan historis — jadi supervised learning tidak mungkin. Isolation Forest ringan, dapat dijelaskan, tidak butuh label, dan cukup kecil untuk jalan di browser. Kesederhanaan itu fitur, bukan keterbatasan.

**Q: Kenapa PD masih simulasi?**
Sudah kami telusuri langsung ke tim listrik — akar masalahnya bukan cuma beda format `asset_id`, tapi **gap instrumentasi**: DGA menguji minyak trafo langsung, sementara sensor PD saat ini terpasang di panel/switchgear, bukan di titik yang sama dengan trafo yang rutin diuji DGA. Pengukuran keduanya juga masih reaktif (baru dilakukan kalau ada tanda-tanda masalah), bukan menyeluruh ke semua aset — meski ada rencana diperluas. Kami memilih menampilkan hasil dengan PD simulasi **sambil menyatakannya terbuka**, daripada menunda seluruh prototype. Begitu cakupan pengukuran meluas dan ada aset yang "berpotongan" (diukur PD dan DGA sekaligus), itu langsung jadi titik awal validasi PD riil — bukan cuma menunggu tanpa arah.

**Q: Apakah rule engine kalian pakai Duval Triangle/Rogers Ratio?**
Tidak — basis kami individual gas threshold + Delta Value + Gas Rate ala IEEE C57.104-2019, karena itu metode yang benar-benar dipakai laporan lab kami sendiri. Urutan keparahan fault type kami terinspirasi dari severity ordering Duval/IEEE, tapi kami tidak mengimplementasikan plot segitiga/pentagon Duval secara penuh.

**Kontak Tim F4:** *[isi nama & kontak PIC]*

> *Penyampaian: slide standby, jangan dipresentasikan di alokasi 10 menit utama.*

---

## Checklist sebelum PPT dibangun

- [x] Verifikasi jumlah **Thermal Fault (Oil)** — hasilnya 0 di lab_fault_type, dihapus dari pareto
- [x] Verifikasi rentang periode sampling F5O-TR55/TR512A — benar 2016–2024, dikembalikan ke Slide 7
- [x] Verifikasi output rule engine — 5 kategori (bukan 6), "Mild Overheating Paper" dihapus dari Slide 5
- [x] Verifikasi angka early-warning — 23 (bukan 24), diperbaiki di Slide B1
- [x] Verifikasi skor anomali TR-44/TR-34/TR-221/TR-1-HV-1 — semua tepat
- [ ] Isi **nama & kontak PIC Tim F4** (Slide B2)
- [ ] Screenshot dashboard resolusi tinggi untuk Slide 8
- [ ] Generate QR code ke `https://pkm-inovasi.vercel.app/`
- [ ] Latihan timing: 10 slide × ±1 menit, Slide 7 boleh 1,5 menit
