import React, { useState } from "react";
import { Permasalahan, Tamu } from "../types";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  Tag,
  Clock,
  User,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface PermasalahanTableProps {
  data: Permasalahan[];
  tamuList: Tamu[];
  onEdit: (kasus: Permasalahan) => void;
  onDelete: (id: string) => void;
  onDetail: (kasus: Permasalahan) => void;
  onAddClick: () => void;
  onNavigateToTamu?: (idTamu: string) => void;
}

const PermasalahanTable: React.FC<PermasalahanTableProps> = ({
  data,
  tamuList,
  onEdit,
  onDelete,
  onDetail,
  onAddClick,
  onNavigateToTamu,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterPic, setFilterPic] = useState("Semua");

  // Get unique options dynamically from data for selectors
  const uniqueKategori = Array.from(new Set(data.map((x) => x.kategori).filter(Boolean)));
  const uniqueStatus = Array.from(new Set(data.map((x) => x.status).filter(Boolean)));
  const uniquePic = Array.from(new Set(data.map((x) => x.pic).filter(Boolean)));

  // Custom multi-filtering + global query search
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // 1. Filter Kategori
      if (filterKategori !== "Semua" && item.kategori !== filterKategori) {
        return false;
      }
      // 2. Filter Status
      if (filterStatus !== "Semua" && item.status !== filterStatus) {
        return false;
      }
      // 3. Filter PIC
      if (filterPic !== "Semua" && item.pic !== filterPic) {
        return false;
      }
      // 4. Global search
      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        const matchesGlobal =
          item.idKasus?.toLowerCase().includes(query) ||
          item.idTamu?.toLowerCase().includes(query) ||
          item.subKategori?.toLowerCase().includes(query) ||
          item.permasalahan?.toLowerCase().includes(query) ||
          item.pic?.toLowerCase().includes(query);
        if (!matchesGlobal) return false;
      }
      return true;
    });
  }, [data, filterKategori, filterStatus, filterPic, globalFilter]);

  const columns = React.useMemo<ColumnDef<Permasalahan>[]>(
    () => [
      {
        accessorKey: "idKasus",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold font-mono tracking-wider text-[10px]"
          >
            ID KASUS <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "idTamu",
        header: "GUEST RELASI",
        cell: (info) => {
          const val = info.getValue() as string;
          if (val && val !== "-") {
            const relatedTamu = tamuList.find((t) => t.idTamu === val);
            return (
              <button
                type="button"
                onClick={() => onNavigateToTamu && onNavigateToTamu(val)}
                className="font-mono text-[10px] font-bold text-blue-500 hover:underline text-left block"
                title={relatedTamu ? `Tamu: ${relatedTamu.nama}` : "Detail Tamu"}
              >
                {val}
                <span className="block text-[9px] text-slate-400 font-normal truncate max-w-[100px]">
                  {relatedTamu?.nama || "Klik Detail"}
                </span>
              </button>
            );
          }
          return <span className="text-slate-300 font-mono text-[10px] italic">Non-Tamu (Internal/AI)</span>;
        },
      },
      {
        accessorKey: "kategori",
        header: "KATEGORI / SUB-KATEGORI",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="max-w-[170px]">
              <span className="inline-flex text-[10px] leading-tight bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                {row.kategori}
              </span>
              <div className="text-[10px] text-slate-400 font-mono mt-1 font-semibold flex items-center gap-0.5">
                <HelpCircle className="w-3 h-3 text-bpmp-indigo" /> {row.subKategori || "-"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "permasalahan",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold text-left"
          >
            DESKRIPSI REMARKS / KELUHAN <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <p className="max-w-xs text-xs font-sans text-slate-700 line-clamp-2 md:line-clamp-3 leading-relaxed break-words" title={info.getValue() as string}>
            {info.getValue() as string}
          </p>
        ),
      },
      {
        accessorKey: "prioritas",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold"
          >
            PRIORITAS <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const val = info.getValue() as string;
          let colorClass = "bg-slate-100 text-slate-700";
          if (val === "Tinggi") {
            colorClass = "bg-red-50 text-red-700 border-red-100";
          } else if (val === "Sedang") {
            colorClass = "bg-amber-50 text-amber-700 border-amber-100";
          } else if (val === "Rendah") {
            colorClass = "bg-blue-50 text-blue-700 border-blue-100";
          }
          return (
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "pic",
        header: "PIC / OFFICER",
        cell: (info) => (
          <div className="flex items-center gap-1 min-w-[120px]">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600 truncate text-[11px]">
              {info.getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: (info) => {
          const val = info.getValue() as string;
          let colorClass = "bg-blue-50 text-blue-700 border-blue-200";

          if (val === "Terkendali" || val === "Ditutup") {
            colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          } else if (val === "Belum Terkendali") {
            colorClass = "bg-red-50 text-red-700 border-red-200 animate-pulse";
          } else if (val === "Ditindaklanjuti" || val === "Diproses") {
            colorClass = "bg-amber-50 text-amber-700 border-amber-200";
          } else if (val === "Diverifikasi") {
            colorClass = "bg-purple-50 text-purple-700 border-purple-200";
          }

          return (
            <span className={`inline-flex items-center text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${colorClass}`}>
              {val}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center font-bold">AKSI</div>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex justify-center items-center gap-1 md:gap-1.5 min-w-[100px]">
              <button
                onClick={() => onDetail(row)}
                title="Lihat Detail Permasalahan"
                className="text-slate-500 hover:text-bpmp-indigo p-1.5 rounded hover:bg-slate-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(row)}
                title="Edit Permasalahan"
                className="text-blue-500 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(row.idKasus)}
                title="Hapus Kasus"
                className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onDetail, tamuList, onNavigateToTamu]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  React.useEffect(() => {
    table.setPageSize(8);
  }, [table]);

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Dynamic Toolbar with Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between gap-4">
        
        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Deskripsi / ID / Sub Kategori / PIC..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue"
            />
          </div>

          {/* Filter Kategori */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              {uniqueKategori.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              {uniqueStatus.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filter PIC */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterPic}
              onChange={(e) => setFilterPic(e.target.value)}
              className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua PIC</option>
              {uniquePic.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Link to Create Case */}
        <div className="flex justify-end shrink-0">
          <button
            onClick={onAddClick}
            className="bg-bpmp-blue hover:bg-bpmp-indigo text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            + Catat Kasus Baru
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden pre-render-block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-4 font-semibold text-slate-500">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-400 bg-slate-50/20 font-medium">
                    Tidak ada data permasalahan yang cocok dengan filter / pencarian kamu.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination section */}
        {table.getPageCount() > 1 && (
          <div className="bg-slate-50/30 px-4 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              Menampilkan <span className="font-bold text-slate-700">{table.getRowModel().rows.length}</span> dari{" "}
              <span className="font-bold text-slate-700">{filteredData.length}</span> baris
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all font-semibold"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              
              <span className="mx-2">
                Halaman <span className="font-bold text-slate-700">{table.getState().pagination.pageIndex + 1}</span> dari <span className="font-bold text-slate-700">{table.getPageCount()}</span>
              </span>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all flex items-center gap-1 font-semibold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all font-semibold"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PermasalahanTable;
