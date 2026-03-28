function openCableModal(id = null) {
    const modal = document.getElementById('cable-modal');
    const form = document.getElementById('cable-form');
    form.reset();
    _faultyCores = [];
    document.getElementById('cable-id').value = id || '';
    document.getElementById('cable-modal-title').innerText = id ? "Edit Kabel" : "Tambah Kabel";
    document.getElementById('map-url-start').value = '';
    document.getElementById('map-url-end').value = '';

    if (id) {
        const c = cables.find(x => x.id === id);
        if (c) {
            document.getElementById('cable-name').value = c.name;
            document.getElementById('cable-type').value = c.type;
            document.getElementById('cable-capacity').value = c.totalCores;
            _faultyCores = [...(c.faultyCores || [])];
            document.getElementById('cable-faulty').value = _faultyCores.join(',');
            document.getElementById('cable-start').value = c.start || '';
            document.getElementById('cable-end').value = c.end || '';
        }
    }
    modal.classList.remove('hidden');
    lucide.createIcons();
    setTimeout(updateFaultyCoreVisual, 30);
}

function closeCableModal() { document.getElementById('cable-modal').classList.add('hidden'); }


function handleCableSubmit() {
    const name = document.getElementById('cable-name').value.trim();
    if(!name) { alert('Nama kabel harus diisi.'); return; }
    const id = document.getElementById('cable-id').value;
    const type = document.getElementById('cable-type').value;
    const totalCores = parseInt(document.getElementById('cable-capacity').value);
    const startLoc = document.getElementById('cable-start').value;
    const endLoc = document.getElementById('cable-end').value;
    
    const faultyCores = _faultyCores.slice().filter(n => n > 0 && n <= totalCores);

    if (id) {
        const idx = cables.findIndex(c => c.id === id);
        if (idx !== -1) {
            cables[idx] = { ...cables[idx], name, type, totalCores, faultyCores, start: startLoc, end: endLoc };
        }
    } else {
        const newId = 'FDR-' + Math.floor(Math.random() * 10000);
        cables.push({ id: newId, name, type, totalCores, faultyCores, start: startLoc, end: endLoc });
        selectedCableId = newId;
    }
    saveData();
    renderFeederList();
    renderFeederDetail();
    document.getElementById('cable-modal').classList.add('hidden');
}

function deleteCable(id) {
    if (confirm('Hapus kabel ini?')) {
        cables = cables.filter(c => c.id !== id);
        if (selectedCableId === id) selectedCableId = cables.length > 0 ? cables[0].id : null;
        saveData();
        renderFeederList();
        renderFeederDetail();
    }
}

function renderFeederList() {
    document.getElementById('feeder-list').innerHTML = cables.map(c => {
        const isActive = c.id === selectedCableId;
        const activeClass = isActive ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-blue-300';
        const usedCores = odcs.filter(o => o.feederId === c.id).length;
        return `
        <div class="rounded-xl border p-3 transition-all duration-200 ${activeClass} group flex justify-between items-center relative">
            <div class="flex-1 min-w-0 pr-16 cursor-pointer" onclick="switchCable('${c.id}')">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-bold text-sm ${isActive ? 'text-blue-700' : 'text-slate-700'} truncate">${c.name}</h4>
                </div>
                <div class="flex items-center text-xs text-slate-500 gap-2">
                     <span class="font-mono bg-slate-50 px-1 rounded">${c.id}</span>
                     <span class="font-semibold text-blue-600">${usedCores}/${c.totalCores} Used</span>
                </div>
            </div>
            <div class="absolute right-3 top-3 flex gap-1 bg-white pl-2">
                <button onclick="openCableModal('${c.id}')" class="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"><i data-lucide="pencil" width="12"></i></button>
                <button onclick="deleteCable('${c.id}')" class="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all"><i data-lucide="trash-2" width="12"></i></button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function renderFeederDetail() {
    const cable = cables.find(c => c.id === selectedCableId);
    if (!cable) {
        document.getElementById('view-cable-name').innerText = "Tidak ada kabel dipilih";
        document.getElementById('cable-core-grid').innerHTML = "";
        document.getElementById('core-summary-bar').innerHTML = "";
        return;
    }
    document.getElementById('view-cable-name').innerText = cable.name;
    document.getElementById('view-cable-id').innerText = cable.id;
    document.getElementById('view-cable-type').innerText = `${cable.type}`;
    document.getElementById('view-cable-cores').innerText = `${cable.totalCores} Core`;

    // Build status per core: K=kosong, U=ODC, R=rusak, B=branching
    let coreStatuses = Array(cable.totalCores).fill('K');
    let coreLabels = Array(cable.totalCores).fill('');
    if(cable.faultyCores) {
        cable.faultyCores.forEach(idx => { if(idx > 0 && idx <= cable.totalCores) { coreStatuses[idx-1] = 'R'; coreLabels[idx-1] = 'Rusak'; } });
    }
    odcs.forEach(o => {
        if(o.feederId === cable.id && o.feederCore && o.feederCore <= cable.totalCores) {
            if(coreStatuses[o.feederCore - 1] !== 'R') { coreStatuses[o.feederCore - 1] = 'U'; coreLabels[o.feederCore - 1] = o.name; }
        }
    });
    // Branching — support multi-core (b.cores array) or old single b.core
    branchings.filter(b => b.feederId === cable.id).forEach(b => {
        const cores = b.cores || (b.core ? [b.core] : []);
        cores.forEach(cNum => {
            if(cNum > 0 && cNum <= cable.totalCores && coreStatuses[cNum-1] !== 'R') {
                coreStatuses[cNum-1] = 'B'; coreLabels[cNum-1] = b.name;
            }
        });
    });

    const usedCount = coreStatuses.filter(s => s === 'U').length;
    const branchCount = coreStatuses.filter(s => s === 'B').length;
    const faultyCount = coreStatuses.filter(s => s === 'R').length;
    const emptyCount = coreStatuses.filter(s => s === 'K').length;

    document.getElementById('info-start').innerText = cable.start || '-';
    document.getElementById('info-end').innerText = cable.end || '-';
    document.getElementById('info-util').innerHTML = `${usedCount + branchCount} / ${cable.totalCores} Terpakai`;
    document.getElementById('info-health').innerHTML = faultyCount > 0 ? `<span class="text-red-600">${faultyCount} Core Rusak</span>` : '<span class="text-green-600">Semua Sehat</span>';

    // Summary bar
    document.getElementById('core-summary-bar').innerHTML = `
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-4">
            <div class="flex items-center gap-2">
                <div class="w-3 h-8 rounded-sm bg-blue-600"></div>
                <div><p class="text-xs font-bold text-blue-700">${usedCount} Core</p><p class="text-[10px] text-slate-400">Dipakai ODC</p></div>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-8 rounded-sm bg-violet-500"></div>
                <div><p class="text-xs font-bold text-violet-700">${branchCount} Core</p><p class="text-[10px] text-slate-400">Branching</p></div>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-8 rounded-sm bg-emerald-500"></div>
                <div><p class="text-xs font-bold text-emerald-700">${emptyCount} Core</p><p class="text-[10px] text-slate-400">Kosong</p></div>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-8 rounded-sm bg-red-500 pattern-stripes border border-red-600"></div>
                <div><p class="text-xs font-bold text-red-600">${faultyCount} Core</p><p class="text-[10px] text-slate-400">Rusak</p></div>
            </div>
            <div class="flex-1 min-w-32">
                <div class="flex h-8 rounded-lg overflow-hidden w-full">
                    ${usedCount>0?`<div style="width:${usedCount/cable.totalCores*100}%" class="bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">${usedCount>1?usedCount:''}</div>`:''}
                    ${branchCount>0?`<div style="width:${branchCount/cable.totalCores*100}%" class="bg-violet-500 flex items-center justify-center text-[9px] text-white font-bold">${branchCount>1?branchCount:''}</div>`:''}
                    ${faultyCount>0?`<div style="width:${faultyCount/cable.totalCores*100}%" class="bg-red-500 pattern-stripes flex items-center justify-center text-[9px] text-white font-bold">${faultyCount>1?faultyCount:''}</div>`:''}
                    ${emptyCount>0?`<div style="width:${emptyCount/cable.totalCores*100}%" class="bg-slate-200"></div>`:''}
                </div>
                <p class="text-[9px] text-slate-400 mt-1 text-center">Utilisasi ${cable.totalCores} Core</p>
            </div>
        </div>`;

    // Core grid visual
    document.getElementById('cable-core-grid').innerHTML = coreStatuses.map((status, index) => {
        const num = index + 1;
        const color = fiberColors[index % 12];
        const label = coreLabels[index];
        let boxStyle = '', outerClass = 'flex flex-col items-center gap-1.5 cursor-default group';
        let numClass = 'text-sm font-extrabold leading-none';
        let badgeHtml = '';
        let tooltipText = label || 'Kosong';

        if(status === 'U') {
            boxStyle = `background:${color.hex}; box-shadow: 0 4px 12px -2px ${color.hex}80;`;
            badgeHtml = `<span class="text-[9px] font-bold text-white/80 leading-none mt-0.5">ODC</span>`;
            numClass += ' text-white';
        } else if(status === 'B') {
            boxStyle = `background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 4px 12px -2px #7c3aed60;`;
            badgeHtml = `<span class="text-[9px] font-bold text-white/80 leading-none mt-0.5">BRC</span>`;
            numClass += ' text-white';
        } else if(status === 'K') {
            boxStyle = `border: 2px dashed ${color.name==='PUTIH'?'#94a3b8':color.hex}; color: ${color.name==='PUTIH'?'#94a3b8':color.hex};`;
            badgeHtml = `<span class="text-[9px] font-bold opacity-60 leading-none mt-0.5">FREE</span>`;
        } else { // R
            boxStyle = `background:#ef4444; background-image: repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px); border: 2px solid #dc2626; box-shadow: 0 4px 12px -2px #ef444440;`;
            badgeHtml = `<span class="text-[9px] font-bold text-white/80 leading-none mt-0.5">ERR</span>`;
            numClass += ' text-white';
        }

        return `
        <div class="${outerClass}" title="${tooltipText}">
            <div class="w-14 h-14 rounded-xl flex flex-col items-center justify-center select-none transition-transform hover:scale-110 relative" style="${boxStyle}">
                <span class="${numClass}">${num}</span>
                ${badgeHtml}
            </div>
            <span class="text-[9px] font-bold uppercase tracking-wide truncate w-14 text-center" style="color:${color.hex === '#cbd5e1' ? '#94a3b8' : color.hex}">${color.name}</span>
            ${label ? `<span class="text-[8px] text-slate-400 truncate w-16 text-center leading-tight">${label.length>12?label.substring(0,10)+'..':label}</span>` : ''}
        </div>`;
    }).join('');
    lucide.createIcons();
}

function switchCable(id) { selectedCableId = id; renderFeederList(); renderFeederDetail(); }

// --- INFRASTRUCTURE (ODC/ODP) ---
function updateFeederCoreOptions() {
    const feederId = document.getElementById('form-feeder-id').value;
    const currentEditingId = document.getElementById('form-id').value; 
    const coreSelect = document.getElementById('form-feeder-core');
    coreSelect.innerHTML = '<option value="">-- Pilih Core --</option>';
    const feeder = cables.find(c => c.id === feederId);
    if(feeder) {
        for(let i=0; i<feeder.totalCores; i++) {
            const num = i+1;
            const isUsed = odcs.some(o => o.feederId === feeder.id && o.feederCore === num && o.id !== currentEditingId);
            const faulty = feeder.faultyCores && feeder.faultyCores.includes(num);
            const color = fiberColors[i%12].name;
            let label = `Core ${num} - ${color}`;
            let disabled = false;
            if(faulty) { label += " (RUSAK)"; disabled = true; } 
            else if(isUsed) { label += " (TERPAKAI)"; disabled = true; }
            const opt = document.createElement('option');
            opt.value = num;
            opt.text = label;
            opt.disabled = disabled;
            coreSelect.appendChild(opt);
        }
    }
}

// ============================================================
// SPLITTER & AUTO-SUGGEST SISTEM LENGKAP
// Topologi: Feeder → Core → ODC L1[Splitter] → Kabel Warna → ODC L2[Splitter] → Port → ODP
// Format: ODP-[FEEDER]-[CoreFeeder]-[WarnaKabelL1→L2]-[SplitterL2]-[PortL2]-[LANDMARK]
// ============================================================

const CORE_CODE = {
    'BIRU':'CB','ORANYE':'CO','HIJAU':'CH','COKELAT':'CC',
    'ABU-ABU':'CA','PUTIH':'CP','MERAH':'CM','HITAM':'CK',
    'KUNING':'CG','UNGU':'CU','PINK':'CI','TOSKA':'CT'
};

