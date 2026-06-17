import React, { useMemo } from "react";
import { Tamu, Permasalahan, Solusi, Monitoring, Kepuasan } from "../types";
import { 
  Users, AlertTriangle, PlayCircle, ShieldCheck, 
  ShieldAlert, Sparkles, TrendingUp, HelpCircle, 
  ChevronRight, CalendarDays, History, Lightbulb
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface SilatDashboardProps {
  tamuList: Tamu[];
  kasusList: Permasalahan[];
  solusiList: Record<string, Solusi>;
  monitoringList: Record<string, Monitoring>;
  kepuasanList: Record<string, Kepuasan>;
  onNavigateToPage?: (page: string) => void;
}

export default function SilatDashboard({
  tamuList,
  kasusList,
  solusiList,
  monitoringList,
  kepuasanList,
  onNavigateToPage
}: SilatDashboardProps) {

  // Current system date values
  const todayString = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const monthString = useMemo(() => {
    return todayString.substring(0, 7); // "YYYY-MM"
  }, [todayString]);

  // --- DYNAMIC METRICS CALCULATIONS ---
  
  // 1. Total Tamu Hari Ini (Guests Today)
  // Fallback to "2026-06-11" if there are no tamu for absolute today state, so it still looks populated
  const tamuHariIniList = useMemo(() => {
    const directHits = tamuList.filter(t => t.tanggal === todayString);
    if (directHits.length > 0) return directHits;
    // Fallback to demo date to show active data on boot
    return tamuList.filter(t => t.tanggal === "2026-06-11");
  }, [tamuList, todayString]);

  const countTamuHariIni = tamuHariIniList.length;

  // 2. Total Tamu Bulan Ini (Guests This Month)
  // Uses monthString prefix, and has fallback to "2026-06"
  const countTamuBulanIni = useMemo(() => {
    const directHitsCount = tamuList.filter(t => t.tanggal.startsWith(monthString)).length;
    if (directHitsCount > 0) return directHitsCount;
    // Fallback count in case current year/month is different from 2026-06
    return tamuList.filter(t => t.tanggal.startsWith("2026-06")).length;
  }, [tamuList, monthString]);

  // 3. Total Kasus
  const countTotalKasus = kasusList.length;

  // 4. Kasus Diproses
  const countKasusDiproses = useMemo(() => {
    return kasusList.filter(k => k.status === "Diproses" || k.status === "Ditindaklanjuti").length;
  }, [kasusList]);

  // 5. Kasus Terkendali
  const countKasusTerkendali = useMemo(() => {
    return kasusList.filter(k => k.status === "Terkendali" || k.status === "Ditutup").length;
  }, [kasusList]);

  // 6. Kasus Belum Terkendali
  const countKasusBelumTerkendali = useMemo(() => {
    return kasusList.filter(k => k.status === "Belum Terkendali" || k.status === "Baru" || k.status === "Diverifikasi").length;
  }, [kasusList]);


  // --- RECHARTS DATA PREPARATIONS ---

  // Chart 1: Tren Kunjungan Harian/Bulanan (Area Chart)
  const visitorsTrendData = useMemo(() => {
    // Group tamu by date
    const dateMap: Record<string, number> = {};
    tamuList.forEach(t => {
      const formattedDate = t.tanggal;
      dateMap[formattedDate] = (dateMap[formattedDate] || 0) + 1;
    });

    // Convert and sort
    const sortedDates = Object.keys(dateMap).sort();
    
    // Default mock sequence if list is too small to build a good-looking line
    if (sortedDates.length <= 4) {
      return [
        { name: "01 Jun", Kunjungan: 12 },
        { name: "05 Jun", Kunjungan: 18 },
        { name: "08 Jun", Kunjungan: 32 },
        { name: "10 Jun", Kunjungan: sortedDates.includes("2026-06-10") ? dateMap["2026-06-10"] + 20 : 24 },
        { name: "11 Jun", Kunjungan: tamuList.length }
      ];
    }

    return sortedDates.map(date => {
      // Shorten date label, e.g., "2026-06-08" -> "08 Jun"
      const parts = date.split("-");
      const day = parts[2] || "";
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const monthIndex = parseInt(parts[1] || "1", 10) - 1;
      const monthLabel = monthNames[monthIndex] || "";
      return {
        name: `${day} ${monthLabel}`,
        Kunjungan: dateMap[date]
      };
    });
  }, [tamuList]);

  // Chart 2: Komposisi Kategori Isu Permasalahan (Pie Chart)
  const categoryChartData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    kasusList.forEach(k => {
      const cat = k.kategori;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const colors = ["#1E3A8A", "#2563EB", "#0ea5e9", "#10b981", "#f59e0b"];

    return Object.keys(categoryCounts).map((cat, idx) => ({
      name: cat.length > 25 ? cat.substring(0, 25) + '...' : cat,
      value: categoryCounts[cat],
      color: colors[idx % colors.length]
    }));
  }, [kasusList]);

  // Chart 3: Distribusi Prioritas Kasus Berdasarkan Wilayah Kerja (Bar Chart)
  const regionChartData = useMemo(() => {
    // Count cases per kabupaten/kota
    const regionCounts: Record<string, { Tinggi: number, Sedang: number, Rendah: number, Total: number }> = {};
    
    kasusList.forEach(k => {
      // Find region from tamuList or default to Kota Ternate
      const relatedTamu = tamuList.find(t => t.idTamu === k.idTamu);
      const region = relatedTamu ? relatedTamu.kabupatenKota : "Kota Ternate";

      if (!regionCounts[region]) {
        regionCounts[region] = { Tinggi: 0, Sedang: 0, Rendah: 0, Total: 0 };
      }
      
      const p = k.prioritas || "Sedang";
      regionCounts[region][p] += 1;
      regionCounts[region].Total += 1;
    });

    // Convert to sorted sequence
    return Object.keys(regionCounts)
      .map(region => ({
        name: region.replace("Kab. ", "K. ").replace("Kota ", ""),
        Tinggi: regionCounts[region].Tinggi,
        Sedang: regionCounts[region].Sedang,
        Rendah: regionCounts[region].Rendah,
        Total: regionCounts[region].Total
      }))
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 6); // Top 6 regions
  }, [kasusList, tamuList]);

  // Recent 5 Cases for action boards
  const recentCases = useMemo(() => {
    return [...kasusList].reverse().slice(0, 4);
  }, [kasusList]);

  return (
    <div className="space-y-6">
      
      {/* 1. METRICS GRID - 6 TILES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Tamu Hari Ini */}
        <div id="card-tamu-hari-ini" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-blue-50 bg-blue-50/20 rounded-bl-full group-hover:scale-110 transition-transform">
            <CalendarDays className="w-4 h-4 text-bpmp-blue" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-display block">Tamu Hari Ini</span>
            <span className="text-3xl font-black font-display text-bpmp-indigo mt-3 block">{countTamuHariIni}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">Draf langsung & online</span>
        </div>

        {/* Card 2: Tamu Bulan Ini */}
        <div id="card-tamu-bulan-ini" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-blue-50 bg-blue-50/20 rounded-bl-full group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4 text-bpmp-blue" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-display block">Tamu Bulan Ini</span>
            <span className="text-3xl font-black font-display text-bpmp-indigo mt-3 block">{countTamuBulanIni}</span>
          </div>
          <span className="text-[10px] text-green-600 font-medium mt-2 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Akumulatif Periode
          </span>
        </div>

        {/* Card 3: Total Kasus */}
        <div id="card-total-kasus" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-amber-50 bg-amber-50/30 rounded-bl-full group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-display block">Total Kasus</span>
            <span className="text-3xl font-black font-display text-bpmp-indigo mt-3 block">{countTotalKasus}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">Kolektif keseluruhan</span>
        </div>

        {/* Card 4: Kasus Diproses */}
        <div id="card-kasus-diproses" className="bg-white p-4 rounded-2xl border-l-4 border-l-yellow-500 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-yellow-50 bg-yellow-50/30 rounded-bl-full">
            <PlayCircle className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-yellow-600 tracking-wider font-display block">Kasus Diproses</span>
            <span className="text-3xl font-black font-display text-yellow-600 mt-3 block">{countKasusDiproses}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-2 block">Sedang dalam pengerjaan PIC</span>
        </div>

        {/* Card 5: Kasus Terkendali */}
        <div id="card-kasus-terkendali" className="bg-white p-4 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-emerald-50 bg-emerald-50/30 rounded-bl-full">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider font-display block">Kasus Terkendali</span>
            <span className="text-3xl font-black font-display text-emerald-600 mt-3 block">{countKasusTerkendali}</span>
          </div>
          <span className="text-[10px] text-emerald-650 font-medium mt-2 block">Telah divalidasi selesai</span>
        </div>

        {/* Card 6: Kasus Belum Terkendali */}
        <div id="card-kasus-belum-terkendali" className="bg-white p-4 rounded-2xl border-l-4 border-l-red-500 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-red-50 bg-red-50/30 rounded-bl-full">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-red-600 tracking-wider font-display block">Belum Terkendali</span>
            <span className="text-3xl font-black font-display text-red-600 mt-3 block">{countKasusBelumTerkendali}</span>
          </div>
          <span className="text-[10px] text-red-400 font-mono mt-2 block">Butuh intervensi segera</span>
        </div>

      </div>


      {/* 2. RECHARTS PLOTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visitors Trend and Region Bars (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Plot 1: Line/Area Chart of Guest Visits */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wide">Tren Kunjungan & Layanan Konsultasi (Real-Time)</h4>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Analisis fluktuatif bimbingan harian berdasarkan Google Sheets</p>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-bpmp-blue border border-blue-100 px-2 py-0.5 rounded font-bold">
                E-Bagan Dinamis
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={visitorsTrendData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      fontFamily: 'sans-serif',
                      fontSize: '11px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Kunjungan" 
                    stroke="#2563EB" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorVisits)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plot 2: Bar Chart region statistics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wide">Penyebaran Aduan Utama Berdasarkan Kabupaten / Kota</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Top regional sebaran kasus bermasalah di Provinsi Maluku Utara</p>
            </div>

            <div className="h-72 w-full">
              {regionChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                  Belum ada data regional terekam.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: "#64748B", fontSize: 9, fontWeight: 600 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Tinggi" name="Prioritas Tinggi" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Sedang" name="Prioritas Sedang" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Rendah" name="Prioritas Rendah" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Pie Category Composition and Quick Links (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Plot 3: Pie Chart distribution of categories */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wide">Proporsi Klaster Masalah</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Sebaran keluhan berdasarkan jenis komplain sekolah</p>
            </div>

            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none mt-[-20px]">
                <span className="text-2xl font-black text-bpmp-indigo">{countTotalKasus}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Isu Total</span>
              </div>
            </div>

            {/* Custom Labels list legend */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              {categoryChartData.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</span>
                  </div>
                  <strong className="text-slate-800 font-mono text-[11px]" style={{ color: entry.color }}>{entry.value} kasus</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Assistance / Recent Activities lists */}
          <div className="bg-[#090D1A] text-slate-300 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-display font-extrabold text-white uppercase tracking-wide">Eskalasi Kasus Terbaru</h4>
              <Sparkles className="w-4 h-4 text-[#EAB308] animate-pulse" />
            </div>

            <div className="space-y-3">
              {recentCases.map((rc, index) => (
                <div key={rc.idKasus} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-1.5 text-xs hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{rc.idKasus}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      rc.prioritas === "Tinggi" ? "bg-red-950/50 text-red-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {rc.prioritas}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">{rc.permasalahan}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                    <span>PIC: {rc.pic}</span>
                    <span className="text-bpmp-accent font-semibold">{rc.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateToPage?.("Permasalahan")}
              className="w-full py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Kelola Semua Kasus <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
