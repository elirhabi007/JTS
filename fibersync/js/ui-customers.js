function openCustomerModal(editId = null) {
    document.getElementById('customer-modal').classList.remove('hidden');
    // Reset form
    document.getElementById('customer-form').reset();
    document.getElementById('cust-edit-id').value = editId || '';
    document.getElementById('cust-name-list').innerHTML = '';
    document.getElementById('cust-name-list').classList.add('hidden');
    document.getElementById('cust-odp-list').innerHTML = '';
    document.getElementById('cust-odp-list').classList.add('hidden');
    document.getElementById('cust-odp-id').value = '';

    if(editId) {
        // Mode EDIT — isi form dengan data existing
        const cust = customers.find(c => c.id === editId);
        if(cust) {
            document.getElementById('customer-modal-title').innerText = 'Edit Pelanggan';
            document.getElementById('cust-name').value = cust.name;
            document.getElementById('cust-wa').value = cust.wa || '';
            document.getElementById('cust-map').value = cust.map || '';
            document.getElementById('cust-odp-id').value = cust.odpId || '';
            // Tampilkan nama ODP di search box
            const odpName = odps.find(o => o.id === cust.odpId)?.name || cust.odpId;
            document.getElementById('cust-odp-search').value = odpName;
        }
    } else {
        document.getElementById('customer-modal-title').innerText = 'Tambah Pelanggan Baru';
        // Sembunyikan status — data sudah di-cache saat app init
        document.getElementById('sheet-status').classList.add('hidden');
    }
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
}

// Event Listener Autocomplete Nama Pelanggan (FIXED + keyboard nav)
let custNameAcIndex = -1;
document.getElementById('cust-name').addEventListener('input', function() {
    const val = this.value;
    const list = document.getElementById('cust-name-list');
    list.innerHTML = '';
    custNameAcIndex = -1;
    
    if (!val || externalCustomers.length === 0) {
        list.classList.add('hidden');
        return;
    }

    // Filter: sudah terdaftar di customers tidak ditampilkan
    const registeredNames = customers.map(c => c.name.toLowerCase());
    const matches = externalCustomers.filter(c =>
        c.name.toLowerCase().includes(val.toLowerCase()) &&
        !registeredNames.includes(c.name.toLowerCase())
    );
    
    if (matches.length > 0) {
        list.classList.remove('hidden');
        matches.forEach((c, idx) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('data-index', idx);
            item.innerHTML = `<strong>${c.name}</strong>`;
            item.addEventListener('click', function() {
                document.getElementById('cust-name').value = c.name;
                document.getElementById('cust-wa').value = c.wa;
                list.classList.add('hidden');
                custNameAcIndex = -1;
            });
            list.appendChild(item);
        });
    } else {
        list.classList.add('hidden');
    }
});

document.getElementById('cust-name').addEventListener('keydown', function(e) {
    const list = document.getElementById('cust-name-list');
    const items = list.querySelectorAll('.autocomplete-item');
    if (list.classList.contains('hidden') || items.length === 0) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        custNameAcIndex = Math.min(custNameAcIndex + 1, items.length - 1);
        items.forEach((el, i) => el.style.background = i === custNameAcIndex ? '#e0f2fe' : '');
        items[custNameAcIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        custNameAcIndex = Math.max(custNameAcIndex - 1, 0);
        items.forEach((el, i) => el.style.background = i === custNameAcIndex ? '#e0f2fe' : '');
        items[custNameAcIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && custNameAcIndex >= 0) {
        e.preventDefault();
        items[custNameAcIndex].click();
    } else if (e.key === 'Escape') {
        list.classList.add('hidden');
    }
});

// Event Listener Autocomplete ODP
document.getElementById('cust-odp-search').addEventListener('input', function() {
    const val = this.value;
    const list = document.getElementById('cust-odp-list');
    list.innerHTML = '';
    
    if (!val) {
        list.classList.add('hidden');
        return;
    }

    const matches = odps.filter(o => o.name.toLowerCase().includes(val.toLowerCase()));

    if (matches.length > 0) {
        list.classList.remove('hidden');
        matches.forEach(o => {
            const used = customers.filter(c => c.odpId === o.id).length;
            const sisa = o.capacity - used;
            const isFull = sisa <= 0;

            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (isFull) item.style.opacity = '0.6';
            
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span>${o.name}</span>
                    <span class="text-xs font-bold ${isFull ? 'text-red-500' : 'text-green-600'}">
                        ${isFull ? 'FULL' : 'Sisa: ' + sisa}
                    </span>
                </div>
            `;
            
            if (!isFull) {
                item.addEventListener('click', function() {
                    document.getElementById('cust-odp-search').value = o.name;
                    document.getElementById('cust-odp-id').value = o.id;
                    list.classList.add('hidden');
                });
            }
            list.appendChild(item);
        });
    } else {
        list.classList.add('hidden');
    }
});

// Hide autocomplete if clicked outside
document.addEventListener('click', function(e) {
    if (e.target.id !== 'cust-name') {
        document.getElementById('cust-name-list').classList.add('hidden');
        custNameAcIndex = -1;
    }
    if (e.target.id !== 'cust-odp-search') {
        document.getElementById('cust-odp-list').classList.add('hidden');
        odpAcIndex = -1;
    }
    if (!document.getElementById('tracking-search').contains(e.target) && 
        !document.getElementById('tracking-autocomplete').contains(e.target)) {
        document.getElementById('tracking-autocomplete').classList.add('hidden');
        trkAcIndex = -1;
    }
});

// Keyboard nav ODP
let odpAcIndex = -1;
document.getElementById('cust-odp-search').addEventListener('keydown', function(e) {
    const list = document.getElementById('cust-odp-list');
    const items = list.querySelectorAll('.autocomplete-item:not([style*="opacity"])');
    const allItems = list.querySelectorAll('.autocomplete-item');
    const selectableItems = Array.from(allItems).filter(el => !el.dataset.full);
    if (list.classList.contains('hidden') || selectableItems.length === 0) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        odpAcIndex = Math.min(odpAcIndex + 1, selectableItems.length - 1);
        selectableItems.forEach((el, i) => el.style.background = i === odpAcIndex ? '#d1fae5' : '');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        odpAcIndex = Math.max(odpAcIndex - 1, 0);
        selectableItems.forEach((el, i) => el.style.background = i === odpAcIndex ? '#d1fae5' : '');
    } else if (e.key === 'Enter' && odpAcIndex >= 0) {
        e.preventDefault();
        selectableItems[odpAcIndex].click();
    } else if (e.key === 'Escape') {
        list.classList.add('hidden');
    }
});

// FIX: HANDLE CUSTOMER SUBMIT — TAMBAH & EDIT
function handleCustomerSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('cust-edit-id').value;
    const name   = document.getElementById('cust-name').value.trim();
    const wa     = document.getElementById('cust-wa').value.trim();
    const map    = document.getElementById('cust-map').value.trim();
    const odpId  = document.getElementById('cust-odp-id').value.trim();

    if (!name) { alert('Nama pelanggan harus diisi.'); return; }
    if (!odpId) {
        alert('Silakan pilih ODP dari daftar pencarian yang tersedia.\nKetik nama ODP lalu klik salah satu dari dropdown.');
        return;
    }

    if (editId) {
        const idx = customers.findIndex(c => c.id === editId);
        if (idx !== -1) {
            customers[idx] = { ...customers[idx], name, wa, map, odpId };
        }
    } else {
        const newId = 'CUST-' + Date.now();
        customers.push({ id: newId, name, wa, map, odpId, status: 'Active' });
    }

    saveData();
    closeCustomerModal();

    // Pastikan tab customers aktif dan langsung render
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-customers').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(el => { el.classList.remove('bg-blue-600','text-white'); el.classList.add('text-slate-300'); });
    const navEl = document.getElementById('nav-customers');
    if (navEl) { navEl.classList.add('bg-blue-600','text-white'); navEl.classList.remove('text-slate-300'); }
    document.getElementById('page-title').innerText = 'Pelanggan';
    document.getElementById('search-customer').value = '';
    renderCustomers();
    renderDashboard();
}

function deleteCustomer(id) {
    if(confirm('Hapus pelanggan ini?')) {
        customers = customers.filter(c => c.id !== id);
        saveData();
        renderCustomers();
    }
}

function renderCustomers() {
    const search = (document.getElementById('search-customer')?.value || '').toLowerCase().trim();
    const tbody   = document.getElementById('customer-table-body');
    const counterEl = document.getElementById('customer-count-badge');
    if (!tbody) return;

    // Update counter
    if (counterEl) counterEl.textContent = customers.length;

    // Pastikan setiap field ada nilainya (guard null dari Google Sheets)
    const safeCustomers = customers.map(c => ({
        id:     String(c.id     || ''),
        name:   String(c.name   || ''),
        wa:     String(c.wa     || ''),
        map:    String(c.map    || ''),
        odpId:  String(c.odpId  || ''),
        status: String(c.status || 'Active'),
    }));

    const filtered = search
        ? safeCustomers.filter(c =>
            c.name.toLowerCase().includes(search)  ||
            c.id.toLowerCase().includes(search)    ||
            c.odpId.toLowerCase().includes(search) ||
            (odps.find(o => o.id === c.odpId)?.name || '').toLowerCase().includes(search)
        )
        : safeCustomers;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center">
            <div class="text-slate-400">
                <div class="text-4xl mb-2">👤</div>
                <p class="font-semibold text-slate-500">${customers.length === 0 ? 'Belum ada data pelanggan' : 'Tidak ada hasil pencarian'}</p>
                <p class="text-sm mt-1">${customers.length === 0 ? 'Klik "+ Tambah Pelanggan" untuk mulai' : 'Coba kata kunci lain'}</p>
            </div>
        </td></tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = filtered.map((c, idx) => {
        const odp    = odps.find(o => o.id === c.odpId);
        const odpName= odp ? odp.name : (c.odpId || '—');
        const waNum  = c.wa.replace(/^0+/, '').replace(/[^0-9]/g, '');
        return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 text-slate-400 text-xs">${idx + 1}</td>
            <td class="px-4 py-3 font-semibold text-slate-800">${c.name || '<span class="text-slate-300 italic">—</span>'}</td>
            <td class="px-4 py-3 text-xs">
                <div class="flex gap-2 flex-wrap">
                    ${c.map && c.map !== 'undefined' ? `<a href="${c.map}" target="_blank" class="flex items-center gap-1 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 px-2 py-1 rounded border border-slate-200 transition"><i data-lucide="map-pin" width="12"></i> Map</a>` : '<span class="text-slate-300 text-xs">—</span>'}
                    ${waNum ? `<a href="https://wa.me/62${waNum}" target="_blank" class="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded border border-green-200 transition"><i data-lucide="message-circle" width="12"></i> WA</a>` : ''}
                </div>
            </td>
            <td class="px-4 py-3 text-xs">
                <div class="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <i data-lucide="radio" width="12" class="text-emerald-500 flex-shrink-0"></i>
                    <span class="truncate max-w-[160px]">${odpName}</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">${c.odpId || '—'}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
            </td>
            <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                    <button onclick="openCustomerModal('${c.id}')" class="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition" title="Edit"><i data-lucide="pencil" width="12"></i></button>
                    <button onclick="deleteCustomer('${c.id}')" class="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition" title="Hapus"><i data-lucide="trash-2" width="12"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
}

// =============================================
// --- TRACKING MODULE ---
// =============================================
let trkCategory = 'all';
let trkAcIndex = -1;
let trkMatches = [];

