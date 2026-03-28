// 1. CONFIGURATION
const fiberColors = [
    { name: 'BIRU', hex: '#2563eb', text: 'text-white' }, { name: 'ORANYE', hex: '#f97316', text: 'text-white' },
    { name: 'HIJAU', hex: '#16a34a', text: 'text-white' }, { name: 'COKELAT', hex: '#854d0e', text: 'text-white' },
    { name: 'ABU-ABU', hex: '#64748b', text: 'text-white' }, { name: 'PUTIH', hex: '#cbd5e1', text: 'text-slate-700', border: true },
    { name: 'MERAH', hex: '#ef4444', text: 'text-white' }, { name: 'HITAM', hex: '#1e293b', text: 'text-white' },
    { name: 'KUNING', hex: '#eab308', text: 'text-slate-800' }, { name: 'UNGU', hex: '#9333ea', text: 'text-white' },
    { name: 'PINK', hex: '#ec4899', text: 'text-white' }, { name: 'TOSKA', hex: '#0d9488', text: 'text-white' }
];

// ============================================================
// 2. KONFIGURASI GOOGLE SHEETS
// Isi URL Web App dari Google Apps Script Anda di sini
// ============================================================
const GS_CONFIG = {
    // URL Google Apps Script Web App untuk data utama (cables, odcs, odps, customers, branchings)
    MAIN_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbzti70DwVvi9XFESBSMyuRP7vjJuR4fAqp27163nsnZvYnstWfKQYMmi36WXaOJlMO0/exec",

    // URL Google Sheet CSV untuk data pelanggan eksternal (autocomplete nama)
    CUSTOMER_SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHzR5z7DqLwKPGsrqOX7yRirFHC9bEqXcU3OZMbAHDNfUJk-NckFdi4zFvRUpD5zsmlqlp81rIsCdC/pub?output=csv",
};

// ============================================================
// 2b. STATE & DATA
// ============================================================
let cables = [];
let odcs = [];
let odps = [];
let customers = [];
let branchings = [];
let externalCustomers = [];

let selectedCableId = null;
let chartInstance1, chartInstance2; // reserved untuk penggunaan chart di masa depan
let _faultyCores = [];
let _isSaving = false;
let _saveQueue = null;

