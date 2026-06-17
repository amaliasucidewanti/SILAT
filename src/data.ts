import { Tamu, Permasalahan, Solusi, Monitoring, Kepuasan } from "./types";

// Columns list for spreadsheet sheets
export const SPREADSHEET_SPECS = [
  {
    name: "TAMU",
    description: "Menyimpan seluruh log kunjungan tamu/konsultasi fisik maupun online.",
    columns: [
      { name: "ID_TAMU", type: "Text (Primary Key)", example: "TM-20260601-001", desc: "Format: TM-YYYYMMDD-Sequence" },
      { name: "TANGGAL", type: "Date", example: "2026-06-01", desc: "Tanggal kunjungan tamu" },
      { name: "NAMA", type: "Text", example: "Drs. Amran Syafar", desc: "Nama lengkap tamu beserta gelar" },
      { name: "INSTANSI", type: "Text", example: "Dinas Pendidikan Halmahera Utara", desc: "Instansi kerja asal" },
      { name: "JABATAN", type: "Text", example: "Kasi Kurikulum SD", desc: "Jabatan formal instansi" },
      { name: "NO_HP", type: "Text", example: "081244558899", desc: "Nomor WhatsApp aktif" },
      { name: "EMAIL", type: "Text", example: "amran.sd@gmail.com", desc: "Email korespondensi aktif" },
      { name: "KABUPATEN_KOTA", type: "Text (Foreign Key)", example: "Kab. Halmahera Utara", desc: "Asal kabupaten/kota dari Master" },
      { name: "JENIS_KUNJUNGAN", type: "Text", example: "Kunjungan Langsung", desc: "Fisik/Tamu Langsung atau Daring" },
      { name: "BIDANG_TUJUAN", type: "Text (Foreign Key)", example: "Uman/Kepegawaian", desc: "Bidang/Pokja tujuan di BPMP Provinsi Maluku Utara" },
      { name: "PETUGAS_PENERIMA", type: "Text", example: "M. Rizky Syaaban", desc: "Nama petugas FO BPMP yang menerima" },
      { name: "JAM_DATANG", type: "Time", example: "09:30", desc: "Waktu check-in tamu" },
      { name: "JAM_PULANG", type: "Time", example: "11:15", desc: "Waktu check-out tamu" },
    ]
  },
  {
    name: "PERMASALAHAN",
    description: "Mendata eskalasi permasalahan spesifik dari dinas pendidikan atau sekolah.",
    columns: [
      { name: "ID_KASUS", type: "Text (Primary Key)", example: "KS-20260601-001", desc: "Format: KS-YYYYMMDD-Sequence" },
      { name: "ID_TAMU", type: "Text (Foreign Key)", example: "TM-20260601-001", desc: "Relasi terkait ID Tamu (bisa kosong jika non-tamu)" },
      { name: "TANGGAL", type: "Date", example: "2026-06-01", desc: "Tanggal pencatatan keluhan" },
      { name: "KATEGORI", type: "Text (Foreign Key)", example: "Teknologi & Aplikasi", desc: "Kategori masalah utama dari Master" },
      { name: "SUB_KATEGORI", type: "Text", example: "Sinkronisasi ARKAS", desc: "Sub-kategori teknis spesifik" },
      { name: "PERMASALAHAN", type: "Text", example: "Gagal unggah lembar pengesahan BOSP di ARKAS 4 karena gangguan token.", desc: "Deskripsi keluhan mendetail" },
      { name: "PRIORITAS", type: "Text", example: "Tinggi", desc: "Tinggi / Sedang / Rendah" },
      { name: "PIC", type: "Text", example: "Fadlillah Ahmad, S.Kom", desc: "Petugas ahli yang menangani masalah" },
      { name: "STATUS", type: "Text", example: "Diproses", desc: "Status alur: Baru / Diverifikasi / Diproses / dll" },
    ]
  },
  {
    name: "SOLUSI",
    description: "Menyimpan hasil kajian teknis, penyebab, dan draft rekomendasi penyelesaian.",
    columns: [
      { name: "ID_KASUS", type: "Text (Primary Key / FK)", example: "KS-20260601-001", desc: "Relasi 1:1 ke tabel PERMASALAHAN" },
      { name: "ANALISIS", type: "Text", example: "Pemeriksaan log kegagalan menunjukkan bentrok port sertifikat SSL.", desc: "Deskripsi diagnosis teknis" },
      { name: "PENYEBAB", type: "Text", example: "Pemasangan firewall ganda pada modem sekolah lokal.", desc: "Mengapa masalah terjadi" },
      { name: "SOLUSI_BPMP", type: "Text", example: "Memandu penyesuaian port 443 pada setup router sekolah.", desc: "Solusi tertulis yang disarankan BPMP" },
      { name: "TINDAK_LANJUT", type: "Text", example: "Mengirim instruksi via WhatsApp untuk dicoba operator.", desc: "Langkah konkret paska konsultasi" },
      { name: "TANGGAL_TINDAK_LANJUT", type: "Date", example: "2026-06-02", desc: "Rencana resolusi tindakan dilakukan" },
    ]
  },
  {
    name: "MONITORING",
    description: "Daftar pengawasan progress penyelesaian keluhan oleh pimpinan dan admin.",
    columns: [
      { name: "ID_KASUS", type: "Text (Primary Key / FK)", example: "KS-20260601-001", desc: "Relasi 1:1 ke tabel PERMASALAHAN" },
      { name: "STATUS", type: "Text", example: "Ditindaklanjuti", desc: "Status paska-solusi (Ditindaklanjuti / Terkendali / dll)" },
      { name: "PROGRESS", type: "Number", example: "80", desc: "Persentase penyelesaian (0 - 100)" },
      { name: "CATATAN", type: "Text", example: "Sekolah mengonfirmasi pengiriman data berhasil sebagian.", desc: "Catatan pengawasan operasional" },
      { name: "BUKTI_TINDAK_LANJUT", type: "Text (Link/Text)", example: "Foto_Asistensi_ARKAS.pdf / Screenshoot_Sukses.png", desc: "Nama berkas bukti resolusi" },
      { name: "TANGGAL_UPDATE", type: "Date", example: "2026-06-03", desc: "Tanggal pembaruan progres terakhir" },
    ]
  },
  {
    name: "KEPUASAN",
    description: "Evaluasi kualitas layanan paska penyelesaian masalah.",
    columns: [
      { name: "ID_KASUS", type: "Text (Primary Key / FK)", example: "KS-20260601-001", desc: "Relasi ke tabel KASUS" },
      { name: "RATING", type: "Number", example: "5", desc: "Skala kepuasan (1 s.d 5)" },
      { name: "KOMENTAR", type: "Text", example: "Sangat responsif dan solusinya langsung bisa dipraktikkan.", desc: "Ulasan dari perwakilan instansi" },
      { name: "TANGGAL", type: "Date", example: "2026-06-04", desc: "Tanggal survei kepuasan didata" },
    ]
  },
  {
    name: "MASTER DATA (3 Sheet)",
    description: "Daftar referensi statis untuk validasi isian dropdown form di frontend.",
    columns: [
      { name: "MASTER_BIDANG", type: "List", example: "Umum, Konsultasi BOSP, Data Dapodik, Kurikulum Merdeka", desc: "Bidang/Pokja tujuan di internal BPMP" },
      { name: "MASTER_KATEGORI", type: "List", example: "Sistem Aplikasi, Kurikulum, Keuangan, Tata Pamong", desc: "Daftar kelompok permasalahan primer" },
      { name: "MASTER_KABUPATEN", type: "List", example: "Kota Ternate, Kota Tidore Kepulauan, Kab. Halmahera Utara, Kab. Halmahera Barat, Kab. Halmahera Selatan, Kab. Kepulauan Sula, Kab. Halmahera Timur, Kab. Halmahera Tengah, Kab. Pulau Morotai, Kab. Pulau Taliabu", desc: "10 Kabupaten/Kota Provinsi Maluku Utara" },
    ]
  }
];

export const INITIAL_TAMU: Tamu[] = [
  {
    idTamu: "TM-20260601-001",
    tanggal: "2026-06-01",
    nama: "Herman Gafar, M.Pd",
    instansi: "Dinas Pendidikan Kab. Halmahera Barat",
    jabatan: "Kepala Bidang Pembinaan SD",
    noHp: "081122334455",
    email: "herman.gafar@halbar.go.id",
    kabupatenKota: "Kab. Halmahera Barat",
    jenisKunjungan: "Konsultasi Tatap Muka",
    bidangTujuan: "Pokja Penjaminan Mutu & Kurikulum",
    petugasPenerima: "Aulia Rahman, SE",
    jamDatang: "08:45",
    jamPulang: "10:30",
  },
  {
    idTamu: "TM-20260605-002",
    tanggal: "2026-06-05",
    nama: "Siti Rahma, S.Pd",
    instansi: "SDN 4 Kota Ternate",
    jabatan: "Kepala Sekolah",
    noHp: "081399887766",
    email: "sitirahma.sdn4@ternate.sch.id",
    kabupatenKota: "Kota Ternate",
    jenisKunjungan: "Konsultasi Tatap Muka",
    bidangTujuan: "Pokja Transformasi Digital & BOSP",
    petugasPenerima: "Budi Santoso, S.Sos",
    jamDatang: "13:15",
    jamPulang: "14:45",
  },
  {
    idTamu: "TM-20260608-003",
    tanggal: "2026-06-08",
    nama: "Darwin Ahmad, S.Kom",
    instansi: "SMAN 1 Kepulauan Sula",
    jabatan: "Operator Dapodik",
    noHp: "085277661122",
    email: "darwin.ops1@sulakab.go.id",
    kabupatenKota: "Kab. Kepulauan Sula",
    jenisKunjungan: "Layanan Daring",
    bidangTujuan: "Pokja Data, Perencanaan & Penilaian",
    petugasPenerima: "Rizky Saputra, A.Md",
    jamDatang: "10:00",
    jamPulang: "11:20",
  },
  {
    idTamu: "TM-20260610-004",
    tanggal: "2026-06-10",
    nama: "Fahri Togupu, SE",
    instansi: "Dinas Pendidikan dan Kebudayaan Halmahera Timur",
    jabatan: "Kasi Perencanaan Anggaran Dinas",
    noHp: "082188775533",
    email: "fahritogupu.disdik@haltim.go.id",
    kabupatenKota: "Kab. Halmahera Timur",
    jenisKunjungan: "Konsultasi Tatap Muka",
    bidangTujuan: "Pokja Perencanaan & Pembiayaan",
    petugasPenerima: "Aulia Rahman, SE",
    jamDatang: "09:00",
    jamPulang: "12:00",
  },
  {
    idTamu: "TM-20260611-005",
    tanggal: "2026-06-11",
    nama: "Ruslan Umar, M.Si",
    instansi: "Dinas Pendidikan Kab. Pulau Morotai",
    jabatan: "Sekretaris Dinas Pendidikan",
    noHp: "081242331100",
    email: "ruslan_morotai@gmail.com",
    kabupatenKota: "Kab. Pulau Morotai",
    jenisKunjungan: "Konsultasi Tatap Muka",
    bidangTujuan: "Pokja Kemitraan & Transformasi Sekolah",
    petugasPenerima: "Fadlillah Ahmad",
    jamDatang: "08:15",
    jamPulang: "10:00",
  }
];

export const INITIAL_PERMASALAHAN: Permasalahan[] = [
  {
    idKasus: "KS-20260601-001",
    idTamu: "TM-20260601-001",
    tanggal: "2026-06-01",
    kategori: "Kurikulum & Pendampingan Peningkatan Mutu",
    subKategori: "Pendampingan IKM & PMM",
    permasalahan: "Satuan pendidikan kesulitan melakukan pelaporan aksi nyata pada PMM karena keterlambatan verifikasi oleh pusat, menghambat rapor pendidikan sekolah.",
    prioritas: "Sedang",
    pic: "Drs. La Ode Ruslan, M.Si",
    status: "Terkendali",
  },
  {
    idKasus: "KS-20260605-002",
    idTamu: "TM-20260605-002",
    tanggal: "2026-06-05",
    kategori: "Teknologi Informasi & Sistem Aplikasi",
    subKategori: "Sinkronisasi ARKAS",
    permasalahan: "Lembar pertanggungjawaban dana BOSP tidak muncul saat dicetak pada software ARKAS versi 4.0.8, menimbulkan ketakutan keterlambatan pelaporan SPJ.",
    prioritas: "Tinggi",
    pic: "Fadlillah Ahmad, S.Kom",
    status: "Ditindaklanjuti",
  },
  {
    idKasus: "KS-20260608-003",
    idTamu: "TM-20260608-003",
    tanggal: "2026-06-08",
    kategori: "Teknologi Informasi & Sistem Aplikasi",
    subKategori: "E-Rapor Pendidikan",
    permasalahan: "Gagal menarik data nilai siswa dari Dapodik lokal ke aplikasi E-Rapor karena duplikasi akun guru pengampu mata pelajaran prakarya.",
    prioritas: "Sedang",
    pic: "Suwardi, S.T., M.T.",
    status: "Diproses",
  },
  {
    idKasus: "KS-20260610-004",
    idTamu: "TM-20260610-004",
    tanggal: "2026-06-10",
    kategori: "Perencanaan & Akuntabilitas Keuangan",
    subKategori: "Penyusunan Kertas Kerja BOSP",
    permasalahan: "Koreksi anggaran pembelanjaan buku ajar pada kuesioner RKAS tidak sinkron dengan ketentuan petunjuk teknis kementerian nomor 18/2026.",
    prioritas: "Tinggi",
    pic: "Drs. Umar Faruq",
    status: "Diverifikasi",
  },
  {
    idKasus: "KS-20260611-005",
    idTamu: "TM-20260611-005",
    tanggal: "2026-06-11",
    kategori: "Kepegawaian & Umum",
    subKategori: "Kemitraan Daerah",
    permasalahan: "Keterlambatan pembentukan Satgas Pencegahan Kekerasan (PPKSP) tingkat kabupaten karena pergantian pimpinan dinas pendidikan terkait.",
    prioritas: "Rendah",
    pic: "Erna S., S.i.P.",
    status: "Baru",
  }
];

export const INITIAL_SOLUSI: Record<string, Solusi> = {
  "KS-20260601-001": {
    idKasus: "KS-20260601-001",
    analisis: "Verifikasi PMM sepenuhnya dikelola kementerian pusat, namun BPMP memiliki kuota fasilitasi percepatan verifikasi aksi nyata melalui helpdesk internal khusus.",
    penyebab: "Antrean verifikasi aksi nyata nasional yang menumpuk di platform pusat.",
    solusiBpmp: "Mengumpulkan data ID PMM dan sertifikat aksi nyata guru Halbar lalu mengekskalasi khusus ke helpdesk pusat via admin BPMP.",
    tindakLanjut: "Memberikan panduan tips penulisan aksi nyata bebas plagiarisme agar langsung disetujui pusat.",
    tanggalTindakLanjut: "2026-06-03"
  },
  "KS-20260605-002": {
    idKasus: "KS-20260605-002",
    analisis: "Bug visual pada renderer file PDF ARKAS versi 4.0.8 yang disebabkan oleh pengaturan default font sistem operasi Windows yang tidak cocok.",
    penyebab: "OS komputer sekolah belum update driver visual pendukung fonts.",
    solusiBpmp: "Melakukan instalasi font Microsoft Core Pack gratis dan mengonfigurasi setingan print preview ARKAS ke printer PDF virtual.",
    tindakLanjut: "Memandu install ulang patch pembaharuan mini ARKAS 4.0.9.",
    tanggalTindakLanjut: "2026-06-06"
  }
};

export const INITIAL_MONITORING: Record<string, Monitoring> = {
  "KS-20260601-001": {
    idKasus: "KS-20260601-001",
    status: "Terkendali",
    progress: 100,
    catatan: "15 akun guru Halbar berhasil diterbitkan sertifikatnya oleh pusat. Kasus selesai sepenuhnya.",
    buktiTindakLanjut: "Buku_Serah_Terpilih.jpg",
    tanggalUpdate: "2026-06-04"
  },
  "KS-20260605-002": {
    idKasus: "KS-20260605-002",
    status: "Ditindaklanjuti",
    progress: 85,
    catatan: "ARKAS milik operator sekolah telah berhasil mengekspor PDF laporan spj. Sedang mencetak bukti fisik SPJ.",
    buktiTindakLanjut: "Bukti_E-SPJ_SDN4.png",
    tanggalUpdate: "2026-06-07"
  },
  "KS-20260608-003": {
    idKasus: "KS-20260608-003",
    status: "Diproses",
    progress: 50,
    catatan: "Data duplikasi guru pengampu mapel prakarya di Dapodik sudah dinonaktifkan oleh Dinas. Menunggu sinkronisasi lokal berikutnya.",
    buktiTindakLanjut: "Draft_Berita_Koreksi.docx",
    tanggalUpdate: "2026-06-09"
  }
};

export const INITIAL_KEPUASAN: Record<string, Kepuasan> = {
  "KS-20260601-001": {
    idKasus: "KS-20260601-001",
    rating: 5,
    komentar: "Pelayanan sangat memuaskan, aksi nyata guru-guru kami langsung diverifikasi sehingga rapor pendidikan sekolah membaik.",
    tanggal: "2026-06-04"
  }
};

export const APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT DATABASE API
 * Penempatan pada: Apps Script Editor yang terhubung dengan Google Spreadsheet utama.
 * BPMP Provinsi Maluku Utara - SILAT BPMP
 */

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

function getSheetByName(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

// Handler GET request untuk melakukan pembacaan data (READ)
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (!action) {
      return respondError("Action parameter is required");
    }
    
    switch (action) {
      case "getTamu":
        return respondSuccess(readTable("TAMU"));
      case "getPermasalahan":
        return respondSuccess(readTable("PERMASALAHAN"));
      case "getSolusi":
        return respondSuccess(readTable("SOLUSI"));
      case "getMonitoring":
        return respondSuccess(readTable("MONITORING"));
      case "getKepuasan":
        return respondSuccess(readTable("KEPUASAN"));
      case "getMaster":
        return respondSuccess({
          bidang: readTable("MASTER_BIDANG"),
          kategori: readTable("MASTER_KATEGORI"),
          kabupaten: readTable("MASTER_KABUPATEN")
        });
      default:
        return respondError("Unknown GET action: " + action);
    }
  } catch (error) {
    return respondError(error.toString());
  }
}

// Handler POST request untuk manipulasi data (CREATE, UPDATE, DELETE)
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheetName = postData.sheet;
    const payload = postData.payload;
    
    if (!action) return respondError("Action in payload is required");
    
    switch (action) {
      case "create":
        return respondSuccess(insertRow(sheetName, payload));
      case "update":
        return respondSuccess(updateRow(sheetName, postData.keyColumn, postData.keyValue, payload));
      case "delete":
        return respondSuccess(deleteRow(sheetName, postData.keyColumn, postData.keyValue));
      default:
        return respondError("Unknown POST action: " + action);
    }
  } catch (error) {
    return respondError(error.toString());
  }
}

// Fungsi pembantu pembacaan tabel spreadsheet ke format JSON array
function readTable(sheetName) {
  const sheet = getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      // Mengubah format nilai tanggal agar seragam string ISO
      let val = data[i][j];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      rowObj[headers[j]] = val;
    }
    rows.push(rowObj);
  }
  return rows;
}

// Fungsi insert baris baru
function insertRow(sheetName, payload) {
  const sheet = getSheetByName(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = [];
  
  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i];
    newRow.push(payload[headerName] !== undefined ? payload[headerName] : "");
  }
  
  sheet.appendRow(newRow);
  return { status: "Row appended successfully", data: payload };
}

// Fungsi update baris berdasarkan Primary Key
function updateRow(sheetName, keyColumn, keyValue, payload) {
  const sheet = getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);
  
  if (keyIndex === -1) throw new Error("Key column not found: " + keyColumn);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex].toString() === keyValue.toString()) {
      for (const prop in payload) {
        const colIndex = headers.indexOf(prop);
        if (colIndex !== -1) {
          // Update sel spesifik pada baris i+1
          sheet.getRange(i + 1, colIndex + 1).setValue(payload[prop]);
        }
      }
      return { status: "Row updated successfully" };
    }
  }
  throw new Error("Record with key " + keyValue + " not found");
}

// Fungsi utilitas untuk menghapus baris (soft / hard-delete)
function deleteRow(sheetName, keyColumn, keyValue) {
  const sheet = getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);
  
  if (keyIndex === -1) throw new Error("Key column not found: " + keyColumn);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex].toString() === keyValue.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "Row deleted successfully" };
    }
  }
  throw new Error("Record with key " + keyValue + " not found");
}

// Menghasilkan response JSON yang kompatibel dengan CORS
function respondSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, response: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(errorMessage) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: errorMessage }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
