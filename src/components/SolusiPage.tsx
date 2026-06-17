import React, { useState, useMemo } from "react";
import { Permasalahan, Solusi, Tamu } from "../types";
import { 
  FileCheck, 
  Search, 
  Tag, 
  Clock, 
  User, 
  HelpCircle, 
  Calendar, 
  X,
  FileText,
  AlertCircle,
  Database,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";

interface SolusiPageProps {
  kasusList: Permasalahan[];
  solusiList: Record<string, Solusi>;
  tamuList: Tamu[];
  onSaveSolusi: (idKasus: string, solusiData: Omit<Solusi, "idKasus">) => Promise<void>;
  liveDbStatus?: string;
  onRefreshLive?: () => Promise<void>;
}

export const SolusiPage: React.FC<SolusiPageProps> = ({
  kasusList = [],
  solusiList = {},
  tamuList = [],
  onSaveSolusi,
  liveDbStatus,
  onRefreshLive
}) => {
  const [editingKasusId, setEditingKasusId] = useState<string | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatusSolusi, setFilterStatusSolusi] = useState("Semua"); // Semua, Selesai, Belum
  const [filterPrioritas, setFilterPrioritas] = useState("Semua");

  // Form States
  const [analisis, setAnalisis] = useState("");
  const [penyebab, setPenyebab] = useState("");
  const [solusiBpmp, setSolusiBpmp] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [tanggalTindakLanjut, setTanggalTindakLanjut] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const triggerNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setNotifyMsg({ text, type });
    setTimeout(() => {
      setNotifyMsg(null);
    }, 4000);
  };

  // Setup Form for Editing
  const handleOpenForm = (kasusId: string) => {
    setEditingKasusId(kasusId);
    const existing = solusiList[kasusId];
    if (existing) {
      setAnalisis(existing.analisis || "");
      setPenyebab(existing.penyebab || "");
      setSolusiBpmp(existing.solusiBpmp || "");
      setTindakLanjut(existing.tindakLanjut || "");
      setTanggalTindakLanjut(existing.tanggalTindakLanjut || new Date().toISOString().split("T")[0]);
    } else {
      setAnalisis("");
      setPenyebab("");
      setSolusiBpmp("");
      setTindakLanjut("");
      setTanggalTindakLanjut(new Date().toISOString().split("T")[0]);
    }
  };

  // Submit Solution Form
  const handleSubmitSolusi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKasusId) return;

    if (!analisis.trim() || !penyebab.trim() || !solusiBpmp.trim() || !tindakLanjut.trim()) {
      alert("Semua field isian draf solusi wajib dilengkapi!");
      return;
    }

    setIsSubmittingForm(true);
    try {
      await onSaveSolusi(editingKasusId, {
        analisis,
        penyebab,
        solusiBpmp,
        tindakLanjut,
        tanggalTindakLanjut
      });
      setEditingKasusId(null);
      triggerNotification(`Berhasil mendata kajian solusi rekomendasi untuk ID Kasus ${editingKasusId}`, "success");
      if (onRefreshLive) onRefreshLive();
    } catch (error: any) {
      console.error(error);
      triggerNotification(`Gagal menyimpan ke server: ${error.message}. Perubahan disimpan secara lokal.`, "info");
      setEditingKasusId(null);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Helper AI to generate dummy perfect drafts
  const handleGenerateSolusiAI = () => {
    if (!editingKasusId) return;
    const currentKasus = kasusList.find(k => k.idKasus === editingKasusId);
    if (!currentKasus) return;

    // Smart generation based on keywords
    const desc = currentKasus.permasalahan.toLowerCase();
    let computedAnalisis = `Telah ditelaah bahwa eskalasi laporan dipengaruhi oleh kurangnya panduan visual operasional di tingkat unit atau delay sistem sinkronisasi.`;
    let computedPenyebab = `Kurangnya pemahaman operator teknis sekolah atau adanya port pembatas (firewall) eksternal di LAN sekolah.`;
    let computedSolusi = `Tim Widyaprada BPMP melakukan intervensi bimbingan daring satu per satu, mengonfigurasi setelan default sistem, serta mendaftarkan kasus ke verifikasi prioritas helpdesk kementerian.`;
    let computedTindakLanjut = `Menyediakan Modul FAQ visual PDF & WhatsApp group tindak lanjut agar operator dapat berkonsultasi langsung secara intensif.`;

    if (desc.includes("arkas") || desc.includes("bosp") || desc.includes("keuangan")) {
      computedAnalisis = "Pemeriksaan tim teknis mengidentifikasi adanya kegagalan parsing file sertifikat cetak SPJ pada program ARKAS 4 akibat update library PDF rendering lokal komputer sekolah yang tidak kompatibel.";
      computedPenyebab = "Sistem Operasi komputer operator sekolah tidak memiliki patch font pembantu bawaan Windows serta cache pendaftaran anggaran yang belum di-refresh.";
      computedSolusi = "Menginstal paket Font Microsoft Core Pack ke sistem operasi Windows, membersihkan folder cache ARKAS, serta melatih tata cara ekspor laporan SPJ secara aman.";
      computedTindakLanjut = "Mengawal proses unggah berkas SPJ secara langsung melalui video call WhatsApp hingga laporannya terkonfirmasi status Terkirim.";
    } else if (desc.includes("kurikulum") || desc.includes("pmm") || desc.includes("merdeka")) {
      computedAnalisis = "Terdapat antrean kurasi berkas aksi nyata yang signifikan di server kurator pusat. Dikarenakan tim penilai kementerian pusat melakukan pemeriksaan berkala secara manual.";
      computedPenyebab = "Deskripsi aksi nyata guru terdeteksi memiliki presentase kemiripan tinggi (plagiat template daring) sehingga tertahan oleh program verifikator otomatis.";
      computedSolusi = "Tim BPMP memandu rekonstruksi isi dokumen tindakan kelas guru bebas plagiarisme dan memasukkan usulan prioritas melalui saluran khusus ( helpdesk internal ) Widyaprada BPMP.";
      computedTindakLanjut = "Melakukan koordinasi dengan Dinas Pendidikan setempat untuk sosialisasi tips penulisan esai refleksi yang orisinal.";
    } else if (desc.includes("dapodik") || desc.includes("rapor") || desc.includes("data")) {
      computedAnalisis = "Ketidaksesuaian data primer pada basis data terdistribusi dapodik provinsi. Duplikasi akun pengajar memicu penolakan validasi sinkron silang.";
      computedPenyebab = "Adanya pergantian tugas guru mapel yang diinput menyilang oleh operator tanpa menonaktifkan kode penugasan semester sebelumnya.";
      computedSolusi = "Melakukan cleansing data duplikasi melalui admin dapodik dinas pendidikan kabupaten/kota, kemudian melakukan forced-sync ditarik ulang ke e-rapor.";
      computedTindakLanjut = "Verifikasi keselarasan hasil tarik data e-rapor dapodik pada dashboard tim teknis BPMP.";
    }

    setAnalisis(computedAnalisis);
    setPenyebab(computedPenyebab);
    setSolusiBpmp(computedSolusi);
    setTindakLanjut(computedTindakLanjut);
    setTanggalTindakLanjut(new Date().toISOString().split("T")[0]);
    triggerNotification("Asisten AI menyusun rancangan rekomendasi draf penyelesaian!", "success");
  };

  // Extract unique options from cases for filters
  const uniqueKategori = useMemo(() => {
    return Array.from(new Set(kasusList.map(k => k.kategori).filter(Boolean)));
  }, [kasusList]);

  // Combined search and filtering logic
  const filteredKasus = useMemo(() => {
    return kasusList.filter(item => {
      // 1. Filter Kategori
      if (filterKategori !== "Semua" && item.kategori !== filterKategori) {
        return false;
      }
      // 2. Filter Status Solusi
      const hasSolusi = !!solusiList[item.idKasus];
      if (filterStatusSolusi === "Telah Di-analisis" && !hasSolusi) return false;
      if (filterStatusSolusi === "Belum Di-analisis" && hasSolusi) return false;

      // 3. Filter Prioritas
      if (filterPrioritas !== "Semua" && item.prioritas !== filterPrioritas) return false;

      // 4. Query Search
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        const matches = 
          item.idKasus.toLowerCase().includes(s) ||
          item.permasalahan.toLowerCase().includes(s) ||
          item.subKategori.toLowerCase().includes(s) ||
          item.pic.toLowerCase().includes(s);
        if (!matches) return false;
      }

      return true;
    });
  }, [kasusList, solusiList, filterKategori, filterStatusSolusi, filterPrioritas, searchQuery]);

  return (
    <div className="space-y-4 font-sans animate-fade-in text-xs max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-display flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-bpmp-blue" /> Draf Rekomendasi Solusi & Kajian BPMP
          </h2>
          <p className="text-slate-400 mt-0.5 font-medium">
            Formulasi analisis penyebab, draf solusi preventif, dan penugasan tindak lanjut kasus konsultasi Bimbtek pendidikan.
          </p>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2 bg-slate-100 p-2 px-3 rounded-xl border border-slate-200">
          <Database className="w-4 h-4 text-bpmp-indigo" />
          <div className="text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Sinkronisasi</div>
            <div className={`font-bold font-display ${liveDbStatus?.includes("Gagal") ? "text-amber-600" : "text-emerald-600"}`}>
              {liveDbStatus || "Tersambung ke Google Spreadsheet Live"}
            </div>
          </div>
        </div>
      </div>

      {notifyMsg && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
          notifyMsg.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-amber-50 border-amber-100 text-amber-800"
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{notifyMsg.text}</span>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kasus ID / Uraian Masalah / PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue"
          />
        </div>

        {/* Kategori Filter */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua Kategori</option>
            {uniqueKategori.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Status Solusi Filter */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterStatusSolusi}
            onChange={(e) => setFilterStatusSolusi(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua Status Kajian</option>
            <option value="Belum Di-analisis">Belum Di-analisis</option>
            <option value="Telah Di-analisis">Telah Di-analisis</option>
          </select>
        </div>

        {/* Prioritas Filter */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua Prioritas</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>
        </div>
      </div>

      {/* Grid of case solutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredKasus.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-xs">Tidak menemukan rincian permasalahan yang cocok dengan pencarian / filter.</p>
          </div>
        ) : (
          filteredKasus.map((kasus) => {
            const hasSolusi = solusiList[kasus.idKasus];
            const relatedTamu = tamuList.find(t => t.idTamu === kasus.idTamu);

            return (
              <div 
                key={kasus.idKasus} 
                className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Header Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {kasus.idKasus}
                      </span>
                      {kasus.idTamu && kasus.idTamu !== "-" && (
                        <span className="font-mono text-slate-400 font-semibold" title={relatedTamu ? `Instansi: ${relatedTamu.instansi}` : ""}>
                          Relasi: {kasus.idTamu}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${
                      hasSolusi 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-red-50 text-red-700 border-red-100 animate-pulse"
                    }`}>
                      {hasSolusi ? "SOLUSI SIAP" : "BUTUH KAJIAN"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">{kasus.kategori}</span>
                    <span className="text-[10px] text-bpmp-indigo font-bold flex items-center gap-0.5 font-mono">
                      <HelpCircle className="w-3.5 h-3.5" /> Sub: {kasus.subKategori}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Uraian Kasus Konsultasi:</span>
                    <p className="text-xs text-slate-700 italic font-medium leading-relaxed font-sans">
                      &ldquo;{kasus.permasalahan}&rdquo;
                    </p>
                  </div>

                  {/* Solusi Body details */}
                  {hasSolusi ? (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50/20 p-3 rounded-xl border border-blue-100/40 text-slate-700">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Akar Diagnosis Analisis</span>
                          <p className="font-medium font-sans leading-relaxed text-slate-700">{hasSolusi.analisis}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Identifikasi Penyebab Utama</span>
                          <p className="font-medium font-sans leading-relaxed text-slate-700">{hasSolusi.penyebab}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/85">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block tracking-wider">Formulasi Rekomendasi Solusi BPMP</span>
                        <p className="font-bold font-sans text-slate-800 text-[11px] leading-relaxed mb-2">{hasSolusi.solusiBpmp}</p>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10px]">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Tindak Lanjut Lanjutan</span>
                            <span className="font-medium text-slate-600">{hasSolusi.tindakLanjut}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Target Tanggal TL</span>
                            <span className="font-mono font-bold text-slate-600">{hasSolusi.tanggalTindakLanjut}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 text-slate-400">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wide">Analisis Widyaprada belum dirumuskan</p>
                      <p className="text-[10px] mt-0.5 text-slate-400">Silakan rumuskan langkah intervensi solusi untuk PIC terkait.</p>
                    </div>
                  )}
                </div>

                {/* Card footer details */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-sans font-semibold">
                  <div className="flex items-center gap-1 text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>PIC: {kasus.pic.split(",")[0]}</span>
                    <span className="mx-1">•</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      kasus.prioritas === "Tinggi" ? "bg-red-50 text-red-600" :
                      kasus.prioritas === "Sedang" ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>Priority: {kasus.prioritas}</span>
                  </div>

                  <button
                    onClick={() => handleOpenForm(kasus.idKasus)}
                    className="text-xs font-bold text-bpmp-blue hover:text-bpmp-indigo flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {hasSolusi ? "Ubah Solusi" : "Formulasi Solusi"} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Solusi Form */}
      {editingKasusId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in col-span-full">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-bpmp-indigo uppercase tracking-wider flex items-center gap-1.5 font-display">
                <FileCheck className="w-4 h-4 text-bpmp-blue" /> Formulasi Hasil Kajian Solusi ({editingKasusId})
              </h3>
              <button onClick={() => setEditingKasusId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Preview Info context */}
            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-amber-800">Uraian Rincian Keluhan Kasus:</span>
              <p className="text-[11px] text-slate-700 italic font-medium leading-relaxed">
                &ldquo;{kasusList.find(k => k.idKasus === editingKasusId)?.permasalahan}&rdquo;
              </p>
            </div>

            {/* Smart assist AI Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateSolusiAI}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[10px] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Bantu Tulis Kajian dengan AI
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSolusi} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                
                {/* Analisis */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-bpmp-blue" /> Analisis Gejala Masalah*
                  </label>
                  <textarea
                    rows={3}
                    value={analisis}
                    onChange={(e) => setAnalisis(e.target.value)}
                    placeholder="Hasil pengamatan teknis/administrasi terhadap keluhan yang disampaikan..."
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs focus:ring-1 focus:ring-bpmp-sky"
                  />
                </div>

                {/* Penyebab */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-bpmp-blue" /> Akar Penyebab Utama*
                  </label>
                  <textarea
                    rows={3}
                    value={penyebab}
                    onChange={(e) => setPenyebab(e.target.value)}
                    placeholder="Apa penyebab utama (root cause) sehingga masalah ini dapat terjadi di lapangan..."
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs focus:ring-1 focus:ring-bpmp-sky"
                  />
                </div>

                {/* Solusi BPMP */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-bpmp-blue" /> Formulasi Solusi BPMP*
                  </label>
                  <textarea
                    rows={3}
                    value={solusiBpmp}
                    onChange={(e) => setSolusiBpmp(e.target.value)}
                    placeholder="Formulasi rekomendasi aksi nyata/intervensi BPMP pendampingan mutu satuan pendidikan..."
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs focus:ring-1 focus:ring-bpmp-sky"
                  />
                </div>

                {/* Tindak Lanjut */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 text-bpmp-blue" /> Tindak Lanjut Unit Kerja*
                  </label>
                  <input
                    type="text"
                    value={tindakLanjut}
                    onChange={(e) => setTindakLanjut(e.target.value)}
                    placeholder="Contoh: Mengunggah PDF bukti fisik / mengikuti bimtek susulan"
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs focus:ring-1 focus:ring-bpmp-sky"
                  />
                </div>

                {/* Tanggal Tindak Lanjut */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-bpmp-blue" /> Target Batas Tindak Lanjut*
                  </label>
                  <input
                    type="date"
                    value={tanggalTindakLanjut}
                    onChange={(e) => setTanggalTindakLanjut(e.target.value)}
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs focus:ring-1 focus:ring-bpmp-sky"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKasusId(null)}
                  disabled={isSubmittingForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="bg-bpmp-blue hover:bg-bpmp-indigo text-white font-extrabold px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  {isSubmittingForm ? "Menyimpan Kajian..." : "Simpan Formulir Kajian"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SolusiPage;
