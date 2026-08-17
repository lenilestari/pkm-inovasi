# Antisipasi Pertanyaan Juri & Titik Rawan Blunder — SRINOVA 2026 Tim F4

Dokumen ini **untuk dibaca tim sebelum presentasi**, bukan untuk ditampilkan di PPT. Isinya: semua
pertanyaan yang mungkin muncul + jawaban siap pakai, dan titik-titik paling rawan bikin blunder
kalau tidak diantisipasi.

---

## 🔴 TITIK PALING RAWAN BLUNDER (baca ini dulu)

### 1. Kontradiksi "PD masih simulasi" vs "sudah menyatukan/membaca data riil"

Kalau di PPT ada kalimat seperti *"kami telah menyatukan sistem monitoring..."* atau *"membaca
data riil monitoring PD"* — **itu HARUS dihapus/diperbaiki sebelum tampil**. Itu bertentangan
langsung dengan panel transparansi yang bilang PD masih simulasi. Kalau juri sempat baca PPT
sebelum sesi, atau mendengarkan dengan teliti, kontradiksi 2 kalimat yang saling melawan dalam
1 dek yang sama akan terlihat SANGAT jelas dan merusak kredibilitas jauh lebih parah daripada
kalau dari awal kita tidak menyebut transparansi sama sekali.

**Kalimat aman untuk dipakai:** *"Kami sudah membangun dan membuktikan arsitektur lengkapnya —
sisi DGA sudah 100% riil dan tervalidasi, sisi PD masih simulasi menunggu mapping data. Begitu
mapping selesai, tinggal pasang, bukan bangun ulang."*

### 2. "Tahap Plan (P) di siklus 8 Langkah PKM" — istilah yang tidak konsisten

Kategori **PKM = 7 Langkah**, **GKM = 8 Langkah** (beda framework, sesuai Technical Guidelines
SRINOVA 2026 sendiri). Kalau slide bilang "8 Langkah PKM" dalam satu napas, ini kelihatan tidak
paham framework sendiri — bisa jadi bahan pertanyaan menjatuhkan dari juri yang teliti.

**Kalau ditanya "kalian PKM atau GKM, kok pakai 8 langkah?"**
Jawaban jujur: *"Dokumen kami mengikuti struktur 8 langkah (Delta/PDCA) yang sudah berjalan di
tim kami sejak awal proyek ini dimulai — secara substansi metodologinya identik dengan siklus
GKM. Kami akan selaraskan penamaan administratif sesuai kategori resmi pendaftaran."* — jangan
bertele-tele membela diri, akui langsung dan pindah topik ke substansi (hasil validasi).

### 3. Angka F5O-TR55 yang salah (kalau masih ada di versi final)

Kalau ada slide yang menyebut skor F5O-TR55 = **−0,0412**, itu **salah**, tidak ada di data asli.
Angka benarnya **−0,0647** (sampel 2023-05-23, Stray Gassing). Cek ulang PPT final sebelum cetak/tampil.

### 4. Live demo gagal karena internet/wifi venue bermasalah

`pkm-inovasi.vercel.app` butuh internet buat load halaman pertama kali (setelah itu `/coba`
jalan offline di browser). Kalau wifi venue lambat/mati:
- **Siapkan screen-recording video pendek** (30-60 detik) yang menunjukkan `/coba` diisi dan
  hasil keluar — sebagai cadangan kalau live demo gagal.
- Buka halaman `/coba` **sebelum** presentasi dimulai (pre-load), bukan pas giliran bicara.
- Siapkan hotspot HP sebagai cadangan kedua.

### 5. Juri mendesak angka rupiah pasti

Sudah dilatih di jawaban Slide 11, tapi risikonya: di bawah tekanan waktu (12 menit tanya jawab,
mungkin juri agresif), presenter tergoda "ngasih angka aja biar cepat". **Jangan.** Satu orang di
tim harus jadi "penjaga" komitmen ini — kalau ada yang mulai menyebut angka rupiah spekulatif,
selingi dengan kalimat siap pakai: *"Strukturnya sudah siap, tinggal satu variabel dari
Pemeliharaan."* Konsistensi ini justru poin kredibilitas, jangan dikorbankan demi kelihatan "sat-set".

### 6. Bingung membedakan kategori Rule Engine vs kategori Lab

Rule engine kita **cuma bisa hasilkan 5 kategori**: Normal, Stray Gassing, Thermal Fault (Oil),
Thermal Cellulose, Partial Discharge. Data lab (ground truth) punya **6 kategori**: 5 di atas
minus Thermal Fault (Oil), plus Attention dan Mild Overheating Paper. Kalau presenter ketuker
nyebut "rule engine kami bisa deteksi Attention" — itu salah, rule engine tidak pernah
menghasilkan itu. Attention CUMA ada sebagai label kesimpulan lab.

### 7. Waktu presentasi terlalu ketat

11 slide dalam 10 menit ≈ 55 detik/slide. Slide 5, 6, 7 (metodologi + bukti) butuh lebih lama
dari itu. **Latihan timing wajib** — kalau lewat, potong dari Slide 4 (solusi overview, bisa
dipercepat) bukan dari Slide 7 (bukti validasi, paling penting).

---

## Pertanyaan yang diantisipasi (lengkap)

**Q: Dampak DGA-PD Risk Monitor bagi Pusri — misalnya efisiensi anggaran maintenance, seberapa besar?**
Kami sengaja tidak menyebut angka rupiah pasti di slide utama — biaya rata-rata per kejadian
belum divalidasi Pemeliharaan. Yang sudah pasti: 16 dari 161 sampel adalah Partial Discharge
(fault paling kritis), dan 23 sampel terflag early-warning yang selama ini tidak tertangkap
sinyal terstrukturnya. Begitu Pemeliharaan memberi biaya rata-rata per kejadian, kerangka
perhitungan kami tinggal diisi satu variabel itu.

**Q: Apakah monitor-nya sudah berjalan?**
Prototype-nya sudah jalan dan bisa dicoba sekarang — live di pkm-inovasi.vercel.app, divalidasi
terhadap 69 aset/161 sampel data DGA riil (80% match). Yang belum: integrasi ke sistem monitoring
produksi harian dan mapping data PD riil — fokus tahap Do berikutnya.

**Q: Metode apa yang dipakai untuk monitoring?**
Tiga metode digabung: (1) DGA Rule Engine — threshold per gas + Delta Value + Gas Rate ala IEEE
C57.104-2019. (2) Trend Engine — Moving Average + Compare Historis, reuse dari Vibration Anomaly
Detection. (3) Composite Risk Score — Isolation Forest unsupervised.

**Q: 80% match berarti 20% meleset. Apa yang terjadi di 32 baris sisanya?**
Mayoritas ada di kasus borderline dan baris berlabel Attention, di mana lab sendiri menyatakan
ketidakpastian. Rule engine kami cenderung konservatif (menaikkan status) daripada melewatkan.
Untuk deteksi dini, false positive jauh lebih murah daripada false negative.

**Q: "Attention" itu apa? Kenapa tidak dihitung fault?**
Flag ketidakpastian dari lab, bukan jenis kerusakan. Kami keluarkan dari hitungan fault agar
klaim kami konservatif — karena itu angka utama kami 17,4%, bukan 25%.

**Q: Tiap aset cuma 2-4 titik data. Cukup untuk analisis tren?**
Untuk time-series forecasting tidak cukup — dan kami tidak mengklaimnya. Pendekatan kami
cross-sectional: 161 baris × 11 fitur, rasio wajar untuk unsupervised anomaly detection.
Beberapa aset (F5O-TR55) punya histori 4 titik membentang 8 tahun (2016-2024).

**Q: Kenapa Isolation Forest, bukan model yang lebih canggih?**
Karena kami tidak punya label kegagalan historis — supervised learning tidak mungkin. Isolation
Forest ringan, dapat dijelaskan, tidak butuh label. Sempat dites bahkan bisa jalan di browser
untuk keperluan demo — tapi ini bukan rencana arsitektur produksi; di produksi tetap berjalan di
server seperti komponen backend lain. Kesederhanaan model ini fitur, bukan keterbatasan.

**Q: Apakah rule engine kalian pakai Duval Triangle / Rogers Ratio?**
Tidak. Basis kami individual gas threshold + Delta Value + Gas Rate ala IEEE C57.104-2019 —
metode yang benar-benar dipakai laporan lab kami sendiri. Urutan keparahan fault kami terinspirasi
severity ordering Duval/IEEE, tapi plot segitiga/pentagon Duval tidak kami implementasikan.

**Q: Kenapa PD masih simulasi? (versi lengkap, sudah dikonfirmasi ke tim listrik)**
Sudah kami telusuri langsung ke tim listrik — akar masalahnya bukan cuma beda format asset_id,
tapi gap instrumentasi: DGA menguji minyak trafo langsung, sementara sensor PD saat ini terpasang
di panel/switchgear, bukan di titik yang sama dengan trafo yang rutin diuji DGA. Pengukuran
keduanya juga masih reaktif (baru diukur kalau ada tanda-tanda masalah), belum menyeluruh ke
semua aset — meski ada rencana perluasan cakupan ke depan. Begitu ada aset yang "berpotongan"
(diukur PD dan DGA sekaligus), itu langsung jadi titik awal validasi PD riil.

**Q: Judul kalian bilang "Unified PD & DGA", tapi yang saya lihat cuma DGA. Mana yang benar?**
Keduanya benar, beda lapisan: judul menjelaskan arsitektur sistem yang kami bangun (dirancang
untuk menyatukan PD+DGA), sedangkan yang sudah 100% riil & tervalidasi hari ini baru sisi DGA.
Sisi PD sudah punya tempatnya di arsitektur (lihat Trend Engine & Composite Risk Score, keduanya
menerima input PD), tinggal menunggu data PD riil ter-mapping untuk diisi. Kami pilih jujur
menyebut ini transparan daripada menutupinya.

**Q: Kenapa tidak tunggu data PD riil dulu baru bikin modelnya?**
Karena fondasi DGA-nya sendiri sudah bernilai penuh dan bisa divalidasi independen (rule engine +
Composite Risk Score sisi DGA, 80% match). Menunggu PD riil dulu berarti menunda validasi yang
sudah bisa kami buktikan sekarang. Begitu PD riil tersedia, tinggal pasang ke arsitektur yang
sudah ada — bukan bangun ulang dari nol.

**Q: Apakah data 69 aset ini representasi semua trafo kritis Pusri?**
Belum — ini 69 aset yang tercakup di 3 laporan Petrolab (Des 2023-Jul 2024) yang sudah kami
transkrip. Cakupan ke aset lain menyusul begitu ada laporan lab baru — struktur pipeline sudah
siap menampung data tambahan tanpa perlu dibangun ulang.

**Kontak Tim F4:** *[isi nama & kontak PIC]* &middot; **Live demo:** `pkm-inovasi.vercel.app`
