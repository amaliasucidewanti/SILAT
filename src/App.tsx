import React, { useState, useEffect } from "react";
import { UserRole, WireframePage, Tamu, Permasalahan, Solusi, Monitoring, Kepuasan, MainTab } from "./types";
import { 
  INITIAL_TAMU, INITIAL_PERMASALAHAN, INITIAL_SOLUSI, INITIAL_MONITORING, INITIAL_KEPUASAN 
} from "./data";
import { 
  LayoutDashboard, Users, AlertTriangle, FileCheck, CheckCircle2, 
  FileText, Star, BrainCircuit, Settings, BookOpen, Cpu, 
  Database, FolderCode, Menu, X, Clock, RefreshCw, ChevronRight,
  ShieldAlert, Building, MapPin, Mail, Sparkles
} from "lucide-react";

// Sub-components imports
import WireframeSandbox from "./components/WireframeSandbox";

// Official BPMP / Kemdikbud Tut Wuri Handayani Logo (Removed per user instruction)
function OfficialBpmpLogo({ className = "w-10 h-10" }: { className?: string }) {
  return null;
}

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>("Administrator");
  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Local collection states for interactive CRUD simulation
  const [tamuList, setTamuList] = useState<Tamu[]>(INITIAL_TAMU);
  const [kasusList, setKasusList] = useState<Permasalahan[]>(INITIAL_PERMASALAHAN);
  const [solusiList, setSolusiList] = useState<Record<string, Solusi>>(INITIAL_SOLUSI);
  const [monitoringList, setMonitoringList] = useState<Record<string, Monitoring>>(INITIAL_MONITORING);
  const [kepuasanList, setKepuasanList] = useState<Record<string, Kepuasan>>(INITIAL_KEPUASAN);

  // Live Sync Database states
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveDbStatus, setLiveDbStatus] = useState<string | null>("Menghubungkan ke Google Spreadsheet...");

  // Digital clock
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all tables on mount or when status is refreshed
  const fetchLiveDatabase = async () => {
    setIsLoadingLive(true);
    setLiveDbStatus("Menghubungkan ke Google Spreadsheet...");
    try {
      const [resTamu, resKasus, resMon, resSol, resKep] = await Promise.all([
        fetch("/api/tamu").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/permasalahan").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/monitoring").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/solusi").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/kepuasan").then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (resTamu.success && Array.isArray(resTamu.data) && resTamu.data.length > 0) {
        setTamuList(resTamu.data);
      }
      if (resKasus.success && Array.isArray(resKasus.data) && resKasus.data.length > 0) {
        setKasusList(resKasus.data);
      }
      if (resMon.success && Array.isArray(resMon.data)) {
        const monMap: Record<string, Monitoring> = {};
        resMon.data.forEach((m: Monitoring) => {
          if (m.idKasus) monMap[m.idKasus] = m;
        });
        if (Object.keys(monMap).length > 0) {
          setMonitoringList(prev => ({ ...prev, ...monMap }));
        }
      }
      if (resSol.success && Array.isArray(resSol.data)) {
        const solMap: Record<string, Solusi> = {};
        resSol.data.forEach((s: Solusi) => {
          if (s.idKasus) solMap[s.idKasus] = s;
        });
        if (Object.keys(solMap).length > 0) {
          setSolusiList(prev => ({ ...prev, ...solMap }));
        }
      }
      if (resKep.success && Array.isArray(resKep.data)) {
        const kepMap: Record<string, Kepuasan> = {};
        resKep.data.forEach((k: Kepuasan) => {
          if (k.idKasus) kepMap[k.idKasus] = k;
        });
        if (Object.keys(kepMap).length > 0) {
          setKepuasanList(prev => ({ ...prev, ...kepMap }));
        }
      }
      const isSimulation = resTamu.isSimulation || resKasus.isSimulation || resMon.isSimulation || resSol.isSimulation || resKep.isSimulation;
      if (isSimulation) {
        setLiveDbStatus("Mode Luring Aktif (Menggunakan Basis Data Lokal)");
      } else {
        setLiveDbStatus("Basis Data Terhubung ke Cloud Google Sheets!");
      }
    } catch (err: any) {
      console.error("Live fetch error:", err);
      setLiveDbStatus("Mode Luring Aktif (Menggunakan Basis Data Lokal)");
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveDatabase();
  }, []);

  // Sync state with layout adjustments
  const handlePageSelect = (page: string) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  // Human-readable labels mapping
  const getPageTitleLabel = () => {
    switch (activePage) {
      case "Dashboard": return "Dashboard Utama Layanan";
      case "Tamu": return "Data Tamu & Kunjungan";
      case "Permasalahan": return "Eskalasi Daftar Masalah";
      case "Solusi": return "Evaluasi & Kajian Solusi";
      case "Monitoring": return "Monitoring Progres Kasus";
      case "Laporan": return "Konsolidasi Laporan Cetak";
      case "Pimpinan": return "Dashboard Analitik Pimpinan";
      case "AI_Assistant": return "Asisten Kecerdasan AI";
      case "Pengaturan": return "Penyetelan Konfigurasi";
      case "Overview": return "Cetak Biru Overview / Spek";
      case "Arsitektur": return "Topologi Arsitektur & Alur";
      case "ERD": return "Desain Skema Basis Data (ERD)";
      case "Struktur": return "Struktur Proyek & API Kontrol";
      default: return "SILAT BPMP Maluku Utara";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 selection:bg-bpmp-sky selection:text-bpmp-blue font-sans">
      
      {/* 1. PERSISTENT DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#090D1A] text-slate-300 border-r border-slate-800 relative z-30">
        
        {/* Sidebar Header Brand with Official BPMP Logo */}
        <div className="p-5 border-b border-slate-850 flex items-center gap-3 bg-[#050811]">
          <OfficialBpmpLogo className="w-10 h-10" />
          <div className="leading-tight">
            <span className="font-mono text-[9px] font-bold text-[#EAB308] tracking-widest block">BPMP MALUT</span>
            <span className="font-display font-black text-xs text-white tracking-wide block">SILAT BPMP</span>
            <span className="text-[8px] text-slate-400 block font-sans">Sistem Layanan Terpadu</span>
          </div>
        </div>

        {/* Sidebar Menu Item lists */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase px-2 block mb-2">Menu Utama</span>
            
            {activeRole !== "Pimpinan" && (
              <button
                id="menu-dashboard"
                onClick={() => handlePageSelect("Dashboard")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  activePage === "Dashboard" 
                    ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                    : "hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                Dashboard Petugas
              </button>
            )}

            <button
              id="menu-tamu"
              onClick={() => handlePageSelect("Tamu")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Tamu" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 text-slate-400" />
              Buku Tamu Langsung
            </button>

            <button
              id="menu-permasalahan"
              onClick={() => handlePageSelect("Permasalahan")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Permasalahan" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              Daftar Permasalahan
            </button>

            <button
              id="menu-solusi"
              onClick={() => handlePageSelect("Solusi")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Solusi" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <FileCheck className="w-4 h-4 text-slate-400" />
              Solusi & Kajian BPMP
            </button>

            <button
              id="menu-monitoring"
              onClick={() => handlePageSelect("Monitoring")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Monitoring" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              Monitoring Tindak Lanjut
            </button>

            <button
              id="menu-laporan"
              onClick={() => handlePageSelect("Laporan")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Laporan" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Laporan & Cetak Berkas
            </button>

            <button
              id="menu-pimpinan"
              onClick={() => handlePageSelect("Pimpinan")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Pimpinan" 
                  ? "bg-slate-800 text-white border-l-2 border-amber-500 pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              Dashboard Pimpinan
            </button>

            <button
              id="menu-ai"
              onClick={() => handlePageSelect("AI_Assistant")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "AI_Assistant" 
                  ? "bg-slate-800 text-white border-l-2 border-emerald-450 pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-emerald-400 animate-pulse" />
              Asisten AI (Gemini)
            </button>

            <button
              id="menu-pengaturan"
              onClick={() => handlePageSelect("Pengaturan")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activePage === "Pengaturan" 
                  ? "bg-slate-800 text-white border-l-2 border-[#EAB308] pl-3.5 shadow-sm" 
                  : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Pengaturan
            </button>
          </div>
        </div>

        {/* Sidebar Footer User Info status indicators */}
        <div className="p-4 border-t border-slate-850 bg-[#050811] text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bpmp-blue text-white flex justify-center items-center font-display font-bold text-sm shadow-sm border border-slate-700/50">
              {activeRole === "Pimpinan" ? "AH" : "RS"}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-200 block text-[11px] truncate leading-tight">
                {activeRole === "Pimpinan" ? "Aisun Hasan, S.Psi., MA" : "M. Rizky Syaaban"}
              </span>
              <span className="text-[10px] text-slate-500 block truncate font-medium">
                {activeRole}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. RESPONSIVE MOBILE SLIDE-OUT MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Container Panel */}
          <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-[#090D1A] text-slate-300 p-6 shadow-2xl animate-slide-right flex-col shrink-0">
            {/* Close Button Top */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <OfficialBpmpLogo className="w-8 h-8" />
                <div className="leading-none">
                  <span className="font-display font-black text-white text-xs block">SILAT BPMP</span>
                  <span className="text-[8px] text-[#EAB308] font-bold tracking-widest uppercase block mt-0.5">MALUKU UTARA</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrolling Navigation Inside Drawer */}
            <nav className="flex-1 overflow-y-auto pt-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block px-2 mb-2">Menu Utama</span>
                
                {activeRole !== "Pimpinan" && (
                  <button
                    onClick={() => handlePageSelect("Dashboard")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                      activePage === "Dashboard" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5 text-slate-400" />
                    Dashboard Petugas
                  </button>
                )}

                <button
                  onClick={() => handlePageSelect("Tamu")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Tamu" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <Users className="w-4.5 h-4.5 text-slate-400" />
                  Buku Tamu Langsung
                </button>

                <button
                  onClick={() => handlePageSelect("Permasalahan")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Permasalahan" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <AlertTriangle className="w-4.5 h-4.5 text-slate-400" />
                  Daftar Permasalahan
                </button>

                <button
                  onClick={() => handlePageSelect("Solusi")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Solusi" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <FileCheck className="w-4.5 h-4.5 text-slate-400" />
                  Solusi & Kajian BPMP
                </button>

                <button
                  onClick={() => handlePageSelect("Monitoring")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Monitoring" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-slate-400" />
                  Monitoring Tindak Lanjut
                </button>

                <button
                  onClick={() => handlePageSelect("Laporan")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Laporan" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <FileText className="w-4.5 h-4.5 text-slate-400" />
                  Laporan & Cetak Berkas
                </button>

                <button
                  onClick={() => handlePageSelect("Pimpinan")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Pimpinan" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <Star className="w-4.5 h-4.5 text-amber-500" />
                  Dashboard Pimpinan
                </button>

                <button
                  onClick={() => handlePageSelect("AI_Assistant")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "AI_Assistant" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <BrainCircuit className="w-4.5 h-4.5 text-emerald-400" />
                  Asisten AI (Gemini)
                </button>

                <button
                  onClick={() => handlePageSelect("Pengaturan")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                    activePage === "Pengaturan" ? "bg-slate-800 text-white" : "hover:bg-slate-800/50"
                  }`}
                >
                  <Settings className="w-4.5 h-4.5 text-slate-400" />
                  Pengaturan
                </button>
              </div>
            </nav>

            <div className="pt-4 border-t border-slate-800 mt-auto">
              <span className="text-[10px] text-slate-500 font-mono tracking-wide">{activeRole} Mode</span>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN APP SECTION (TOP NAVBAR + DASHBOARD PANEL SHELL) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 3.1 TOP COMPREHENSIVE NAVBAR */}
        <header className="bg-white border-b border-slate-200 shrink-0 px-4 md:px-6 py-2.5 flex justify-between items-center relative z-20 shadow-xs">
          
          <div className="flex items-center gap-3.5">
            {/* Hamburger Button on small screen */}
            <button
              id="hamburger-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-none transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Official KEMENDIKBUD/BPMP Logo and Identity Banner */}
            <div className="flex items-center gap-3">
              <OfficialBpmpLogo className="w-10 h-10 hidden sm:block animate-fade-in" />
              <div className="leading-tight select-none">
                <span className="text-[8px] font-extrabold text-[#0C4A6E] tracking-wider font-mono block uppercase">
                  KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA
                </span>
                <span className="text-xs md:text-sm font-display font-black text-slate-800 tracking-tight block">
                  BPMP Provinsi Maluku Utara • SILAT BPMP
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-medium">
                  <span className="bg-blue-50 text-bpmp-blue font-bold px-1.5 py-0.2 rounded border border-blue-150 text-[9px]">
                    Sistem Layanan Terpadu
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-350" />
                  <span className="text-slate-700 font-semibold">{getPageTitleLabel()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Database Connection Node Sync Button on Navbar */}
            <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 border border-slate-200 pl-3 pr-2.5 py-1.5 rounded-xl shadow-2xs">
              <span className={`inline-block w-2 h-2 rounded-full ${isLoadingLive ? "bg-amber-500 animate-pulse" : liveDbStatus?.includes("Gagal") ? "bg-amber-450" : "bg-emerald-500 animate-ping"}`}></span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold max-w-64 truncate">
                {isLoadingLive ? "Sinkronisasi..." : liveDbStatus || "Layanan Terkoneksi"}
              </span>
              <button 
                onClick={fetchLiveDatabase}
                disabled={isLoadingLive}
                title="Lakukan penyegaran database spreadsheet"
                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-bpmp-blue transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLive ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Clock Widget on Navbar */}
            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs font-mono font-medium border-r pr-4 border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime || "12:00:00"}</span>
            </div>

            {/* Interactive User Role testing gate on Navbar */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-0.5 shadow-2xs text-[10px]">
                {(["Administrator", "Petugas", "Pimpinan"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    id={`role-switch-${r.toLowerCase()}`}
                    onClick={() => {
                      setActiveRole(r);
                      if (r === "Pimpinan") {
                        handlePageSelect("Pimpinan");
                      } else {
                        handlePageSelect("Dashboard");
                      }
                    }}
                    className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                      activeRole === r 
                        ? "bg-bpmp-blue text-white shadow-xs" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </header>

        {/* 3.2 DASHBOARD SHIELD SHELL (SCROLLABLE CONTENT AREA) */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Pages switch router shell */}
            <div className="min-h-[500px]">
              
              {/* Core 9 SILAT pages (rendered via WireframeSandbox wrapper with hoisted state properties) */}
              {["Dashboard", "Tamu", "Permasalahan", "Solusi", "Monitoring", "Laporan", "Pimpinan", "AI_Assistant", "Pengaturan"].includes(activePage) && (
                <div className="bg-none">
                  <WireframeSandbox 
                    activePage={activePage as WireframePage}
                    setActivePage={(page) => setActivePage(page)}
                    activeRole={activeRole}
                    setActiveRole={(role) => {
                      setActiveRole(role);
                      if (role === "Pimpinan") {
                        setActivePage("Pimpinan");
                      }
                    }}
                    tamuList={tamuList}
                    setTamuList={setTamuList}
                    kasusList={kasusList}
                    setKasusList={setKasusList}
                    solusiList={solusiList}
                    setSolusiList={setSolusiList}
                    monitoringList={monitoringList}
                    setMonitoringList={setMonitoringList}
                    kepuasanList={kepuasanList}
                    setKepuasanList={setKepuasanList}
                    isLoadingLive={isLoadingLive}
                    setIsLoadingLive={setIsLoadingLive}
                    liveDbStatus={liveDbStatus}
                    setLiveDbStatus={setLiveDbStatus}
                    fetchLiveDatabase={fetchLiveDatabase}
                  />
                </div>
              )}

            </div>

          </div>

        </main>

        {/* BPMP Minimalist footer */}
        <footer className="bg-white border-t border-slate-150 text-[10px] text-slate-400 py-3 px-6 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>🇮🇩 Balai Penjaminan Mutu Pendidikan Provinsi Maluku Utara • SILAT BPMP © 2026</span>
          <span className="text-slate-500 font-mono">v1.0.0 • Kementerian Pendidikan Dasar dan Menengah RI</span>
        </footer>

      </div>

    </div>
  );
}
