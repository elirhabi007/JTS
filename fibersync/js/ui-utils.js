function openSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('input-main-url').value = GS_CONFIG.MAIN_WEBAPP_URL;
    document.getElementById('input-customer-csv').value = GS_CONFIG.CUSTOMER_SHEET_CSV_URL;
    lucide.createIcons();
}
function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}
function saveSettings() {
    GS_CONFIG.MAIN_WEBAPP_URL = document.getElementById('input-main-url').value.trim();
    // Simpan URL apa adanya — konversi dilakukan saat fetch
    GS_CONFIG.CUSTOMER_SHEET_CSV_URL = document.getElementById('input-customer-csv').value.trim();
    sessionStorage.setItem('gs_main_url', GS_CONFIG.MAIN_WEBAPP_URL);
    sessionStorage.setItem('gs_csv_url', GS_CONFIG.CUSTOMER_SHEET_CSV_URL);
    closeSettingsModal();
    loadDataFromSheet();
}

// ============================================================
// DEMO DATA (fallback jika URL belum diisi)
// ============================================================
function loadDemoData() {
    cables     = [{ id: 'CBL-FD-01', name: 'Feeder Main Sentul', type: 'ADSS', totalCores: 12, faultyCores: [], start: '-6.1, 106.8', end: '-6.2, 106.9' }];
    odcs       = [{ id: 'ODC-L1-01', name: 'ODC Level 1 Sentul', level: 'L1', feederId: 'CBL-FD-01', feederCore: 1, lat: -6.123, lng: 106.321, capacity: 2 },
                  { id: 'ODC-L2-01', name: 'ODC Level 2 Sentul', level: 'L2', parentId: 'ODC-L1-01', lat: -6.124, lng: 106.325, capacity: 2 }];
    odps       = [{ id: 'ODP-ST-04', name: 'ODP Melati A', odcId: 'ODC-L2-01', lat: -6.125, lng: 106.322, capacity: 8 }];
    customers  = [{ id: 'CUST-01', name: 'Budi Santoso', wa: '81234567890', map: 'https://maps.google.com', odpId: 'ODP-ST-04', status: 'Active' }];
    branchings = [];
    selectedCableId = cables[0].id;
}

// ============================================================
// INIT APP
// ============================================================
function initApp() {
    if (!selectedCableId && cables.length > 0) selectedCableId = cables[0].id;
    renderDashboard();
    renderInfraTables();
    renderFeederList();
    renderFeederDetail();
    renderCustomers();
    // Pre-load data pelanggan eksternal di background (sekali saja)
    if (externalCustomers.length === 0 && GS_CONFIG.CUSTOMER_SHEET_CSV_URL) {
        fetchGoogleSheetData();
    }
}

window.onload = function() {
    lucide.createIcons();
    // Ambil config dari sessionStorage jika sudah pernah diisi
    GS_CONFIG.MAIN_WEBAPP_URL = sessionStorage.getItem('gs_main_url') || GS_CONFIG.MAIN_WEBAPP_URL;
    GS_CONFIG.CUSTOMER_SHEET_CSV_URL = sessionStorage.getItem('gs_csv_url') || GS_CONFIG.CUSTOMER_SHEET_CSV_URL;
    loadDataFromSheet();
};

// CSV Parser
function parseCSV(str) {
    const arr = [];
    let quote = false;
    let row = 0, col = 0, c = 0;
    for (; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
}

// --- TAB SWITCHER ---
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${tabId}`).classList.remove('hidden');
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-blue-600','text-white');
        el.classList.add('text-slate-300');
    });
    const activeNav = document.getElementById(`nav-${tabId}`);
    if(activeNav) { activeNav.classList.add('bg-blue-600','text-white'); activeNav.classList.remove('text-slate-300'); }
    // Update page title
    const titles = {dashboard:'Dashboard',infra:'ODC & ODP',visualizer:'Kabel Feeder',customers:'Pelanggan',branching:'Branching',tracking:'Tracking',ai:'AI Planner'};
    document.getElementById('page-title').innerText = titles[tabId] || tabId;
    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'infra') { switchInfraTab(_infraTab); }
    if(tabId === 'visualizer') { renderFeederList(); renderFeederDetail(); }
    if(tabId === 'customers') renderCustomers();
    if(tabId === 'branching') renderBranching();
    if(tabId === 'tracking') { lucide.createIcons(); }
}

// --- MANAJEMEN KABEL ---
