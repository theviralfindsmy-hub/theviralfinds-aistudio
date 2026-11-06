# 🧠 KAJIAN REPOSITORI COPILOTKIT & PELAN NAIK TARAF THEVIRALFINDSMY (PRO-LEVEL UPGRADE)

**Sumber Repositori:** [`CopilotKit/CopilotKit`](https://github.com/CopilotKit/CopilotKit)  
**Aplikasi Sasaran:** TheViralFindsMY — AI Shopee & TikTok Affiliate Automation Platform  
**Tarikh Analisis:** 5 November 2026  

---

## 🔍 1. APA ITU COPILOTKIT & BAGAIMANA IA BERFUNGSI?

CopilotKit ialah rangka kerja sumber terbuka (open-source framework) paling popular untuk membina **In-App AI Copilots, AI Agents, dan Generative UI** terus ke dalam aplikasi React/Next.js.

### 🏗️ Seni Bina Teras 3 Lapisan (AG-UI Protocol):
1. **Frontend Layer (Context & UI Engine)**:
   - `useCopilotReadable`: Mendedahkan keadaan (state) skrin aktif pengguna secara dinamik ke otak AI supaya AI "nampak" apa yang pengguna sedang lihat tanpa perlu bertanya berulang kali.
   - `useCopilotAction`: Membenarkan AI memanggil fungsi atau aksi di klien (browser client-side tools) seperti menavigasi halaman, mengisi borang, atau mengubah suai teks.
   - `<CopilotSidebar>` & `<CopilotChat>`: Komponen UI sedia guna yang responsif dengan sokongan Generative UI (merender kad interaktif terus di dalam tetingkap chat).
2. **Runtime Layer (`@copilotkit/runtime`)**:
   - Lapisan middleware proksi pelayan (Next.js API route) yang menyelaraskan panggilan model LLM, penstriman teks (token streaming), dan kawalan keselamatan kunci API.
3. **Agent Layer (Reasoning & HITL Engine)**:
   - Menyambungkan orkestrasi ejen (LangGraph, Mastra, CrewAI) dengan ciri **Human-in-the-Loop (HITL)** — menjeda tindakan kritikal untuk pengesahan pengguna sebelum dilaksanakan.

---

## 💡 2. CADANGAN UPGRADE COPILOTKIT UNTUK THEVIRALFINDSMY

Untuk menaik taraf TheViralFindsMY daripada sistem dashboard pasif kepada **AI-Native Affiliate Co-Pilot Platform**, kita boleh mengintegrasikan 5 konsep teras CopilotKit berikut:

---

### 🚀 1. In-App Copilot Sidebar (`HermesCopilotSidebar.tsx`)
* **Masalah Sedia Ada:** Pengguna perlu sentiasa membuka halaman `/hermes` untuk bertanya soalan atau meminta AI menjana sesuatu, menyebabkan mereka terputus konteks dari halaman aktif (seperti Products, Links, atau Analytics).
* **Solusi CopilotKit:**
  - Sediakan **Copilot Slide-Over Drawer/Sidebar** global yang boleh dipanggil dari mana-mana halaman dengan menekan `Cmd+J` atau klik ikon Co-Pilot di bar navigasi atas.
  - Pengguna boleh bertanya mengenai produk yang sedang dipaparkan di skrin pada masa nyata.

---

### 🚀 2. Bidirectional Context (`useCopilotReadable` Pattern)
* **Masalah Sedia Ada:** Apabila pengguna berada di halaman Analytics atau Trend Spy dan bertanya *"Kenapa sales turun?"*, AI tidak tahu carta apa yang sedang dilihat oleh pengguna.
* **Solusi CopilotKit:**
  - Laksanakan konteks pintar mengikut halaman aktif:
    - Di `ProductsPage`: AI secara automatik membaca senarai produk trending, harga, dan kadar komisen yang sedang ditapis.
    - Di `AnalyticsPage`: AI membaca jumlah klik, CVR (Conversion Rate), dan pendapatan bersih hari ini.
    - Di `SocialHubPage`: AI membaca akaun yang telah bersambung (TikTok, IG, FB).
  - Soalan ringkas seperti *"Cadangkan video hook untuk produk pertama di skrin"* akan dijawab serta-merta tanpa perlu salin-tampal nama produk.

---

### 🚀 3. Client-Side Autonomous Actions (`useCopilotAction` Pattern)
* **Masalah Sedia Ada:** Chatbot hanya membalas dengan teks. Pengguna masih perlu klik secara manual untuk menjadualkan pos atau menukar penapis.
* **Solusi CopilotKit:**
  - Berikan ejen AI keupayaan untuk mengambil tindakan terus di UI:
    - **Action 1: `navigate_to_page`**: *"Bawa aku ke halaman Social Hub"* ➔ AI menukar tab secara automatik.
    - **Action 2: `schedule_social_post`**: *"Jadualkan promo produk ini ke TikTok petang ni"* ➔ AI mengisi borang autopost dan membuka dialog kelulusan.
    - **Action 3: `filter_high_commission`**: *"Tapis produk komisen melebihi 10%"* ➔ AI mengubah filter produk di skrin.

---

### 🚀 4. Generative UI (Komponen Dinamik Dalam Chat)
* **Masalah Sedia Ada:** Bot membalas dengan senarai markdown teks yang panjang dan membosankan.
* **Solusi CopilotKit:**
  - Ejen AI membalas dengan **Interactive Mini-Cards**:
    - Kad pratonton video TikTok dengan butang "Edit Script".
    - Kad produk Shopee dengan butang "Generate Affiliate Link" & "Copy Link".
    - Butang pengesahan Human-in-the-Loop: *"Adakah anda mahu menyiarkan pos ini ke Telegram? [Ya, Siarkan] [Batal]"*.

---

### 🚀 5. Kombinasi Padu: Manus O-P-B-V + CopilotKit In-App Assistance
- Gabungkan kuasa **Manus Studio v2.1.0** (Gelung Observe ➔ Plan ➔ Batch ➔ Verify di latar belakang) bersama **CopilotKit** (Interaksi kontekstual langsung di hadapan skrin pengguna).
- Ini menghasilkan persekitaran autonomi affiliate yang lengkap: ejen bekerja di latar belakang (Floating HUD), manakala pembantu pintar berada di sisi skrin sedia membantu bila-bila masa (Copilot Sidebar).
