import React, { useMemo, useState } from "react";
import { Permasalahan, Tamu, Monitoring } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  Clock, 
  FileText, 
  ShieldAlert, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Database
} from "lucide-react";

interface PimpinanDashboardProps {
  kasusList: Permasalahan[];
  tamuList: Tamu[];
  monitoringList: Record<string, Monitoring>;
  liveDbStatus?: string;
  onRefreshLive?: () => Promise<void>;
}

export const PimpinanDashboard: React.FC<PimpinanDashboardProps> = ({
  kasusList = [],
  tamuList = [],
  monitoringList = {},
  liveDbStatus,
  onRefreshLive
}) => {
  // Current local simulation time anchor is 2026-06-11
  const CURRENT_DATE_STR = "2026-06-11";
  const benchmarkDate = new Date(CURRENT_DATE_STR);

  // States
  const [filterKabupaten, setFilterKabupaten] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Auxiliary: Case Age calculation helper
  const getCaseAge = (tanggalStr: string) => {
    if (!tanggalStr) return 0;
    const caseDate = new Date(tanggalStr);
    const diffTime = benchmarkDate.getTime() - caseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 1. KPI Stats Summary counts
  const totalKasus = kasusList.length;
  const totalTamu = tamuList.length;

  const kasusUncontrolled = useMemo(() => {
    return kasusList.filter(k => k.status === "Belum Terkendali");
  }, [kasusList]);

  const kasusOverdue = useMemo(() => {
    return kasusList.filter(k => {
      // Unresolved cases older than 30 days
      const unresolved = k.status !== "Ditutup" && k.status !== "Terkendali";
      const age = getCaseAge(k.tanggal);
      return unresolved && age > 30;
    });
  }, [kasusList]);

  // Combined filters applied dynamically for drill-downs inside the leader's view
  const filteredKasusForCharts = useMemo(() => {
    return kasusList.filter(k => {
      // Filter by kabupaten (linking case with related guest county if possible)
      if (filterKabupaten !== "Semua") {
        const relatedTamu = tamuList.find(t => t.idTamu === k.idTamu);
        if (!relatedTamu || relatedTamu.kabupatenKota !== filterKabupaten) {
          return false;
        }
      }
      // Filter by status
      if (filterStatus !== "Semua" && k.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [kasusList, tamuList, filterKabupaten, filterStatus]);

  // 2. TOP 10 PERMASALAHAN (Aggregates by Sub-kategori or Kategori)
  const topPermasalahanData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredKasusForCharts.forEach(k => {
      const label = `${k.kategori} - ${k.subKategori}`;
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, jumlah]) => ({ name, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10);
  }, [filteredKasusForCharts]);

  // 3. TOP 10 INSTANSI (Aggregates relative issue/guest counts by Instansi)
  const topInstansiData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Group from tamuList
    tamuList.forEach(t => {
      if (t.instansi && t.instansi.trim() !== "-") {
        const instShort = t.instansi.trim();
        counts[instShort] = (counts[instShort] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, jumlah]) => ({ name, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10);
  }, [tamuList]);

  // 4. TOP 10 KABUPATEN / KOTA
  const topKabupatenKotaData = useMemo(() => {
    const counts: Record<string, number> = {};
    tamuList.forEach(t => {
      if (t.kabupatenKota) {
        counts[t.kabupatenKota] = (counts[t.kabupatenKota] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tamuList]);

  // PIC Case Workload analytics (Top Widyaprada PIC load)
  const picWorkloadData = useMemo(() => {
    const counts: Record<string, { total: number; resolved: number; backlog: number }> = {};
    kasusList.forEach(k => {
      const name = k.pic || "Belum Ditunjuk";
      if (!counts[name]) {
        counts[name] = { total: 0, resolved: 0, backlog: 0 };
      }
      counts[name].total += 1;
      if (k.status === "Terkendali" || k.status === "Ditutup") {
        counts[name].resolved += 1;
      } else {
        counts[name].backlog += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, stats]) => ({
        name: name.split(",")[0], // Short name representation
        "Total Kasus": stats.total,
        "Selesai": stats.resolved,
        "Belum Selesai": stats.backlog
      }))
      .sort((a, b) => b["Total Kasus"] - a["Total Kasus"]);
  }, [kasusList]);

  // Unique list of Kabupaten for filters
  const kabupatenList = useMemo(() => {
    return Array.from(new Set(tamuList.map(t => t.kabupatenKota).filter(Boolean)));
  }, [tamuList]);

  // Recharts color palette
  const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#ec4899", "#14b8a6", "#06b6d4", "#f43f5e", "#64748b"
  ];

  return (
    <div className="space-y-6 font-sans text-xs animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-bpmp-indigo to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
              Executive Leadership Dashboard
            </span>
            <span className="text-slate-400 font-mono text-[9px] font-bold">SILAT BPMP MALUT</span>
          </div>
          <h2 className="text-2xl font-black font-display text-white tracking-tight">
            Aisun Hasan, S.Psi., MA 
          </h2>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-xl font-medium">
            Panel Pengambil Keputusan Kepala Balai Penjaminan Mutu Pendidikan. Pantau dinamika pengaduan Satuan Pendidikan, alarm keterlambatan, persebaran geografis daerah, dan kepatuhan mitigasi program prioritas Kementerian.
          </p>
        </div>

        {/* Database Status Tracker */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 w-full md:w-auto text-left relative z-10">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Koneksi Basis Data</span>
              <span className="font-bold text-emerald-300 text-[11px] block">{liveDbStatus || "Sinkronisasi Google Sheet Lancar"}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Waktu Server: <span className="font-mono font-bold text-slate-300">{CURRENT_DATE_STR}</span></span>
            </div>
          </div>
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              className="mt-2.5 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Tarik Data Terbaru
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Patients/Tamu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-display">AKUMULASI TAMU</span>
            <div className="text-3xl font-black text-slate-800 font-display flex items-baseline gap-1">
              {totalTamu} <span className="text-xs text-slate-400 font-normal">Kunjungan</span>
            </div>
            <span className="text-[9px] text-slate-400 block">Sektor Dinas & Satuan Pendidikan</span>
          </div>
          <div className="bg-blue-50 text-bpmp-blue p-3.5 rounded-2xl group-hover:bg-bpmp-blue group-hover:text-white transition-all">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Total Cases/Permasalahan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-display">TOTAL KASUS MASUK</span>
            <div className="text-3xl font-black text-slate-800 font-display flex items-baseline gap-1">
              {totalKasus} <span className="text-xs text-slate-400 font-normal">Laporan</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold">
              {totalKasus > 0 ? Math.round((kasusList.filter(k => k.status === "Terkendali" || k.status === "Ditutup").length / totalKasus) * 100) : 0}% Solved
            </span>
          </div>
          <div className="bg-indigo-50 text-bpmp-indigo p-3.5 rounded-2xl group-hover:bg-bpmp-indigo group-hover:text-white transition-all">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Uncontrolled Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex items-center justify-between border-l-4 border-l-amber-500 group hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block font-display">BELUM TERKENDALI</span>
            <div className="text-3xl font-black text-slate-800 font-display flex items-baseline gap-1">
              {kasusUncontrolled.length} <span className="text-xs text-slate-400 font-normal">Berkas</span>
            </div>
            <span className="text-[9px] text-amber-600 font-semibold block animate-pulse">Menunggu Intervensi Lapangan</span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* KPI 4: Overdue Cases > 30 Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex items-center justify-between border-l-4 border-l-red-500 group hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest block font-display">BACKLOG OVERDUE &gt; 30 HARI</span>
            <div className="text-3xl font-black text-red-650 font-display flex items-baseline gap-1">
              {kasusOverdue.length} <span className="text-xs text-red-400 font-normal">Kasus</span>
            </div>
            <span className="text-[9px] text-red-650 font-black uppercase tracking-wider block">CRITICAL WARNING</span>
          </div>
          <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-bounce-slow" />
          </div>
        </div>

      </div>

      {/* Filter Drill-Down Control */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-bpmp-indigo" />
          <div>
            <span className="font-extrabold text-[10px] uppercase text-slate-700 tracking-wider">Interaktif Filter Drill-Down</span>
            <p className="text-[9px] text-slate-400">Sesuaikan tampilan grafik distribusi data di bawah sesuai kriteria</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Kabupaten Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-1.5 text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 uppercase font-black tracking-wider text-[8px] scale-90">Wilayah:</span>
            <select
              value={filterKabupaten}
              onChange={(e) => setFilterKabupaten(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer py-1.5"
            >
              <option value="Semua">Semua Kabupaten/Kota</option>
              {kabupatenList.map(kab => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-1.5 text-[10px]">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 uppercase font-black tracking-wider text-[8px] scale-90">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer py-1.5"
            >
              <option value="Semua">Semua Status Kasus</option>
              <option value="Baru">Baru</option>
              <option value="Diverifikasi">Diverifikasi</option>
              <option value="Diproses">Diproses</option>
              <option value="Ditindaklanjuti">Ditindaklanjuti</option>
              <option value="Terkendali">Terkendali</option>
              <option value="Belum Terkendali">Belum Terkendali</option>
              <option value="Ditutup">Ditutup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Top 10 Permasalahan (Vertical Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-4">
          <div>
            <span className="text-[10px] font-black text-bpmp-indigo uppercase tracking-wider block">DIAGRAM BATANG PERMASALAHAN</span>
            <h4 className="text-xs font-bold text-slate-800 font-sans mt-0.5">Top 10 Jenis Urusan Permasalahan Mutu Sekolah Sering Dikonsultasikan</h4>
          </div>

          <div className="h-72 w-full pt-1">
            {topPermasalahanData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">Tidak ada data untuk filter ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topPermasalahanData} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 20)}...` : val}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: "10px", borderRadius: "10px", padding: "8px", border: "10px" }}
                    itemStyle={{ color: "#1e1b4b", fontWeight: "bold" }}
                  />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {topPermasalahanData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Top 10 Kabupaten / Kota Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-4">
          <div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">GEOSPATIAL SCHOOL INPATIENT</span>
            <h4 className="text-xs font-bold text-slate-800 font-sans mt-0.5">Top 10 Sebaran Asal Kabupaten / Kota Instansi Buku Tamu</h4>
          </div>

          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            {topKabupatenKotaData.length === 0 ? (
              <div className="text-slate-400">Tidak ada data sebaran kabupaten.</div>
            ) : (
              <>
                <div className="h-full w-full sm:w-[60%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topKabupatenKotaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {topKabupatenKotaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend list scrollable */}
                <div className="w-full sm:w-[40%] text-[10px] space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {topKabupatenKotaData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-semibold truncate">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-850 whitespace-nowrap">{item.value} tamu</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 3: Top 10 Instansi / Sekolah Pengadu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-4">
          <div>
            <span className="text-[10px] font-black text-bpmp-indigo uppercase tracking-wider block">INSTITUTIONAL LEADERBOARD</span>
            <h4 className="text-xs font-bold text-slate-800 font-sans mt-0.5">Top 10 Instansi / Satuan Pendidikan Teraktif di Buku Tamu SILAT</h4>
          </div>

          <div className="h-72 w-full pt-1">
            {topInstansiData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 max-w-xs">Tidak ada tamu yang mewakili instansi khusus.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topInstansiData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 25 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    interval={0}
                    tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                  <Bar dataKey="jumlah" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {topInstansiData.map((e, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PIC Team Performance Load (Resource Allocation) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-4">
          <div>
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">WIDYAPRADA PIC ALLOCATION WORKLOAD</span>
            <h4 className="text-xs font-bold text-slate-800 font-sans mt-0.5">Beban Tugas & Kuantitas Kasus Widyaprada / PIC Pendamping Ahli</h4>
          </div>

          <div className="h-72 w-full overflow-y-auto pr-1">
            <table className="w-full text-left text-[10px] font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                  <th className="py-2 pl-2">Nama PIC Widyaprada</th>
                  <th className="py-2 text-center">Beban Kasus</th>
                  <th className="py-2 text-center">Selesai</th>
                  <th className="py-2 text-center text-amber-600">Terbuka</th>
                  <th className="py-2 text-right pr-2">Kefektifan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {picWorkloadData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-450">Belum ada pic bertugas.</td>
                  </tr>
                ) : (
                  picWorkloadData.map((picItem, idx) => {
                    const resolved = picItem["Selesai"];
                    const total = picItem["Total Kasus"] || 1;
                    const pct = Math.round((resolved / total) * 100);
                    
                    return (
                      <tr key={picItem.name} className="hover:bg-slate-50/50">
                        <td className="py-2.5 pl-2 font-bold text-slate-700 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-bpmp-blue" />
                          {picItem.name}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-slate-800">{picItem["Total Kasus"]}</td>
                        <td className="py-2.5 text-center font-mono text-emerald-600 font-bold">{picItem["Selesai"]}</td>
                        <td className="py-2.5 text-center font-mono text-amber-600 font-bold">{picItem["Belum Selesai"]}</td>
                        <td className="py-2.5 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono font-extrabold text-slate-600">{pct}%</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Critical Lists Overview Section (Uncontrolled & Overdue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel A: Kasus Belum Terkendali */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-amber-50/60 border-b border-slate-100 flex justify-between items-center">
              <span className="font-extrabold text-amber-800 uppercase tracking-wider font-display flex items-center gap-1.5 text-[10px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" /> Daftar Kasus Status Belum Terkendali ({kasusUncontrolled.length})
              </span>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] px-2 py-0.5 rounded-full font-bold">Urgensi Pendampingan</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-96">
              {kasusUncontrolled.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-450 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-slate-500">Hebat! Tidak ada keluhan berkas yang berstatus Belum Terkendali.</p>
                </div>
              ) : (
                kasusUncontrolled.map(k => {
                  const mon = monitoringList[k.idKasus];
                  return (
                    <div key={k.idKasus} className="p-4 hover:bg-amber-50/10 transition-colors space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{k.idKasus}</span>
                        <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase font-mono">WARNING</span>
                      </div>
                      
                      <p className="font-bold text-slate-800 leading-relaxed font-sans">{k.permasalahan}</p>
                      
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-medium font-sans">
                        <span><strong>Kategori:</strong> {k.kategori}</span>
                        <span><strong>PIC:</strong> {k.pic.split(",")[0]}</span>
                        <span><strong>Tanggapan TL:</strong> {mon?.catatan ? `“${mon.catatan.substring(0, 20)}...”` : "Menunggu"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="p-3 bg-slate-50 text-center border-t border-slate-100 text-[9px] text-slate-400 font-medium">
            Segera lakukan intervensi desk-study atau pendampingan langsung ke sekolah pelapor.
          </div>
        </div>

        {/* Panel B: Kasus Berumur > 30 Hari (Backlog Red alert) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-red-50/60 border-b border-slate-100 flex justify-between items-center">
              <span className="font-extrabold text-red-800 uppercase tracking-wider font-display flex items-center gap-1.5 text-[10px]">
                <Clock className="w-4 h-4 text-red-650 animate-spin-slow" /> Daftar Kasus Menumpuk &gt; 30 Hari Unresolved ({kasusOverdue.length})
              </span>
              <span className="bg-red-100 text-red-900 border border-red-200 text-[9px] px-2 py-0.5 rounded-full font-bold">Keterlambatan Penilaian</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-96">
              {kasusOverdue.length === 0 ? (
                <div className="text-center py-16 text-slate-400 col-span-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce-slow" />
                  <p className="font-semibold text-xs text-slate-500">Luar biasa! Seluruh kasus keluhan mutu berumur kurang dari 30 hari.</p>
                </div>
              ) : (
                kasusOverdue.map(k => {
                  const age = getCaseAge(k.tanggal);
                  return (
                    <div key={k.idKasus} className="p-4 hover:bg-red-50/10 transition-colors space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{k.idKasus}</span>
                        <span className="text-red-650 font-black font-mono">Baku Mutu: {age} Hari Overdue</span>
                      </div>
                      
                      <p className="font-bold text-slate-800 leading-relaxed font-sans">{k.permasalahan}</p>
                      
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-medium font-sans">
                        <span><strong>Mulai:</strong> {k.tanggal}</span>
                        <span><strong>PIC Ahli:</strong> {k.pic.split(",")[0]}</span>
                        <span className="capitalize"><strong>Status:</strong> {k.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 text-center border-t border-slate-100 text-[9px] text-slate-400 font-medium">
            Prosedur Baku Mutu BPMP mewajibkan penyelesaian kendala kurang dari 30 hari kerja sejak diregistrasikan.
          </div>
        </div>

      </div>

    </div>
  );
};

export default PimpinanDashboard;
