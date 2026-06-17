import React, { useState, useMemo } from "react";
import { Tamu, Permasalahan, Monitoring, Solusi } from "../types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, 
  Printer, 
  FileText, 
  TableProperties, 
  CheckCircle2, 
  Database,
  CloudLightning,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  FileCheck2,
  CalendarDays,
  ListFilter
} from "lucide-react";

interface LaporanPageProps {
  tamuList: Tamu[];
  kasusList: Permasalahan[];
  monitoringList: Record<string, Monitoring>;
  solusiList: Record<string, Solusi>;
  liveDbStatus?: string;
  onRefreshLive?: () => Promise<void>;
}

export const LaporanPage: React.FC<LaporanPageProps> = ({
  tamuList = [],
  kasusList = [],
  monitoringList = {},
  solusiList = {},
  liveDbStatus,
  onRefreshLive
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"Semua" | "Tamu" | "Permasalahan" | "Monitoring" | "Dashboard">("Semua");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  
  // Local time anchor simulation
  const CURRENT_DATE_STR = "2026-06-11";

  // Filter states
  const [filterKabupaten, setFilterKabupaten] = useState("Semua");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-30");

  const uniqueKabupaten = useMemo(() => {
    return Array.from(new Set(tamuList.map(t => t.kabupatenKota).filter(Boolean)));
  }, [tamuList]);

  // Filtered lists
  const filteredTamuList = useMemo(() => {
    let result = tamuList;
    if (filterKabupaten !== "Semua") {
      result = result.filter(t => t.kabupatenKota === filterKabupaten);
    }
    if (startDate) {
      result = result.filter(t => t.tanggal >= startDate);
    }
    if (endDate) {
      result = result.filter(t => t.tanggal <= endDate);
    }
    return result;
  }, [tamuList, filterKabupaten, startDate, endDate]);

  const filteredKasusList = useMemo(() => {
    let result = kasusList;
    if (filterKabupaten !== "Semua") {
      result = result.filter(k => {
        const matchTamu = tamuList.find(t => t.idTamu === k.idTamu);
        return matchTamu?.kabupatenKota === filterKabupaten;
      });
    }
    if (startDate) {
      result = result.filter(k => k.tanggal >= startDate);
    }
    if (endDate) {
      result = result.filter(k => k.tanggal <= endDate);
    }
    return result;
  }, [kasusList, tamuList, filterKabupaten, startDate, endDate]);

  // Dashboard calculation data
  const dashboardSummaryStats = useMemo(() => {
    const totalT = filteredTamuList.length;
    const totalK = filteredKasusList.length;
    const resolvedK = filteredKasusList.filter(k => k.status === "Ditutup" || k.status === "Terkendali").length;
    const unresolvedK = totalK - resolvedK;
    
    // cases > 30 days
    const overdueK = filteredKasusList.filter(k => {
      const unresolved = k.status !== "Ditutup" && k.status !== "Terkendali";
      if (!unresolved) return false;
      const caseDate = new Date(k.tanggal);
      const diffTime = new Date(CURRENT_DATE_STR).getTime() - caseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).length;

    return {
      totalTamu: totalT,
      totalKasus: totalK,
      resolvedKasus: resolvedK,
      unresolvedKasus: unresolvedK,
      overdueKasus: overdueK,
      percentageSolved: totalK > 0 ? Math.round((resolvedK / totalK) * 100) : 0
    };
  }, [filteredTamuList, filteredKasusList]);

  // 1. EXCEL EXPORT (Multiple sheets inside a single workbook)
  const handleExportExcel = (targetType: typeof activeSubTab) => {
    setIsProcessing(true);
    setProcessingMsg(`Menyusun spreadsheet Excel (.xlsx) untuk kriteria: ${targetType === "Semua" ? "Seluruh Halaman database" : targetType}...`);
    
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Data Buku Tamu
        if (targetType === "Semua" || targetType === "Tamu") {
          const tamuRows = filteredTamuList.map(t => ({
            "ID Tamu": t.idTamu,
            "Tanggal Kunjungan": t.tanggal,
            "Waktu Kunjungan": `${t.jamDatang} s.d ${t.jamPulang || "-"}`,
            "Nama Tamu": t.nama,
            "Instansi / Lembaga": t.instansi,
            "Jabatan Organisasi": t.jabatan,
            "Nomor Telepon/HP": t.noHp,
            "Email": t.email,
            "Kabupaten/Kota": t.kabupatenKota,
            "Jenis Kunjungan": t.jenisKunjungan,
            "Sektor/Unit Dituju": t.bidangTujuan,
            "Petugas Penerima": t.petugasPenerima
          }));
          const wsTamu = XLSX.utils.json_to_sheet(tamuRows);
          XLSX.utils.book_append_sheet(wb, wsTamu, "Buku Tamu");
        }

        // Sheet 2: Isu Permasalahan
        if (targetType === "Semua" || targetType === "Permasalahan") {
          const kasusRows = filteredKasusList.map(k => {
            const sol = solusiList[k.idKasus];
            return {
              "ID Kasus": k.idKasus,
              "ID Tamu Terkait": k.idTamu,
              "Tanggal Masuk": k.tanggal,
              "Kategori Pengaduan": k.kategori,
              "Sub-Kategori Urusan": k.subKategori,
              "Deskripsi Kejadian Masalah": k.permasalahan,
              "Tingkat Urgensi": k.prioritas,
              "PIC Ahli Widyaprada": k.pic,
              "Status Kelayakan": k.status,
              "Detail Akar Penyebab": sol?.penyebab || "-",
              "Rancangan Solusi BPMP": sol?.solusiBpmp || "-",
              "Langkah Tindak Lanjut": sol?.tindakLanjut || "-"
            };
          });
          const wsKasus = XLSX.utils.json_to_sheet(kasusRows);
          XLSX.utils.book_append_sheet(wb, wsKasus, "Permasalahan & Solusi");
        }

        // Sheet 3: Monitoring & Progres
        if (targetType === "Semua" || targetType === "Monitoring") {
          const monitoringRows = filteredKasusList.map(k => {
            const mon = monitoringList[k.idKasus] || {};
            return {
              "ID Kasus": k.idKasus,
              "Permasalahan Utama": k.permasalahan,
              "PIC Ditunjuk": k.pic,
              "Status Terkini": k.status,
              "Tingkat Penyelesaian (%)": mon.progress !== undefined ? `${mon.progress}%` : "0%",
              "Catatan Lapangan Ahli": mon.catatan || "Belum ada update mitigasi",
              "Dokumen/Bukti Pendukung": mon.buktiTindakLanjut || "-",
              "Waktu Update Terakhir": mon.tanggalUpdate || "-"
            };
          });
          const wsMon = XLSX.utils.json_to_sheet(monitoringRows);
          XLSX.utils.book_append_sheet(wb, wsMon, "Status Monitoring");
        }

        // Sheet 4: Dashboard ringkasan eksekutif
        if (targetType === "Semua" || targetType === "Dashboard") {
          const dashboardRows = [
            { "Variabel Kinerja Organisasi": "Total Kehadiran Tamu Satuan Pendidikan & Dinas", "Nilai Kuantitatif": dashboardSummaryStats.totalTamu, "Satuan Ukur": "Orang / Entri Buku", "Klasifikasi": filterKabupaten === "Semua" ? "Provinsi Maluku Utara" : `Kawasan ${filterKabupaten}` },
            { "Variabel Kinerja Organisasi": "Laporan Kasus Urusan Mutu Sekolah Teregistrasi", "Nilai Kuantitatif": dashboardSummaryStats.totalKasus, "Satuan Ukur": "Pengaduan Lapangan", "Klasifikasi": "Laporan Masuk" },
            { "Variabel Kinerja Organisasi": "Jumlah Kasus Terselesaikan (Terkendali/Ditutup)", "Nilai Kuantitatif": dashboardSummaryStats.resolvedKasus, "Satuan Ukur": "Kasus Berkeputusan", "Klasifikasi": `${dashboardSummaryStats.percentageSolved}% Efisiensi Kelompok Kerja` },
            { "Variabel Kinerja Organisasi": "Jumlah Kasus Masih Berproses (Terbuka/Draf)", "Nilai Kuantitatif": dashboardSummaryStats.unresolvedKasus, "Satuan Ukur": "Tunggakan Kerja", "Klasifikasi": "Kebutuhan Desk-study" },
            { "Variabel Kinerja Organisasi": "Kasus Overdue Menumpuk (> 30 Hari)", "Nilai Kuantitatif": dashboardSummaryStats.overdueKasus, "Satuan Ukur": "Kasus Alarm Kritis", "Klasifikasi": "Urgensi Escalate Pimpinan" }
          ];
          const wsDash = XLSX.utils.json_to_sheet(dashboardRows);
          XLSX.utils.book_append_sheet(wb, wsDash, "Ringkasan Pimpinan");
        }

        // Trigger download
        const suffix = filterKabupaten === "Semua" ? "Provinsi" : filterKabupaten.replace(/\s+/g, "_");
        XLSX.writeFile(wb, `REKAP_SILAT_BPMP_MALUT_${targetType.toUpperCase()}_${suffix}.xlsx`);
      } catch (err) {
        console.error("Error exporting Excel: ", err);
        alert("Gagal mengekspor spreadsheet. Detil kesalahan: " + (err as Error).message);
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  // 2. PDF EXPORT (With Official Letterhead & Layout style)
  const handleExportPDF = (targetType: typeof activeSubTab) => {
    setIsProcessing(true);
    setProcessingMsg(`Mempersiapkan dokumen PDF resmi untuk kriteria: ${targetType === "Semua" ? "Format Multi-halaman" : targetType}...`);

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });

        const drawFederalHeader = (docInstance: typeof doc, titleText: string) => {
          // official header Kop Surat
          docInstance.setFont("times", "bold");
          docInstance.setFontSize(11);
          docInstance.text("KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH", 148, 12, { align: "center" });
          docInstance.setFontSize(12);
          docInstance.text("BALAI PENJAMINAN MUTU PENDIDIKAN (BPMP) PROVINSI MALUKU UTARA", 148, 17, { align: "center" });
          docInstance.setFont("times", "normal");
          docInstance.setFontSize(8.5);
          docInstance.text("Jalan Arnold Mononutu No. 222, Kota Ternate • Email: bpmp.malut@kemdikbud.go.id • Telpon/Faks: (0921) 312345", 148, 21, { align: "center" });
          
          // Draw horizontal border lines
          docInstance.setLineWidth(0.5);
          docInstance.line(15, 24, 282, 24);
          docInstance.setLineWidth(0.15);
          docInstance.line(15, 25, 282, 25);

          // Subtitle
          docInstance.setFont("helvetica", "bold");
          docInstance.setFontSize(10);
          docInstance.setTextColor(15, 23, 42); // slate 900
          docInstance.text(titleText.toUpperCase(), 148, 32, { align: "center" });
          
          docInstance.setFont("helvetica", "normal");
          docInstance.setFontSize(8);
          docInstance.setTextColor(100, 116, 139); // slate 500
          docInstance.text(`Status data s.d: ${CURRENT_DATE_STR} | Periode: ${startDate} s.d ${endDate} | Wilayah Filter: ${filterKabupaten} | SIM SILAT Eksekutif`, 148, 36, { align: "center" });
        };

        const drawFooter = (docInstance: typeof doc, pNum: number, totalP: number) => {
          docInstance.setLineWidth(0.1);
          docInstance.setDrawColor(200, 200, 200);
          docInstance.line(15, 195, 282, 195);
          docInstance.setFont("helvetica", "italic");
          docInstance.setFontSize(7.5);
          docInstance.setTextColor(150, 150, 150);
          docInstance.text("Lampiran Dokumen Resmi - Dokumen ini diekstrak otomatis dari Cloud Spreadsheet Server SILAT BPMP", 15, 199);
          docInstance.text(`Halaman ${pNum} dari ${totalP}`, 282, 199, { align: "right" });
        };

        let pageIndex = 1;
        const totalEstimatedPages = targetType === "Semua" ? 4 : 1;

        // 1. TAMU SHEET PDF SECTION
        if (targetType === "Semua" || targetType === "Tamu") {
          if (pageIndex > 1) doc.addPage();
          drawFederalHeader(doc, "LAPORAN REGISTER DATA BUKU TAMU?");
          
          const columns = ["ID Tamu", "Tanggal", "Nama Tamu", "Instansi / Dinas", "Jabatan / Utusan", "Nomor HP", "Kavling Kab/Kota", "Sektor Tujuan", "Waktu Masuk"];
          const dataRows = filteredTamuList.map(t => [
            t.idTamu,
            t.tanggal,
            t.nama,
            t.instansi,
            t.jabatan,
            t.noHp,
            t.kabupatenKota,
            t.bidangTujuan.replace("Pokja ", ""),
            t.jamDatang
          ]);

          autoTable(doc, {
            startY: 42,
            head: [columns],
            body: dataRows,
            theme: "striped",
            headStyles: { fillColor: [15, 23, 42], fontSize: 7, fontStyle: "bold" },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
              2: { cellWidth: 35 }, // Nama Tamu
              3: { cellWidth: 45 }, // Instansi
              4: { cellWidth: 35 }, // Jabatan
              7: { cellWidth: 40 }  // Sektor
            }
          });
          
          drawFooter(doc, pageIndex++, totalEstimatedPages);
        }

        // 2. KASUS & SOLUSI PDF SECTION
        if (targetType === "Semua" || targetType === "Permasalahan") {
          if (pageIndex > 1) doc.addPage();
          drawFederalHeader(doc, "DAFTAR LAPORAN KASUS URUSAN PENJAMINAN MUTU SEKOLAH");

          const columns = ["ID Kasus", "Isu Utama Permasalahan", "Jenis Kategori", "Status", "Urgensi", "Akar Masalah (Analisis)", "Rekomendasi Tindak Lanjut BPMP"];
          const dataRows = filteredKasusList.map(k => {
            const sol = solusiList[k.idKasus];
            return [
              k.idKasus,
              k.permasalahan,
              k.kategori.replace(" & Pendampingan Peningkatan Mutu", ""),
              k.status,
              k.prioritas,
              sol?.penyebab || "Analisis draf belum disubmit",
              sol?.solusiBpmp || "Menunggu tinjauan Widyaprada"
            ];
          });

          autoTable(doc, {
            startY: 42,
            head: [columns],
            body: dataRows,
            theme: "grid",
            headStyles: { fillColor: [43, 58, 66], fontSize: 7, fontStyle: "bold" },
            bodyStyles: { fontSize: 6.5 },
            columnStyles: {
              1: { cellWidth: 50 }, // Permasalahan
              2: { cellWidth: 40 }, // Kategori
              5: { cellWidth: 50 }, // Akar Masalah
              6: { cellWidth: 55 }  // Solusi
            }
          });

          drawFooter(doc, pageIndex++, totalEstimatedPages);
        }

        // 3. MONITORING PDF SECTION
        if (targetType === "Semua" || targetType === "Monitoring") {
          if (pageIndex > 1) doc.addPage();
          drawFederalHeader(doc, "LAPORAN STATUS PROGRESS MONITORING & EVALUASI MITIGASI");

          const columns = ["ID Kasus", "Permasalahan", "Status", "Kemajuan (%)", "Catatan Lapangan Widyaprada", "Dokumen Bukti Tindak Lanjut", "Audit Up"];
          const dataRows = filteredKasusList.map(k => {
            const mon = monitoringList[k.idKasus] || {};
            return [
              k.idKasus,
              k.permasalahan,
              k.status,
              mon.progress !== undefined ? `${mon.progress}%` : "0%",
              mon.catatan || "Menunggu pembaruan progress lapangan",
              mon.buktiTindakLanjut || "-",
              mon.tanggalUpdate || "-"
            ];
          });

          autoTable(doc, {
            startY: 42,
            head: [columns],
            body: dataRows,
            theme: "striped",
            headStyles: { fillColor: [37, 99, 235], fontSize: 7, fontStyle: "bold" },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
              1: { cellWidth: 60 },
              4: { cellWidth: 60 },
              5: { cellWidth: 45 }
            }
          });

          drawFooter(doc, pageIndex++, totalEstimatedPages);
        }

        // 4. EXECUTIVE SUMMARY DASHBOARD
        if (targetType === "Semua" || targetType === "Dashboard") {
          if (pageIndex > 1) doc.addPage();
          drawFederalHeader(doc, "LAPORAN RINGKASAN EKSEKUTIF PIMPINAN (EXECUTIVE EXECUTIVE SUMMARY)");

          const stats = dashboardSummaryStats;
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.text("A. INDIKATOR UTAMA KINERJA PELAYANAN (KPIs):", 20, 48);

          const columns = ["Variabel Indikator", "Nilai/Volume", "Satuan Ukuran Pelaporan", "Interpretasi Efektivitas Kerja Dinas"];
          const dataRows = [
            ["Kehadiran Tamu Satuan Pendidikan", String(stats.totalTamu), "Kepala Sekolah / Guru / Operator", "Tingkat partisipasi tinggi dalam konsultasi inovasi digital"],
            ["Berkas Permasalahan Kepatuhan Sekolah", String(stats.totalKasus), "Laporan Terdaftar", "Jumlah keluhan teknis penyerapan anggaran BOSP & Dapodik"],
            ["Kasus Selesai (Mitigasi Terkendali / Ditutup)", String(stats.resolvedKasus), "Akumulasi Berkas", `Rata-rata ${stats.percentageSolved}% penuntasan kendala mutu tepat sasaran`],
            ["Kasus Masih Berproses Lapangan", String(stats.unresolvedKasus), "Aktivitas Desk-study", "Kewajiban pengawalan oleh Pokja berwenang"],
            ["Kasus Mengendap Lebih dari 30 Hari", String(stats.overdueKasus), "Critical Alarm", stats.overdueKasus > 0 ? "Butuh penunjukan satgas darurat penanganan khusus" : "Seluruh urusan diselesaikan tepat waktu (< 30 Hari kerja)"]
          ];

          autoTable(doc, {
            startY: 52,
            head: [columns],
            body: dataRows,
            theme: "grid",
            headStyles: { fillColor: [16, 185, 129], fontSize: 8, fontStyle: "bold" },
            bodyStyles: { fontSize: 8 }
          });

          // Signature block
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          doc.text("Pimpinan Berwenang,", 220, 140);
          doc.text("Kepala BPMP Provinsi Maluku Utara", 220, 144);
          
          doc.setFont("times", "bold");
          doc.text("Aisun Hasan, S.Psi., MA", 220, 172);
          doc.setFont("times", "normal");
          doc.text("NIP. 19681124 199403 1 002", 220, 176);

          drawFooter(doc, pageIndex++, totalEstimatedPages);
        }

        // Save
        const suffix = filterKabupaten === "Semua" ? "Provinsi" : filterKabupaten.replace(/\s+/g, "_");
        doc.save(`LAPORAN_RESMI_SILAT_${targetType.toUpperCase()}_${suffix}.pdf`);
      } catch (err) {
        console.error("PDF download failure:", err);
        alert("Gagal mencetak PDF resmi: " + (err as Error).message);
      } finally {
        setIsProcessing(false);
      }
    }, 850);
  };

  // 3. PRINT SECTION
  const handlePrint = (targetType: typeof activeSubTab) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup diblokir oleh browser! Mohon izinkan popup untuk meluncurkan print berkas.");
      return;
    }

    const kopSurat = `
      <div style="text-align: center; border-bottom: 3.5px double #000; padding-bottom: 14px; margin-bottom: 22px; font-family: 'Times New Roman', Times, serif;">
        <h3 style="margin: 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</h3>
        <h2 style="margin: 4px 0; font-size: 15pt; font-weight: bold; text-transform: uppercase;">BALAI PENJAMINAN MUTU PENDIDIKAN (BPMP)</h2>
        <h2 style="margin: 2px 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">PROVINSI MALUKU UTARA</h2>
        <p style="margin: 0; font-size: 9.5pt; font-style: italic;">Jalan Arnold Mononutu No. 222, Kota Ternate &bull; Email: bpmp.malut@kemdikbud.go.id</p>
      </div>
    `;

    let generatedContent = "";
    const filterDesc = `<p style="font-family: Arial, sans-serif; font-size: 9pt; color:#666; margin-bottom: 12px;">Kawasan Cakupan Wilayah: <b>${filterKabupaten}</b> | Periode: <b>${startDate} s.d ${endDate}</b> | Tanggal Laporan: <b>${CURRENT_DATE_STR}</b></p>`;

    // 1. TAMU SHEET PRINT
    if (targetType === "Semua" || targetType === "Tamu") {
      generatedContent += `
        <h4 class="section-title">A. REGISTER KEHADIRAN DATA BUKU TAMU KONSULTASI</h4>
        ${filterDesc}
        <table>
          <thead>
            <tr>
              <th>ID Tamu</th>
              <th>Tanggal</th>
              <th>Nama Pengadu</th>
              <th>Instansi / Organisasi</th>
              <th>Jabatan</th>
              <th>Kontak Telepon</th>
              <th>Kabupaten/Kota</th>
              <th>Unit Dituju</th>
              <th>Tamu Masuk</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTamuList.map(t => `
              <tr>
                <td style="font-family: monospace; font-size: 8.5pt;">${t.idTamu}</td>
                <td>${t.tanggal}</td>
                <td style="font-weight: bold;">${t.nama}</td>
                <td>${t.instansi}</td>
                <td>${t.jabatan}</td>
                <td>${t.noHp}</td>
                <td>${t.kabupatenKota}</td>
                <td>${t.bidangTujuan}</td>
                <td>${t.jamDatang}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="page-break-after: always;"></div>
      `;
    }

    // 2. PERMASALAHAN SHEET PRINT
    if (targetType === "Semua" || targetType === "Permasalahan") {
      generatedContent += `
        <h4 class="section-title">B. DAFTAR INDEKS PERMASALAHAN MUTU SATUAN PENDIDIKAN</h4>
        ${filterDesc}
        <table>
          <thead>
            <tr>
              <th>ID Kasus</th>
              <th>Isu Masalah Pokok</th>
              <th>Kategori Pengaduan</th>
              <th>Status</th>
              <th>Prioritas</th>
              <th>Akar Penyebab / Masalah</th>
              <th>Usulan Solusi Widyaprada</th>
            </tr>
          </thead>
          <tbody>
            ${filteredKasusList.map(k => {
              const sol = solusiList[k.idKasus];
              return `
                <tr>
                  <td style="font-family: monospace; font-size: 8.5pt;">${k.idKasus}</td>
                  <td style="font-weight: bold;">${k.permasalahan}</td>
                  <td>${k.kategori}</td>
                  <td><b>${k.status}</b></td>
                  <td>${k.prioritas}</td>
                  <td>${sol?.penyebab || "Menunggu review draf manual"}</td>
                  <td>${sol?.solusiBpmp || "Belum ada rekomendasi"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        <div style="page-break-after: always;"></div>
      `;
    }

    // 3. MONITORING SHEET PRINT
    if (targetType === "Semua" || targetType === "Monitoring") {
      generatedContent += `
        <h4 class="section-title">C. MONITORING PROGRESS TINDAK LANJUT MITIGASI PROGRAM</h4>
        ${filterDesc}
        <table>
          <thead>
            <tr>
              <th>ID Kasus</th>
              <th>Isu Lapangan</th>
              <th>PIC Ditugaskan</th>
              <th>Persentase Kelengkapan</th>
              <th>Buku Catatan Lapangan Real-Time</th>
              <th>Dokumen Bukti Fisik/Arsip</th>
              <th>Update Terakhir</th>
            </tr>
          </thead>
          <tbody>
            ${filteredKasusList.map(k => {
              const mon = monitoringList[k.idKasus] || {};
              return `
                <tr>
                  <td style="font-family: monospace; font-size: 8.5pt;">${k.idKasus}</td>
                  <td>${k.permasalahan}</td>
                  <td>${k.pic}</td>
                  <td><b>${mon.progress !== undefined ? mon.progress : 0}%</b></td>
                  <td>${mon.catatan || "-"}</td>
                  <td>${mon.buktiTindakLanjut || "-"}</td>
                  <td>${mon.tanggalUpdate || "-"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        <div style="page-break-after: always;"></div>
      `;
    }

    // 4. EXECUTIVE DASHBOARD SUMMARY SHEET PRINT
    if (targetType === "Semua" || targetType === "Dashboard") {
      const s = dashboardSummaryStats;
      generatedContent += `
        <h4 class="section-title">D. RINGKASAN CAPAIAN STATISTIK EXECUTIF INDIKATOR (DASHBOARD)</h4>
        ${filterDesc}
        
        <div class="summary-box">
          <div style="display: grid; grid-template-cols: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
            <div class="kpi-card">
              <span class="label">TOTAL KUNJUNGAN TAMU</span>
              <span class="value">${s.totalTamu}</span>
            </div>
            <div class="kpi-card">
              <span class="label">KASUS MASUK</span>
              <span class="value">${s.totalKasus}</span>
            </div>
            <div class="kpi-card">
              <span class="label">TINGKAT PENYELESAIAN</span>
              <span class="value">${s.percentageSolved}%</span>
            </div>
          </div>
          
          <table style="margin-top: 15px;">
            <thead>
              <tr>
                <th>KPI Organisasi BPMP</th>
                <th style="width: 150px; text-align: center;">Kuantitas Skenario</th>
                <th>Status Penilaian Sektoral</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Laporan Layanan Buku Tamu Terdaftar</td>
                <td style="text-align: center; font-bold: true;">${s.totalTamu}</td>
                <td>Berjalan lancar dan tertib administrasi</td>
              </tr>
              <tr>
                <td>Tumpukan Kasus Terverifikasi Ahli</td>
                <td style="text-align: center;">${s.totalKasus}</td>
                <td>Mitigasi pendampingan dipetakan otomatis</td>
              </tr>
              <tr>
                <td>Kasus Berhasil Dikendalikan / Selesai</td>
                <td style="text-align: center; font-weight: bold; color: green;">${s.resolvedKasus}</td>
                <td>Penyelesaian program tepat sasaran</td>
              </tr>
              <tr>
                <td>Kasus Menyeberang Batas Mutu > 30 Hari</td>
                <td style="text-align: center; font-weight: bold; color: ${s.overdueKasus > 0 ? "red" : "black"};">${s.overdueKasus}</td>
                <td>${s.overdueKasus > 0 ? "Memerlukan intervensi bimbingan langsung" : "Mutu pelayanan cepat, aman, dan kooperatif"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="signature-block" style="text-align: right; margin-top: 50px; font-family: 'Times New Roman', serif;">
          <p>Kepala Balai Penjaminan Mutu Pendidikan,</p>
          <br/><br/><br/>
          <h4 style="margin: 0; text-decoration: underline;">Aisun Hasan, S.Psi., MA</h4>
          <p style="margin: 0; font-size: 9pt;">NIP. 19681124 199403 1 002</p>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan SILAT BPMP Malut</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 30px; font-size: 10pt; line-height: 1.4; color: #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            th { border: 1.5px solid #000; padding: 7px; text-transform: uppercase; font-size: 8pt; background-color: #ededed; text-align: left; }
            td { border: 1px solid #111; padding: 6.5px; font-size: 8.5pt; text-align: left; }
            .section-title { font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; color: #111; }
            
            /* KPI dashboard simulation printing cards */
            .kpi-card { border: 1px solid #999; padding: 12px; border-radius: 6px; text-align: center; float: left; width: 28%; margin-right: 3%; box-sizing: border-box; }
            .kpi-card .label { font-size: 7.5pt; color: #444; display: block; font-weight: bold; }
            .kpi-card .value { font-size: 18pt; font-weight: 900; color: #000; display: block; margin-top: 5px; }
            
            @media print {
              .no-print { display: none; }
              body { padding: 0; font-size: 9.5pt; }
            }
          </style>
        </head>
        <body>
          ${kopSurat}
          ${generatedContent}
          <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="window.print()" style="font-weight: bold; padding: 10px 22px; cursor: pointer; background-color: #2563eb; color: #fff; border: none; border-radius: 6px;">Cetak Dokumen Laporan</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="space-y-6 font-sans text-xs animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Executive Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Color accents */}
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-emerald-500 via-bpmp-blue to-purple-600" />
        
        <div>
          <span className="bg-bpmp-indigo/5 text-bpmp-indigo border border-bpmp-indigo/10 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase font-display inline-block mb-1">
            Modul Ekspor & Pencetakan Berkas Resmi
          </span>
          <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
            SIM-SILAT Konsolidasi Laporan Periodik
          </h2>
          <p className="text-gray-500 text-xs mt-1 max-w-xl leading-relaxed font-sans">
            Gunakan fungsionalitas di bawah untuk menyusun backup, berkas lampiran rapat koordinasi, atau bukti audit dinas. Terintegrasi sepenuhnya dengan penarikan data Google Sheets API.
          </p>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 p-4 rounded-2xl shrink-0 w-full md:w-auto text-left">
          <Database className="w-5 h-5 text-bpmp-blue shrink-0" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Koneksi Basis Data</span>
            <span className="font-bold text-slate-800 text-[10px] block">{liveDbStatus || "Google Spreadsheet Online"}</span>
            <span className="text-[9px] text-emerald-500 block font-bold mt-0.5">● Sinkronisasi Berhasil</span>
          </div>
        </div>
      </div>

      {/* Export Options & Interactive Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Control Card: Choose Area and Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4 md:col-span-1">
          <div className="space-y-4">
            <h3 className="font-bold font-display text-[#0F172A] text-xs uppercase tracking-wider flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-bpmp-blue" /> 1. Saring Kriteria Data
            </h3>
            
            {/* Filter Kabupaten */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Kabupaten/Kota Satuan Pendidikan:</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 gap-1.5 text-[11px] w-full">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filterKabupaten}
                  onChange={(e) => setFilterKabupaten(e.target.value)}
                  className="bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer py-2.5 w-full font-sans"
                >
                  <option value="Semua">Semua Kabupaten/Kota (Nasional)</option>
                  {uniqueKabupaten.map(kab => (
                    <option key={kab} value={kab}>{kab}</option>
                  ))}
                </select>
              </div>
              <p className="text-[9px] text-gray-400">Menyaring database agar baris yang tidak sesuai prioritas terpinggirkan otomatis.</p>
            </div>

            {/* Filter Periode Tanggal */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Periode Tanggal Laporan:</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 gap-1 text-[10px] w-full">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-none text-slate-700 font-bold focus:outline-none py-2 w-full font-sans text-[11px]"
                  />
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 gap-1 text-[10px] w-full">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none text-slate-700 font-bold focus:outline-none py-2 w-full font-sans text-[11px]"
                  />
                </div>
              </div>
              <p className="text-[9px] text-gray-400">Saring rentang tanggal kunjungan buku tamu dan laporan permasalahan.</p>
            </div>

            {/* Sub-Tab Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Halaman/Tumpukan Tabel:</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-250">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("Semua")}
                  className={`py-1.5 px-2.5 rounded-lg text-center font-bold text-[9px] uppercase tracking-wider transition-all ${activeSubTab === "Semua" ? "bg-white text-slate-900 border border-slate-200 font-black shadow-xs" : "text-slate-400 hover:text-slate-700 cursor-pointer"}`}
                >
                  Semua Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("Tamu")}
                  className={`py-1.5 px-2.5 rounded-lg text-center font-bold text-[9px] uppercase tracking-wider transition-all ${activeSubTab === "Tamu" ? "bg-white text-slate-900 border border-slate-200 font-black shadow-xs" : "text-slate-400 hover:text-slate-700 cursor-pointer"}`}
                >
                  Buku Tamu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("Permasalahan")}
                  className={`py-1.5 px-2.5 rounded-lg text-center font-bold text-[9px] uppercase tracking-wider transition-all ${activeSubTab === "Permasalahan" ? "bg-white text-slate-900 border border-slate-200 font-black shadow-xs" : "text-slate-400 hover:text-slate-700 cursor-pointer"}`}
                >
                  Permasalahan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("Monitoring")}
                  className={`py-1.5 px-2.5 rounded-lg text-center font-bold text-[9px] uppercase tracking-wider transition-all ${activeSubTab === "Monitoring" ? "bg-white text-slate-900 border border-slate-200 font-black shadow-xs" : "text-slate-400 hover:text-slate-700 cursor-pointer"}`}
                >
                  Monitoring
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("Dashboard")}
                  className={`py-1.5 px-2.5 rounded-lg text-center font-bold text-[9px] uppercase tracking-wider transition-all ${activeSubTab === "Dashboard" ? "bg-white text-slate-900 border border-slate-200 font-black shadow-xs" : "text-slate-400 hover:text-slate-700 cursor-pointer"}`}
                >
                  Pimpinan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-500 leading-relaxed font-mono">
            <strong>Ringkasan Cakupan:</strong>
            <ul className="list-disc list-inside mt-1 font-sans space-y-0.5 text-gray-450">
              <li>{filteredTamuList.length} Baris tamu terfilter</li>
              <li>{filteredKasusList.length} Baris kasus terfilter</li>
              <li>{dashboardSummaryStats.overdueKasus} Berkas overdue terhitung</li>
            </ul>
          </div>
        </div>

        {/* Middle Card: Actions & Formats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold font-display text-[#0F172A] text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> 2. Rapatkan Format Eksportasi Berkas
            </h3>
            <p className="text-gray-500 font-sans leading-relaxed text-xs">
              Sistem menyandikan data ke dalam format yang murni dan bersih. Excel digunakan untuk audit manipulasi kalkulasi, PDF resmi untuk penyerahan fisik arsip ber-kop Kementrian, serta cetak kertas langsung untuk lampiran dokumen dinas.
            </p>
          </div>

          {isProcessing ? (
            <div className="p-8 text-center bg-blue-50/50 rounded-2xl border border-dashed border-blue-200 animate-pulse space-y-2">
              <div className="flex justify-center">
                <Download className="w-8 h-8 text-bpmp-blue animate-bounce" />
              </div>
              <strong className="text-bpmp-indigo block text-xs">Menyusun Laporan Digital...</strong>
              <p className="text-[10px] text-slate-450 font-sans max-w-md mx-auto">{processingMsg}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              {/* Option A: EXCEL */}
              <div className="border border-slate-150 rounded-2xl p-4 text-center hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between items-center space-y-4">
                <div className="space-y-1 select-none flex flex-col items-center">
                  <div className="bg-emerald-50 text-emerald-600 p-2 text-center rounded-xl w-10 h-10 flex items-center justify-center">
                    <TableProperties className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-800 font-display block text-[11px] pt-1 uppercase tracking-wide">EXCEL FILE (.XLSX)</strong>
                  <span className="text-[9px] text-gray-400 font-sans">Kompatibel penuh dengan Microsoft Excel & Google Sheets</span>
                </div>
                <button
                  onClick={() => handleExportExcel(activeSubTab)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold font-display cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Ambil Excel
                </button>
              </div>

              {/* Option B: PDF */}
              <div className="border border-slate-150 rounded-2xl p-4 text-center hover:border-red-500/50 hover:shadow-md transition-all flex flex-col justify-between items-center space-y-4">
                <div className="space-y-1 select-none flex flex-col items-center">
                  <div className="bg-red-50 text-red-600 p-2 text-center rounded-xl w-10 h-10 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-800 font-display block text-[11px] pt-1 uppercase tracking-wide">DOKUMEN PDF (.PDF)</strong>
                  <span className="text-[9px] text-gray-400 font-sans">Sertakan Kop Surat, tanda tangan Kepala Balai, & margin A4</span>
                </div>
                <button
                  onClick={() => handleExportPDF(activeSubTab)}
                  className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-xl text-xs font-bold font-display cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh PDF
                </button>
              </div>

              {/* Option C: PRINT */}
              <div className="border border-slate-150 rounded-2xl p-4 text-center hover:border-slate-800/50 hover:shadow-md transition-all flex flex-col justify-between items-center space-y-4">
                <div className="space-y-1 select-none flex flex-col items-center">
                  <div className="bg-slate-50 text-slate-800 p-2 text-center rounded-xl w-10 h-10 flex items-center justify-center border border-slate-200">
                    <Printer className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-800 font-display block text-[11px] pt-1 uppercase tracking-wide">PENCETAKAN DIRECT</strong>
                  <span className="text-[9px] text-gray-400 font-sans">Luncurkan popup cetak sistem, ramah kertas printer standar</span>
                </div>
                <button
                  onClick={() => handlePrint(activeSubTab)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold font-display cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Langsung
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Structured Comprehensive preview matching the current filter subset */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-6 p-6">
        
        {/* Paper Layout Header mockup */}
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-5 select-none relative">
          <div className="uppercase font-display font-black text-xs text-slate-900 tracking-wider">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA</div>
          <div className="uppercase font-display font-black text-sm text-[#0F172A]">BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI MALUKU UTARA</div>
          <div className="text-[9.5px] font-mono text-gray-450">Jalan Arnold Mononutu No. 222, Kota Ternate • Email: bpmp.malut@kemdikbud.go.id</div>
          
          <div className="absolute right-0 bottom-1 flex items-center gap-1 text-[8.5px] text-slate-400 font-mono">
            <Calendar className="w-3 h-3 text-slate-350" /> {CURRENT_DATE_STR}
          </div>
        </div>

        <div>
          <h4 className="text-center font-display font-bold text-xs underline uppercase text-slate-800 tracking-wide">
            REKAPITULASI DRAF LAPORAN AKTIVITAS KONSULTASI YANG DISETUJUI ({filterKabupaten})
          </h4>
          <p className="text-center text-[10px] text-slate-400 font-sans mt-1">
            Data di bawah ini merupakan tinjauan lampiran live yang siap diekspor ke dalam arsip resmi.
          </p>
        </div>

        {/* Section View Tabs preview list */}
        <div className="space-y-4">
          
          {/* Section: Guest lists */}
          {filteredTamuList.length > 0 && (
            <div className="space-y-2">
              <strong className="text-bpmp-indigo font-display text-[10px] uppercase tracking-widest block border-b pb-1">Tinjauan Buku Tamu ({filteredTamuList.length} baris)</strong>
              <div className="overflow-x-auto max-h-52 overflow-y-auto rounded-xl border border-slate-150">
                <table className="w-full text-left text-[10px] font-sans">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 tracking-wider font-display sticky top-0">
                    <tr>
                      <th className="p-2">ID Tamu</th>
                      <th className="p-2">Tanggal</th>
                      <th className="p-2">Nama</th>
                      <th className="p-2">Instansi/Sekolah</th>
                      <th className="p-2">Kabupaten/Kota</th>
                      <th className="p-2">Unit Kerja Dituju</th>
                      <th className="p-2">Penerima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTamuList.slice(0, 5).map(t => (
                      <tr key={t.idTamu} className="hover:bg-slate-50/50">
                        <td className="p-2 font-mono font-semibold text-slate-400">{t.idTamu}</td>
                        <td className="p-2 text-slate-500">{t.tanggal}</td>
                        <td className="p-2 font-bold text-slate-700">{t.nama}</td>
                        <td className="p-2 text-slate-600 font-semibold">{t.instansi}</td>
                        <td className="p-2 text-slate-500">{t.kabupatenKota}</td>
                        <td className="p-2 text-slate-500">{t.bidangTujuan}</td>
                        <td className="p-2 text-slate-500">{t.petugasPenerima}</td>
                      </tr>
                    ))}
                    {filteredTamuList.length > 5 && (
                      <tr className="bg-slate-50/45">
                        <td colSpan={7} className="p-2 text-center text-slate-400 text-[9px] italic">
                          ...Dan {filteredTamuList.length - 5} data tamu lainnya terfilter...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section: Cases lists */}
          {filteredKasusList.length > 0 && (
            <div className="space-y-2 pt-2">
              <strong className="text-emerald-700 font-display text-[10px] uppercase tracking-widest block border-b pb-1">Tinjauan Masalah & Solusi ({filteredKasusList.length} kasus)</strong>
              <div className="overflow-x-auto max-h-52 overflow-y-auto rounded-xl border border-slate-150">
                <table className="w-full text-left text-[10px] font-sans">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 tracking-wider font-display sticky top-0">
                    <tr>
                      <th className="p-2">ID Kasus</th>
                      <th className="p-2">Isu Permasalahan Utama</th>
                      <th className="p-2">Urgensi</th>
                      <th className="p-2">PIC Ditugaskan</th>
                      <th className="p-2">Rekomendasi Tindak Lanjut</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredKasusList.slice(0, 5).map(k => {
                      const sol = solusiList[k.idKasus];
                      return (
                        <tr key={k.idKasus} className="hover:bg-slate-50/50">
                          <td className="p-2 font-mono font-semibold text-slate-400">{k.idKasus}</td>
                          <td className="p-2 font-bold text-slate-700 max-w-xs">{k.permasalahan}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${k.prioritas === "Tinggi" ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-100 text-slate-700"}`}>
                              {k.prioritas}
                            </span>
                          </td>
                          <td className="p-2 text-slate-500">{k.pic}</td>
                          <td className="p-2 text-slate-600 italic">{sol?.solusiBpmp || "Analisis draf belum disubmit"}</td>
                          <td className="p-2">
                            <span className={`text-[9px] font-black uppercase ${k.status === "Ditutup" ? "text-slate-400" : "text-emerald-600 font-extrabold"}`}>
                              {k.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredKasusList.length > 5 && (
                      <tr className="bg-slate-50/45">
                        <td colSpan={6} className="p-2 text-center text-slate-400 text-[9px] italic">
                          ...Dan {filteredKasusList.length - 5} sisa laporan masalah pendampingan lainnya terfilter...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default LaporanPage;
