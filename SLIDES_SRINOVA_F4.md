# Deck Presentasi — SRINOVA 2026 — Tim F4 (PKM)

**Judul Inovasi:** Unified Trend & Correlation Analytics Berbasis AI untuk Partial Discharge (PD)
dan Dissolve Gas Analysis (DGA) — Menghasilkan Composite Risk Score per Aset Transformator
Tegangan Tinggi

**Kategori:** PKM &middot; **Alokasi waktu:** 10 menit presentasi + 12 menit tanya jawab (total 25 menit, Kategori A)

**Audiens:** Tim manajemen Pemeliharaan & Operasional (non-teknis-AI, paham domain trafo/kelistrikan)

**Pemetaan ke 5 kriteria penilaian resmi SRINOVA:**

| Kriteria Juri | Ditangani di Slide |
|---|---|
| 1. Identifikasi Masalah/Peluang | Slide 2, 3 |
| 2. Metodologi | Slide 5, 6 |
| 3. Implementasi | Slide 7, 8 |
| 4. Dampak | Slide 3, 7 |
| 5. Replikasi & Sustainability | Slide 9 |

**Senjata utama pas tanya jawab:** prototype web app SUDAH live dan bisa dicoba siapa saja —
`https://pkm-inovasi.vercel.app/` (Dashboard), `/coba` (demo interaktif), `/metodologi`
(penjelasan metode). Buka langsung di depan juri kalau ada kesempatan, jauh lebih meyakinkan
daripada screenshot.

---

## Slide 1 — Cover

**Judul:** Unified Trend & Correlation Analytics Berbasis AI untuk PD & DGA

**Sub-judul:** Composite Risk Score per Aset Transformator Tegangan Tinggi

**Tagline:** Menyatukan dua sinyal yang selama ini terpisah, menangkap degradasi yang selama ini
terlewat.

**Footer:** Tim F4 &middot; Kategori PKM &middot; SRINOVA 2026

*Catatan penyampaian: buka dengan tenang, sebut nama tim & kategori, lalu langsung transisi ke
Hook Masalah tanpa basa-basi panjang — waktu presentasi cuma 10 menit.*

---

## Slide 2 — Hook Masalah: Dua Modul, Dua Dunia Terpisah

- **Partial Discharge (PD)**: sudah punya evaluasi status otomatis (Watch / Warning / Critical)
- **Dissolve Gas Analysis (DGA)**: nilai gas cuma **dicatat mentah**, tanpa interpretasi otomatis
  sama sekali — tidak ada severity, tidak ada status
- Keduanya dinilai **snapshot per titik waktu**, tanpa tren historis
- **Tidak ada korelasi** antara sinyal PD dan DGA, meski sering mengamati **aset fisik yang sama**
  (satu transformator yang sama punya data PD sekaligus DGA)
- Engineer harus buka & bandingkan 2 modul **manual** untuk menilai risiko 1 aset

**Kalimat penutup slide (headline):** *"Kalau tanda-tanda degradasi muncul bersamaan di PD dan
DGA — siapa yang menyadari?"*

*Catatan penyampaian: ini slide yang harus "kena" secara emosional ke audiens Pemeliharaan —
mereka yang paling paham rasanya cek 2 sistem terpisah. Jangan buru-buru, beri jeda setelah
kalimat penutup.*

---

## Slide 3 — Dampak & Urgensi

**Data riil dari 161 sampel DGA yang sudah kita transkrip** (bukan hipotetis):

| Kategori | Jumlah | % |
|---|---|---|
| Normal | 121 | 75.2% |
| Partial Discharge | 16 | 9.9% |
| Attention | 12 | 7.5% |
| Stray Gassing | 7 | 4.3% |
| Mild Overheating Paper | 3 | 1.9% |
| Thermal Cellulose | 2 | 1.2% |

- **~25% dari sampel yang kita punya menunjukkan kondisi TIDAK normal** — dan tanpa rule engine,
  sinyal ini tidak pernah terstruktur, cuma angka mentah di database
- **Partial Discharge** — kategori paling berbahaya, berpotensi merambat jadi kegagalan total —
  adalah kategori tidak-normal yang **paling sering muncul** (~40% dari semua kasus tidak normal)
- Risiko kalau dibiarkan: **unplanned shutdown**, risiko keselamatan K3LH, dan kegagalan yang
  baru diketahui setelah terlambat

**Estimasi Dampak Finansial — kerangka perhitungan (bukan angka final):**

```
Total Efisiensi/tahun  =  Jumlah kejadian berpotensi dicegah/tahun  ×  Rata-rata biaya per kejadian
                          (downtime tak terjadwal + perbaikan darurat + risiko K3)

Basis jumlah kejadian: dari 161 sampel historis, 16 kasus Partial Discharge (paling
kritis) dan 24 kasus early-warning (≥2 parameter memburuk bersamaan) terdeteksi —
ini basis realistis untuk memperkirakan berapa banyak kejadian per tahun yang bisa
tertangani lebih dini kalau sistem ini berjalan.

Estimasi awal: Rp 200 - 350 juta/tahun
Status: POTENSIAL, bukan riil — angka biaya per kejadian (downtime, perbaikan
darurat) masih perlu divalidasi bersama tim Pemeliharaan sebelum dipakai sebagai
klaim final.
```

*Catatan penyampaian: kalau juri tanya "dari mana angka Rp 200-350 juta", tunjukkan kerangka
perhitungan ini — jangan bertahan seolah angka itu final, justru posisikan sebagai "inilah
kenapa kami butuh tahap Do berikutnya: memvalidasi angka ini bersama Pemeliharaan".*

---

## Slide 4 — Ide Solusi: 3 Kapabilitas

**Unified Trend & Correlation Analytics** — 3 kapabilitas yang saling melengkapi:

1. **DGA Rule Engine** — fondasi evaluasi otomatis untuk DGA, setara yang sudah ada di PD
2. **Trend Engine generik** — reuse logika Moving Average + Compare Historis dari modul
   *Vibration Anomaly Detection* yang sudah ada, dipakai bareng untuk PD dan DGA
3. **Composite Risk Score** — model machine learning *unsupervised* (Isolation Forest) yang
   menggabungkan tren PD + DGA jadi **1 skor risiko per aset**

**Kenapa ini genuine AI, bukan cuma rule-based:** model belajar sendiri pola "normal" dari
riwayat multi-parameter tiap aset, lalu mendeteksi kombinasi kondisi yang menyimpang — **tanpa
label manual, tanpa ambang batas yang diset tangan**.

*Catatan penyampaian: tegaskan poin 3 — ini yang membedakan proposal ini dari sekadar "rule
engine doang". Reviewer sering skeptis inovasi digital cuma rebranding if-else; di sini ada
model ML sungguhan yang sudah dilatih dan tervalidasi (lihat Slide 7).*

---

## Slide 5 — Cara Kerja #1: DGA Rule Engine

Standar **IEEE C57.104-2019** — metode yang **benar-benar dipakai** vendor lab kita sendiri
(PT Petrolab Services), dikonfirmasi langsung dari laporan riil, bukan diasumsikan dari teori:

- **Threshold ganda per gas** (H2, CH4, C2H6, C2H4, C2H2, CO, CO2) — tergantung 2 faktor: rasio
  **O2/N2** (≤0.2 vs >0.2) dan **usia trafo** (Unknown / 1-9 / 10-30 / >30 tahun)
- Status ditentukan dari 3 sinyal: kadar gas individual (Tabel 1 & 2), **Delta Value** (Tabel 3),
  dan **Gas Rate**/laju kenaikan (Tabel 4)
- Output: **Status 1/2/3** + **Fault Type** (Normal, Stray Gassing, Thermal Fault, Thermal
  Cellulose, Partial Discharge)

**Kenapa ini penting:** DGA yang tadinya cuma "angka mentah" sekarang punya severity otomatis
**setara** dengan yang sudah ada di modul PD.

*Catatan penyampaian: kalau audiens tanya kenapa bukan Rogers Ratio/Duval Triangle (metode DGA
yang lebih terkenal) — jawab: sudah dicek langsung ke laporan lab riil, metode yang benar-benar
dipakai vendor kita adalah threshold+delta+rate ala IEEE, bukan Rogers/Duval. Kami ikuti metode
yang benar-benar relevan ke data kami, bukan yang paling terkenal.*

---

## Slide 6 — Cara Kerja #2: Trend Engine + Composite Risk Score

**Trend Engine (generik, reuse dari modul Vibration Anomaly Detection):**
- Moving Average per parameter (DGA per jenis gas, PD per reading)
- Compare Historis → hitung berapa parameter yang "memburuk" dibanding sampel sebelumnya
- Output kunci: **jumlah parameter PD+DGA yang memburuk bersamaan** per (aset, periode)

**Composite Risk Score (Isolation Forest, unsupervised ML):**
- Pendekatan cross-sectional: satu baris = satu (aset, periode sampling)
- Fitur input: delta tiap gas, status rule engine, jumlah parameter memburuk — bukan nilai
  mentah
- Model belajar pola mayoritas "normal", lalu beri skor anomali — **makin negatif, makin
  menyimpang**
- **Tidak butuh label manual, tidak butuh data insiden kegagalan historis untuk training**

*Catatan penyampaian: tekankan kata "reuse" di Trend Engine — ini bukan bikin dari nol, tapi
adaptasi dari modul yang SUDAH terbukti jalan di produksi (Vibration Anomaly Detection). Ini
juga bukti awal untuk argumen Replikasi di Slide 9.*

---

## Slide 7 — Bukti Validasi: Data Riil, Bukan Konsep Kosong

**Sumber data:** 3 laporan lab pihak ketiga **PT Petrolab Services** (Desember 2023, Maret 2024,
Juli 2024) — **69 aset transformator unik, 161 sampel**, ditranskrip verbatim (bukan direkayasa)

**Hasil validasi rule engine:** **80% match** (129/161 baris) terhadap kesimpulan resmi lab —
rule engine kita cocok dengan penilaian ahli lab sungguhan

**Hasil validasi Composite Risk Score:** urutan `anomaly_score` **persis sesuai keparahan** —
Partial Discharge paling anomali, lalu Stray Gassing, Thermal Cellulose, Attention, dan Normal
paling tidak anomali

**Kasus konkret (bukan hipotetis):**
- **TR-221**: H2 naik dari 47.966 → 50.438 ppm antar sampel — terkonfirmasi Partial Discharge,
  rule engine & model AI kompak menandainya sebagai kasus paling kritis
- **TR-45B**: Delta C2H4 melebihi ambang Tabel 3 — Thermal Fault
- **F5O-TR55, F5O-TR512A**: Stray Gassing berulang lintas 4 periode sampling (2016–2024) — model
  benar menempatkannya di skor menengah, bukan seburuk Partial Discharge

**Yang membedakan proposal ini:** sudah ada **prototype web app yang LIVE**, bisa dicoba
langsung, bukan cuma notebook riset atau mockup:

> `https://pkm-inovasi.vercel.app/` — Dashboard (ringkasan 69 aset) &middot; `/coba` (masukkan
> nilai gas sendiri, lihat hasil rule engine + AI seketika) &middot; `/metodologi` (penjelasan
> lengkap)

*Catatan penyampaian: ini slide paling kuat di deck — kalau waktu terbatas, ini yang paling
tidak boleh dipotong. Kalau bisa, buka `/coba` live di depan juri dan minta salah satu juri
sebut angka gas sembarang untuk dicoba.*

---

## Slide 8 — Kenapa Low-Risk / Mudah Diadopsi

- Pakai **stack backend existing** (Go/Fiber/GORM) — **tanpa lisensi atau komputasi tambahan**
- Model Isolation Forest ringan — prototype bahkan bisa jalan **langsung di browser** (client-side,
  sudah dibuktikan)
- Tampil sebagai **lapisan tambahan** di dashboard — **tidak mengganti** sistem PD/DGA yang
  sudah berjalan
- Divalidasi dulu lewat **shadow mode** terhadap kasus historis, sebelum dipercaya untuk
  keputusan operasional apa pun

**Kalimat kunci:** *"Kalau ternyata modelnya belum optimal, sistem PD dan DGA existing tetap
jalan seperti biasa — tidak ada yang rusak."*

*Catatan penyampaian: slide ini buat menjawab keraguan "nanti kalau AI-nya salah gimana" —
tekankan additive, bukan replacement.*

---

## Slide 9 — Replikasi & Sustainability

**Replikasi:**
- Pola "Trend Engine generik" ini **sudah terbukti reusable** — Trend Engine PD+DGA ini sendiri
  adalah hasil adaptasi dari modul *Vibration Anomaly Detection* yang sudah ada
- Potensi diperluas ke **aset kritis lain** yang punya 2+ parameter kondisi terpisah (bukan cuma
  trafo) — pola yang sama, domain berbeda

**Sustainability:**
- Retraining model berkala terjadwal, mengikuti data baru yang masuk
- Kepemilikan bersama: **TI PSP** (maintain sistem & model) + **Pemeliharaan** (validasi domain
  & SME review berkala)
- Standardisasi skema data (structured gas value per `asset_id`) jadi fondasi untuk ekspansi ke
  aset/modul berikutnya, tanpa bongkar ulang dari nol

*Catatan penyampaian: ini kriteria juri yang paling sering dilewatkan tim lain — pastikan
disebut eksplisit kata "replikasi" dan "sustainability" biar juri gampang mencocokkan ke rubrik
penilaian mereka.*

---

## Slide 10 — Roadmap Lanjutan (Jujur soal Status)

**Status saat ini:** masih tahap **Plan (P)** di siklus 8 Langkah PKM — **tapi prototype teknis
sudah dibangun, dites, dan divalidasi** terhadap data riil (bukan sekadar konsep di atas kertas).

**Langkah berikutnya (Do → Check → Act):**

1. **Mapping asset_id PD–DGA riil** — data PD produksi saat ini masih berisi asset_id yang tidak
   match ke aset DGA riil; ini prasyarat sebelum korelasi PD+DGA pakai data PD sungguhan
2. **Review bersama SME Pemeliharaan** — validasi bobot & ambang Composite Risk Score
3. **Integrasi ke backend produksi** (Go/Fiber, sistem Asset Health Management existing)
4. **Shadow mode validation** terhadap kasus historis sebelum go-live penuh

*Catatan penyampaian: JANGAN menyembunyikan bahwa ini belum production-ready. Sampaikan dengan
percaya diri sebagai "roadmap yang jelas dan sudah punya bukti teknis" — ini justru kekuatan,
bukan kelemahan, karena banyak proposal inovasi berhenti di ide tanpa bukti apa pun.*

---

## Slide 11 — Ask / Next Step

**Yang kami minta:**

1. **Kesempatan lanjut** ke tahap penilaian berikutnya SRINOVA 2026
2. **Dukungan akses data** dari tim Pemeliharaan untuk mapping asset_id PD–DGA riil
3. **Waktu & resource** untuk lanjut ke tahap Do — integrasi ke sistem produksi

**Kalimat penutup:** *"Fondasinya sudah kami bangun dan buktikan sendiri. Yang kami butuhkan
sekarang adalah dukungan untuk membawanya dari prototype ke produksi."*

*Catatan penyampaian: tutup dengan nada percaya diri, bukan memohon — kalian sudah punya bukti
kerja nyata, bukan cuma proposal kosong.*

---

## Slide 12 — Backup / Kontak (dibuka saat sesi tanya jawab)

- **Live demo:** `https://pkm-inovasi.vercel.app/`
  - `/` — Dashboard ringkasan 69 aset
  - `/coba` — input manual, hasil rule engine + AI seketika
  - `/metodologi` — penjelasan lengkap metode
- **Kontak Tim F4:** [isi nama & kontak PIC]
- QR code ke link demo (opsional, biar juri bisa buka dari HP masing-masing)

*Catatan penyampaian: slide ini standby, dibuka kalau juri minta lihat lebih detail pas sesi
tanya jawab (12 menit) — bukan dipresentasikan di alokasi 10 menit utama.*
