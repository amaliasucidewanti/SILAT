/**
 * =========================================================================
 *                         SILAT BPMP BACKEND DATABASE BRIDGE
 *          Sistem Informasi Layanan dan Tindak Lanjut BPMP Provinsi Maluku Utara
 * =========================================================================
 * 
 * Penempatan Skrip:
 * 1. Buka Google Spreadsheet Utama Anda (ID: 1UOAmoREYYXQh5NI5j1jdUZ5f_szbTgrWX3IQA9wr4D8)
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'
 * 3. Hapus seluruh kode default yang ada, lalu salin dan tempel kode ini seluruhnya.
 * 4. Ganti versi deploy atau Deploy sebagai 'Web App':
 *    - Execute as: "Me" (Email Anda)
 *    - Who has access: "Anyone" (Agar aplikasi Vercel dapat memanggil tanpa hambatan login)
 * 5. Salin URL Web App yang dihasilkan untuk dikonfigurasi sebagai API endpoint pada frontend.
 */

// Konfigurasi Database Utama
const SPREADSHEET_ID = "1UOAmoREYYXQh5NI5j1jdUZ5f_szbTgrWX3IQA9wr4D8";

/**
 * Mendapatkan Referensi Spreadsheet Utama secara Pintar & Fleksibel
 */
function getSpreadsheetObj() {
  let ss = null;
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Gagal membuka lewat ID, mencoba getActiveSpreadsheet... Detail: " + e.toString());
    }
  }
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      throw new Error("Tidak dapat menemukan Google Spreadsheet. Pastikan variabel SPREADSHEET_ID diatur dengan benar atau pasang script ini langsung di dalam ekosistem spreadsheet.");
    }
  }
  return ss;
}

/**
 * FUNGSI SETUP MANDIRI (Rekomendasi Utama)
 * Jalankan fungsi ini sekali saja di Google Apps Script dengan memilih menu drop-down fungsi 'SETUP_BUAT_SHEET_OTOMATIS' lalu klik tombol 'Jalankan' (Run - Simbol Segitiga Samping).
 * Ini akan memunculkan dialog 'Izin Diperlukan' (Review Permissions) -> Pilih Akun Anda -> Advanced -> Go to ... (unsafe) -> klik 'Allow'.
 * Mengapa wajib? 
 * 1. Ini memberikan otorisasi aman (perizinan) bagi skrip web app untuk mengakses Spreadsheet Anda.
 * 2. Ini akan otomatis memeriksa dan membuat lembar sheet (TAMU, PERMASALAHAN, MONITORING, SOLUSI, KEPUASAN) lengkap beserta baris header kolomnya masing-masing secara instan!
 */
function SETUP_BUAT_SHEET_OTOMATIS() {
  const ss = getSpreadsheetObj();
  Logger.log("--- MEMULAI PROSES PEMBUATAN TAB SHEETS SECARA OTOMATIS ---");
  
  const bento = {
    "TAMU": [
      "ID_TAMU", "TANGGAL", "NAMA", "INSTANSI", "JABATAN", 
      "NO_HP", "EMAIL", "KABUPATEN_KOTA", "JENIS_KUNJUNGAN", 
      "BIDANG_TUJUAN", "PETUGAS_PENERIMA", "JAM_DATANG", "JAM_PULANG"
    ],
    "PERMASALAHAN": [
      "ID_KASUS", "ID_TAMU", "TANGGAL", "KATEGORI", "SUB_KATEGORI", 
      "PERMASALAHAN", "PRIORITAS", "PIC", "STATUS"
    ],
    "MONITORING": [
      "ID_KASUS", "STATUS", "PROGRESS", "CATATAN", 
      "BUKTI_TINDAK_LANJUT", "TANGGAL_UPDATE"
    ],
    "SOLUSI": [
      "ID_KASUS", "ANALISIS", "PENYEBAB", "SOLUSI_BPMP", 
      "TINDAK_LANJUT", "TANGGAL_TINDAK_LANJUT"
    ],
    "KEPUASAN": [
      "ID_KASUS", "RATING", "KOMENTAR", "TANGGAL"
    ]
  };
  
  for (const sheetName in bento) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log("-> Berhasil membuat Sheet baru: '" + sheetName + "'");
    } else {
      Logger.log("-> Sheet '" + sheetName + "' sudah tersedia.");
    }
    
    // Validasi atau setel Header Kolom
    const values = sheet.getDataRange().getValues();
    if (values.length === 0 || (values.length === 1 && values[0][0] === "")) {
      sheet.getRange(1, 1, 1, bento[sheetName].length).setValues([bento[sheetName]]);
      // Atur huruf bold pada baris kepala
      sheet.getRange(1, 1, 1, bento[sheetName].length).setFontWeight("bold");
      Logger.log("   [OK] Header kolom berhasil disematkan di baris ke-1!");
    } else {
      Logger.log("   [OK] Sheet sudah memiliki baris data/headers.");
    }
  }
  
  Logger.log("--- SETUP SUKSES BESAR! SEMUA SHEETS SIAP DIGUNAKAN ---");
  return "Inisialisasi Sukses! Semua sheet siap dipakai.";
}

/**
 * Mendapatkan referensi Sheet berdasarkan Nama
 */
function getSheet(sheetName) {
  const ss = getSpreadsheetObj();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Jika tidak ditemukan, coba inisialisasi dulu otomatis demi ketahanan
    SETUP_BUAT_SHEET_OTOMATIS();
    sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' tidak ditemukan dalam Google Spreadsheet.");
    }
  }
  return sheet;
}

/**
 * Handler Utama untuk Permintaan HTTP GET (Membaca Data)
 * Mendukung Routing Berbasis Query Parameter 'path' atau 'endpoint'
 * Contoh: 
 *   - GET .../exec?path=/tamu
 *   - GET .../exec?path=/permasalahan
 *   - GET .../exec?path=/monitoring
 */
function doGet(e) {
  try {
    const path = getRoutePath(e);
    
    if (!path) {
      return respondJson({
        success: false,
        message: "Endpoint tidak ditentukan. Sediakan query parameter '?path=/tamu', '?path=/permasalahan', atau '?path=/monitoring'"
      }, 400);
    }
    
    switch (path) {
      case "/tamu":
        return respondJson({
          success: true,
          data: readTable("TAMU")
        });
        
      case "/permasalahan":
        return respondJson({
          success: true,
          data: readTable("PERMASALAHAN")
        });
        
      case "/monitoring":
        return respondJson({
          success: true,
          data: readTable("MONITORING")
        });
        
      case "/solusi":
        return respondJson({
          success: true,
          data: readTable("SOLUSI")
        });
        
      case "/kepuasan":
        return respondJson({
          success: true,
          data: readTable("KEPUASAN")
        });
        
      default:
        return respondJson({
          success: false,
          message: "Route GET untuk '" + path + "' tidak ditemukan."
        }, 404);
    }
  } catch (error) {
    return respondJson({
      success: false,
      error: error.toString(),
      message: "Terjadi kesalahan internal ketika memproses GET request."
    }, 500);
  }
}

/**
 * Handler Utama untuk Permintaan HTTP POST (Menulis / Menyimpan Data Baru)
 * Mendukung Routing Berbasis parameter di URL (?path=...) atau parameter body JSON
 */
function doPost(e) {
  try {
    let postData;
    try {
      postData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return respondJson({
        success: false,
        message: "Format data POST harus berupa JSON valid."
      }, 400);
    }
    
    // Prioritaskan path dari URL query, jika tidak ada, baca dari muatan JSON
    const path = getRoutePath(e) || postData.path || postData.endpoint;
    
    if (!path) {
      return respondJson({
        success: false,
        message: "Rute target penyuntingan tidak didefinisikan secara valid."
      }, 400);
    }
    
    const payload = postData.payload || postData.data || postData;
    
    switch (path) {
      case "/tamu":
        return handlePostTamu(payload);
        
      case "/permasalahan":
        return handlePostPermasalahan(payload);
        
      case "/monitoring":
        return handlePostMonitoring(payload);
        
      case "/solusi":
        return handlePostSolusi(payload);
        
      case "/kepuasan":
        return handlePostKepuasan(payload);
        
      default:
        return respondJson({
          success: false,
          message: "Route POST untuk '" + path + "' tidak terdaftar."
        }, 404);
    }
  } catch (error) {
    return respondJson({
      success: false,
      error: error.toString(),
      message: "Gagal memproses penulisan data ke Spreadsheet."
    }, 500);
  }
}

/**
 * Ekstraksi Parameter Rute dari Berbagai Format Pemanggilan
 */
function getRoutePath(e) {
  if (!e || !e.parameter) return null;
  let rawPath = e.parameter.path || e.parameter.endpoint || e.parameter.action || "";
  
  // Normalisasi format (contoh: 'tamu' menjadi '/tamu')
  if (rawPath && !rawPath.startsWith("/")) {
    rawPath = "/" + rawPath;
  }
  return rawPath;
}

/**
 * Membaca Baris SPREADSHEET ke dalam deretan JSON Array
 */
function readTable(sheetName) {
  const sheet = getSheet(sheetName);
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const list = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Format tanggal ke String ISO-8601 agar presisi di browser client
      if (val instanceof Date) {
        // Jika bertipe waktu (jam), ubah ke format HH:mm
        if (sheetName === "TAMU" && (headers[j] === "JAM_DATANG" || headers[j] === "JAM_PULANG")) {
          item[headers[j]] = Utilities.formatDate(val, Session.getScriptTimeZone(), "HH:mm");
        } else {
          item[headers[j]] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
      } else {
        item[headers[j]] = val;
      }
    }
    list.push(item);
  }
  return list;
}

/**
 * Menulis Baris Baru ke dalam Sheet dengan Auto-Mapping sesuai Header Kolom
 */
function appendRowData(sheetName, dataMap) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const newRowValues = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    let val = dataMap[header];
    newRowValues.push(val !== undefined && val !== null ? val : "");
  }
  
  sheet.appendRow(newRowValues);
  return dataMap;
}

/**
 * Memperbarui Baris Data yang sudah ada berdasarkan kolom kunci (Primary Key)
 */
function updateRowData(sheetName, keyColumnName, keyValue, updateMap) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const keyColIdx = headers.indexOf(keyColumnName);
  if (keyColIdx === -1) {
    throw new Error("Kolom kunci '" + keyColumnName + "' tidak ditemukan di Sheet " + sheetName);
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyColIdx].toString() === keyValue.toString()) {
      // Baris fisik di spreadsheet adalah 1-indexed dan baris header adalah baris ke-1
      const rowNum = i + 1;
      
      for (const k in updateMap) {
        const colIdx = headers.indexOf(k);
        if (colIdx !== -1) {
          sheet.getRange(rowNum, colIdx + 1).setValue(updateMap[k]);
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * =========================================================================
 *                    FLOW HANDLER UNTUK SETIAP ENDPOINT
 * =========================================================================
 */

/**
 * 1. POST /tamu
 * Mendaftarkan tamu baru dan mengeluarkan ID_TAMU otomatis: TM-YYYYMMDD-XXX
 */
function handlePostTamu(payload) {
  if (!payload.NAMA || !payload.INSTANSI) {
    return respondJson({ success: false, message: "Field 'NAMA' dan 'INSTANSI' wajib diisi." }, 400);
  }
  
  // Format Tanggal Hari Ini
  const todayStr = getTodayDateString();
  
  // Generate ID_TAMU otomatis secara berurutan berdasarkan rekam data hari ini
  const sequenceNum = getTodaySequence("TAMU", "TANGGAL", todayStr) + 1;
  const padding = sequenceNum < 10 ? "00" : sequenceNum < 100 ? "0" : "";
  const idTamu = "TM-" + todayStr.replace(/-/g, "") + "-" + padding + sequenceNum;
  
  // Siapkan baris data tamu yang lengkap
  const dataTamu = {
    ID_TAMU: idTamu,
    TANGGAL: payload.TANGGAL || todayStr,
    NAMA: payload.NAMA,
    INSTANSI: payload.INSTANSI,
    JABATAN: payload.JABATAN || "-",
    NO_HP: payload.NO_HP || "-",
    EMAIL: payload.EMAIL || "-",
    KABUPATEN_KOTA: payload.KABUPATEN_KOTA || "Kota Ternate",
    JENIS_KUNJUNGAN: payload.JENIS_KUNJUNGAN || "Konsultasi Tatap Muka",
    BIDANG_TUJUAN: payload.BIDANG_TUJUAN || "Pokja Transformasi Digital & BOSP",
    PETUGAS_PENERIMA: payload.PETUGAS_PENERIMA || "Petugas FO",
    JAM_DATANG: payload.JAM_DATANG || getCurrentTimeString(),
    JAM_PULANG: payload.JAM_PULANG || "-"
  };
  
  appendRowData("TAMU", dataTamu);
  
  return respondJson({
    success: true,
    message: "Data Tamu berhasil disimpan dengan ID: " + idTamu,
    data: dataTamu
  });
}

/**
 * 2. POST /permasalahan
 * Mendaftarkan permasalahan kasus baru dan menggenerasikan ID_KASUS: KS-YYYYMMDD-XXX
 * Sekaligus mendaftarkan entri awal di lembar MONITORING dengan progres 0%
 */
function handlePostPermasalahan(payload) {
  if (!payload.PERMASALAHAN) {
    return respondJson({ success: false, message: "Deskripsi 'PERMASALAHAN' wajib disertakan." }, 400);
  }
  
  const todayStr = getTodayDateString();
  
  // Generate ID_KASUS berurutan otomatis
  const sequenceNum = getTodaySequence("PERMASALAHAN", "TANGGAL", todayStr) + 1;
  const padding = sequenceNum < 10 ? "00" : sequenceNum < 100 ? "0" : "";
  const idKasus = "KS-" + todayStr.replace(/-/g, "") + "-" + padding + sequenceNum;
  
  const dataKasus = {
    ID_KASUS: idKasus,
    ID_TAMU: payload.ID_TAMU || "-",
    TANGGAL: payload.TANGGAL || todayStr,
    KATEGORI: payload.KATEGORI || "Teknologi Informasi & Sistem Aplikasi",
    SUB_KATEGORI: payload.SUB_KATEGORI || "Sistem Pengaduan",
    PERMASALAHAN: payload.PERMASALAHAN,
    PRIORITAS: payload.PRIORITAS || "Sedang",
    PIC: payload.PIC || "Belum Ditunjuk",
    STATUS: payload.STATUS || "Baru"
  };
  
  appendRowData("PERMASALAHAN", dataKasus);
  
  // Create entri awal otomatis pada monitoring agar data selalu sinkron (Integritas Data)
  const dataMonitoring = {
    ID_KASUS: idKasus,
    STATUS: dataKasus.STATUS,
    PROGRESS: 0,
    CATATAN: "Kasus keluhan didaftarkan secara resmi di sistem.",
    BUKTI_TINDAK_LANJUT: "-",
    TANGGAL_UPDATE: todayStr
  };
  appendRowData("MONITORING", dataMonitoring);
  
  return respondJson({
    success: true,
    message: "Pengaduan Permasalahan berhasil dilaporkan dengan ID: " + idKasus,
    data: dataKasus
  });
}

/**
 * 3. POST /monitoring
 * Melakukan update status, progres penyelesaian, catatan lapangan, dan bukti dokumen kasus
 */
function handlePostMonitoring(payload) {
  const idKasus = payload.ID_KASUS;
  if (!idKasus) {
    return respondJson({ success: false, message: "Field 'ID_KASUS' dibutuhkan untuk memperbarui monitoring." }, 400);
  }
  
  // Periksa apakah kasus valid dan terdaftar
  const kasusList = readTable("PERMASALAHAN");
  const validCase = kasusList.some(k => k.ID_KASUS === idKasus);
  
  if (!validCase) {
    return respondJson({ success: false, message: "ID_KASUS '" + idKasus + "' tidak ditemukan di database." }, 404);
  }
  
  const todayStr = getTodayDateString();
  const updatePayload = {
    STATUS: payload.STATUS || "Diproses",
    PROGRESS: payload.PROGRESS !== undefined ? Number(payload.PROGRESS) : 50,
    CATATAN: payload.CATATAN || "Dilakukan pendampingan teknis lanjutan.",
    BUKTI_TINDAK_LANJUT: payload.BUKTI_TINDAK_LANJUT || "-",
    TANGGAL_UPDATE: todayStr
  };
  
  // Update tabel monitoring relasional
  const updatedMon = updateRowData("MONITORING", "ID_KASUS", idKasus, updatePayload);
  
  // Dan sesuaikan status kasus utama agar sinkron (Status cascade)
  updateRowData("PERMASALAHAN", "ID_KASUS", idKasus, { STATUS: updatePayload.STATUS });
  
  if (updatedMon) {
    return respondJson({
      success: true,
      message: "Progres monitoring kasus " + idKasus + " berhasil diupdate ke " + updatePayload.PROGRESS + "%.",
      data: updatePayload
    });
  } else {
    // Jika entri monitoring belum ada secara ajaib, buat barulah
    updatePayload.ID_KASUS = idKasus;
    appendRowData("MONITORING", updatePayload);
    return respondJson({
      success: true,
      message: "Entri monitoring baru berhasil dibuat untuk Kasus " + idKasus,
      data: updatePayload
    });
  }
}

/**
 * 4. POST /solusi
 * Menyimpan hasil kajian, analisis penyebab rill, dan tawaran solusi dari Widyaprada BPMP
 */
function handlePostSolusi(payload) {
  const idKasus = payload.ID_KASUS;
  if (!idKasus) {
    return respondJson({ success: false, message: "Field 'ID_KASUS' diperlukan untuk mencatat draft solusi." }, 400);
  }
  
  const todayStr = getTodayDateString();
  const dataSolusi = {
    ID_KASUS: idKasus,
    ANALISIS: payload.ANALISIS || "Dilakukan investigasi data keluhan.",
    PENYEBAB: payload.PENYEBAB || "Salah konfigurasi operator sistem sekolah.",
    SOLUSI_BPMP: payload.SOLUSI_BPMP || "Melakukan klinik bimbingan teknis.",
    TINDAK_LANJUT: payload.TINDAK_LANJUT || "Monitoring berkas susulan.",
    TANGGAL_TINDAK_LANJUT: payload.TANGGAL_TINDAK_LANJUT || todayStr
  };
  
  const existSolusi = readTable("SOLUSI").some(s => s.ID_KASUS === idKasus);
  
  if (existSolusi) {
    updateRowData("SOLUSI", "ID_KASUS", idKasus, dataSolusi);
  } else {
    appendRowData("SOLUSI", dataSolusi);
  }
  
  return respondJson({
    success: true,
    message: "Kajian solusi untuk Kasus " + idKasus + " berhasil terekam.",
    data: dataSolusi
  });
}

/**
 * 5. POST /kepuasan
 * Menyimpan survey kepuasan tamu terhadap resolusi solusi BPMP
 */
function handlePostKepuasan(payload) {
  const idKasus = payload.ID_KASUS;
  if (!idKasus) {
    return respondJson({ success: false, message: "Field 'ID_KASUS' wajib diisi." }, 400);
  }
  
  const dataKepuasan = {
    ID_KASUS: idKasus,
    RATING: payload.RATING !== undefined ? Number(payload.RATING) : 5,
    KOMENTAR: payload.KOMENTAR || "Puas dengan layanan bpmp.",
    TANGGAL: getTodayDateString()
  };
  
  const existKepuasan = readTable("KEPUASAN").some(k => k.ID_KASUS === idKasus);
  if (existKepuasan) {
    updateRowData("KEPUASAN", "ID_KASUS", idKasus, dataKepuasan);
  } else {
    appendRowData("KEPUASAN", dataKepuasan);
  }
  
  return respondJson({
    success: true,
    message: "Terima kasih! Indeks kepuasan berhasil direkam untuk Kasus " + idKasus,
    data: dataKepuasan
  });
}

/**
 * =========================================================================
 *                         UTILITAS / HELPER FUNCTIONS
 * =========================================================================
 */

/**
 * Menghitung urutan ID pada sheet berdasarkan tanggal hari ini untuk generate ID berurutan
 */
function getTodaySequence(sheetName, dateColumnHeader, dateValue) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  
  const headers = data[0];
  const dateColIdx = headers.indexOf(dateColumnHeader);
  if (dateColIdx === -1) return 0;
  
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    let rowDate = data[i][dateColIdx];
    let rowDateStr = "";
    
    if (rowDate instanceof Date) {
      rowDateStr = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      rowDateStr = rowDate.toString();
    }
    
    if (rowDateStr === dateValue) {
      count++;
    }
  }
  return count;
}

/**
 * Mengambil string waktu saat ini (HH:mm)
 */
function getCurrentTimeString() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm");
}

/**
 * Mengambil string tanggal hari ini (YYYY-MM-DD)
 */
function getTodayDateString() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/**
 * Mengonstruksi respons JSON legal yang didukung CORS secara penuh
 */
function respondJson(outputObj, statusKode = 200) {
  const outputString = JSON.stringify(outputObj);
  
  // Buat TextOutput berjenis JSON
  const output = ContentService.createTextOutput(outputString)
    .setMimeType(ContentService.MimeType.JSON);
    
  return output;
}
