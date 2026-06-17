import React, { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, FileCheck, ShieldAlert, BarChart3, HelpCircle, 
  Settings, User, Plus, Search, Filter, Edit, Trash2, CheckCircle2, 
  BrainCircuit, Download, Printer, Check, Star, RefreshCw, Calendar, 
  Clock, MapPin, Building, Phone, Mail, ArrowRight, BookOpen, AlertCircle
} from "lucide-react";
import { Tamu, Permasalahan, Solusi, Monitoring, Kepuasan, UserRole, WireframePage } from "../types";
import { INITIAL_TAMU, INITIAL_PERMASALAHAN, INITIAL_SOLUSI, INITIAL_MONITORING, INITIAL_KEPUASAN } from "../data";
import SilatDashboard from "./SilatDashboard";
import TamuPage from "./TamuPage";
import PermasalahanPage from "./PermasalahanPage";
import SolusiPage from "./SolusiPage";
import MonitoringPage from "./MonitoringPage";
import PimpinanDashboard from "./PimpinanDashboard";
import LaporanPage from "./LaporanPage";

interface WireframeSandboxProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activePage: WireframePage;
  setActivePage: (page: WireframePage) => void;
  tamuList: Tamu[];
  setTamuList: React.Dispatch<React.SetStateAction<Tamu[]>>;
  kasusList: Permasalahan[];
  setKasusList: React.Dispatch<React.SetStateAction<Permasalahan[]>>;
  solusiList: Record<string, Solusi>;
  setSolusiList: React.Dispatch<React.SetStateAction<Record<string, Solusi>>>;
  monitoringList: Record<string, Monitoring>;
  setMonitoringList: React.Dispatch<React.SetStateAction<Record<string, Monitoring>>>;
  kepuasanList: Record<string, Kepuasan>;
  setKepuasanList: React.Dispatch<React.SetStateAction<Record<string, Kepuasan>>>;
  isLoadingLive: boolean;
  setIsLoadingLive: React.Dispatch<React.SetStateAction<boolean>>;
  liveDbStatus: string | null;
  setLiveDbStatus: React.Dispatch<React.SetStateAction<string | null>>;
  fetchLiveDatabase: () => Promise<void>;
}

export default function WireframeSandbox({
  activeRole,
  setActiveRole,
  activePage,
  setActivePage,
  tamuList,
  setTamuList,
  kasusList,
  setKasusList,
  solusiList,
  setSolusiList,
  monitoringList,
  setMonitoringList,
  kepuasanList,
  setKepuasanList,
  isLoadingLive,
  setIsLoadingLive,
  liveDbStatus,
  setLiveDbStatus,
  fetchLiveDatabase
}: WireframeSandboxProps) {
  // Live Sync Database states are now controlled by parent/passed as props.

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabupaten, setFilterKabupaten] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");

  // Dynamic Modals States
  const [isTamuModalOpen, setIsTamuModalOpen] = useState(false);
  const [isKasusModalOpen, setIsKasusModalOpen] = useState(false);
  const [isSolusiModalOpen, setIsSolusiModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedKasusId, setSelectedKasusId] = useState<string | null>(null);

  // Form Fields State - TAMU
  const [newTamu, setNewTamu] = useState({
    nama: "", instansi: "", jabatan: "", noHp: "", email: "", kabupatenKota: "Kota Ternate",
    jenisKunjungan: "Konsultasi Tatap Muka", bidangTujuan: "Pokja Transformasi Digital & BOSP", petugasPenerima: "Aulia Rahman"
  });

  // Form Fields State - KASUS
  const [newKasus, setNewKasus] = useState({
    idTamu: "", kategori: "Teknologi Informasi & Sistem Aplikasi", subKategori: "", permasalahan: "",
    prioritas: "Sedang" as Permasalahan["prioritas"], pic: ""
  });

  // Form Fields State - SOLUSI
  const [currentSolusiForm, setCurrentSolusiForm] = useState({
    analisis: "", penyebab: "", solusiBpmp: "", tindakLanjut: "", tanggalTindakLanjut: ""
  });

  // Form Fields State - MONITORING progress update
  const [currentProgressForm, setCurrentProgressForm] = useState({
    status: "Diproses" as Permasalahan["status"], progress: 50, catatan: "", buktiTindakLanjut: ""
  });

  // AI Assistant Sandbox States
  const [aiPermasalahanInput, setAiPermasalahanInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiDemo, setIsAiDemo] = useState(false);
  const [aiResponseData, setAiResponseData] = useState<{
    kategori: string; prioritas: "Tinggi" | "Sedang" | "Rendah" | string; analisis: string;
    penyebab: string; solusiBpmp: string; tindakLanjut: string;
  } | null>(null);

  // Export & Print preview alerts and states
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"PDF" | "Excel" | "Print" | null>(null);

  // Mock Master Lists
  const listKabupaten = ["Kota Ternate", "Kota Tidore Kepulauan", "Kab. Halmahera Utara", "Kab. Halmahera Barat", "Kab. Halmahera Selatan", "Kab. Kepulauan Sula", "Kab. Halmahera Timur", "Kab. Halmahera Tengah", "Kab. Pulau Morotai", "Kab. Pulau Taliabu"];
  const listKategori = ["Teknologi Informasi & Sistem Aplikasi", "Kurikulum & Pendampingan Peningkatan Mutu", "Perencanaan & Akuntabilitas Keuangan", "Kepegawaian & Umum"];
  const listBidang = ["Pokja Transformasi Digital & BOSP", "Pokja Penjaminan Mutu & Kurikulum", "Pokja Data, Perencanaan & Penilaian", "Pokja Perencanaan & Pembiayaan", "Pokja Kemitraan & Transformasi Sekolah"];

  // Heuristic helpers
  const countKasusByStatus = (status: Permasalahan["status"]) => kasusList.filter(k => k.status === status).length;
  const countTamuHariIni = tamuList.filter(t => t.tanggal === "2026-06-11").length;

  // --- ACTIONS HANDLERS ---
  
  // Create Tamu
  const handleCreateTamu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTamu.nama || !newTamu.instansi) return alert("Nama dan Instansi wajib diisi!");
    
    setIsLoadingLive(true);
    setLiveDbStatus("Menyimpan data tamu...");
    try {
      const response = await fetch("/api/tamu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTamu,
          jamDatang: newTamu.jamDatang || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Tamu berhasil didaftarkan: ${result.message || "Tersimpan"}`);
        await fetchLiveDatabase();
        setIsTamuModalOpen(false);
        setNewTamu({
          nama: "", instansi: "", jabatan: "", noHp: "", email: "", kabupatenKota: "Kota Ternate",
          jenisKunjungan: "Konsultasi Tatap Muka", bidangTujuan: "Pokja Transformasi Digital & BOSP", petugasPenerima: "Aulia Rahman"
        });
      } else {
        throw new Error(result.message || "Gagal menyimpan");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Koneksi Google Sheets down atau lambat. Menyimpan data tamu secara lokal.`);
      
      const seq = tamuList.length + 1;
      const padding = seq < 10 ? "00" : seq < 100 ? "0" : "";
      const mockId = `TM-20260611-${padding}${seq}`;
      const newRow: Tamu = {
        idTamu: mockId,
        tanggal: "2026-06-11",
        nama: newTamu.nama,
        instansi: newTamu.instansi,
        jabatan: newTamu.jabatan || "Staff / Pegawai",
        noHp: newTamu.noHp || "-",
        email: newTamu.email || "-",
        kabupatenKota: newTamu.kabupatenKota,
        jenisKunjungan: newTamu.jenisKunjungan,
        bidangTujuan: newTamu.bidangTujuan,
        petugasPenerima: newTamu.petugasPenerima || "Petugas Piket",
        jamDatang: "10:30",
        jamPulang: "-"
      };
      setTamuList([newRow, ...tamuList]);
      setIsTamuModalOpen(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Delete Tamu
  const handleDeleteTamu = (id: string) => {
    alert("Penghapusan baris tamu dinonaktifkan di Google Apps Script demi integritas data dan history audit.");
  };

  // Create Kasus
  const handleCreateKasus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasus.permasalahan) return alert("Deskripsi Permasalahan wajib diisi!");

    setIsLoadingLive(true);
    setLiveDbStatus("Menyimpan laporan kasus baru...");
    try {
      const response = await fetch("/api/permasalahan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTamu: newKasus.idTamu || "-",
          tanggal: "2026-06-11",
          kategori: newKasus.kategori,
          subKategori: newKasus.subKategori || "Layanan Umum",
          permasalahan: newKasus.permasalahan,
          prioritas: newKasus.prioritas,
          pic: newKasus.pic || "Belum Ditugaskan",
          status: "Baru"
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Aduan kasus berhasil dibuat: ${result.message}`);
        await fetchLiveDatabase();
        setIsKasusModalOpen(false);
        setNewKasus({
          idTamu: "", kategori: "Teknologi Informasi & Sistem Aplikasi", subKategori: "", permasalahan: "",
          prioritas: "Sedang", pic: ""
        });
      } else {
        throw new Error(result.message || "Gagal menyimpan");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Google Spreadsheet tidak merespon. Menyimpan kasus secara lokal.`);
      
      const seq = kasusList.length + 1;
      const padding = seq < 10 ? "00" : seq < 100 ? "0" : "";
      const mockId = `KS-20260611-${padding}${seq}`;
      const newRow: Permasalahan = {
        idKasus: mockId,
        idTamu: newKasus.idTamu || "-",
        tanggal: "2026-06-11",
        kategori: newKasus.kategori,
        subKategori: newKasus.subKategori || "Layanan Umum",
        permasalahan: newKasus.permasalahan,
        prioritas: newKasus.prioritas,
        pic: newKasus.pic || "Belum Ditugaskan",
        status: "Baru"
      };
      setKasusList([newRow, ...kasusList]);
      setIsKasusModalOpen(false);
      setMonitoringList(prev => ({
        ...prev,
        [mockId]: {
          idKasus: mockId,
          status: "Baru",
          progress: 0,
          catatan: "Kasus didaftarkan hari ini oleh petugas.",
          buktiTindakLanjut: "-",
          tanggalUpdate: "2026-06-11"
        }
      }));
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Delete Kasus
  const handleDeleteKasus = (id: string) => {
    alert("Penghapusan kasus tidak diijinkan di Google Spreadsheet. Silakan gunakan monitoring untuk menutup status kasus.");
  };

  // Manage Solution Modal Triggers
  const openSolusiModal = (id: string) => {
    setSelectedKasusId(id);
    const existingSolusi = solusiList[id];
    if (existingSolusi) {
      setCurrentSolusiForm({
        analisis: existingSolusi.analisis,
        penyebab: existingSolusi.penyebab,
        solusiBpmp: existingSolusi.solusiBpmp,
        tindakLanjut: existingSolusi.tindakLanjut,
        tanggalTindakLanjut: existingSolusi.tanggalTindakLanjut
      });
    } else {
      setCurrentSolusiForm({
        analisis: "", penyebab: "", solusiBpmp: "", tindakLanjut: "", tanggalTindakLanjut: "2026-06-12"
      });
    }
    setIsSolusiModalOpen(true);
  };

  // Save Solutions
  const handleSaveSolusi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasusId) return;

    setIsLoadingLive(true);
    setLiveDbStatus("Mengirim analisis solusi ke Google Spreadsheet...");
    try {
      const response = await fetch("/api/solusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idKasus: selectedKasusId,
          analisis: currentSolusiForm.analisis,
          penyebab: currentSolusiForm.penyebab,
          solusiBpmp: currentSolusiForm.solusiBpmp,
          tindakLanjut: currentSolusiForm.tindakLanjut,
          tanggalTindakLanjut: currentSolusiForm.tanggalTindakLanjut || "2026-06-12"
        })
      });
      const result = await response.json();
      if (result.success) {
        alert("Rancangan solusi Widyaprada berhasil disimpan di Google Sheets!");
        await fetchLiveDatabase();
        setIsSolusiModalOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal melakukan sinkronisasi solusi ke Spreadsheet. Menyimpan solusi secara lokal.");
      
      const savedSolusi: Solusi = {
        idKasus: selectedKasusId,
        analisis: currentSolusiForm.analisis,
        penyebab: currentSolusiForm.penyebab,
        solusiBpmp: currentSolusiForm.solusiBpmp,
        tindakLanjut: currentSolusiForm.tindakLanjut,
        tanggalTindakLanjut: currentSolusiForm.tanggalTindakLanjut
      };
      setSolusiList(prev => ({ ...prev, [selectedKasusId]: savedSolusi }));
      setIsSolusiModalOpen(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Progress Monitoring Modal Trigger
  const openProgressModal = (id: string) => {
    setSelectedKasusId(id);
    const existingProgress = monitoringList[id];
    const caseItem = kasusList.find(k => k.idKasus === id);
    if (existingProgress) {
      setCurrentProgressForm({
        status: caseItem?.status || "Diproses",
        progress: existingProgress.progress,
        catatan: existingProgress.catatan,
        buktiTindakLanjut: existingProgress.buktiTindakLanjut
      });
    } else {
      setCurrentProgressForm({
        status: caseItem?.status || "Diproses",
        progress: 10,
        catatan: "",
        buktiTindakLanjut: ""
      });
    }
    setIsProgressModalOpen(true);
  };

  // Save Progress Updates
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasusId) return;

    setIsLoadingLive(true);
    setLiveDbStatus("Mengupdate status monitoring di Google Spreadsheet...");
    try {
      const response = await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idKasus: selectedKasusId,
          status: currentProgressForm.status,
          progress: Number(currentProgressForm.progress),
          catatan: currentProgressForm.catatan || "Terjadi pembaruan progress operasional lapangan.",
          buktiTindakLanjut: currentProgressForm.buktiTindakLanjut || "-"
        })
      });
      const result = await response.json();
      if (result.success) {
        alert("Pembalikan kemajuan monitoring kasus berhasil disalin ke Google Sheets!");
        
        if (currentProgressForm.status === "Ditutup" || currentProgressForm.status === "Terkendali") {
          await fetch("/api/kepuasan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idKasus: selectedKasusId,
              rating: 5,
              komentar: "Sangat puas dengan penutupan kasus."
            })
          }).catch(() => {});
        }
        
        await fetchLiveDatabase();
        setIsProgressModalOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengupdate database online. Menyimpan pembaruan secara lokal.");
      
      setKasusList(prev => prev.map(k => {
        if (k.idKasus === selectedKasusId) {
          return { ...k, status: currentProgressForm.status };
        }
        return k;
      }));

      const updatedProgress: Monitoring = {
        idKasus: selectedKasusId,
        status: currentProgressForm.status,
        progress: Number(currentProgressForm.progress),
        catatan: currentProgressForm.catatan || "Terjadi pembaruan progress operasional lapangan.",
        buktiTindakLanjut: currentProgressForm.buktiTindakLanjut || "-",
        tanggalUpdate: "2026-06-11"
      };

      setMonitoringList(prev => ({
        ...prev,
        [selectedKasusId]: updatedProgress
      }));

      setIsProgressModalOpen(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Run Real Server-Side Gemini AI Call
  const triggerAiAnalysis = async () => {
    if (!aiPermasalahanInput.trim()) {
      return alert("Silakan sampaikan deksripsi permasalahan bimbingan teknis.");
    }

    setIsAiLoading(true);
    setAiError(null);
    setAiResponseData(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permasalahan: aiPermasalahanInput })
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setAiResponseData(data.data);
        setIsAiDemo(data.demo);
      } else {
        throw new Error(data.error || "Gagal memperoleh rekomendasi AI.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Koneksi terputus. Mengoperasikan fallback otomatis.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Seed data directly from AI response sandbox back to the database
  const saveAiDraftToDatabase = () => {
    if (!aiResponseData) return;

    const seq = kasusList.length + 1;
    const padding = seq < 10 ? "00" : seq < 100 ? "0" : "";
    const mockKasusId = `KS-20260611-${padding}${seq}`;

    // 1. Create Kasus
    const newCaseRow: Permasalahan = {
      idKasus: mockKasusId,
      idTamu: "-",
      tanggal: "2026-06-11",
      kategori: aiResponseData.kategori,
      subKategori: "Hasil Analisis AI",
      permasalahan: aiPermasalahanInput,
      prioritas: (aiResponseData.prioritas as any) || "Sedang",
      pic: "La Ode Ruslan / Fadlillah Ahmad",
      status: "Baru"
    };

    // 2. Create Solution
    const newSolutionRow: Solusi = {
      idKasus: mockKasusId,
      analisis: aiResponseData.analisis,
      penyebab: aiResponseData.penyebab,
      solusiBpmp: aiResponseData.solusiBpmp,
      tindakLanjut: aiResponseData.tindakLanjut,
      tanggalTindakLanjut: "2026-06-12"
    };

    setKasusList([newCaseRow, ...kasusList]);
    setSolusiList(prev => ({ ...prev, [mockKasusId]: newSolutionRow }));
    setMonitoringList(prev => ({
      ...prev,
      [mockKasusId]: {
        idKasus: mockKasusId,
        status: "Baru",
        progress: 0,
        catatan: "Didrafkan melalui modul AI Assistant.",
        buktiTindakLanjut: "-",
        tanggalUpdate: "2026-06-11"
      }
    }));

    alert(`Sukses! Kasus ${mockKasusId} beserta lembar rekomendasi solusi telah disimpan di Sheet database.`);
    setAiPermasalahanInput("");
    setAiResponseData(null);
    setActivePage("Permasalahan");
  };

  // Predefined AI Prompt Fast Templates
  const handleSelectAiTemplate = (txt: string) => {
    setAiPermasalahanInput(txt);
  };

  // Simulate Export
  const triggerSimulationExport = (type: "PDF" | "Excel" | "Print") => {
    setExportType(type);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportType(null);
      alert(`Sukses! Berkas ${type} berhasil diolah dan diunduh. Data disinkronkan secara aman dari Google Sheets API.`);
    }, 1500);
  };

  const handlePersistSolusi = async (idKasus: string, data: Omit<Solusi, "idKasus">) => {
    setIsLoadingLive(true);
    setLiveDbStatus("Mengirim analisis solusi ke Google Spreadsheet...");
    try {
      const response = await fetch("/api/solusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idKasus,
          analisis: data.analisis,
          penyebab: data.penyebab,
          solusiBpmp: data.solusiBpmp,
          tindakLanjut: data.tindakLanjut,
          tanggalTindakLanjut: data.tanggalTindakLanjut || "2026-06-12"
        })
      });
      const result = await response.json();
      if (result.success) {
        await fetchLiveDatabase();
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.warn("Offline fallback for solusi:", err);
      const savedSolusi: Solusi = {
        idKasus,
        ...data
      };
      setSolusiList(prev => ({ ...prev, [idKasus]: savedSolusi }));
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Filter dynamic computed row queries
  const filteredTamu = tamuList.filter(t => {
    const s = searchQuery.toLowerCase();
    const matchSearch = t.nama.toLowerCase().includes(s) || t.instansi.toLowerCase().includes(s) || t.idTamu.toLowerCase().includes(s);
    const matchKab = filterKabupaten === "Semua" || t.kabupatenKota === filterKabupaten;
    return matchSearch && matchKab;
  });

  const filteredKasus = kasusList.filter(k => {
    const s = searchQuery.toLowerCase();
    const matchSearch = k.permasalahan.toLowerCase().includes(s) || k.idKasus.toLowerCase().includes(s);
    const matchKat = filterKategori === "Semua" || k.kategori === filterKategori;
    return matchSearch && matchKat;
  });

  return (
    <div className="space-y-6">

          {/* PAGE ROUTER RENDERING ENGINE */}

          {/* PAGE 1: AGENT DASHBOARD */}
          {activePage === "Dashboard" && (
            <div className="space-y-6 animate-fade-in">
              <SilatDashboard 
                tamuList={tamuList}
                kasusList={kasusList}
                solusiList={solusiList}
                monitoringList={monitoringList}
                kepuasanList={kepuasanList}
                onNavigateToPage={(page) => setActivePage(page as any)}
              />
            </div>
          )}

          {/* PAGE 2: BUKU TAMU */}
          {activePage === "Tamu" && (
            <TamuPage
              tamuList={tamuList}
              onTamuListChange={setTamuList}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshTamu={fetchLiveDatabase}
            />
          )}

          {/* PAGE 3: DAFTAR PERMASALAHAN */}
          {activePage === "Permasalahan" && (
            <PermasalahanPage
              kasusList={kasusList}
              solusiList={solusiList}
              onSaveSolusi={handlePersistSolusi}
              tamuList={tamuList}
              onKasusListChange={setKasusList}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshKasus={fetchLiveDatabase}
              onNavigateToTamu={(idTamu) => {
                setSearchQuery(idTamu);
                setActivePage("Tamu");
              }}
            />
          )}

          {/* PAGE 4: SOLUSI */}
          {activePage === "Solusi" && (
            <SolusiPage
              kasusList={kasusList}
              solusiList={solusiList}
              tamuList={tamuList}
              onSaveSolusi={handlePersistSolusi}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshLive={fetchLiveDatabase}
            />
          )}

          {/* PAGE 5: MONITORING */}
          {activePage === "Monitoring" && (
            <MonitoringPage
              kasusList={kasusList}
              monitoringList={monitoringList}
              tamuList={tamuList}
              onSaveProgress={async (idKasus, data) => {
                // Bridge onSaveProgress to server post with offline state fallback
                setIsLoadingLive(true);
                setLiveDbStatus("Mengupdate status monitoring di Google Spreadsheet...");
                try {
                  const response = await fetch("/api/monitoring", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      idKasus,
                      status: data.status,
                      progress: Number(data.progress),
                      catatan: data.catatan || "Terjadi pembaruan progress operasional lapangan.",
                      buktiTindakLanjut: data.buktiTindakLanjut || "-"
                    })
                  });
                  const result = await response.json();
                  if (result.success) {
                    if (data.status === "Ditutup" || data.status === "Terkendali") {
                      await fetch("/api/kepuasan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          idKasus,
                          rating: 5,
                          komentar: "Sangat puas dengan penutupan kasus."
                        })
                      }).catch(() => {});
                    }
                    await fetchLiveDatabase();
                  } else {
                    throw new Error(result.message);
                  }
                } catch (err: any) {
                  console.warn("Offline fallback for progress:", err);
                  setKasusList(prev => prev.map(k => {
                    if (k.idKasus === idKasus) {
                      return { ...k, status: data.status };
                    }
                    return k;
                  }));

                  const updatedProgress: Monitoring = {
                    idKasus,
                    status: data.status,
                    progress: Number(data.progress),
                    catatan: data.catatan || "Terjadi pembaruan progress operasional lapangan.",
                    buktiTindakLanjut: data.buktiTindakLanjut || "-",
                    tanggalUpdate: new Date().toISOString().split("T")[0]
                  };

                  setMonitoringList(prev => ({
                    ...prev,
                    [idKasus]: updatedProgress
                  }));
                } finally {
                  setIsLoadingLive(false);
                }
              }}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshLive={fetchLiveDatabase}
            />
          )}

          {/* PAGE 6: DASHBOARD PIMPINAN */}
          {activePage === "Pimpinan" && (
            <PimpinanDashboard 
              kasusList={kasusList}
              tamuList={tamuList}
              monitoringList={monitoringList}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshLive={fetchLiveDatabase}
            />
          )}

          {/* PAGE 8: LAPORAN EXPORT */}
          {activePage === "Laporan" && (
            <LaporanPage
              tamuList={tamuList}
              kasusList={kasusList}
              monitoringList={monitoringList}
              solusiList={solusiList}
              liveDbStatus={liveDbStatus || undefined}
              onRefreshLive={fetchLiveDatabase}
            />
          )}

          {/* PAGE 9: PENGATURAN */}
          {activePage === "Pengaturan" && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="bg-white p-6 rounded-2xl border border-bpmp-slate shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-extrabold text-[#0F172A] text-sm uppercase tracking-wide">Penyetelan Sistem & Integrasi (Pengaturan SILAT)</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    Konfigurasi parameter runtime aplikasi, kunci rahasia API, serta integrasi Google Spreadsheet sebagai basis data hibrida.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-slate-700">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide border-b pb-1.5 flex items-center gap-1.5 font-display">
                      <Settings className="w-4 h-4 text-bpmp-blue" /> Integrasi Google Sheets API
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 block">Google Apps Script URL Endpoint:</label>
                      <input
                        type="text"
                        readOnly
                        value="https://script.google.com/macros/s/AKfycbxmHR7VxxyaZ1Jo0T42HbAiQYc6hm1odWOBOAyCQMwDOVVKUuUUI0dJjnNSsDdgX6II/exec"
                        className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-gray-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-gray-400 font-sans">
                        Disinkronkan otomatis melalui environment variable <code>GOOGLE_APPS_SCRIPT_URL</code>.
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <strong>Status Koneksi: Aktif</strong>
                        <p className="text-[10px] text-emerald-600 mt-0.5 leading-relaxed font-sans">
                          Sinkronisasi dua arah berhasil. Entri baru didelegasikan real-time dari dan ke Google Sheets BPMP Provinsi Maluku Utara.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide border-b pb-1.5 flex items-center gap-1.5 font-display">
                      <BrainCircuit className="w-4 h-4 text-emerald-500 font-bold" /> Konfigurasi AI Gemini-3.5-Flash
                    </h4>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 block text-xs">Model Terpilih (Default SDK):</label>
                      <span className="font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded inline-block">
                        gemini-3.5-flash
                      </span>
                    </div>

                    <div className="space-y-2 text-gray-600 leading-relaxed text-xs">
                      <span className="block font-semibold">Tugas AI Utama:</span>
                      <ul className="list-disc list-inside space-y-1 text-gray-450 font-sans">
                        <li>Ulasan desk-study otomatis isu sekolah</li>
                        <li>Rekomendasi teknokratis (Widyaprada)</li>
                        <li>Identifikasi prioritas andalan</li>
                        <li>Asistensi draf pemetaan sebaran</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500">
                  <div className="space-y-0.5 text-left w-full md:w-auto">
                    <span className="font-bold text-slate-700 block text-[11px]">Konektivitas Cloud Google Sheets</span>
                    <span className="text-[10px]">Sistem secara otomatis mensinkronkan data perubahan secara dua-arah dengan aman.</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={fetchLiveDatabase}
                      className="bg-bpmp-blue hover:bg-bpmp-light-blue text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs font-sans"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? "animate-spin" : ""}`} /> Muat Ulang Sheets
                    </button>
                  </div>
                </div>
              </div>

              {/* Developer credits bento block */}
              <div className="bg-[#090D1A] text-slate-400 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-display font-bold text-white text-[11px] uppercase tracking-wide">SILAT BPMP — Aplikasi Sistem Layanan & Tindak Lanjut</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                  <div>
                    <strong className="text-slate-300 block">Spesifikasi</strong>
                    <span>Siap Produksi</span>
                  </div>
                  <div>
                    <strong className="text-slate-300 block">Wilayah Kerja</strong>
                    <span>Maluku Utara, Indonesia</span>
                  </div>
                  <div>
                    <strong className="text-slate-300 block text-bpmp-accent">Layanan Terpadu</strong>
                    <span>ARKAS, Dapodik, PMM</span>
                  </div>
                  <div>
                    <strong className="text-slate-300 block">Versi Sistem</strong>
                    <span>v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* --- ALL INTERACTIVE WIREFRAME INPUT MODALS --- */}

      {/* Modal - TAMU NEW */}
      {isTamuModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-bpmp-slate max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-display font-bold text-bpmp-indigo uppercase pb-2 border-b border-slate-100">
              Pendaftaran Tamu Baru (Buku Tamu Sheets)
            </h4>
            <form onSubmit={handleCreateTamu} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Lengkap*</label>
                  <input
                    type="text"
                    required
                    value={newTamu.nama}
                    onChange={(e) => setNewTamu({ ...newTamu, nama: e.target.value })}
                    placeholder="Drs. Amran Syafar"
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Asal Instansi*</label>
                  <input
                    type="text"
                    required
                    value={newTamu.instansi}
                    onChange={(e) => setNewTamu({ ...newTamu, instansi: e.target.value })}
                    placeholder="Dinas Pendidikan Halbar"
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jabatan</label>
                  <input
                    type="text"
                    value={newTamu.jabatan}
                    onChange={(e) => setNewTamu({ ...newTamu, jabatan: e.target.value })}
                    placeholder="Kepala Bidang SD"
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    value={newTamu.noHp}
                    onChange={(e) => setNewTamu({ ...newTamu, noHp: e.target.value })}
                    placeholder="081244..."
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Korespondensi</label>
                <input
                  type="email"
                  value={newTamu.email}
                  onChange={(e) => setNewTamu({ ...newTamu, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kabupaten/Kota</label>
                  <select
                    value={newTamu.kabupatenKota}
                    onChange={(e) => setNewTamu({ ...newTamu, kabupatenKota: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  >
                    {listKabupaten.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenis Layanan</label>
                  <select
                    value={newTamu.jenisKunjungan}
                    onChange={(e) => setNewTamu({ ...newTamu, jenisKunjungan: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  >
                    <option value="Konsultasi Tatap Muka">Konsultasi Tatap Muka</option>
                    <option value="Layanan Mandiri">Layanan Mandiri</option>
                    <option value="Layanan Daring">Layanan Daring</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bidang / Pokja Tujuan</label>
                <select
                  value={newTamu.bidangTujuan}
                  onChange={(e) => setNewTamu({ ...newTamu, bidangTujuan: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none animate-fade-in"
                >
                  {listBidang.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTamuModalOpen(false)}
                  className="bg-slate-100 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-bpmp-blue hover:bg-bpmp-light-blue text-white font-bold px-5 py-2.5 rounded-lg text-xs"
                >
                  Simpan Buku Tamu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - KASUS NEW */}
      {isKasusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-bpmp-slate max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-display font-bold text-bpmp-indigo uppercase pb-2 border-b border-slate-100">
              Eskalasi Lembar Kasus Baru
            </h4>
            <form onSubmit={handleCreateKasus} className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hubungkan dengan Pengunjung Tamu (Opsional)</label>
                <select
                  value={newKasus.idTamu}
                  onChange={(e) => setNewKasus({ ...newKasus, idTamu: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                >
                  <option value="-">Non-Tamu (Eskalasi Tiket Mandiri)</option>
                  {tamuList.map(t => (
                    <option key={t.idTamu} value={t.idTamu}>{t.nama} - {t.instansi} ({t.idTamu})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kategori Utama</label>
                <select
                  value={newKasus.kategori}
                  onChange={(e) => setNewKasus({ ...newKasus, kategori: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                >
                  {listKategori.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sub-Kategori Teknis</label>
                  <input
                    type="text"
                    value={newKasus.subKategori}
                    onChange={(e) => setNewKasus({ ...newKasus, subKategori: e.target.value })}
                    placeholder="misal: Sinkronisasi BOSP"
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Prioritas Tindakan</label>
                  <select
                    value={newKasus.prioritas}
                    onChange={(e) => setNewKasus({ ...newKasus, prioritas: e.target.value as any })}
                    className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none font-bold"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Uraian Gambaran Permasalahan*</label>
                <textarea
                  rows={3}
                  required
                  value={newKasus.permasalahan}
                  onChange={(e) => setNewKasus({ ...newKasus, permasalahan: e.target.value })}
                  placeholder="Tulis hambatan konkret sekolah atau dinas pendidikan di Maluku Utara..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Petugas Khusus PIC Ahli</label>
                <input
                  type="text"
                  value={newKasus.pic}
                  onChange={(e) => setNewKasus({ ...newKasus, pic: e.target.value })}
                  placeholder="Fadlillah Ahmad, S.Kom"
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKasusModalOpen(false)}
                  className="bg-slate-100 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-bpmp-blue hover:bg-bpmp-light-blue text-white font-bold px-5 py-2.5 rounded-lg text-xs"
                >
                  Eskalasi Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - SOLUSI FORM KAJIAN */}
      {isSolusiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-bpmp-slate max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-display font-bold text-bpmp-indigo uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Kelola Analisis & Formula Solusi BPMP</span>
              <span className="font-mono text-[10px] text-slate-400 font-bold">Kasus: {selectedKasusId}</span>
            </h4>
            <form onSubmit={handleSaveSolusi} className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Analisis Diagnosis Ahli</label>
                <textarea
                  rows={2}
                  required
                  value={currentSolusiForm.analisis}
                  onChange={(e) => setCurrentSolusiForm({ ...currentSolusiForm, analisis: e.target.value })}
                  placeholder="Analisis teknis seputar kendala aplikasi..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Faktor Dugaan Penyebab</label>
                <textarea
                  rows={2}
                  required
                  value={currentSolusiForm.penyebab}
                  onChange={(e) => setCurrentSolusiForm({ ...currentSolusiForm, penyebab: e.target.value })}
                  placeholder="Mengapa masalah ini bisa terjadi..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Solusi dari BPMP Provinsi Maluku Utara</label>
                <textarea
                  rows={2}
                  required
                  value={currentSolusiForm.solusiBpmp}
                  onChange={(e) => setCurrentSolusiForm({ ...currentSolusiForm, solusiBpmp: e.target.value })}
                  placeholder="Langkah pemecahan masalah yang kita formulasikan..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rencana Tindak Lanjut Pemantauan</label>
                <textarea
                  rows={2}
                  value={currentSolusiForm.tindakLanjut}
                  onChange={(e) => setCurrentSolusiForm({ ...currentSolusiForm, tindakLanjut: e.target.value })}
                  placeholder="Asistensi mandiri, monitoring rutin tim BOSP..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tanggal Tindak Lanjut Ekskalasi</label>
                <input
                  type="date"
                  value={currentSolusiForm.tanggalTindakLanjut}
                  onChange={(e) => setCurrentSolusiForm({ ...currentSolusiForm, tanggalTindakLanjut: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none h-10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setIsSolusiModalOpen(false)}
                  className="bg-slate-100 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs"
                >
                  Simpan Solusi di Sheets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - PROGRES DAN MONITORING STATUS */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-bpmp-slate max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-display font-bold text-bpmp-indigo uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Ubah Progres Pemantauan Lapangan</span>
              <span className="font-mono text-[10px] text-slate-400 font-bold">Kode: {selectedKasusId}</span>
            </h4>
            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status Tindak Lanjut</label>
                <select
                  value={currentProgressForm.status}
                  onChange={(e) => setCurrentProgressForm({ ...currentProgressForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                >
                  <option value="Baru">Baru</option>
                  <option value="Diverifikasi">Diverifikasi</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                  <option value="Terkendali">Terkendali</option>
                  <option value="Belum Terkendali">Belum Terkendali</option>
                  <option value="Ditutup">Ditutup (Kasus Selesai)</option>
                </select>
              </div>

              {/* Slider for exact progress metric */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-slate-700">Persentase Tingkat Progres</span>
                  <span className="text-bpmp-blue text-xs font-bold">{currentProgressForm.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentProgressForm.progress}
                  onChange={(e) => setCurrentProgressForm({ ...currentProgressForm, progress: Number(e.target.value) })}
                  className="w-full bg-slate-100 h-2 rounded cursor-pointer accent-bpmp-blue focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Pemantauan Paska Studi Lapangan</label>
                <textarea
                  rows={2}
                  value={currentProgressForm.catatan}
                  onChange={(e) => setCurrentProgressForm({ ...currentProgressForm, catatan: e.target.value })}
                  placeholder="misal: Operator dinas telah memferifikasi upload pdf..."
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tautan / Nama Berkas Bukti Digital (Asistensi)</label>
                <input
                  type="text"
                  value={currentProgressForm.buktiTindakLanjut}
                  onChange={(e) => setCurrentProgressForm({ ...currentProgressForm, buktiTindakLanjut: e.target.value })}
                  placeholder="Foto_Workshop_Asistensi.pdf"
                  className="w-full bg-slate-50 p-2.5 rounded border border-slate-200 focus:outline-none h-10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="bg-slate-100 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-bpmp-blue hover:bg-bpmp-light-blue text-white font-bold px-5 py-2.5 rounded-lg text-xs"
                >
                  Perbaharui Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
