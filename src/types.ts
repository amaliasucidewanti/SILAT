export type UserRole = "Administrator" | "Petugas" | "Pimpinan";

export interface Tamu {
  idTamu: string;
  tanggal: string;
  nama: string;
  instansi: string;
  jabatan: string;
  noHp: string;
  email: string;
  kabupatenKota: string;
  jenisKunjungan: string;
  bidangTujuan: string;
  petugasPenerima: string;
  jamDatang: string;
  jamPulang: string;
}

export interface Permasalahan {
  idKasus: string;
  idTamu: string;
  tanggal: string;
  kategori: string;
  subKategori: string;
  permasalahan: string;
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  pic: string;
  status: "Baru" | "Diverifikasi" | "Diproses" | "Ditindaklanjuti" | "Terkendali" | "Belum Terkendali" | "Ditutup";
}

export interface Solusi {
  idKasus: string;
  analisis: string;
  penyebab: string;
  solusiBpmp: string;
  tindakLanjut: string;
  tanggalTindakLanjut: string;
}

export interface Monitoring {
  idKasus: string;
  status: Permasalahan["status"];
  progress: number; // 0 - 100
  catatan: string;
  buktiTindakLanjut: string; // Deskripsi dokumen atau link fiktif
  tanggalUpdate: string;
}

export interface Kepuasan {
  idKasus: string;
  rating: number; // 1-5
  komentar: string;
  tanggal: string;
}

export type MainTab = "Overview" | "Arsitektur" | "ERD" | "Struktur" | "Wireframes";

export type WireframePage = 
  | "Dashboard" 
  | "Tamu" 
  | "Permasalahan" 
  | "Solusi" 
  | "Monitoring" 
  | "Pimpinan" 
  | "Laporan"
  | "Pengaturan";
