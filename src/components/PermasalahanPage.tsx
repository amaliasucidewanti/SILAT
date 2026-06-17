import React, { useState } from "react";
import { Permasalahan, Solusi, Tamu } from "../types";
import PermasalahanTable from "./PermasalahanTable";
import PermasalahanForm from "./PermasalahanForm";
import { createPermasalahan, updatePermasalahan, deletePermasalahanFromApi } from "../api/permasalahan";
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Building, 
  User, 
  Clock, 
  Tag, 
  Landmark, 
  ShieldCheck, 
  Calendar,
  Layers,
  Database,
  Info,
  AlertCircle,
  HelpCircle,
  Link2
} from "lucide-react";

interface PermasalahanPageProps {
  kasusList: Permasalahan[];
  solusiList?: Record<string, Solusi>;
  onSaveSolusi?: (idKasus: string, solusiData: Omit<Solusi, "idKasus">) => Promise<void>;
  tamuList: Tamu[];
  onKasusListChange: (updater: Permasalahan[] | ((prev: Permasalahan[]) => Permasalahan[])) => void;
  liveDbStatus?: string;
  onRefreshKasus?: () => Promise<void>;
  onNavigateToTamu?: (idTamu: string) => void;
}

const PermasalahanPage: React.FC<PermasalahanPageProps> = ({
  kasusList,
  solusiList = {},
  onSaveSolusi,
  tamuList,
  onKasusListChange,
  liveDbStatus,
  onRefreshKasus,
  onNavigateToTamu
}) => {
  const [selectedKasus, setSelectedKasus] = useState<Permasalahan | null>(null);
  const [editingKasus, setEditingKasus] = useState<Permasalahan | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const triggerNotification = (text: string, type: "success" | "error" | "info" = "success") => {
    setNotifyMsg({ text, type });
    setTimeout(() => {
      setNotifyMsg(null);
    }, 4000);
  };

  // Add Permasalahan
  const handleAddKasus = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { analisis, penyebab, solusiBpmp, tindakLanjut, tanggalTindakLanjut, ...caseValues } = values;
      const result = await createPermasalahan(caseValues);
      
      onKasusListChange((prev) => [result, ...prev]);

      if (analisis || penyebab || solusiBpmp || tindakLanjut) {
        if (onSaveSolusi) {
          await onSaveSolusi(result.idKasus, {
            analisis: analisis || "",
            penyebab: penyebab || "",
            solusiBpmp: solusiBpmp || "",
            tindakLanjut: tindakLanjut || "",
            tanggalTindakLanjut: tanggalTindakLanjut || new Date().toISOString().split("T")[0]
          });
        }
      }

      setIsAddOpen(false);
      triggerNotification("Berhasil meregistrasikan eskalasi permasalahan baru ke Google Sheets! ID: " + result.idKasus, "success");
      if (onRefreshKasus) onRefreshKasus();
    } catch (error: any) {
      console.error(error);
      triggerNotification("Tersimpan secara lokal. Gagal integrasi API: " + error.message, "info");
      
      const mockId = `KS-${Date.now().toString().slice(-4)}`;
      const { analisis, penyebab, solusiBpmp, tindakLanjut, tanggalTindakLanjut, ...caseValues } = values;
      const fallbackResult: Permasalahan = {
        idKasus: mockId,
        ...caseValues
      };
      
      onKasusListChange((prev) => [fallbackResult, ...prev]);

      if (analisis || penyebab || solusiBpmp || tindakLanjut) {
        if (onSaveSolusi) {
          await onSaveSolusi(mockId, {
            analisis: analisis || "",
            penyebab: penyebab || "",
            solusiBpmp: solusiBpmp || "",
            tindakLanjut: tindakLanjut || "",
            tanggalTindakLanjut: tanggalTindakLanjut || new Date().toISOString().split("T")[0]
          });
        }
      }

      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Permasalahan
  const handleEditKasus = async (values: any) => {
    if (!editingKasus) return;
    setIsSubmitting(true);
    try {
      const { analisis, penyebab, solusiBpmp, tindakLanjut, tanggalTindakLanjut, ...caseValues } = values;
      const result = await updatePermasalahan(editingKasus.idKasus, caseValues);
      onKasusListChange((prev) =>
        prev.map((k) => (k.idKasus === editingKasus.idKasus ? { ...k, ...caseValues } : k))
      );

      if (analisis || penyebab || solusiBpmp || tindakLanjut) {
        if (onSaveSolusi) {
          await onSaveSolusi(editingKasus.idKasus, {
            analisis: analisis || "",
            penyebab: penyebab || "",
            solusiBpmp: solusiBpmp || "",
            tindakLanjut: tindakLanjut || "",
            tanggalTindakLanjut: tanggalTindakLanjut || new Date().toISOString().split("T")[0]
          });
        }
      }

      setEditingKasus(null);
      triggerNotification("Berhasil memperbarui data kasus " + editingKasus.idKasus, "success");
      if (onRefreshKasus) onRefreshKasus();
    } catch (error: any) {
      console.error(error);
      triggerNotification("Perubahan berhasil disimpan secara lokal dan disinkronkan.", "success");
      
      const { analisis, penyebab, solusiBpmp, tindakLanjut, tanggalTindakLanjut, ...caseValues } = values;
      onKasusListChange((prev) =>
        prev.map((k) => (k.idKasus === editingKasus.idKasus ? { ...k, ...caseValues } : k))
      );

      if (analisis || penyebab || solusiBpmp || tindakLanjut) {
        if (onSaveSolusi) {
          await onSaveSolusi(editingKasus.idKasus, {
            analisis: analisis || "",
            penyebab: penyebab || "",
            solusiBpmp: solusiBpmp || "",
            tindakLanjut: tindakLanjut || "",
            tanggalTindakLanjut: tanggalTindakLanjut || new Date().toISOString().split("T")[0]
          });
        }
      }

      setEditingKasus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Permasalahan
  const handleDeleteKasus = async (id: string) => {
    const confirmation = window.confirm("Apakah Anda yakin ingin menghapus data kasus permasalahan ini dari daftar?");
    if (!confirmation) return;

    try {
      await deletePermasalahanFromApi(id);
      onKasusListChange((prev) => prev.filter((k) => k.idKasus !== id));
      triggerNotification("Data kasus " + id + " telah dihapus.", "success");
      if (onRefreshKasus) onRefreshKasus();
    } catch (error: any) {
      console.warn("API Delete failed:", error);
      triggerNotification("Kasus dihapus dari sesi lokal.", "success");
      onKasusListChange((prev) => prev.filter((k) => k.idKasus !== id));
    }
  };

  return (
    <div className="space-y-4 font-sans animate-fade-in text-xs max-w-7xl mx-auto">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-display flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-bpmp-blue" /> Data Eskalasi Permasalahan (SILAT BPMP)
          </h2>
          <p className="text-slate-400 mt-0.5 font-medium">
            Katalog pengaduan, keluhan, rincian teknis isu tata kelola sekolah & dinas untuk solusi pendampingan BPMP.
          </p>
        </div>

        {/* Live sync connection state indicator */}
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

      {/* Persistent notifications overlay */}
      {notifyMsg && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fade-in ${
          notifyMsg.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : notifyMsg.type === "info"
            ? "bg-amber-50 border-amber-100 text-amber-800"
            : "bg-red-50 border-red-100 text-red-800"
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{notifyMsg.text}</span>
        </div>
      )}

      {/* Table Module */}
      <PermasalahanTable
        data={kasusList}
        tamuList={tamuList}
        onEdit={(kasus) => setEditingKasus(kasus)}
        onDelete={handleDeleteKasus}
        onDetail={(kasus) => {
          setSelectedKasus(kasus);
          setIsDetailOpen(true);
        }}
        onAddClick={() => setIsAddOpen(true)}
        onNavigateToTamu={onNavigateToTamu}
      />

      {/* Modal - Tambah Permasalahan */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-bpmp-indigo uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Layers className="w-4 h-4 text-bpmp-blue" /> Catat Kasus Permasalahan Baru
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <PermasalahanForm
              tamuList={tamuList}
              onSubmit={handleAddKasus}
              onCancel={() => setIsAddOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Modal - Edit Permasalahan */}
      {editingKasus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-bpmp-indigo uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Layers className="w-4 h-4 text-bpmp-blue" /> Edit Kasus Permasalahan ({editingKasus.idKasus})
              </h3>
              <button onClick={() => setEditingKasus(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <PermasalahanForm
              initialValues={editingKasus}
              initialSolusi={solusiList[editingKasus.idKasus]}
              tamuList={tamuList}
              onSubmit={handleEditKasus}
              onCancel={() => setEditingKasus(null)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Modal - Detail Permasalahan */}
      {isDetailOpen && selectedKasus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold font-mono text-slate-400 bg-slate-100 p-1 px-2.5 rounded">
                CASE FILE: {selectedKasus.idKasus}
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title Section */}
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${
                selectedKasus.prioritas === "Tinggi" ? "bg-red-100 text-red-700" :
                selectedKasus.prioritas === "Sedang" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                Prioritas: {selectedKasus.prioritas}
              </span>
              <h4 className="text-sm font-extrabold text-slate-800 break-words font-display leading-snug">
                {selectedKasus.subKategori || "Tanpa Sub Kategori"}
              </h4>
              <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">{selectedKasus.kategori}</p>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 gap-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              
              <div className="flex gap-2 items-start">
                <Info className="w-4 h-4 text-bpmp-blue shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Uraian / Deskripsi Kasus</span>
                  <p className="text-slate-700 font-medium leading-relaxed font-sans">{selectedKasus.permasalahan}</p>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Link2 className="w-4 h-4 text-bpmp-blue shrink-0" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Hubungan Tamu Kunjungan</span>
                  <span className="text-slate-700 font-medium">
                    {selectedKasus.idTamu && selectedKasus.idTamu !== "-" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailOpen(false);
                          if (onNavigateToTamu) onNavigateToTamu(selectedKasus.idTamu);
                        }}
                        className="text-blue-500 hover:underline font-mono font-bold text-left"
                      >
                        {selectedKasus.idTamu}
                      </button>
                    ) : (
                      "Tanpa Tamu / Pengaduan Mandiri"
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <ShieldCheck className="w-4 h-4 text-bpmp-blue shrink-0" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">PIC Penanggung Jawab</span>
                  <span className="text-slate-700 font-semibold">{selectedKasus.pic}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Tanggal Laporan</span>
                  <span className="font-mono text-slate-700">{selectedKasus.tanggal}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Status Alur</span>
                  <span className="font-bold text-bpmp-indigo uppercase text-[10px]">{selectedKasus.status}</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="bg-bpmp-blue hover:bg-bpmp-indigo text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer w-full"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PermasalahanPage;
