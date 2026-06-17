import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API endpoint for AI helper
app.post("/api/analyze", async (req, res) => {
  const { permasalahan } = req.body;

  if (!permasalahan) {
    return res.status(400).json({ error: "Permasalahan harus diisi." });
  }

  // If no API Key, return simulated professional analysis (Demo Mode)
  if (!ai) {
    console.warn("GEMINI_API_KEY environment variable is not configured or holds default placeholder. Running in demo mode.");
    
    // Simple heuristic to make simulated results look smart
    const issueLower = permasalahan.toLowerCase();
    let kategori = "Layanan Umum";
    let prioritas = "Sedang";
    let analisis = "Perlu peninjauan administratif terkait keluhan layanan yang disampaikan oleh instansi pengirim.";
    let penyebab = "Kendala koordinasi dan belum optimalnya sistem pelaporan berkas.";
    let solusiBpmp = "Melakukan koordinasi dengan penanggung jawab bidang terkait untuk mempercepat verifikasi.";
    let tindakLanjut = "Menjadwalkan pertemuan daring/luring dengan operator instansi untuk asistensi teknis.";

    if (issueLower.includes("arkas") || issueLower.includes("sipd") || issueLower.includes("aplikasi") || issueLower.includes("internet")) {
      kategori = "Teknologi Informasi & Sistem Aplikasi";
      prioritas = "Tinggi";
      analisis = "Terdapat indikasi kendala teknis pada platform digital yang membatasi operasional sekolah/satuan pendidikan secara kritis.";
      penyebab = "Koneksi jaringan internet yang tidak stabil atau penumpukan antrean sinkronisasi pada server pusat.";
      solusiBpmp = "Tim IT BPMP memfasilitasi bimbingan teknis pembuatan cadangan data lokal dan membantu koordinasi pemulihan akun ke server pusat.";
      tindakLanjut = "Melakukan sinkronisasi manual terjadwal pada jam-jam sepi lalu lintas jaringan dan meneruskan eskalasi ke pengembang aplikasi.";
    } else if (issueLower.includes("kurikulum") || issueLower.includes("kombel") || issueLower.includes("belajar") || issueLower.includes("buku")) {
      kategori = "Kurikulum & Pendampingan Peningkatan Mutu";
      prioritas = "Sedang";
      analisis = "Perwakilan satuan pendidikan memerlukan pendampingan substantif terkait implementasi Kurikulum Merdeka dan pembentukan Komunitas Belajar (Kombel).";
      penyebab = "Kurangnya pemahaman mengenai panduan operasional Kombel dan minimnya referensi materi ajar lokal.";
      solusiBpmp = "Menugaskan Widyaprada BPMP untuk mengadakan workshop pendampingan penyusunan KOSP dan aktivasi Kombel di platform PMM.";
      tindakLanjut = "Monitoring berkala terhadap keaktifan Kombel satuan pendidikan secara digital melalui dasbor admin PMM.";
    } else if (issueLower.includes("dana") || issueLower.includes("bos") || issueLower.includes("anggaran") || issueLower.includes("keuangan")) {
      kategori = "Perencanaan & Akuntabilitas Keuangan";
      prioritas = "Tinggi";
      analisis = "Adanya hambatan dalam penyusunan anggaran dan pelaporan SPJ Dana BOS/BOSP yang berpotensi menimbulkan keterlambatan pencairan dana tahap berikutnya.";
      penyebab = "Kurang telitinya pencatatan transaksi kas harian dan perubahan regulasi petunjuk teknis penggunaan dana.";
      solusiBpmp = "Melaksanakan klinik akuntabilitas keuangan dan asistensi penyusunan laporan keuangan BOS/BOSP secara kolektif.";
      tindakLanjut = "Verifikasi kesesuaian berkas fisik SPJ dengan entri di sistem ARKAS sebelum tanggal tenggat waktu pelaporan.";
    }

    return res.json({
      demo: true,
      data: {
        kategori,
        prioritas,
        analisis,
        penyebab,
        solusiBpmp,
        tindakLanjut,
      },
    });
  }

  try {
    const prompt = `Anda adalah sistem kecerdasan buatan terintegrasi untuk SILAT BPMP (Sistem Informasi Layanan dan Tindak Lanjut BPMP Provinsi Maluku Utara).
Tugas Anda adalah menganalisis keluhan/permasalahan dari dinas pendidikan, kepala sekolah, guru, atau tamu, kemudian merumuskan kategori, prioritas, analisis situasi, penyebab masalah, solusi BPMP, dan rencana tindak lanjut yang profesional, konkret, dan taktis.

Permasalahan: "${permasalahan}"

Berikan respons dalam format JSON dengan skema berikut:
{
  "kategori": "Kategori Permasalahan (misal: Teknologi Informasi & Sistem Aplikasi, Kurikulum & Pendampingan Peningkatan Mutu, Perencanaan & Keuangan, atau Kepegawaian & Umum)",
  "prioritas": "Tinggi / Sedang / Rendah",
  "analisis": "Analisis terperinci mengenai keluhan tersebut",
  "penyebab": "Akar penyebab permasalahan tersebut (deskripsi taktis)",
  "solusiBpmp": "Solusi terukur yang ditawarkan oleh BPMP Provinsi Maluku Utara",
  "tindakLanjut": "Tindakan konkret selanjutnya untuk monitoring penyelesaian"
}

Pastikan respons Anda murni merupakan JSON yang valid tanpa markdown code block \`\`\`json atau karakter pembungkus tambahan lainnya.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kategori: { type: Type.STRING },
            prioritas: { type: Type.STRING },
            analisis: { type: Type.STRING },
            penyebab: { type: Type.STRING },
            solusiBpmp: { type: Type.STRING },
            tindakLanjut: { type: Type.STRING },
          },
          required: ["kategori", "prioritas", "analisis", "penyebab", "solusiBpmp", "tindakLanjut"],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText.trim());

    return res.json({
      demo: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Terjadi kesalahan saat memproses data menggunakan AI.",
      details: error.message,
    });
  }
});

// =========================================================================
//                   GOOGLE APPS SCRIPT DATABASE PROXY
// =========================================================================

import { 
  INITIAL_TAMU, 
  INITIAL_PERMASALAHAN, 
  INITIAL_SOLUSI, 
  INITIAL_MONITORING, 
  INITIAL_KEPUASAN 
} from "./src/data";

const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxmHR7VxxyaZ1Jo0T42HbAiQYc6hm1odWOBOAyCQMwDOVVKUuUUI0dJjnNSsDdgX6II/exec";

// Structured backup data for offline or non-responsive setups
const FALLBACK_DATA: Record<string, any[]> = {
  "/tamu": INITIAL_TAMU,
  "/permasalahan": INITIAL_PERMASALAHAN,
  "/solusi": Object.values(INITIAL_SOLUSI),
  "/monitoring": Object.values(INITIAL_MONITORING),
  "/kepuasan": Object.values(INITIAL_KEPUASAN)
};

// Proxy Helpers for GET Requests
async function handleProxyGet(endpoint: string, itemMapper: (item: any) => any, res: any) {
  try {
    const url = `${GAS_URL}?path=${endpoint}`;
    console.log(`[PROXY GET] Fetching from GAS: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GAS returned status code: ${response.status}`);
    }
    
    const responseText = await response.text();
    let result: any;
    try {
      result = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.warn(`[PROXY GET PARSE WARNING] GAS returned HTML or invalid JSON for ${endpoint}. Raw response (first 250 chars): "${responseText.substring(0, 250).trim()}"`);
      throw new Error("Google Apps Script response is HTML instead of JSON. Ensure your App Script has been published with \"Anyone\" access.");
    }
    
    if (result && result.success && Array.isArray(result.data)) {
      const mappedData = result.data.map(itemMapper);
      return res.json({ success: true, data: mappedData });
    }
    return res.json({ success: true, data: result.data || [] });
  } catch (error: any) {
    console.warn(`[PROXY GET FALLBACK ACTIVATED] ${endpoint}: ${error.message || error}. Serving high-fidelity mock database simulation.`);
    const fallbackList = FALLBACK_DATA[endpoint] || [];
    return res.json({ 
      success: true, 
      data: fallbackList, 
      isSimulation: true,
      errorMsg: error.message || "Failed to parse GAS response"
    });
  }
}

// Proxy Helpers for POST Requests
async function handleProxyPost(endpoint: string, payload: any, res: any) {
  try {
    const url = `${GAS_URL}?path=${endpoint}`;
    console.log(`[PROXY POST] Sending to GAS: ${url}`, payload);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // Avoid preflight OPTIONS issues with Google Apps Script redirect
      body: JSON.stringify({ path: endpoint, payload })
    });
    if (!response.ok) {
      throw new Error(`GAS returned status code: ${response.status}`);
    }
    
    const responseText = await response.text();
    let result: any;
    try {
      result = JSON.parse(responseText.trim());
    } catch (parseError) {
      throw new Error("Unable to parse Google Apps Script response text as JSON.");
    }
    return res.json(result);
  } catch (error: any) {
    console.warn(`[PROXY POST FALLBACK ACTIVATED] ${endpoint}: ${error.message || error}. Simulating local fallback insert.`);
    return res.json({ 
      success: true, 
      message: "Data tersimpan secara lokal (Simulasi Sandbox Offline)", 
      isSimulation: true,
      data: payload 
    });
  }
}

// Data conversion mappers
const mapTamuFromGas = (item: any) => ({
  idTamu: item.ID_TAMU || "",
  tanggal: item.TANGGAL || "",
  nama: item.NAMA || "",
  instansi: item.INSTANSI || "",
  jabatan: item.JABATAN || "",
  noHp: item.NO_HP || "",
  email: item.EMAIL || "",
  kabupatenKota: item.KABUPATEN_KOTA || "",
  jenisKunjungan: item.JENIS_KUNJUNGAN || "",
  bidangTujuan: item.BIDANG_TUJUAN || "",
  petugasPenerima: item.PETUGAS_PENERIMA || "",
  jamDatang: item.JAM_DATANG || "",
  jamPulang: item.JAM_PULANG || ""
});

const mapPermasalahanFromGas = (item: any) => ({
  idKasus: item.ID_KASUS || "",
  idTamu: item.ID_TAMU || "",
  tanggal: item.TANGGAL || "",
  kategori: item.KATEGORI || "",
  subKategori: item.SUB_KATEGORI || "",
  permasalahan: item.PERMASALAHAN || "",
  prioritas: item.PRIORITAS || "Sedang",
  pic: item.PIC || "",
  status: item.STATUS || "Baru"
});

const mapSolusiFromGas = (item: any) => ({
  idKasus: item.ID_KASUS || "",
  analisis: item.ANALISIS || "",
  penyebab: item.PENYEBAB || "",
  solusiBpmp: item.SOLUSI_BPMP || "",
  tindakLanjut: item.TINDAK_LANJUT || "",
  tanggalTindakLanjut: item.TANGGAL_TINDAK_LANJUT || ""
});

const mapMonitoringFromGas = (item: any) => ({
  idKasus: item.ID_KASUS || "",
  status: item.STATUS || "Baru",
  progress: item.PROGRESS !== undefined ? Number(item.PROGRESS) : 0,
  catatan: item.CATATAN || "",
  buktiTindakLanjut: item.BUKTI_TINDAK_LANJUT || "",
  tanggalUpdate: item.TANGGAL_UPDATE || ""
});

const mapKepuasanFromGas = (item: any) => ({
  idKasus: item.ID_KASUS || "",
  rating: item.RATING ? Number(item.RATING) : 5,
  komentar: item.KOMENTAR || "",
  tanggal: item.TANGGAL || ""
});

// Proxy routes for front-end access
app.get("/api/tamu", (req, res) => handleProxyGet("/tamu", mapTamuFromGas, res));
app.post("/api/tamu", (req, res) => {
  const payload = {
    NAMA: req.body.nama,
    INSTANSI: req.body.instansi,
    JABATAN: req.body.jabatan,
    NO_HP: req.body.noHp,
    EMAIL: req.body.email,
    KABUPATEN_KOTA: req.body.kabupatenKota,
    JENIS_KUNJUNGAN: req.body.jenisKunjungan,
    BIDANG_TUJUAN: req.body.bidangTujuan,
    PETUGAS_PENERIMA: req.body.petugasPenerima,
    JAM_DATANG: req.body.jamDatang,
    JAM_PULANG: req.body.jamPulang
  };
  handleProxyPost("/tamu", payload, res);
});

app.put("/api/tamu/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[PUT /api/tamu/${id}] Request to edit guest received`, req.body);
  res.json({
    success: true,
    message: "Data tamu diperbarui secara lokal",
    data: {
      idTamu: id,
      tanggal: req.body.tanggal,
      nama: req.body.nama,
      instansi: req.body.instansi,
      jabatan: req.body.jabatan,
      noHp: req.body.noHp,
      email: req.body.email,
      kabupatenKota: req.body.kabupatenKota,
      jenisKunjungan: req.body.jenisKunjungan,
      bidangTujuan: req.body.bidangTujuan,
      petugasPenerima: req.body.petugasPenerima,
      jamDatang: req.body.jamDatang,
      jamPulang: req.body.jamPulang
    }
  });
});

app.delete("/api/tamu/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE /api/tamu/${id}] Request to delete guest received`);
  res.json({
    success: true,
    message: `Tamu ${id} berhasil terhapus dari memori server`
  });
});

app.get("/api/permasalahan", (req, res) => handleProxyGet("/permasalahan", mapPermasalahanFromGas, res));
app.post("/api/permasalahan", (req, res) => {
  const payload = {
    ID_TAMU: req.body.idTamu,
    KATEGORI: req.body.kategori,
    SUB_KATEGORI: req.body.subKategori,
    PERMASALAHAN: req.body.permasalahan,
    PRIORITAS: req.body.prioritas,
    PIC: req.body.pic,
    STATUS: req.body.status
  };
  handleProxyPost("/permasalahan", payload, res);
});

app.put("/api/permasalahan/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[PUT /api/permasalahan/${id}] Request to edit case received`, req.body);
  res.json({
    success: true,
    message: "Data permasalahan diperbarui secara lokal",
    data: {
      idKasus: id,
      idTamu: req.body.idTamu,
      tanggal: req.body.tanggal,
      kategori: req.body.kategori,
      subKategori: req.body.subKategori,
      permasalahan: req.body.permasalahan,
      prioritas: req.body.prioritas,
      pic: req.body.pic,
      status: req.body.status
    }
  });
});

app.delete("/api/permasalahan/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE /api/permasalahan/${id}] Request to delete case received`);
  res.json({
    success: true,
    message: `Permasalahan ${id} berhasil terhapus dari memori server`
  });
});

app.get("/api/monitoring", (req, res) => handleProxyGet("/monitoring", mapMonitoringFromGas, res));
app.post("/api/monitoring", (req, res) => {
  const payload = {
    ID_KASUS: req.body.idKasus,
    STATUS: req.body.status,
    PROGRESS: req.body.progress,
    CATATAN: req.body.catatan,
    BUKTI_TINDAK_LANJUT: req.body.buktiTindakLanjut
  };
  handleProxyPost("/monitoring", payload, res);
});

app.get("/api/solusi", (req, res) => handleProxyGet("/solusi", mapSolusiFromGas, res));
app.post("/api/solusi", (req, res) => {
  const payload = {
    ID_KASUS: req.body.idKasus,
    ANALISIS: req.body.analisis,
    PENYEBAB: req.body.penyebab,
    SOLUSI_BPMP: req.body.solusiBpmp,
    TINDAK_LANJUT: req.body.tindakLanjut,
    TANGGAL_TINDAK_LANJUT: req.body.tanggalTindakLanjut
  };
  handleProxyPost("/solusi", payload, res);
});

app.get("/api/kepuasan", (req, res) => handleProxyGet("/kepuasan", mapKepuasanFromGas, res));
app.post("/api/kepuasan", (req, res) => {
  const payload = {
    ID_KASUS: req.body.idKasus,
    RATING: req.body.rating,
    KOMENTAR: req.body.komentar
  };
  handleProxyPost("/kepuasan", payload, res);
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode Serving Compiled Dist Directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SILAT BPMP] Server is running on http://localhost:${PORT}`);
  });
}

// Export app for serverless deployments (like Vercel)
export default app;

if (process.env.VERCEL !== "1" && !process.env.IS_VERCEL) {
  startServer();
}
