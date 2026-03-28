function setTrackingCategory(cat) {
    trkCategory = cat;
    // Update button styles
    document.querySelectorAll('.trk-cat-btn').forEach(btn => {
        btn.classList.remove('bg-teal-500','text-white','border-teal-500');
        btn.classList.add('border-slate-200','text-slate-500');
    });
    const activeBtn = document.getElementById(`trk-btn-${cat}`);
    if(activeBtn) {
        activeBtn.classList.add('bg-teal-500','text-white','border-teal-500');
        activeBtn.classList.remove('border-slate-200','text-slate-500');
    }
    // Re-render autocomplete if there's text
    const val = document.getElementById('tracking-search').value;
    if(val) renderTrackingAutocomplete();
    else document.getElementById('tracking-autocomplete').classList.add('hidden');
}

function renderTrackingAutocomplete() {
    const val = document.getElementById('tracking-search').value.toLowerCase();
    const list = document.getElementById('tracking-autocomplete');
    list.innerHTML = '';
    trkAcIndex = -1;
    trkMatches = [];

    if(!val) { list.classList.add('hidden'); return; }

    if(trkCategory === 'all' || trkCategory === 'feeder') {
        cables.filter(c => c.name.toLowerCase().includes(val) || c.id.toLowerCase().includes(val))
            .forEach(c => trkMatches.push({ type:'feeder', label:`🔵 ${c.name}`, sub: c.id, data: c }));
    }
    if(trkCategory === 'all' || trkCategory === 'branching') {
        branchings.filter(b => b.name.toLowerCase().includes(val) || b.id.toLowerCase().includes(val) || b.destination.toLowerCase().includes(val) || b.feederName.toLowerCase().includes(val))
            .forEach(b => trkMatches.push({ type:'branching', label:`🟣 ${b.name}`, sub: `→ ${b.destination}`, data: b }));
    }
    if(trkCategory === 'all' || trkCategory === 'odc') {
        odcs.filter(o => o.name.toLowerCase().includes(val) || o.id.toLowerCase().includes(val))
            .forEach(o => trkMatches.push({ type:'odc', label:`🔷 ${o.name}`, sub: `${o.level} · ${o.id}`, data: o }));
    }
    if(trkCategory === 'all' || trkCategory === 'odp') {
        odps.filter(o => o.name.toLowerCase().includes(val) || o.id.toLowerCase().includes(val))
            .forEach(o => trkMatches.push({ type:'odp', label:`🟢 ${o.name}`, sub: o.id, data: o }));
    }
    if(trkCategory === 'all' || trkCategory === 'customer') {
        customers.filter(c => c.name.toLowerCase().includes(val) || c.id.toLowerCase().includes(val))
            .forEach(c => trkMatches.push({ type:'customer', label:`🟠 ${c.name}`, sub: c.id, data: c }));
    }

    if(trkMatches.length === 0) {
        list.innerHTML = '<div class="autocomplete-item text-slate-400 italic">Tidak ditemukan</div>';
        list.classList.remove('hidden');
        return;
    }

    list.classList.remove('hidden');
    trkMatches.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item flex items-center justify-between';
        item.innerHTML = `<span class="font-semibold">${m.label}</span><span class="text-xs text-slate-400 font-mono">${m.sub}</span>`;
        item.addEventListener('click', () => {
            document.getElementById('tracking-search').value = m.data.name || m.data.id;
            list.classList.add('hidden');
            trkAcIndex = -1;
            showTrackingResult(m);
        });
        list.appendChild(item);
    });
}

function trackingKeyNav(e) {
    const list = document.getElementById('tracking-autocomplete');
    const items = list.querySelectorAll('.autocomplete-item');
    if(list.classList.contains('hidden') || items.length === 0) return;
    if(e.key === 'ArrowDown') {
        e.preventDefault();
        trkAcIndex = Math.min(trkAcIndex + 1, items.length - 1);
        items.forEach((el, i) => el.style.background = i === trkAcIndex ? '#f0fdfa' : '');
        items[trkAcIndex].scrollIntoView({ block:'nearest' });
    } else if(e.key === 'ArrowUp') {
        e.preventDefault();
        trkAcIndex = Math.max(trkAcIndex - 1, 0);
        items.forEach((el, i) => el.style.background = i === trkAcIndex ? '#f0fdfa' : '');
        items[trkAcIndex].scrollIntoView({ block:'nearest' });
    } else if(e.key === 'Enter' && trkAcIndex >= 0) {
        e.preventDefault();
        items[trkAcIndex].click();
    } else if(e.key === 'Escape') {
        list.classList.add('hidden');
    }
}

function showTrackingResult(match) {
    const panel = document.getElementById('tracking-result');
    panel.classList.remove('hidden');
    if(match.type === 'feeder') panel.innerHTML = buildFeederInfo(match.data);
    else if(match.type === 'branching') panel.innerHTML = buildBranchingInfo(match.data);
    else if(match.type === 'odc') panel.innerHTML = buildODCInfo(match.data);
    else if(match.type === 'odp') panel.innerHTML = buildODPInfo(match.data);
    else if(match.type === 'customer') panel.innerHTML = buildCustomerInfo(match.data);
    lucide.createIcons();
}

function buildBranchingInfo(b) {
    const feeder = cables.find(c => c.id === b.feederId);
    const coresInfo = b.coresInfo || (b.core ? [{ num: b.core, colorName: b.coreColorName, colorHex: b.coreColorHex }] : []);

    // Core visual chips
    const coreChipsHtml = coresInfo.map(ci =>
        `<div class="flex flex-col items-center gap-1">
            <div class="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-sm font-extrabold shadow-md" style="background:${ci.colorHex}; box-shadow: 0 4px 12px -2px ${ci.colorHex}60">
                ${ci.num}
                <span class="text-[8px] font-bold opacity-80">${ci.colorName.substring(0,3)}</span>
            </div>
            <span class="text-[9px] font-bold uppercase" style="color:${ci.colorHex}">${ci.colorName}</span>
        </div>`
    ).join('');

    // Feeder core usage context
    let feederCtxHtml = '';
    if(feeder) {
        const totalUsed = odcs.filter(o => o.feederId === feeder.id).length + branchings.filter(br => br.feederId === feeder.id).reduce((s, br) => s + (br.cores||[br.core]||[]).length, 0);
        feederCtxHtml = `<div class="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p class="text-xs font-bold text-blue-400 uppercase mb-1">Kabel Feeder Sumber</p>
            <p class="font-semibold text-blue-800">${feeder.name} <span class="text-xs font-mono text-slate-400">${feeder.id}</span></p>
            <p class="text-xs text-blue-600 mt-1">${feeder.type} · ${feeder.totalCores} Core · ${totalUsed} terpakai</p>
        </div>`;
    }

    // Lokasi tujuan link
    let locHtml = '';
    if(b.location) {
        const m = b.location.match(/([-]?\d+\.?\d*)[,\s]+([-]?\d+\.?\d*)/);
        locHtml = m
            ? `<a href="https://www.google.com/maps?q=${m[1]},${m[2]}" target="_blank" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-xs underline decoration-dotted transition-colors"><i data-lucide="map-pin" class="w-3 h-3"></i>${b.location}</a>`
            : `<span class="font-mono text-xs text-slate-500">${b.location}</span>`;
    }

    return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 fade-in">
        ${sectionHeader('git-branch', b.name, 'bg-violet-100 text-violet-600')}
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            ${infoBadge('ID', b.id, 'slate')}
            ${infoBadge('Tujuan', b.destination, 'violet')}
            ${b.length ? infoBadge('Panjang Kabel', b.length + ' m', 'slate') : ''}
        </div>
        ${feederCtxHtml}
        <h5 class="font-bold text-slate-700 mb-2 text-sm">Core yang Digunakan (${coresInfo.length} core)</h5>
        <div class="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-4">
            <div class="flex flex-wrap gap-3">${coreChipsHtml || '<p class="text-slate-400 text-xs italic">Tidak ada data core</p>'}</div>
        </div>
        ${b.location ? `<div class="bg-violet-50 border border-violet-100 rounded-lg p-3 mb-4">
            <p class="text-xs font-bold text-violet-400 uppercase mb-1">Lokasi Titik Tujuan</p>
            <p>${locHtml}</p>
        </div>` : ''}
        ${b.note ? `<div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p class="text-xs font-bold text-amber-500 uppercase mb-1">Keterangan</p>
            <p class="text-sm text-amber-800 italic">${b.note}</p>
        </div>` : ''}
    </div>`;
}

function infoBadge(label, value, color='slate') {
    return `<div class="bg-${color}-50 border border-${color}-100 rounded-lg p-3">
        <p class="text-[10px] font-bold text-${color}-400 uppercase mb-0.5">${label}</p>
        <p class="text-sm font-bold text-${color}-800">${value}</p>
    </div>`;
}

// Helper: chip warna kabel
function cableColorChip(colorIdx, portNum) {
    if (!colorIdx) return '<span class="text-slate-400 text-xs italic">—</span>';
    const c = fiberColors[(parseInt(colorIdx)-1)%12];
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white" style="background:${c.hex}">
        <span class="w-2 h-2 rounded-full bg-white/40 flex-shrink-0"></span>
        ${portNum?'Port '+String(portNum).padStart(2,'0')+' · ':''}${c.name} (${CORE_CODE[c.name]||'C?'})
    </span>`;
}

// Helper: build rantai sinyal lengkap dengan warna
function buildSignalChain(odp) {
    const odc2   = odp ? odcs.find(o=>o.id===odp.odcId) : null;
    const odc1   = odc2 ? odcs.find(o=>o.id===odc2.parentId) : null;
    const feeder = odc1 ? cables.find(c=>c.id===odc1.feederId) : null;
    const cFeeder= odc1?.feederCore ? fiberColors[(odc1.feederCore-1)%12] : null;
    const pColors= odc1?.l1PortColors ? (typeof odc1.l1PortColors==='string'?JSON.parse(odc1.l1PortColors):odc1.l1PortColors) : null;
    const l1Port = odc2?.l1PortUsed ? parseInt(odc2.l1PortUsed) : null;
    const cidxL2 = pColors&&l1Port ? pColors[l1Port] : null;
    const cL1L2  = cidxL2 ? fiberColors[(parseInt(cidxL2)-1)%12] : null;
    const odpPort= odp?.odpCore ? parseInt(odp.odpCore) : null;

    // Satu node: icon bulat di tengah, label di bawah
    // Tinggi total cell = 120px: 20px label atas + 48px icon + 52px label bawah
    // Garis konektor selalu ada di y=44px dari atas cell (tengah icon)

    const CELL_H = 120;  // total tinggi cell
    const ICON_T = 24;   // top offset icon dari atas cell (px)
    const ICON_W = 48;   // lebar & tinggi icon box
    const LINE_Y = ICON_T + ICON_W/2; // = 48 → center garis = center icon

    // NODE cell
    const nodeCell = (icon, label, sub, color, badge) =>
        `<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;width:88px;height:${CELL_H}px;flex-shrink:0">
            <!-- icon -->
            <div style="position:absolute;top:${ICON_T}px;left:50%;transform:translateX(-50%);
                        width:${ICON_W}px;height:${ICON_W}px;border-radius:14px;
                        background:${color};
                        box-shadow:0 6px 18px -4px ${color}70;
                        display:flex;align-items:center;justify-content:center">
                <i data-lucide="${icon}" style="width:22px;height:22px;color:white"></i>
                ${badge ? `<span style="position:absolute;top:-7px;right:-7px;
                                      background:white;color:${color};
                                      font-size:8px;font-weight:900;
                                      padding:2px 5px;border-radius:99px;
                                      border:2px solid ${color};line-height:1.2">${badge}</span>` : ''}
            </div>
            <!-- label bawah -->
            <div style="position:absolute;top:${ICON_T+ICON_W+8}px;left:0;right:0;text-align:center">
                <div style="font-size:10px;font-weight:700;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px">${label}</div>
                ${sub ? `<div style="font-size:9px;color:#94a3b8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px">${sub}</div>` : ''}
            </div>
        </div>`;

    // CONNECTOR cell — garis + chip label di tengah
    const connCell = (color, chipTop, chipBot) => {
        const c = color || '#cbd5e1';
        return `<div style="position:relative;display:inline-flex;align-items:center;width:68px;height:${CELL_H}px;flex-shrink:0">
            <!-- garis horizontal tepat di tengah icon -->
            <div style="position:absolute;top:${LINE_Y}px;left:0;right:0;height:3px;border-radius:99px;background:${c};transform:translateY(-50%)"></div>
            <!-- chip atas (di atas garis) -->
            ${chipTop ? `<div style="position:absolute;top:${LINE_Y-22}px;left:50%;transform:translateX(-50%);
                                     background:${c};color:white;font-size:8px;font-weight:800;
                                     padding:2px 8px;border-radius:99px;white-space:nowrap;line-height:1.5">${chipTop}</div>` : ''}
            <!-- chip bawah (di bawah garis) -->
            ${chipBot ? `<div style="position:absolute;top:${LINE_Y+6}px;left:50%;transform:translateX(-50%);
                                     background:${c};color:white;font-size:8px;font-weight:800;
                                     padding:2px 8px;border-radius:99px;white-space:nowrap;line-height:1.5">${chipBot}</div>` : ''}
        </div>`;
    };

    let cells = [];
    if (feeder) cells.push(nodeCell('cable',  feeder.name, feeder.type+' '+feeder.totalCores+' core', '#2563eb', null));
    if (odc1) {
        cells.push(connCell(cFeeder ? cFeeder.hex : '#cbd5e1', cFeeder ? 'Core '+odc1.feederCore : null, cFeeder ? cFeeder.name : null));
        cells.push(nodeCell('server', odc1.name, odc1.l1Splitter||'—', '#4f46e5', 'L1'));
    }
    if (odc2) {
        cells.push(connCell(cL1L2 ? cL1L2.hex : '#cbd5e1', l1Port ? 'Port '+l1Port : null, cL1L2 ? cL1L2.name : null));
        cells.push(nodeCell('cpu', odc2.name, odc2.l2Splitter||'—', '#7c3aed', 'L2'));
    }
    if (odp) {
        cells.push(connCell('#10b981', odpPort ? 'Port '+String(odpPort).padStart(2,'0') : null, null));
        cells.push(nodeCell('radio', odp.name, odp.odpSplitter||'—', '#059669', null));
    }

    return `<div style="background:linear-gradient(135deg,#f8fafc,#eef2ff50);border:1.5px solid #e2e8f0;border-radius:18px;padding:18px 20px 14px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="width:4px;height:15px;border-radius:99px;background:#3b82f6"></div>
            <span style="font-size:10px;font-weight:900;color:#64748b;letter-spacing:.12em;text-transform:uppercase">Jalur Sinyal Lengkap</span>
        </div>
        <div style="display:flex;align-items:flex-start;overflow-x:auto;padding-bottom:4px">
            ${cells.join('')}
        </div>
    </div>`;
}

function sectionHeader(icon, title, colorClass) {
    return `<div class="flex items-center gap-3 mb-4">
        <div class="p-2 rounded-lg ${colorClass}"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
        <h4 class="text-lg font-bold text-slate-800">${title}</h4>
    </div>`;
}

function buildFeederInfo(cable) {
    const odcsConnected = odcs.filter(o => o.feederId === cable.id);
    const totalClients = odcsConnected.reduce((sum, odc) => {
        const subOdps = odps.filter(p => p.odcId === odc.id || odcs.filter(l2 => l2.parentId === odc.id).some(l2 => p.odcId === l2.id));
        return sum + subOdps.reduce((s2, p) => s2 + customers.filter(c => c.odpId === p.id).length, 0);
    }, 0);

    let coreRows = '';
    for(let i = 0; i < cable.totalCores; i++) {
        const num = i+1;
        const color = fiberColors[i % 12];
        const odc = odcsConnected.find(o => o.feederCore === num);
        const faulty = cable.faultyCores && cable.faultyCores.includes(num);
        let status, statusClass;
        if(faulty) { status='RUSAK'; statusClass='bg-red-100 text-red-700'; }
        else if(odc) { status=`${odc.name}`; statusClass='bg-blue-100 text-blue-700'; }
        else { status='Kosong'; statusClass='bg-slate-100 text-slate-400'; }
        coreRows += `<tr class="border-b hover:bg-slate-50">
            <td class="px-3 py-2 font-mono text-xs font-bold">${num}</td>
            <td class="px-3 py-2">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold" style="color:${color.hex}">
                    <span class="w-3 h-3 rounded-full inline-block" style="background:${color.hex}"></span>
                    ${color.name}
                </span>
            </td>
            <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}">${status}</span></td>
        </tr>`;
    }

    return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 fade-in">
        ${sectionHeader('activity', cable.name, 'bg-blue-100 text-blue-600')}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            ${infoBadge('ID', cable.id, 'blue')}
            ${infoBadge('Jenis', cable.type, 'slate')}
            ${infoBadge('Total Core', cable.totalCores + ' Core', 'blue')}
            ${infoBadge('ODC Terhubung', odcsConnected.length + ' ODC', 'indigo')}
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            ${infoBadge('Core Rusak', (cable.faultyCores||[]).length + ' Core', 'red')}
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Lokasi Awal</p>
                <p class="text-sm font-bold text-slate-800">${coordToMapLink(cable.start)}</p>
            </div>
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Lokasi Akhir</p>
                <p class="text-sm font-bold text-slate-800">${coordToMapLink(cable.end)}</p>
            </div>
        </div>
        <h5 class="font-bold text-slate-700 mb-2 text-sm">Detail Core</h5>
        <div class="rounded-xl overflow-hidden border border-slate-100">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-xs uppercase text-slate-400 font-bold">
                    <tr><th class="px-3 py-2">Core</th><th class="px-3 py-2">Warna</th><th class="px-3 py-2">Status / ODC</th></tr>
                </thead>
                <tbody>${coreRows}</tbody>
            </table>
        </div>
    </div>`;
}

function buildODCInfo(odc) {
    const isL1   = odc.level === 'L1';
    const feeder = isL1 ? cables.find(c=>c.id===odc.feederId) : null;
    const odc1   = !isL1 ? odcs.find(o=>o.id===odc.parentId) : null;
    const cFeeder= odc.feederCore ? fiberColors[(odc.feederCore-1)%12] : null;

    // Warna kabel masuk ke ODC L2
    let cableInHtml = '';
    if (!isL1 && odc1) {
        const pColors = odc1.l1PortColors ? (typeof odc1.l1PortColors==='string'?JSON.parse(odc1.l1PortColors):odc1.l1PortColors) : null;
        const portNum = odc.l1PortUsed ? parseInt(odc.l1PortUsed) : null;
        const cidx    = pColors&&portNum ? pColors[portNum] : null;
        const c       = cidx ? fiberColors[(parseInt(cidx)-1)%12] : null;
        cableInHtml = `<div class="mt-2 flex flex-wrap gap-2 items-center">
            <span class="text-[10px] text-indigo-500 font-bold">Masuk via:</span>
            ${portNum?`<span class="bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">Port ${String(portNum).padStart(2,'0')}</span>`:''}
            ${c?`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style="background:${c.hex}">● ${c.name} (${CORE_CODE[c.name]||'C?'})</span>`:''}
            ${odc1.l1Splitter?`<span class="text-[9px] text-slate-400">dari splitter ${odc1.l1Splitter}</span>`:''}
        </div>`;
    }

    // Children
    let childrenHtml = '';
    if (isL1) {
        const childL2 = odcs.filter(o=>o.parentId===odc.id);
        const totalOdps = childL2.reduce((s,l2)=>s+odps.filter(p=>p.odcId===l2.id).length,0);
        const totalCusts = childL2.reduce((s,l2)=>s+odps.filter(p=>p.odcId===l2.id).reduce((s2,p)=>s2+customers.filter(c=>c.odpId===p.id).length,0),0);
        const pColors = odc.l1PortColors?(typeof odc.l1PortColors==='string'?JSON.parse(odc.l1PortColors):odc.l1PortColors):null;
        childrenHtml = `
        <div class="grid grid-cols-3 gap-3 mb-4">
            ${infoBadge('ODC L2',''+childL2.length,'indigo')}
            ${infoBadge('Total ODP',''+totalOdps,'emerald')}
            ${infoBadge('Total Pelanggan',''+totalCusts,'orange')}
        </div>
        ${odc.l1Splitter?`<div class="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p class="text-[10px] font-bold text-blue-400 uppercase mb-2">Output Port Splitter ${odc.l1Splitter}</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${Array.from({length:parseInt(odc.l1Splitter.split(':')[1])||0},(_,i)=>{
                const pn=i+1, cidx=pColors?pColors[pn]:null;
                const c=cidx?fiberColors[(parseInt(cidx)-1)%12]:null;
                const l2=childL2.find(x=>parseInt(x.l1PortUsed)===pn);
                return `<div class="bg-white border rounded-lg p-2.5 ${l2?'border-indigo-200':'border-slate-100'}">
                    <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-slate-100 text-slate-600">P${pn}</span>
                        ${c?`<span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${c.hex}"></span><span class="text-[10px] font-bold truncate" style="color:${c.hex}">${c.name}</span>`:'<span class="text-[10px] text-slate-300">—</span>'}
                    </div>
                    ${l2?`<p class="text-[9px] text-indigo-600 font-semibold truncate">→ ${l2.name}</p><p class="text-[9px] text-slate-400">${l2.l2Splitter||''}</p>`:'<p class="text-[9px] text-slate-300 italic">Kosong</p>'}
                </div>`;
            }).join('')}
            </div>
        </div>`:''}
        <h5 class="font-bold text-slate-700 mb-2 text-sm">ODC L2 Turunan</h5>
        <div class="space-y-2 mb-4">${childL2.length?childL2.map(l2=>{
            const pColors2=l2.l1PortColors?(typeof l2.l1PortColors==='string'?JSON.parse(l2.l1PortColors):l2.l1PortColors):null;
            const portN=l2.l1PortUsed?parseInt(l2.l1PortUsed):null;
            const cidx2=pColors&&portN?pColors[portN]:null;
            const c2=cidx2?fiberColors[(parseInt(cidx2)-1)%12]:null;
            const odpsU=odps.filter(p=>p.odcId===l2.id);
            const custs=odpsU.reduce((s,p)=>s+customers.filter(c=>c.odpId===p.id).length,0);
            return `<div class="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-indigo-100 transition" onclick="switchTab('infra');setTimeout(()=>{switchInfraTab('odc-l2');selectInfraItem('${l2.id}')},100)">
                <div class="min-w-0">
                    <p class="font-semibold text-indigo-700 text-sm">${l2.name}</p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                        ${portN?`<span class="text-[9px] bg-white border border-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded font-bold">Port ${String(portN).padStart(2,'0')}</span>`:''}
                        ${c2?`<span class="inline-flex items-center gap-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style="background:${c2.hex}">● ${c2.name}</span>`:''}
                        ${l2.l2Splitter?`<span class="text-[9px] text-slate-400">${l2.l2Splitter}</span>`:''}
                    </div>
                </div>
                <span class="text-xs text-slate-500 flex-shrink-0 ml-2">${odpsU.length} ODP · ${custs} Client</span>
            </div>`;
        }).join(''):'<p class="text-slate-400 text-sm italic">Belum ada ODC L2</p>'}</div>`;
    } else {
        const odpsUnder = odps.filter(p=>p.odcId===odc.id);
        const totalCusts = odpsUnder.reduce((s,p)=>s+customers.filter(c=>c.odpId===p.id).length,0);
        childrenHtml = `
        <div class="grid grid-cols-2 gap-3 mb-4">
            ${infoBadge('Total ODP',''+odpsUnder.length,'emerald')}
            ${infoBadge('Total Pelanggan',''+totalCusts,'orange')}
        </div>
        <h5 class="font-bold text-slate-700 mb-2 text-sm">ODP di bawahnya</h5>
        <div class="space-y-2 mb-4">${odpsUnder.length?odpsUnder.map(p=>{
            const custs=customers.filter(c=>c.odpId===p.id);
            const pct=p.capacity?Math.round(custs.length/p.capacity*100):0;
            return `<div class="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-emerald-100 transition" onclick="switchTab('infra');setTimeout(()=>{switchInfraTab('odp');selectInfraItem('${p.id}')},100)">
                <div class="flex justify-between items-start mb-1.5">
                    <div class="min-w-0">
                        <p class="font-semibold text-emerald-700 text-sm">${p.name}</p>
                        <div class="flex gap-1.5 mt-0.5 flex-wrap">
                            ${p.odpCore?`<span class="text-[9px] bg-white border border-emerald-200 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Port ${String(parseInt(p.odpCore)).padStart(2,'0')}</span>`:''}
                            ${p.odpSplitter?`<span class="text-[9px] bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-bold">${p.odpSplitter}</span>`:''}
                            ${p.landmark?`<span class="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-bold">${p.landmark}</span>`:''}
                        </div>
                    </div>
                    <span class="text-xs font-bold flex-shrink-0 ml-2" style="color:${pct>=100?'#ef4444':pct>80?'#f59e0b':'#059669'}">${custs.length}/${p.capacity}</span>
                </div>
                <div class="util-bar-track" style="height:4px"><div class="util-bar-fill" style="width:${pct}%;background:${pct>=100?'#ef4444':pct>80?'#f59e0b':'#059669'}"></div></div>
            </div>`;
        }).join(''):'<p class="text-slate-400 text-sm italic">Belum ada ODP</p>'}</div>`;
    }

    return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 fade-in">
        ${sectionHeader('server', odc.name, isL1?'bg-blue-100 text-blue-600':'bg-indigo-100 text-indigo-600')}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            ${infoBadge('Level', 'ODC '+odc.level, isL1?'blue':'indigo')}
            ${infoBadge('Splitter', (isL1?odc.l1Splitter:odc.l2Splitter)||'—', 'slate')}
            ${infoBadge('Kapasitas', (odc.capacity||0)+' Port', 'slate')}
            ${isL1&&odc.lat&&odc.lng?`<div class="bg-slate-50 border border-slate-100 rounded-lg p-3"><p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Koordinat</p><a href="https://maps.google.com/?q=${odc.lat},${odc.lng}" target="_blank" class="text-xs font-mono text-blue-600 hover:underline">${odc.lat}, ${odc.lng}</a></div>`:infoBadge('Koordinat', odc.lat&&odc.lng?odc.lat+', '+odc.lng:'—','slate')}
        </div>
        ${isL1?`<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <p class="text-[10px] font-bold text-blue-400 uppercase mb-2">Sumber: Kabel Feeder</p>
            <p class="font-semibold text-blue-800 text-sm">${feeder?feeder.name:'—'} <span class="text-[10px] font-mono text-slate-400">${feeder?feeder.type+' · '+feeder.totalCores+' core':''}</span></p>
            ${cFeeder?`<div class="flex items-center gap-2 mt-2">
                <span class="w-4 h-4 rounded-full border-2 border-white shadow" style="background:${cFeeder.hex}"></span>
                <span class="text-xs font-bold" style="color:${cFeeder.hex}">Core ${odc.feederCore} — ${cFeeder.name} (${CORE_CODE[cFeeder.name]||'C?'})</span>
            </div>`:''}
        </div>`:`<div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
            <p class="text-[10px] font-bold text-indigo-400 uppercase mb-2">Sumber: ODC Level 1</p>
            <p class="font-semibold text-indigo-800 text-sm">${odc1?odc1.name:'—'}</p>
            ${cableInHtml}
            ${odc1?`<button class="text-[10px] text-indigo-500 mt-2 hover:underline" onclick="showTrackingResult({type:'odc',data:odcs.find(o=>o.id==='${odc1.id}')})">Lihat detail ODC L1 →</button>`:''}
        </div>`}
        ${childrenHtml}
    </div>`;
}
function buildODPInfo(odp) {
    const odc2   = odcs.find(o=>o.id===odp.odcId);
    const odc1   = odc2 ? odcs.find(o=>o.id===odc2.parentId) : null;
    const feeder = odc1 ? cables.find(c=>c.id===odc1.feederId) : null;
    const custList = customers.filter(c=>c.odpId===odp.id);
    const pct = odp.capacity ? Math.round(custList.length/odp.capacity*100) : 0;

    return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 fade-in">
        ${sectionHeader('radio', odp.name, 'bg-emerald-100 text-emerald-600')}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            ${infoBadge('Splitter ODP', odp.odpSplitter||'—', 'emerald')}
            ${infoBadge('Kapasitas', custList.length+'/'+odp.capacity+' Port', 'emerald')}
            ${odp.landmark?infoBadge('Landmark', odp.landmark, 'amber'):''}
            ${odp.lat&&odp.lng?`<div class="bg-slate-50 border border-slate-100 rounded-lg p-3"><p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Koordinat</p><a href="https://maps.google.com/?q=${odp.lat},${odp.lng}" target="_blank" class="text-xs font-mono text-blue-600 hover:underline">${odp.lat}, ${odp.lng}</a></div>`:infoBadge('Koordinat','—','slate')}
        </div>
        <div class="mb-4">
            <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Utilisasi Port</span><span style="color:${pct>=100?'#ef4444':pct>80?'#f59e0b':'#059669'}">${pct}% (${custList.length}/${odp.capacity})</span></div>
            <div class="util-bar-track"><div class="util-bar-fill" style="width:${pct}%;background:${pct>=100?'#ef4444':pct>80?'#f59e0b':'#059669'}"></div></div>
        </div>
        ${buildSignalChain(odp)}
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs">
            ${feeder?`<div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p class="text-[10px] font-bold text-blue-400 uppercase mb-1">Kabel Feeder</p>
                <p class="font-bold text-blue-800">${feeder.name}</p>
                <p class="text-[9px] text-blue-500 mt-0.5">${feeder.type} · ${feeder.totalCores} core</p>
            </div>`:''}
            ${odc1?`<div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <p class="text-[10px] font-bold text-indigo-400 uppercase mb-1">ODC L1</p>
                <p class="font-bold text-indigo-800">${odc1.name}</p>
                ${odc1.l1Splitter?`<p class="text-[9px] text-indigo-500 mt-0.5">Splitter ${odc1.l1Splitter}</p>`:''}
            </div>`:''}
            ${odc2?`<div class="bg-violet-50 border border-violet-200 rounded-xl p-3">
                <p class="text-[10px] font-bold text-violet-400 uppercase mb-1">ODC L2 Induk</p>
                <p class="font-bold text-violet-800">${odc2.name}</p>
                ${odc2.l2Splitter?`<p class="text-[9px] text-violet-500 mt-0.5">Splitter ${odc2.l2Splitter}</p>`:''}
                ${odp.odpCore?`<p class="text-[9px] text-slate-500">Port ${String(parseInt(odp.odpCore)).padStart(2,'0')}</p>`:''}
            </div>`:''}
        </div>
        <h5 class="font-bold text-slate-700 mb-2 text-sm">Pelanggan Terhubung (${custList.length})</h5>
        <div class="space-y-1.5">${custList.length?custList.map((c,i)=>`
            <div class="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="w-5 h-5 rounded-full bg-orange-200 text-orange-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0">${i+1}</span>
                    <p class="font-semibold text-orange-800 text-sm truncate">${c.name}</p>
                </div>
                <div class="flex gap-1.5 flex-shrink-0">
                    ${c.wa?`<a href="https://wa.me/62${(c.wa||'').replace(/^0+/,'').replace(/[^0-9]/g,'')}" target="_blank" class="text-[10px] bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded font-bold hover:bg-green-100 transition">WA</a>`:''}
                    ${c.map&&c.map!=='undefined'?`<a href="${c.map}" target="_blank" class="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition">Map</a>`:''}
                </div>
            </div>`).join(''):'<p class="text-slate-400 text-sm italic">Belum ada pelanggan terhubung</p>'}
        </div>
    </div>`;
}
function buildCustomerInfo(cust) {
    const odp    = odps.find(o=>o.id===cust.odpId);
    const odc2   = odp ? odcs.find(o=>o.id===odp.odcId) : null;
    const odc1   = odc2 ? odcs.find(o=>o.id===odc2.parentId) : null;
    const feeder = odc1 ? cables.find(c=>c.id===odc1.feederId) : null;
    const waNum  = (cust.wa||'').replace(/^0+/,'').replace(/[^0-9]/g,'');

    return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 fade-in">
        ${sectionHeader('user', cust.name, 'bg-orange-100 text-orange-600')}
        <div class="flex gap-3 mb-4">
            ${waNum?`<a href="https://wa.me/62${waNum}" target="_blank" class="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-xl text-sm font-bold border border-green-200 transition"><i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp</a>`:''}
            ${cust.map&&cust.map!=='undefined'?`<a href="${cust.map}" target="_blank" class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold border border-blue-200 transition"><i data-lucide="map-pin" class="w-4 h-4"></i> Lokasi</a>`:''}
        </div>
        ${buildSignalChain(odp)}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            ${feeder?`<div class="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <p class="text-[10px] font-bold text-blue-400 uppercase mb-1">Kabel Feeder</p>
                <p class="font-bold text-blue-800">${feeder.name}</p>
                <p class="text-[9px] text-blue-500 mt-0.5">${feeder.type} · ${feeder.totalCores} core</p>
                ${(()=>{const c=odc1?.feederCore?fiberColors[(odc1.feederCore-1)%12]:null;return c?`<div class="flex items-center gap-1 mt-1"><span class="w-3 h-3 rounded-full" style="background:${c.hex}"></span><span class="text-[9px] font-bold" style="color:${c.hex}">Core ${odc1.feederCore} — ${c.name}</span></div>`:''})()}
            </div>`:''}
            ${odc1?`<div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5">
                <p class="text-[10px] font-bold text-indigo-400 uppercase mb-1">ODC L1</p>
                <p class="font-bold text-indigo-800">${odc1.name}</p>
                ${odc1.l1Splitter?`<p class="text-[9px] text-indigo-500 mt-0.5">Splitter ${odc1.l1Splitter}</p>`:''}
                ${(()=>{
                    const pColors=odc1.l1PortColors?(typeof odc1.l1PortColors==='string'?JSON.parse(odc1.l1PortColors):odc1.l1PortColors):null;
                    const pn=odc2?.l1PortUsed?parseInt(odc2.l1PortUsed):null;
                    const cidx=pColors&&pn?pColors[pn]:null;
                    const c=cidx?fiberColors[(parseInt(cidx)-1)%12]:null;
                    return c?`<div class="flex items-center gap-1 mt-1"><span class="w-3 h-3 rounded-full" style="background:${c.hex}"></span><span class="text-[9px] font-bold" style="color:${c.hex}">${c.name} Port ${pn?String(pn).padStart(2,'0'):''}</span></div>`:'';
                })()}
            </div>`:''}
            ${odc2?`<div class="bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                <p class="text-[10px] font-bold text-violet-400 uppercase mb-1">ODC L2</p>
                <p class="font-bold text-violet-800">${odc2.name}</p>
                ${odc2.l2Splitter?`<p class="text-[9px] text-violet-500 mt-0.5">Splitter ${odc2.l2Splitter}</p>`:''}
                ${odp?.odpCore?`<p class="text-[9px] text-slate-500 mt-0.5">Port ${String(parseInt(odp.odpCore)).padStart(2,'0')}</p>`:''}
            </div>`:''}
            ${odp?`<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <p class="text-[10px] font-bold text-emerald-400 uppercase mb-1">ODP</p>
                <p class="font-bold text-emerald-800">${odp.name}</p>
                ${odp.odpSplitter?`<p class="text-[9px] text-emerald-600 mt-0.5">Splitter ${odp.odpSplitter}</p>`:''}
                ${odp.landmark?`<p class="text-[9px] text-amber-600 font-bold mt-0.5">📍 ${odp.landmark}</p>`:''}
                ${odp.lat&&odp.lng?`<a href="https://maps.google.com/?q=${odp.lat},${odp.lng}" target="_blank" class="text-[9px] text-blue-500 hover:underline mt-0.5 block">📌 ${odp.lat}, ${odp.lng}</a>`:''}
            </div>`:''}
        </div>
    </div>`;
}
// 9. AI MOCK
