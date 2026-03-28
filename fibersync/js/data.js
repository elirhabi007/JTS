// ============================================================
// GOOGLE SHEETS: LOAD DATA UTAMA
// ============================================================
async function loadDataFromSheet() {
    updateSyncStatus('loading', 'Memuat data dari Google Sheet...');
    const url = GS_CONFIG.MAIN_WEBAPP_URL;
    if (!url) {
        updateSyncStatus('warn', 'URL Apps Script belum diisi. Klik ⚙ Pengaturan.');
        loadDemoData();
        initApp();
        return;
    }
    try {
        const res = await fetch(url + '?action=getData', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();

        // ── Normalisasi data dari Google Sheets ──────────────────
        cables = (json.cables || []).filter(r => r.id).map(c => ({
            ...c,
            totalCores:  parseInt(c.totalCores) || 0,
            faultyCores: typeof c.faultyCores === 'string' && c.faultyCores
                ? (() => { try { return JSON.parse(c.faultyCores); } catch(e) { return []; } })()
                : (Array.isArray(c.faultyCores) ? c.faultyCores : []),
        }));

        odcs = (json.odcs || []).filter(r => r.id).map(o => ({
            ...o,
            // Kapasitas & feederCore sebagai number
            capacity:     parseInt(o.capacity) || 0,
            feederCore:   o.feederCore ? parseInt(o.feederCore) : null,
            // lat/lng tetap sebagai string agar presisi desimal terjaga
            lat: o.lat !== undefined && o.lat !== null && o.lat !== '' ? String(o.lat) : '',
            lng: o.lng !== undefined && o.lng !== null && o.lng !== '' ? String(o.lng) : '',
            // l1PortColors: parse JSON jika masih string
            l1PortColors: (() => {
                const v = o.l1PortColors;
                if (!v || v === '' || v === '[]' || v === 'null') return null;
                if (typeof v === 'object' && !Array.isArray(v)) return v;
                try { return JSON.parse(v); } catch(e) { return null; }
            })(),
            // String fields: pastikan tidak null
            l1Splitter:  o.l1Splitter  || '',
            l1PortUsed:  o.l1PortUsed  || '',
            l2Splitter:  o.l2Splitter  || '',
            // Normalisasi parentId — bisa dari berbagai nama kolom di Sheets
            parentId:    o.parentId || o.parentl1 || o.parent_id || o.odcL1Id || o.parentID || '',
        }));

        odps = (json.odps || []).filter(r => r.id).map(p => ({
            ...p,
            capacity:    parseInt(p.capacity) || 0,
            lat: p.lat !== undefined && p.lat !== null && p.lat !== '' ? String(p.lat) : '',
            lng: p.lng !== undefined && p.lng !== null && p.lng !== '' ? String(p.lng) : '',
            odpCore:     p.odpCore     || '',
            odpSplitter: p.odpSplitter || '',
            landmark:    p.landmark    || '',
        }));

        branchings = (json.branchings || []).filter(r => r.id).map(b => ({
            ...b,
            cores: typeof b.cores === 'string' && b.cores
                ? (() => { try { return JSON.parse(b.cores); } catch(e) { return []; } })()
                : (Array.isArray(b.cores) ? b.cores : []),
            coresInfo: typeof b.coresInfo === 'string' && b.coresInfo
                ? (() => { try { return JSON.parse(b.coresInfo); } catch(e) { return []; } })()
                : (Array.isArray(b.coresInfo) ? b.coresInfo : []),
            cableType:  b.cableType  || '',
            cableCores: b.cableCores ? parseInt(b.cableCores) : null,
            cableFaultyCores: typeof b.cableFaultyCores === 'string' && b.cableFaultyCores
                ? (() => { try { return JSON.parse(b.cableFaultyCores); } catch(e) { return []; } })()
                : (Array.isArray(b.cableFaultyCores) ? b.cableFaultyCores : []),
        }));
        // Customers: filter baris kosong, normalisasi semua field ke string
        customers  = (json.customers  || [])
            .filter(r => r.id && (r.name || r.odpId))
            .map(r => ({
                id:     String(r.id     || ''),
                name:   String(r.name   || ''),
                wa:     String(r.wa     || ''),
                map:    String(r.map    || ''),
                odpId:  String(r.odpId  || ''),
                status: String(r.status || 'Active'),
            }));

        selectedCableId = cables.length > 0 ? cables[0].id : null;
        updateSyncStatus('ok', 'Data berhasil dimuat (' + new Date().toLocaleTimeString('id-ID') + ')');
    } catch(e) {
        console.error('loadDataFromSheet error:', e);
        updateSyncStatus('error', 'Gagal memuat: ' + e.message + '. Gunakan data sementara.');
        loadDemoData();
    }
    initApp();
}

// ============================================================
// GOOGLE SHEETS: SAVE DATA UTAMA (auto-save dengan debounce)
// ============================================================
let _saveTimer = null;
function saveData() {
    // Debounce: tunda 800ms, batalkan jadwal sebelumnya
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => doSaveData(), 800);
}

async function doSaveData() {
    const url = GS_CONFIG.MAIN_WEBAPP_URL;
    if (!url) return; // Tidak ada URL, skip
    if (_isSaving) { _saveQueue = true; return; }
    _isSaving = true;
    updateSyncStatus('saving', 'Menyimpan...');
    const payload = { cables, odcs, odps, customers, branchings };
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveData', data: payload })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        updateSyncStatus('ok', 'Tersimpan (' + new Date().toLocaleTimeString('id-ID') + ')');
    } catch(e) {
        console.error('saveData error:', e);
        updateSyncStatus('error', 'Gagal menyimpan: ' + e.message);
    }
    _isSaving = false;
    if (_saveQueue) { _saveQueue = false; doSaveData(); }
}

// ============================================================
// GOOGLE SHEETS: LOAD DATA PELANGGAN EKSTERNAL (autocomplete)
// ============================================================
async function fetchGoogleSheetData() {
    const statusEl = document.getElementById('sheet-status');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = '<span class="flex items-center gap-1"><i class="animate-spin" data-lucide="loader-2" width="12"></i> Memuat data pelanggan...</span>';
    lucide.createIcons();

    let rawUrl = GS_CONFIG.CUSTOMER_SHEET_CSV_URL;
    if (!rawUrl) {
        statusEl.innerHTML = '<span class="text-amber-500">⚠ URL Sheet Pelanggan belum diisi di Pengaturan.</span>';
        return;
    }

    // ── Auto-convert: pubhtml / pub?output=html → pub?output=csv ──
    // Tangani berbagai format URL yang mungkin di-paste pengguna
    let csvUrl = rawUrl.trim();
    // Hapus fragment (#gid=...) dulu
    csvUrl = csvUrl.split('#')[0];
    if (csvUrl.includes('/pubhtml')) {
        csvUrl = csvUrl.replace('/pubhtml', '/pub?output=csv');
    } else if (csvUrl.includes('pub?output=html')) {
        csvUrl = csvUrl.replace('pub?output=html', 'pub?output=csv');
    } else if (csvUrl.includes('/pub') && !csvUrl.includes('output=csv')) {
        // Ada /pub tapi belum ada output=csv
        csvUrl = csvUrl.includes('?')
            ? csvUrl + '&output=csv'
            : csvUrl + '?output=csv';
    }
    // Tambah cache-buster
    csvUrl += (csvUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();

    // ── Daftar proxy fallback ──
    const proxies = [
        u => 'https://corsproxy.io/?' + encodeURIComponent(u),
        u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
        u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    ];

    let lastError = '';
    for (const makeProxy of proxies) {
        try {
            const proxyUrl = makeProxy(csvUrl);
            const res = await fetch(proxyUrl, { cache: 'no-store' });
            if (!res.ok) { lastError = 'HTTP ' + res.status; continue; }
            const text = await res.text();

            // Deteksi balasan HTML (error page / login redirect)
            const trimmed = text.trim();
            if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
                lastError = 'Proxy mengembalikan HTML (coba proxy berikutnya)';
                continue;
            }
            if (trimmed === '') { lastError = 'Respon kosong'; continue; }

            // ── Parse CSV ──
            const rows = parseCSV(text);
            externalCustomers = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || (row.length <= 1 && (!row[0] || row[0].trim() === ''))) continue;
                if (row.length > 2) {
                    const name = (row[2] || '').trim();
                    const wa   = (row[3] || '').trim().replace(/[^0-9]/g, '');
                    if (name) externalCustomers.push({ name, wa });
                }
            }

            statusEl.innerHTML = '<span class="text-green-600 flex items-center gap-1"><i data-lucide="check" width="12"></i> ' + externalCustomers.length + ' data pelanggan dimuat</span>';
            lucide.createIcons();
            setTimeout(() => statusEl.classList.add('hidden'), 3000);
            return; // sukses, stop loop
        } catch (e) {
            lastError = e.message;
        }
    }

    // Semua proxy gagal
    console.error('fetchGoogleSheetData: semua proxy gagal. Error terakhir:', lastError);
    statusEl.innerHTML = '<span class="text-red-500">⚠ Gagal memuat: ' + lastError + '</span>';
}

// ============================================================
// STATUS BAR (sidebar)
// ============================================================
function updateSyncStatus(type, msg) {
    const el = document.getElementById('sync-status-text');
    const dot = document.getElementById('sync-status-dot');
    if (!el) return;
    el.textContent = msg;
    dot.className = 'w-2 h-2 rounded-full';
    if (type === 'ok')      { dot.classList.add('bg-green-500', 'animate-pulse'); }
    else if (type === 'saving') { dot.classList.add('bg-yellow-400', 'animate-pulse'); }
    else if (type === 'loading') { dot.classList.add('bg-blue-400', 'animate-pulse'); }
    else if (type === 'error')  { dot.classList.add('bg-red-500'); }
    else if (type === 'warn')   { dot.classList.add('bg-amber-400'); }
}

// ============================================================
// MODAL PENGATURAN URL
// ============================================================
