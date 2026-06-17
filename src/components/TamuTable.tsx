import React, { useState } from "react";
import { Tamu } from "../types";
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
  MapPin,
  Tag,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

interface TamuTableProps {
  data: Tamu[];
  onEdit: (tamu: Tamu) => void;
  onDelete: (id: string) => void;
  onDetail: (tamu: Tamu) => void;
  onAddClick: () => void;
}

const TamuTable: React.FC<TamuTableProps> = ({
  data,
  onEdit,
  onDelete,
  onDetail,
  onAddClick,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterKabupaten, setFilterKabupaten] = useState("Semua");
  const [filterBidang, setFilterBidang] = useState("Semua");

  // Get unique options for filter select
  const uniqueKabupaten = Array.from(new Set(data.map((t) => t.kabupatenKota))).filter(Boolean);
  const uniqueBidang = Array.from(new Set(data.map((t) => t.bidangTujuan))).filter(Boolean);

  // Custom filter logic combined with global filter (search)
  const filteredData = React.useMemo(() => {
    return data.filter((tamu) => {
      // 1. Filter Kabupaten/Kota
      if (filterKabupaten !== "Semua" && tamu.kabupatenKota !== filterKabupaten) {
        return false;
      }
      // 2. Filter Bidang Tujuan
      if (filterBidang !== "Semua" && tamu.bidangTujuan !== filterBidang) {
        return false;
      }
      // 3. Search (Global filter)
      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        const matchesSearch =
          tamu.idTamu?.toLowerCase().includes(query) ||
          tamu.nama?.toLowerCase().includes(query) ||
          tamu.instansi?.toLowerCase().includes(query) ||
          tamu.jabatan?.toLowerCase().includes(query) ||
          tamu.email?.toLowerCase().includes(query) ||
          tamu.noHp?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [data, filterKabupaten, filterBidang, globalFilter]);

  const columns = React.useMemo<ColumnDef<Tamu>[]>(
    () => [
      {
        accessorKey: "idTamu",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold font-mono tracking-wider text-[10px]"
          >
            ID GUEST <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold"
          >
            TANGGAL <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-slate-600 block min-w-[75px]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "nama",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold text-left"
          >
            NAMA LENGKAP & JABATAN <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="max-w-[200px]">
              <div className="font-bold text-slate-800 break-words">{row.nama}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate" title={row.jabatan}>
                {row.jabatan}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "instansi",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-bpmp-blue font-bold text-left"
          >
            INSTANSI ASAL & AREA <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="max-w-[200px]">
              <div className="font-medium text-slate-700 break-words">{row.instansi}</div>
              <div className="text-[10px] text-bpmp-blue font-semibold flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-3 h-3 text-bpmp-indigo inline" /> {row.kabupatenKota}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "bidangTujuan",
        header: "BIDANG / POKJA TUJUAN",
        cell: (info) => {
          const val = info.getValue() as string;
          // Clean the prefix BUKU_TAMU& if present
          const cleanVal = val.includes("&") ? val.split("&")[1] : val;
          return (
            <span className="inline-flex max-w-[200px] text-[10px] leading-tight bg-sky-50 text-bpmp-blue px-2.5 py-1 rounded-full font-medium border border-sky-100">
              {cleanVal}
            </span>
          );
        },
      },
      {
        accessorKey: "jenisKunjungan",
        header: "JENIS LAYANAN",
        cell: (info) => {
          const val = info.getValue() as string;
          let colorClass = "bg-purple-50 text-purple-700 border-purple-100";
          if (val === "Layanan Mandiri") {
            colorClass = "bg-amber-50 text-amber-700 border-amber-100";
          } else if (val === "Layanan Daring") {
            colorClass = "bg-green-50 text-green-700 border-green-100";
          }
          return (
            <span className={`inline-flex text-[10px] ${colorClass} px-2 py-0.5 rounded font-medium border`}>
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
            <div className="flex justify-center items-center gap-1.5 min-w-[100px]">
              <button
                onClick={() => onDetail(row)}
                title="Detail Tamu"
                className="text-slate-500 hover:text-bpmp-indigo p-1.5 rounded hover:bg-slate-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(row)}
                title="Edit Baris Tamu"
                className="text-blue-500 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(row.idTamu)}
                title="Hapus Baris Tamu"
                className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onDetail]
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

  // Customize standard pagination size to 8 for tighter wireframe fit
  React.useEffect(() => {
    table.setPageSize(8);
  }, [table]);

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Dynamic Toolbar with Search, Multi-Filter, and Trigger */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        
        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama / Instansi / ID / HP..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-bpmp-blue"
            />
          </div>

          {/* Filter Kabupaten */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterKabupaten}
              onChange={(e) => setFilterKabupaten(e.target.value)}
              className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kabupaten/Kota</option>
              {uniqueKabupaten.map((kab) => (
                <option key={kab} value={kab}>
                  {kab}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bidang Tujuan */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="bg-transparent border-none text-xs w-full py-2 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Bidang/Pokja</option>
              {uniqueBidang.map((bid) => {
                const bStr = bid as string;
                return (
                  <option key={bStr} value={bStr}>
                    {bStr.includes("&") ? bStr.split("&")[1] : bStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Add guest trigger for sheets sync */}
        <div className="flex justify-end shrink-0">
          <button
            onClick={onAddClick}
            className="bg-bpmp-blue hover:bg-bpmp-indigo text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            + Tambah Tamu (POST Sheets)
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
                    Tidak ada data tamu yang cocok dengan filter / pencarian kamu.
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
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all"
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
                className="p-1 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all"
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

export default TamuTable;
