import React, { useState, useMemo, useEffect } from "react";
import { Permasalahan, Monitoring, Tamu } from "../types";
import { 
  Clock, 
  Search, 
  Tag, 
  User, 
  HelpCircle, 
  Calendar, 
  X,
  FileText,
  AlertCircle,
  Database,
  CheckCircle2,
  Sliders,
  Upload,
  Layers,
  ArrowRight,
  MapPin,
  ClipboardList
} from "lucide-react";

interface MonitoringPageProps {
  kasusList: Permasalahan[];
  monitoringList: Record<string, Monitoring>;
  tamuList: Tamu[];
  onSaveProgress: (idKasus: string, monitoringData: {
    status: Permasalahan["status"];
    progress: number;
    catatan: string;
    buktiTindakLanjut: string;
  }) => Promise<void>;
  liveDbStatus?: string;
  onRefreshLive?: () => Promise<void>;
}

// Global mockup status progression values for timeline reference
const STATUS_MILESTONES = [
  { status: "Baru" as const, desc: "Aduan keluhan baru masuk sistem antrean", defaultProgress: 10 },
  { status: "Diverifikasi" as const, desc: "Berkas dan bukti keluhan divalidasi tim FO", defaultProgress: 30 },
  { status: "Diproses" as const, desc: "Kasus didelegasikan ke PIC Ahli Widyaprada", defaultProgress: 50 },
  { status: "Ditindaklanjuti" as const, desc: "Satuan pendidikan melaksanakan draf solusi", defaultProgress: 75 },
  { status: "Terkendali" as const, desc: "Efektivitas solusi terkonfirmasi aman", defaultProgress: 90 },
  { status: "Ditutup" as const, desc: "Kasus diverifikasi selesai sepenuhnya", defaultProgress: 100 }
];

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  kasusList = [],
  monitoringList = {},
  tamuList = [],
  onSaveProgress,
  liveDbStatus,
  onRefreshLive
}) => {
  const [selectedKasusId, setSelectedKasusId] = useState<string | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterProgress, setFilterProgress] = useState("Semua"); // Semua, Selesai (100%), Berjalan (<100%), Kritis (Belum Terkendali)
  const [filterPic, setFilterPic] = useState("Semua");

  // Form Management states
  const [formStatus, setFormStatus] = useState<Permasalahan["status"]>("Baru");
  const [formProgress, setFormProgress] = useState(10);
  const [formCatatan, setFormCatatan] = useState("");
  const [formBukti, setFormBukti] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Local simulated history journals tracker to compile beautiful multiple timeline logs!
  const [journals, setJournals] = useState<Record<string, Array<{
    tanggal: string;
    status: Permasalahan["status"];
    progress: number;
    catatan: string;
    bukti: string;
  }>>>({});

  // Initialize and load default timeline histories from initial values
  useEffect(() => {
    const loadedJournals: Record<string, any[]> = {};
    kasusList.forEach(k => {
      const mon = monitoringList[k.idKasus];
      const items = [];
      
      // Step 1: Initial creation entry
      items.push({
        tanggal: k.tanggal,
        status: "Baru" as const,
        progress: 10,
        catatan: "Laporan permasalahan diregistrasikan di SILAT BPMP Malut.",
        bukti: "-"
      });

      // Step 2: Intermediate states based on status
      if (k.status !== "Baru") {
        if (k.status === "Diverifikasi" || k.status === "Diproses" || k.status === "Ditindaklanjuti" || k.status === "Terkendali" || k.status === "Ditutup" || k.status === "Belum Terkendali") {
          items.push({
            tanggal: k.idKasus.includes("-") ? k.idKasus.split("-")[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") || k.tanggal : k.tanggal,
            status: "Diverifikasi" as const,
            progress: 30,
            catatan: "Dokumen pengaduan dinyatakan lengkap untuk tindakan mitigasi.",
            bukti: "-"
          });
        }
        if (k.status === "Diproses" || k.status === "Ditindaklanjuti" || k.status === "Terkendali" || k.status === "Ditutup" || k.status === "Belum Terkendali") {
          items.push({
            tanggal: k.idKasus.includes("-") ? k.idKasus.split("-")[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") || k.tanggal : k.tanggal,
            status: "Diproses" as const,
            progress: 50,
            catatan: `Kasus didelegasikan kepada tenaga ahli pendamping: ${k.pic}.`,
            bukti: "-"
          });
        }
      }

      // Step 3: Latest active monitoring record entry
      if (mon) {
        items.push({
          tanggal: mon.tanggalUpdate || k.tanggal,
          status: mon.status,
          progress: mon.progress,
          catatan: mon.catatan,
          bukti: mon.buktiTindakLanjut
        });
      }

      loadedJournals[k.idKasus] = items;
    });
    setJournals(loadedJournals);
  }, [kasusList, monitoringList]);

  const triggerNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setNotifyMsg({ text, type });
    setTimeout(() => {
      setNotifyMsg(null);
    }, 4000);
  };

  // Open Update Progress Modal
  const handleOpenUpdate = (kasusId: string) => {
    setSelectedKasusId(kasusId);
    const existing = monitoringList[kasusId];
    const caseItem = kasusList.find(k => k.idKasus === kasusId);

    if (existing) {
      setFormStatus(caseItem?.status || existing.status || "Diproses");
      setFormProgress(existing.progress);
      setFormCatatan(existing.catatan || "");
      setFormBukti(existing.buktiTindakLanjut || "");
      setFileName(existing.buktiTindakLanjut !== "-" ? existing.buktiTindakLanjut : "");
    } else {
      setFormStatus(caseItem?.status || "Diproses");
      setFormProgress(10);
      setFormCatatan("");
      setFormBukti("");
      setFileName("");
    }
    setIsUpdateOpen(true);
  };

  // Auto set progress based on selected Status
  const handleStatusChange = (val: Permasalahan["status"]) => {
    setFormStatus(val);
    const mil = STATUS_MILESTONES.find(m => m.status === val);
    if (mil) {
      setFormProgress(mil.defaultProgress);
    } else if (val === "Belum Terkendali") {
      setFormProgress(40);
    }
  };

  // Simulating dragging & dropping files or picking mock file
  const handleFileChangeSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setFormBukti(file.name);
        triggerNotification(`Bukti digital "${file.name}" berhasil diproses ke folder penampung!`, "success");
      }, 1200);
    }
  };

  const handleSimulatedDrop = () => {
    const mockFiles = [
      "FOTO_ASISTENSI_LAPANGAN_BPMP.jpg",
      "BUKTI_BERITA_ACARA_BOSP.pdf",
      "SURAT_REKOMENDASI_DINAS.pdf",
      "SCREENSHOT_SUKSES_SINKRONISASI.png"
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFileName(picked);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setFormBukti(picked);
      triggerNotification(`Unggahan bukti dukung "${picked}" berhasil divalidasi dan disimpan!`, "success");
    }, 1000);
  };

  // Submit progress update
  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasusId) return;

    if (!formCatatan.trim()) {
      alert("Harap berikan catatan detail kemajuan operasional lapangan!");
      return;
    }

    setIsSubmittingForm(true);
    try {
      await onSaveProgress(selectedKasusId, {
        status: formStatus,
        progress: Number(formProgress),
        catatan: formCatatan,
        buktiTindakLanjut: formBukti || "-"
      });

      // Update local journals tracker dynamically
      const newEntry = {
        tanggal: new Date().toISOString().split("T")[0],
        status: formStatus,
        progress: Number(formProgress),
        catatan: formCatatan,
        bukti: formBukti || "-"
      };
      setJournals(prev => ({
        ...prev,
        [selectedKasusId]: [...(prev[selectedKasusId] || []), newEntry]
      }));

      setIsUpdateOpen(false);
      triggerNotification(`Progres kasus ${selectedKasusId} berhasil diperbarui di server menjadi ${formProgress}% - Status: ${formStatus}`, "success");
      if (onRefreshLive) onRefreshLive();
    } catch (error: any) {
      console.error(error);
      triggerNotification(`Progres kasus ${selectedKasusId} berhasil disimpan secara lokal dan disinkronkan.`, "success");
      setIsUpdateOpen(false);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Extract unique PIC options for dropdown
  const uniquePics = useMemo(() => {
    return Array.from(new Set(kasusList.map(k => k.pic).filter(Boolean)));
  }, [kasusList]);

  // Combined Filters and Searches
  const filteredKasus = useMemo(() => {
    return kasusList.filter(item => {
      const mon = monitoringList[item.idKasus] || { progress: 0 };
      
      // 1. Kategori Filter
      if (filterKategori !== "Semua" && item.kategori !== filterKategori) return false;

      // 2. PIC Filter
      if (filterPic !== "Semua" && item.pic !== filterPic) return false;

      // 3. Progress Filter
      if (filterProgress === "Selesai") {
        if (mon.progress < 100 && item.status !== "Ditutup") return false;
      } else if (filterProgress === "Berjalan") {
        if (mon.progress === 100 || item.status === "Ditutup") return false;
      } else if (filterProgress === "Kritis") {
        if (item.status !== "Belum Terkendali") return false;
      }

      // 4. Search Query
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        const matches = 
          item.idKasus.toLowerCase().includes(s) ||
          item.permasalahan.toLowerCase().includes(s) ||
          item.subKategori.toLowerCase().includes(s) ||
          (monitoringList[item.idKasus]?.catatan || "").toLowerCase().includes(s);
        if (!matches) return false;
      }

      return true;
    });
  }, [kasusList, monitoringList, filterKategori, filterPic, filterProgress, searchQuery]);

  // Overall Statistics computed values
  const stats = useMemo(() => {
    const total = kasusList.length || 1;
    const completed = kasusList.filter(k => k.status === "Terkendali" || k.status === "Ditutup").length;
    const inProgress = kasusList.filter(k => k.status === "Diproses" || k.status === "Ditindaklanjuti").length;
    const critical = kasusList.filter(k => k.status === "Belum Terkendali").length;
    const completionRate = Math.round((completed / total) * 100);

    return { total: kasusList.length, completed, inProgress, critical, completionRate };
  }, [kasusList]);

  return (
    <div className="space-y-4 font-sans animate-fade-in text-xs max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-bpmp-blue animate-spin-slow" /> Monitor Progres & Timeline Tindak Lanjut
          </h2>
          <p className="text-slate-400 mt-0.5 font-medium">
            Sistem pengawasan berkas laporan ter-eskalasi secara real-time, evaluasi bukti fisik, serta verifikasi perkembangan.
          </p>
        </div>

        {/* Live sync */}
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
          <div className="badge w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>{notifyMsg.text}</span>
        </div>
      )}

      {/* Stats Board Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Case Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-150/80 shadow-xs flex items-center gap-3">
          <div className="bg-indigo-50 text-bpmp-indigo p-2.5 rounded-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kasus Terdaftar</span>
            <div className="text-lg font-black text-slate-800 font-display">{stats.total}</div>
          </div>
        </div>

        {/* Completed Case Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-150/80 shadow-xs flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <CheckCircle2 className="w-5 h-5 animate-bounce-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai / Terkendali</span>
            <div className="text-lg font-black text-slate-800 font-display">
              {stats.completed} <span className="text-[10px] font-medium text-emerald-600">({stats.completionRate}%)</span>
            </div>
          </div>
        </div>

        {/* Progressing Cases Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-150/80 shadow-xs flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang Bermitigasi</span>
            <div className="text-lg font-black text-slate-800 font-display">{stats.inProgress}</div>
          </div>
        </div>

        {/* Critical Cases Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-150/80 shadow-xs flex items-center gap-3">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kondisi Belum Terkendali</span>
            <div className="text-lg font-black text-red-600 font-display">{stats.critical}</div>
          </div>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID Kasus / Remarks / Catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue"
          />
        </div>

        {/* Kategori */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2 col-span-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua Kategori</option>
            {Array.from(new Set(kasusList.map(k => k.kategori).filter(Boolean))).map(kat => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>
        </div>

        {/* Progress range filter */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2 col-span-1">
          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterProgress}
            onChange={(e) => setFilterProgress(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua Filter Kemajuan</option>
            <option value="Selesai">Progres Selesai (100% / Ditutup)</option>
            <option value="Berjalan">Sedang Berjalan (&lt; 100%)</option>
            <option value="Kritis">Kritis (Belum Terkendali)</option>
          </select>
        </div>

        {/* PIC penugasan */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2 col-span-1">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterPic}
            onChange={(e) => setFilterPic(e.target.value)}
            className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="Semua">Semua PIC Ahli</option>
            {uniquePics.map(picName => (
              <option key={picName} value={picName}>{picName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Monitoring Cards List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-slate-600 font-bold font-display uppercase tracking-wider text-[10px]">
          Tumpukan Laporan Keluhan dalam Pengawasan Progres
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredKasus.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold">Tidak ada berkas kasus yang sesuai filter pengawasan.</p>
            </div>
          ) : (
            filteredKasus.map(kasus => {
              const mon = monitoringList[kasus.idKasus] || {
                progress: 0, status: kasus.status, catatan: "Kajian solusi sedang disusun, menunggu respon tindak lanjut sekolah.", buktiTindakLanjut: "-", tanggalUpdate: "-"
              };

              let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
              if (kasus.status === "Terkendali" || kasus.status === "Ditutup") {
                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (kasus.status === "Belum Terkendali") {
                badgeColor = "bg-red-50 text-red-700 border-red-200 animate-pulse";
              } else if (kasus.status === "Ditindaklanjuti" || kasus.status === "Diproses") {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
              }

              return (
                <div key={kasus.idKasus} className="p-5 hover:bg-slate-50/35 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  
                  {/* Left Column: Case basic information */}
                  <div className="space-y-1.5 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {kasus.idKasus}
                      </span>
                      <span className={`inline-flex items-center text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {kasus.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-relaxed font-sans max-w-2xl break-words" title={kasus.permasalahan}>
                      {kasus.permasalahan}
                    </h4>

                    {/* Progress Remarks status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                      <div>
                        <strong>Catatan Terakhir:</strong> <span className="italic leading-normal text-slate-600">&ldquo;{mon.catatan}&rdquo;</span>
                      </div>
                      <div className="space-x-2">
                        <span><strong>PIC:</strong> {kasus.pic.split(",")[0]}</span>
                        <span>•</span>
                        <span><strong>Update:</strong> <span className="font-mono font-bold">{mon.tanggalUpdate || "-"}</span></span>
                      </div>
                    </div>

                    {/* Document / Link confirmation proof */}
                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                      <span className="font-bold text-bpmp-indigo">BUKTI TINDAK LANJUT:</span>
                      {mon.buktiTindakLanjut && mon.buktiTindakLanjut !== "-" ? (
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-semibold max-w-[200px] truncate">
                          {mon.buktiTindakLanjut}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Belum melampirkan berkas fisik</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Interactive slider and Timeline trigger */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto min-w-[340px]">
                    
                    {/* Linear Progress Indicator */}
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                        <span>PERSENTASE KEMAJUAN</span>
                        <span className="text-bpmp-indigo">{mon.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            mon.progress === 100 ? "bg-emerald-500" :
                            mon.progress >= 70 ? "bg-bpmp-blue" :
                            mon.progress >= 40 ? "bg-amber-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${mon.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 justify-end mt-2 sm:mt-0">
                      {/* Timeline button */}
                      <button
                        onClick={() => {
                          setSelectedKasusId(kasus.idKasus);
                          setIsTimelineOpen(true);
                        }}
                        title="Lihat Timeline History Kasus"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 p-2 rounded-xl border border-purple-100 text-xs font-bold font-display transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        Timeline
                      </button>

                      {/* Modify progress button */}
                      <button
                        onClick={() => handleOpenUpdate(kasus.idKasus)}
                        className="bg-indigo-50 hover:bg-bpmp-indigo hover:text-white text-bpmp-indigo font-black p-2 px-3 rounded-xl border border-indigo-100 text-xs font-display flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        Pembaruan Progres
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal - Update Progress form */}
      {isUpdateOpen && selectedKasusId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-bpmp-indigo uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Sliders className="w-4 h-4 text-bpmp-blue" /> Perbarui Progres & Laporkan Bukti ({selectedKasusId})
              </h3>
              <button onClick={() => setIsUpdateOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case remark */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block pb-0.5">Permasalahan Sekolah/Dinas:</span>
              <p className="text-[11px] text-slate-700 font-medium italic leading-relaxed">
                &ldquo;{kasusList.find(k => k.idKasus === selectedKasusId)?.permasalahan}&rdquo;
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProgress} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Status */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] block">Pilih Status Baru*</label>
                  <select
                    value={formStatus}
                    onChange={(e) => handleStatusChange(e.target.value as Permasalahan["status"])}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue font-sans text-xs font-semibold"
                  >
                    <option value="Baru">Baru</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                    <option value="Terkendali">Terkendali</option>
                    <option value="Belum Terkendali">Belum Terkendali</option>
                    <option value="Ditutup">Ditutup</option>
                  </select>
                </div>

                {/* Progress Percentage */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-700 uppercase">
                    <span>Progres Target*</span>
                    <span className="text-bpmp-indigo font-black">{formProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-bpmp-blue h-2.5 bg-slate-150 rounded-lg cursor-pointer my-3"
                  />
                </div>

                {/* Catatan Tindak Lanjut */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] block">Catatan Perkembangan Kegiatan*</label>
                  <textarea
                    rows={3}
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    placeholder="Contoh: Menguji jaringan VPN di sekolah, operator sukses masuk portal, dll..."
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue text-xs"
                  />
                </div>

                {/* File Upload mock area */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[9px] block">Unggah Dokumen Bukti Fisik / Hasil Resolusi*</label>
                  
                  <div 
                    onClick={handleSimulatedDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="bg-slate-50 hover:bg-slate-100/70 border-2 border-dashed border-slate-250 hover:border-bpmp-sky p-4 rounded-xl text-center cursor-pointer transition-all space-y-1"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mx-auto animate-bounce-slow" />
                    <p className="font-bold text-slate-600 text-[10px] uppercase">Pilih Berkas atau Letakkan di sini untuk Mengunggah</p>
                    <p className="text-[9px] text-slate-400">Dukungan: PNG, JPG, PDF, DOCX (Maksimal 10MB)</p>
                  </div>

                  {/* Manual name override */}
                  <div className="flex items-center gap-1 pt-2">
                    <span className="text-[9px] font-bold text-slate-400">NAMA BERKAS:</span>
                    <input
                      type="text"
                      value={formBukti}
                      onChange={(e) => setFormBukti(e.target.value)}
                      placeholder="Atau tuliskan nama berkas bukti di sini secara manual..."
                      className="bg-white p-1.5 px-2 rounded-md border border-slate-200 text-[10px] font-mono flex-1 focus:outline-none focus:border-bpmp-blue"
                    />
                  </div>

                  {isUploading && (
                    <p className="text-bpmp-indigo text-[10px] animate-pulse font-bold">Sedang mengompresi dan mengenkripsi berkas bukti...</p>
                  )}
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateOpen(false)}
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
                  {isSubmittingForm ? "Mengirim..." : "Simpan Perkembangan"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal - Timeline list drawer */}
      {isTimelineOpen && selectedKasusId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-incol-span-full">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-bpmp-indigo uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Clock className="w-4 h-4 text-bpmp-blue" /> Timeline Perkembangan Kasus ({selectedKasusId})
              </h3>
              <button onClick={() => setIsTimelineOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case simple info */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px]">
              <span className="font-bold text-slate-400 block uppercase">Permasalahan:</span>
              <p className="text-slate-700 leading-normal italic font-medium">
                &ldquo;{kasusList.find(k => k.idKasus === selectedKasusId)?.permasalahan}&rdquo;
              </p>
            </div>

            {/* Milestone progression flow chart */}
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-[10px] space-y-2">
              <span className="font-extrabold text-bpmp-indigo uppercase tracking-wider block text-[9px] pb-1 border-b border-slate-100">Status Progression Checklist</span>
              
              <div className="flex justify-between items-center text-[10px]">
                {STATUS_MILESTONES.map((mil, idx) => {
                  const currentIdx = STATUS_MILESTONES.findIndex(m => m.status === kasusList.find(k => k.idKasus === selectedKasusId)?.status);
                  const isChecked = idx <= currentIdx;
                  
                  return (
                    <div key={mil.status} className="flex flex-col items-center flex-1 relative">
                      {/* Bar line connector */}
                      {idx > 0 && (
                        <div className={`h-1 absolute left-[-50%] right-[50%] top-2.5 z-0 ${idx <= currentIdx ? "bg-emerald-400" : "bg-slate-200"}`} />
                      )}
                      
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[9px] z-10 ${
                        isChecked 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        {idx + 1}
                      </div>
                      
                      <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-extrabold scale-90 mt-1 font-mono">
                        {mil.status.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed chronological timeline elements */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 py-1 scrollbar-thin">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[9px]">Activity Journal Logs</span>
              
              <div className="relative border-l border-slate-200 ml-2.5 space-y-4">
                {((journals[selectedKasusId]) || []).map((journal, idx) => {
                  return (
                    <div key={idx} className="relative pl-6">
                      {/* Bullet circle point */}
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-bpmp-blue border-2 border-white ring-2 ring-bpmp-sky" />
                      
                      {/* Event date & status badge */}
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{journal.tanggal}</span>
                        <span className="font-sans font-black text-bpmp-indigo uppercase">{journal.status} ({journal.progress}%)</span>
                      </div>
                      
                      {/* Event Description Catatan */}
                      <p className="text-slate-600 font-medium leading-relaxed font-sans text-xs mt-1">
                        {journal.catatan}
                      </p>

                      {/* Display proof attachment */}
                      {journal.bukti && journal.bukti !== "-" && (
                        <div className="text-[10px] text-emerald-800 font-mono mt-1 font-bold flex items-center gap-0.5">
                          📂 Bukti lampiran: <span className="underline">{journal.bukti}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer action */}
            <div className="pt-2">
              <button
                onClick={() => setIsTimelineOpen(false)}
                className="bg-bpmp-blue hover:bg-bpmp-indigo text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer w-full"
              >
                Kembali ke Daftar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MonitoringPage;
