import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tamu } from "../types";
import { Clock, User, Building, Briefcase, Phone, Mail, MapPin, Tag, Landmark, ShieldCheck, Calendar } from "lucide-react";

// List parameters same as database definition
export const LIST_KABUPATEN = [
  "Kota Ternate",
  "Kota Tidore Kepulauan",
  "Kab. Halmahera Utara",
  "Kab. Halmahera Barat",
  "Kab. Halmahera Selatan",
  "Kab. Kepulauan Sula",
  "Kab. Halmahera Timur",
  "Kab. Halmahera Tengah",
  "Kab. Pulau Morotai",
  "Kab. Pulau Taliabu"
];

export const LIST_BIDANG = [
  "Pokja Transformasi Digital & BOSP",
  "Pokja Penjaminan Mutu & Kurikulum",
  "Pokja Data, Perencanaan & Penilaian",
  "Pokja Perencanaan & Pembiayaan",
  "Pokja Kemitraan & Transformasi Sekolah"
];

export const LIST_LAYANAN = [
  "Konsultasi Tatap Muka",
  "Layanan Mandiri",
  "Layanan Daring"
];

// Zod Schema to validate Tamu
const tamuSchema = z.object({
  idTamu: z.string().optional(),
  tanggal: z.string().min(1, { message: "Tanggal wajib diisi" }),
  nama: z.string().min(3, { message: "Nama lengkap minimal 3 karakter" }),
  instansi: z.string().min(3, { message: "Instansi minimal 3 karakter" }),
  jabatan: z.string().min(2, { message: "Jabatan minimal 2 karakter" }),
  noHp: z.string().min(10, { message: "Nomor HP minimal 10 digit angka" }).regex(/^[0-9+\-\s]+$/, { message: "Format nomor HP tidak valid" }),
  email: z.string().email({ message: "Format email tidak valid" }).or(z.string().length(0)).optional().nullable(),
  kabupatenKota: z.string().min(1, { message: "Silakan pilih kabupaten/kota asal" }),
  jenisKunjungan: z.string().min(1, { message: "Jenis kunjungan wajib ditentukan" }),
  bidangTujuan: z.string().min(1, { message: "Bidang/pokja tujuan wajib dipilih" }),
  petugasPenerima: z.string().min(2, { message: "Nama petugas penerima minimal 2 karakter" }),
  jamDatang: z.string().min(1, { message: "Jam datang wajib diisi" }),
  jamPulang: z.string().optional().nullable()
});

type TamuFormValues = z.infer<typeof tamuSchema>;

interface TamuFormProps {
  initialValues?: Partial<Tamu>;
  onSubmit: (values: TamuFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TamuForm: React.FC<TamuFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const defaultValues: TamuFormValues = {
    idTamu: initialValues?.idTamu || "",
    tanggal: initialValues?.tanggal || new Date().toISOString().split("T")[0],
    nama: initialValues?.nama || "",
    instansi: initialValues?.instansi || "",
    jabatan: initialValues?.jabatan || "",
    noHp: initialValues?.noHp || "",
    email: initialValues?.email || "",
    kabupatenKota: initialValues?.kabupatenKota || LIST_KABUPATEN[0],
    jenisKunjungan: initialValues?.jenisKunjungan || LIST_LAYANAN[0],
    bidangTujuan: initialValues?.bidangTujuan || LIST_BIDANG[0],
    petugasPenerima: initialValues?.petugasPenerima || "",
    jamDatang: initialValues?.jamDatang || new Date().toTimeString().slice(0, 5),
    jamPulang: initialValues?.jamPulang || ""
  };

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TamuFormValues>({
    resolver: zodResolver(tamuSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-sans">
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tanggal */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Calendar className="w-3.5 h-3.5 text-bpmp-blue" /> Tanggal Kunjungan*
          </label>
          <input
            type="date"
            {...register("tanggal")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.tanggal ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.tanggal && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.tanggal.message}</p>
          )}
        </div>

        {/* Nama Lengkap */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <User className="w-3.5 h-3.5 text-bpmp-blue" /> Nama Lengkap Tamu*
          </label>
          <input
            type="text"
            placeholder="Contoh: Drs. Amran Syafar, M.Pd."
            {...register("nama")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.nama ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.nama && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.nama.message}</p>
          )}
        </div>

        {/* Instansi Asal */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Building className="w-3.5 h-3.5 text-bpmp-blue" /> Instansi Asal*
          </label>
          <input
            type="text"
            placeholder="Contoh: Dinas Pendidikan Kab. Halmahera Barat"
            {...register("instansi")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.instansi ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.instansi && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.instansi.message}</p>
          )}
        </div>

        {/* Jabatan */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Briefcase className="w-3.5 h-3.5 text-bpmp-blue" /> Jabatan Resmi*
          </label>
          <input
            type="text"
            placeholder="Contoh: Kepala Bidang Pembinaan SD"
            {...register("jabatan")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.jabatan ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.jabatan && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.jabatan.message}</p>
          )}
        </div>

        {/* Nomor HP */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Phone className="w-3.5 h-3.5 text-bpmp-blue" /> Nomor WhatsApp / HP*
          </label>
          <input
            type="text"
            placeholder="Contoh: 08123456789"
            {...register("noHp")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.noHp ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.noHp && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.noHp.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Mail className="w-3.5 h-3.5 text-bpmp-blue" /> Alamat Email (Optional)
          </label>
          <input
            type="text"
            placeholder="Contoh: amran.halbar@gmail.com"
            {...register("email")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.email ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Kabupaten/Kota */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-bpmp-blue" /> Kabupaten / Kota Asal*
          </label>
          <select
            {...register("kabupatenKota")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.kabupatenKota ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue"
            }`}
          >
            {LIST_KABUPATEN.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {errors.kabupatenKota && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.kabupatenKota.message}</p>
          )}
        </div>

        {/* Jenis Layanan */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Tag className="w-3.5 h-3.5 text-bpmp-blue" /> Jenis Layanan / Kunjungan*
          </label>
          <select
            {...register("jenisKunjungan")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.jenisKunjungan ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue"
            }`}
          >
            {LIST_LAYANAN.map(lay => (
              <option key={lay} value={lay}>{lay}</option>
            ))}
          </select>
          {errors.jenisKunjungan && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.jenisKunjungan.message}</p>
          )}
        </div>

        {/* Bidang/Pokja Tujuan */}
        <div className="space-y-1 md:col-span-2">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Landmark className="w-3.5 h-3.5 text-bpmp-blue" /> Bidang / Pokja BPMP Tujuan*
          </label>
          <select
            {...register("bidangTujuan")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none ${
              errors.bidangTujuan ? "border-red-500" : "border-slate-200 focus:border-bpmp-blue"
            }`}
          >
            {LIST_BIDANG.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {errors.bidangTujuan && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.bidangTujuan.message}</p>
          )}
        </div>

        {/* Petugas Penerima */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-bpmp-blue" /> Petugas Penerima BPMP*
          </label>
          <input
            type="text"
            placeholder="Contoh: Aulia Rahman, S.Kom."
            {...register("petugasPenerima")}
            className={`w-full bg-white p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
              errors.petugasPenerima ? "border-red-500 focus:ring-red-300" : "border-slate-200 focus:border-bpmp-blue focus:ring-bpmp-sky"
            }`}
          />
          {errors.petugasPenerima && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.petugasPenerima.message}</p>
          )}
        </div>

        {/* Jam Datang / Pulang */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider text-[9px]">
              <Clock className="w-3 h-3 text-bpmp-blue" /> Datang*
            </label>
            <input
              type="time"
              {...register("jamDatang")}
              className={`w-full bg-white p-2 rounded-lg border text-xs focus:outline-none ${
                errors.jamDatang ? "border-red-500" : "border-slate-200 focus:border-bpmp-blue"
              }`}
            />
            {errors.jamDatang && (
              <p className="text-red-500 text-[9px] mt-0.5">{errors.jamDatang.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider text-[9px]">
              <Clock className="w-3 h-3 text-bpmp-blue" /> Pulang
            </label>
            <input
              type="time"
              {...register("jamPulang")}
              className={`w-full bg-white p-2 rounded-lg border text-xs focus:outline-none border-slate-200 focus:border-bpmp-blue`}
            />
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-bpmp-blue hover:bg-bpmp-light-blue text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : (initialValues?.idTamu ? "Simpan Perubahan" : "Tambah Tamu")}
        </button>
      </div>
    </form>
  );
};

export default TamuForm;
