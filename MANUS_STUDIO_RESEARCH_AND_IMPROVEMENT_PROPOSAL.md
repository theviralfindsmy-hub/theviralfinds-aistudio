# 🔬 KAJIAN FORENSIK SENI BINA MANUS STUDIO (v2.1.0) & PELAN PENAMBAHBAIKAN THEVIRALFINDSMY

**Dokumen Rujukan:** REA Forensic Audit Manus Studio v2.1.0.0 (`ManusAI.Manus_2.1.0.0_x64__vajzd2mq3s8wj`)  
**Aplikasi Sasaran:** TheViralFindsMY — AI Shopee & TikTok Affiliate Automation Platform  
**Tarikh Analisis:** 5 November 2026  

---

## 📑 1. EKSEKUTIF FORENSIK: APA ITU SENI BINA MANUS STUDIO v2.1.0?

Manus Studio Desktop v2.1.0 (dinaik taraf daripada v2.0.7 dengan saiz ASAR 325.4 MB berbanding 259.8 MB) menunjukkan transformasi daripada sekadar bot perbualan AI kepada sebuah **Autonomous Agent Execution Environment (AAEE)** bertaraf OS gred desktop dengan 5 komponen utama:

### 1. Enjin Model Context Protocol (MCP) Stdio (`ManusComputerUseHelper.exe`)
- Bertindak sebagai pelayan rasmi Model Context Protocol (MCP) berasaskan pengangkutan stdio (`--stdio`).
- Melaksanakan gelung kawalan berdisiplin tinggi: `Observe ➔ Plan ➔ Batch ➔ Verify` (O-P-B-V Loop).
- Dilengkapi **Safety Gates**: meminta pengesahan manusia (Human-in-the-Loop) sebelum menjalankan operasi berisiko tinggi.

### 2. Mikro-Enjin Native (`manus-utilities.exe` - 43.4 MB)
- Mengendalikan servis tempatan tanpa kebergantungan cloud berlebihan:
  - **Video Analysis**: Pemprosesan inferensi video berterusan (`VIDEO_ANALYSIS_POLL_INTERVAL_MS = 3000ms`).
  - **Speech Input**: Input suara resolusi tinggi (buffer sehingga 25 MB).
  - **Render Partition**: Penebat paparan rajah Mermaid.js & sintaks kod.
  - **Session & Cookie Import (`ManusBrowserImport.exe`)**: Pengambilan kuki & sesi aktif pelayar.

### 3. Floating HUD & Task Activity Panel (`ManusTaskPanel.exe` & `desktop-activity-indicator.html`)
- Widget terapung di desktop yang sentiasa memaparkan status kerja agen, aktiviti semasa, dan senarai kad tugas tanpa perlu membuka tetingkap penuh aplikasi.

### 4. Ekosistem 10 Bundled Modular Addons
- Pakej mikro-aplikasi teras (.tar.gz) merangkumi:
  1. `manus-video-editor` (61.4 MB) — Penjana & penyunting video pintar.
  2. `manus-webdev` (25.6 MB) — Kotak pasir pembangunan web.
  3. `manus-workflow` (728 KB) — Automasi berbilang langkah.
  4. `manus-slides` (170 KB) — Penjana dek slaid.
  5. `manus-trip` (113 KB) — Carian jadual & pelan perjalanan.
  6. `manus-triggers` (47 KB) — Pencetus automasi berdasarkan acara sistem.
  7. `manus-homemaster` (21 KB) — Integrasi automasi pintar.
  8. `manus-shopping` (26 KB) — Automasi troli dan perbandingan e-dagang.
  9. `manus-storage` (9.4 KB) — Lapisan pengurusan fail dan storan.
  10. `manus-tasks` (8.2 KB) — Penjejak tugasan pengguna.

### 5. Klien Suara Pintar (Cue by Manus)
- Aplikasi pendamping desktop berasaskan arahan suara ambien pengguna (`ManusAI.CuebyManus_1.1.10.0`).

---

## 🎯 2. CADANGAN CIRI MANUS STUDIO UNTUK DIINTEGRASIKAN KE DALAM THEVIRALFINDSMY

Berikut adalah 6 ciri utama berinspirasikan Manus Studio v2.1.0 yang disesuaikan secara terus untuk memperkasakan TheViralFindsMY bagi pasaran affiliate Shopee & TikTok Malaysia:

---

### 💡 Ciri 1: Floating Agent HUD & Execution Matrix (Diinspirasikan daripada `ManusTaskPanel.exe`)
* **Masalah Sedia Ada:** Pengguna perlu klik pelbagai menu untuk melihat sama ada penjanaan skrip, pemantauan harga Shopee, atau semakan link affiliate telah selesai.
* **Solusi Manus:**
  - Sediakan **Floating Ambient Bento Widget (HUD)** di penjuru skrin aplikasi.
  - Menunjukkan status langsung agen yang sedang bekerja di latar belakang:
    - *Agent 1:* Scraping Shopee Flash Sales (Observe ➔ Verify)
    - *Agent 2:* AI Script Generation (Batching 5 viral video hooks)
    - *Agent 3:* Auto-posting Telegram/WhatsApp Queue
  - Pengguna boleh mengecilkan (minimize), menjeda (pause), atau meluluskan tindakan berisiko (Safety Gate) dalam 1 klik.

---

### 💡 Ciri 2: Gelung Tindakan MCP O-P-B-V (Observe ➔ Plan ➔ Batch ➔ Verify Loop)
* **Masalah Sedia Ada:** Sistem AI affiliate standard hanya membuat 1 kali prompt teks. Jika produk Shopee kehabisan stok atau harga berubah, sistem tidak mengesahkan keadaan sebenar.
* **Solusi Manus:**
  - **Observe:** Agen memeriksa URL Shopee / TikTok Shop (harga, rating > 4.7, stok unit, komisen rate).
  - **Plan:** Agen merangka jadual 3 video pendek, sudut promosi (USP), dan sasaran penonton Malaysia.
  - **Batch:** Agen menjana skrip, cadangan audio suara latar (BM santai/slang), thumbnail prompt, dan pautan affiliate pendek secara serentak.
  - **Verify:** Agen mengesahkan pautan affiliate aktif dan tiada pelanggaran polisi Shopee/TikTok Ads sebelum disiarkan.
  - **Safety Gate:** Memberikan butang *"Human Approval Required"* jika kos iklan atau promosi melebihi had bajet.

---

### 💡 Ciri 3: Modular Addon Studio Engine (Diinspirasikan daripada 10 Micro-Addons Manus)
Pakejkan alatan TheViralFindsMY ke dalam modul berdikari (Modular Bento-Box Addons):
1. `tvf-video-creator`: Studio papan cerita (storyboard) & penjana skrip video TikTok/Reels berasaskan hook viral.
2. `tvf-shopee-scout`: Enjin peninjau produk viral & analisis komisen tertinggi secara live.
3. `tvf-workflow-automator`: Aliran kerja automatik (cth: *"Jika komisen > 10% dan trend meningkat > 30%, janakan skrip video & simpan ke kalendar"*).
4. `tvf-cue-voice`: Pembantu suara arahan pantas (cth: *"Carikan 3 produk kecantikan Shopee komisen tertinggi hari ini"*).
5. `tvf-telegram-broadcast`: Auto-pusat hebahan kod promo ke saluran Telegram & WhatsApp affiliate.
6. `tvf-smart-shopping`: Automasi perbandingan harga antara Shopee, Lazada & TikTok Shop secara serentak.

---

### 💡 Ciri 4: Sesi Sesuai Pelayar (Browser Session Connector - `ManusBrowserImport`)
* **Solusi Manus:**
  - Membenarkan affiliate menyegerakkan sambungan akaun Shopee Affiliate Program (OpenAPI / Session Sync) dengan selamat.
  - Mengambil data analitik komisen harian, klik pautan (Sub-IDs), dan peratusan penukaran (CVR) secara terus ke dashboard.

---

### 💡 Ciri 5: Visual Workflow Canvas & Mermaid Flow Viewer
* **Solusi Manus:**
  - Paparan grafik visual interaktif untuk kempen pemasaran (Marketing Funnel):
    - *Trafik TikTok Video ➔ Shopee Affiliate Link ➔ Retargeting Telegram Channel ➔ Komisen Masuk*.
  - Menjana diagram aliran kerja secara automatik menggunakan Mermaid.js.

---

### 💡 Ciri 6: Audio & Video Analysis Pipeline (Diinspirasikan daripada `manus-utilities.exe`)
* **Solusi Manus:**
  - Analisis video pesaing TikTok Shop yang sedang FYP.
  - Mengesan struktur video: Hook (0-3s), Problem (3-10s), Solution/Demo (10-25s), Call to Action (25-30s).
  - Mengesyorkan format yang sama untuk ditiru oleh affiliate dengan produk mereka sendiri.

---

## 🚀 3. RUMUSAN & LANGKAH INTEGRASI

Dengan mengintegrasikan falsafah **Multi-Process Agent Matrix** dan **MCP Loop** daripada Manus Studio v2.1.0 ke dalam TheViralFindsMY, platform ini melonjak daripada alat semakan pautan pasif menjadi **Automated E-Commerce Growth Machine** yang beroperasi secara autonomi untuk menjana pendapatan affiliate 24/7.
