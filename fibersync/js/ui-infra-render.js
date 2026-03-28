
// =====================================================
// ODC/ODP NEW TAB + SIDEBAR-DETAIL SYSTEM
// =====================================================
let _infraTab = 'odc-l1';      // current tab
let _infraSelectedId = null;   // selected item id

const infraTabConfig = {
    'odc-l1':  { color: '#2563eb', bg: '#eff6ff', label: 'Tambah ODC L1', icon: 'box',   selClass: '' },
    'odc-l2':  { color: '#4f46e5', bg: '#eef2ff', label: 'Tambah ODC L2', icon: 'cpu',   selClass: 'indigo' },
    'odp':     { color: '#059669', bg: '#ecfdf5', label: 'Tambah ODP',    icon: 'radio',  selClass: 'emerald' },
};

function switchInfraTab(tab) {
    _infraTab = tab;
    _infraSelectedId = null;
    // Update tab styles
    Object.keys(infraTabConfig).forEach(t => {
        const el = document.getElementById(`infra-tab-${t}`);
        const cfg = infraTabConfig[t];
        el.style.setProperty('--tab-color', cfg.color);
        el.style.setProperty('--tab-bg', cfg.bg);
        if(t === tab) {
            el.style.borderBottomColor = cfg.color;
            el.style.color = cfg.color;
            el.style.backgroundColor = cfg.bg;
        } else {
            el.style.borderBottomColor = 'transparent';
            el.style.color = '#64748b';
            el.style.backgroundColor = 'transparent';
        }
    });
    // Update add button
    const cfg = infraTabConfig[tab];
    document.getElementById('infra-add-label').textContent = cfg.label;
    document.getElementById('infra-add-btn').style.backgroundColor = cfg.color;
    renderInfraList();
    renderInfraDetail();
}

function infraAddClick() {
    const map = { 'odc-l1':'odc-l1', 'odc-l2':'odc-l2', 'odp':'odp' };
    openInfraModal(map[_infraTab]);
}

function selectInfraItem(id) {
    _infraSelectedId = id;
    renderInfraList();
    renderInfraDetail();
}

function renderInfraTables() {
    // Update tab counts
    const l1count = odcs.filter(o=>o.level==='L1').length;
    const l2count = odcs.filter(o=>o.level==='L2').length;
    const odpcount = odps.length;
    const countEl1 = document.getElementById('infra-count-odc-l1');
    const countEl2 = document.getElementById('infra-count-odc-l2');
    const countElO = document.getElementById('infra-count-odp');
    if(countEl1) countEl1.textContent = l1count;
    if(countEl2) countEl2.textContent = l2count;
    if(countElO) countElO.textContent = odpcount;
    // Update badge colors
    if(countEl1) { countEl1.style.backgroundColor = l1count>0 ? '#2563eb' : '#cbd5e1'; countEl1.style.color = l1count>0 ? 'white' : '#64748b'; }
    if(countEl2) { countEl2.style.backgroundColor = l2count>0 ? '#4f46e5' : '#cbd5e1'; countEl2.style.color = l2count>0 ? 'white' : '#64748b'; }
    if(countElO) { countElO.style.backgroundColor = odpcount>0 ? '#059669' : '#cbd5e1'; countElO.style.color = odpcount>0 ? 'white' : '#64748b'; }

    renderInfraList();
    renderInfraDetail();
    lucide.createIcons();
}

function getFilteredInfraItems() {
    const q = (document.getElementById('infra-search')?.value || '').toLowerCase();
    if(_infraTab === 'odc-l1') {
        return odcs.filter(o => {
            if(o.level !== 'L1') return false;
            if(!q) return true;
            const feeder = cables.find(c=>c.id===o.feederId);
            return o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (feeder&&feeder.name.toLowerCase().includes(q));
        });
    } else if(_infraTab === 'odc-l2') {
        return odcs.filter(o => {
            if(o.level !== 'L2') return false;
            if(!q) return true;
            const parent = odcs.find(p=>p.id===o.parentId);
            return o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (parent&&parent.name.toLowerCase().includes(q));
        });
    } else {
        return odps.filter(o => {
            if(!q) return true;
            const custs = customers.filter(c=>c.odpId===o.id);
            return o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || custs.some(c=>c.name.toLowerCase().includes(q));
        });
    }
}

function renderInfraList() {
    const listEl = document.getElementById('infra-list');
    const emptyEl = document.getElementById('infra-list-empty');
    if(!listEl) return;
    const items = getFilteredInfraItems();
    const cfg = infraTabConfig[_infraTab];
    if(items.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = items.map(o => {
        const isSelected = o.id === _infraSelectedId;
        let subtitle = '', used = 0, capacity = o.capacity || 0;
        if(_infraTab === 'odc-l1') {
            const feeder = cables.find(c=>c.id===o.feederId);
            subtitle = feeder ? feeder.name : 'No Feeder';
            used = odcs.filter(s=>s.parentId===o.id).length;
        } else if(_infraTab === 'odc-l2') {
            const parent = odcs.find(p=>p.id===o.parentId);
            subtitle = parent ? parent.name : '-';
            used = odps.filter(p=>p.odcId===o.id).length;
        } else {
            const parent = odcs.find(p=>p.id===o.odcId);
            subtitle = parent ? parent.name : '-';
            used = customers.filter(c=>c.odpId===o.id).length;
        }
        const percent = capacity ? Math.round((used/capacity)*100) : 0;
        const isFull = percent >= 100;
        const isWarn = percent > 80;
        const barColor = isFull ? '#ef4444' : isWarn ? '#f59e0b' : cfg.color;
        const statusDot = isFull ? 'bg-red-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-400';
        return `<div class="infra-list-item ${isSelected ? 'selected '+cfg.selClass : ''}" onclick="selectInfraItem('${o.id}')">
            <div class="flex items-start justify-between gap-2 mb-1.5">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full flex-shrink-0 ${statusDot}"></span>
                        <p class="text-sm font-bold text-slate-800 truncate">${o.name}</p>
                    </div>
                    <p class="text-[10px] text-slate-400 font-mono mt-0.5 pl-3.5 truncate">${subtitle}</p>
                </div>
                <span class="text-[10px] font-bold flex-shrink-0 mt-0.5" style="color:${barColor}">${used}/${capacity}</span>
            </div>
            <div class="util-bar-track">
                <div class="util-bar-fill" style="width:${percent}%;background:${barColor}"></div>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}


function colorChip(colorIdx, label='') {
    if (!colorIdx) return '<span class="text-slate-400 text-xs">—</span>';
    const c = fiberColors[(parseInt(colorIdx)-1) % 12];
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white" style="background:${c.hex}"><span class="w-2 h-2 rounded-full bg-white/40 flex-shrink-0"></span>${c.name}${label?' · '+label:''}</span>`;
}

function cableColorBadge(color, portNum, splitter) {
    if (!color) return '';
    return `<div class="inline-flex items-center gap-1.5 bg-white border rounded-lg px-2.5 py-1.5 shadow-sm" style="border-color:${color.hex}40">
        <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${color.hex}"></div>
        <span class="text-xs font-bold" style="color:${color.hex}">${color.name}</span>
        <span class="text-[10px] text-slate-400">(${CORE_CODE[color.name]||'C?'})</span>
        ${portNum?`<span class="text-[10px] bg-slate-100 text-slate-500 px-1 rounded font-mono">Port ${String(portNum).padStart(2,'0')}</span>`:''}
        ${splitter?`<span class="text-[10px] text-slate-400">· ${splitter}</span>`:''}
    </div>`;
}
function renderInfraDetail() {
    const emptyEl = document.getElementById('infra-detail-empty');
    const contentEl = document.getElementById('infra-detail-content');
    if(!emptyEl || !contentEl) return;
    if(!_infraSelectedId) {
        emptyEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        return;
    }
    const cfg = infraTabConfig[_infraTab];
    let html = '';
    if(_infraTab === 'odc-l1') {
        const o = odcs.find(x=>x.id===_infraSelectedId);
        if(!o) return;
        const feeder = cables.find(c=>c.id===o.feederId);
        const children = odcs.filter(s=>s.parentId===o.id);
        const used = children.length;
        const percent = Math.round((used/o.capacity)*100);
        html = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#eff6ff">
                            <i data-lucide="box" class="w-4 h-4" style="color:#2563eb"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900">${o.name}</h3>
                        <span class="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">ODC L1</span>
                    </div>
                    <p class="text-xs font-mono text-slate-400 pl-10">${o.id}</p>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="openInfraModal('odc-l1','${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold border border-blue-100 transition-all">
                        <i data-lucide="pencil" width="12"></i> Edit
                    </button>
                    <button onclick="deleteODC('${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold border border-red-100 transition-all">
                        <i data-lucide="trash-2" width="12"></i> Hapus
                    </button>
                </div>
            </div>
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 rounded-xl border border-blue-100 p-4 col-span-2">
                    <p class="text-[10px] font-bold text-blue-400 uppercase mb-1">Feeder Sumber</p>
                    <p class="font-semibold text-slate-800 text-sm">${feeder?feeder.name:'—'}</p>
                    ${feeder?`<p class="text-[10px] text-blue-500 font-mono mt-0.5">${feeder.type} · ${feeder.totalCores} core total</p>`:''}
                    ${(()=>{const c=o.feederCore?fiberColors[(o.feederCore-1)%12]:null;return c?`<div class="flex items-center gap-2 mt-2"><span class="w-4 h-4 rounded-full border-2 border-white shadow flex-shrink-0" style="background:${c.hex}"></span><span class="text-xs font-bold" style="color:${c.hex}">Core ${o.feederCore} — ${c.name} (${CORE_CODE[c.name]||'C?'})</span></div>`:''})()}
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Splitter ODC L1</p>
                    <p class="font-bold text-xl text-blue-700">${o.l1Splitter||'—'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${o.l1Splitter?(parseInt(o.l1Splitter.split(':')[1])||0)+' port output':''}</p>
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Slot ODC L2</p>
                    <p class="font-bold text-2xl text-slate-800">${used}<span class="text-slate-400 text-base font-normal">/${o.capacity}</span></p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${o.capacity-used} slot kosong</p>
                </div>
            </div>
            ${(()=>{
                const colors = o.l1PortColors ? (typeof o.l1PortColors==='string'?JSON.parse(o.l1PortColors):o.l1PortColors) : null;
                if(!colors || Object.keys(colors).length===0) return '';
                const portHtml = Object.entries(colors).map(([port,cidx])=>{
                    const c = fiberColors[(parseInt(cidx)-1)%12];
                    const l2 = children.find(ch=>parseInt(ch.l1PortUsed)===parseInt(port));
                    return `<div class="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-600 flex-shrink-0">P${port}</div>
                        <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${c.hex}"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold" style="color:${c.hex}">${c.name} (${CORE_CODE[c.name]||'C?'})</p>
                            ${l2?`<p class="text-[10px] text-slate-400 truncate">→ ${l2.name}</p>`:'<p class="text-[10px] text-slate-300">Belum dipakai</p>'}
                        </div>
                    </div>`;
                }).join('');
                return `<div class="px-6 pb-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Output Port Splitter → ODC L2</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">${portHtml}</div>
                </div>`;
            })()}
            <div class="px-6 pb-4">
                <div class="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Utilisasi Slot</span>
                    <span style="color:${percent>80?'#f59e0b':'#2563eb'}">${used}/${o.capacity} (${percent}%)</span>
                </div>
                <div class="util-bar-track">
                    <div class="util-bar-fill" style="width:${percent}%;background:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#2563eb'}"></div>
                </div>
            </div>
        </div>
        ${children.length > 0 ? `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 class="font-bold text-slate-700 flex items-center gap-2">
                    <i data-lucide="cpu" class="w-4 h-4 text-indigo-500"></i>
                    ODC L2 Turunan
                    <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">${children.length}</span>
                </h4>
                <button onclick="openInfraModal('odc-l2')" class="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold border border-indigo-100 flex items-center gap-1 transition-all">
                    <i data-lucide="plus" width="12"></i> Tambah
                </button>
            </div>
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                ${children.map(c => {
                    const codpUsed = odps.filter(p=>p.odcId===c.id).length;
                    const cpct = Math.round((codpUsed/c.capacity)*100);
                    return `<div class="border border-slate-100 rounded-xl p-3.5 bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer" onclick="switchInfraTab('odc-l2');selectInfraItem('${c.id}')">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="font-bold text-slate-700 text-sm">${c.name}</p>
                                <p class="text-[10px] font-mono text-slate-400">${c.id}</p>
                            </div>
                            <span class="text-xs font-bold" style="color:${cpct>80?'#f59e0b':'#4f46e5'}">${codpUsed}/${c.capacity}</span>
                        </div>
                        <div class="util-bar-track">
                            <div class="util-bar-fill" style="width:${cpct}%;background:${cpct>=100?'#ef4444':cpct>80?'#f59e0b':'#4f46e5'}"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>` : ''}`;
    } else if(_infraTab === 'odc-l2') {
        const o = odcs.find(x=>x.id===_infraSelectedId);
        if(!o) return;
        const parent = odcs.find(p=>p.id===o.parentId);
        const children = odps.filter(p=>p.odcId===o.id);
        const used = children.length;
        const percent = Math.round((used/o.capacity)*100);
        html = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#eef2ff">
                            <i data-lucide="cpu" class="w-4 h-4" style="color:#4f46e5"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900">${o.name}</h3>
                        <span class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">ODC L2</span>
                    </div>
                    <p class="text-xs font-mono text-slate-400 pl-10">${o.id}</p>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="openInfraModal('odc-l2','${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold border border-indigo-100 transition-all">
                        <i data-lucide="pencil" width="12"></i> Edit
                    </button>
                    <button onclick="deleteODC('${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold border border-red-100 transition-all">
                        <i data-lucide="trash-2" width="12"></i> Hapus
                    </button>
                </div>
            </div>
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-indigo-50 rounded-xl border border-indigo-100 p-4 col-span-2">
                    <p class="text-[10px] font-bold text-indigo-400 uppercase mb-1">Sumber: ODC Level 1</p>
                    <p class="font-semibold text-slate-800 text-sm">${parent?parent.name:'—'}</p>
                    ${(()=>{
                        if(!o.l1PortUsed||!parent) return '';
                        const portNum = parseInt(o.l1PortUsed);
                        const pColors = parent.l1PortColors?(typeof parent.l1PortColors==='string'?JSON.parse(parent.l1PortColors):parent.l1PortColors):null;
                        const cidx = pColors?pColors[portNum]:null;
                        const c = cidx?fiberColors[(parseInt(cidx)-1)%12]:null;
                        return `<div class="flex items-center gap-2 mt-2">
                            <span class="bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">Port ${String(portNum).padStart(2,'0')}</span>
                            ${c?`<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded-full" style="background:${c.hex}"></span><span class="text-xs font-bold" style="color:${c.hex}">${c.name} (${CORE_CODE[c.name]||'C?'})</span></span>`:''}
                            ${parent.l1Splitter?`<span class="text-[10px] text-slate-400">dari splitter ${parent.l1Splitter}</span>`:''}
                        </div>`;
                    })()}
                    ${parent?`<button class="text-[10px] text-indigo-500 font-mono mt-2 hover:underline flex items-center gap-1" onclick="switchInfraTab('odc-l1');selectInfraItem('${parent.id}')">Lihat ODC L1 →</button>`:''}
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Splitter ODC L2</p>
                    <p class="font-bold text-xl text-indigo-700">${o.l2Splitter||'—'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${o.l2Splitter?(parseInt(o.l2Splitter.split(':')[1])||0)+' port ke ODP':''}</p>
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Slot ODP</p>
                    <p class="font-bold text-2xl text-slate-800">${used}<span class="text-slate-400 text-base font-normal">/${o.capacity}</span></p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${o.capacity-used} slot kosong</p>
                </div>
            </div>
            <div class="px-6 pb-2">
                <div class="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Utilisasi Slot ODP</span>
                    <span style="color:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#4f46e5'}">${used}/${o.capacity} (${percent}%)</span>
                </div>
                <div class="util-bar-track">
                    <div class="util-bar-fill" style="width:${percent}%;background:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#4f46e5'}"></div>
                </div>
            </div>
            ${o.lat&&o.lng?`<div class="px-6 pb-4"><a href="https://www.google.com/maps?q=${o.lat},${o.lng}" target="_blank" class="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-xs font-mono bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg"><i data-lucide="map-pin" class="w-3 h-3"></i>${o.lat}, ${o.lng}</a></div>`:''}
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 class="font-bold text-slate-700 flex items-center gap-2">
                    <i data-lucide="radio" class="w-4 h-4 text-emerald-500"></i>
                    Daftar ODP
                    <span class="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">${children.length}</span>
                </h4>
                <button onclick="openInfraModal('odp', null, '${o.id}')" class="text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-bold border border-emerald-600 flex items-center gap-1 transition-all shadow-sm shadow-emerald-600/20">
                    <i data-lucide="plus" width="12"></i> Tambah ODP
                </button>
            </div>
            ${children.length > 0 ? `
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                ${children.map(p => {
                    const pu = customers.filter(c=>c.odpId===p.id).length;
                    const pp = Math.round((pu/p.capacity)*100);
                    const portInfo = p.odpCore ? `Port ${String(parseInt(p.odpCore)).padStart(2,'0')}` : '';
                    return `<div class="border border-slate-100 rounded-xl p-3.5 bg-slate-50 hover:border-emerald-200 transition-all cursor-pointer" onclick="switchInfraTab('odp');selectInfraItem('${p.id}')">
                        <div class="flex justify-between items-start mb-1">
                            <div class="min-w-0 pr-2">
                                <p class="font-bold text-slate-700 text-sm truncate">${p.name}</p>
                                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    ${portInfo?`<span class="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">${portInfo}</span>`:''}
                                    ${p.odpSplitter?`<span class="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">${p.odpSplitter}</span>`:''}
                                    ${p.landmark?`<span class="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold">${p.landmark}</span>`:''}
                                </div>
                            </div>
                            <span class="text-xs font-bold flex-shrink-0" style="color:${pp>=100?'#ef4444':pp>80?'#f59e0b':'#059669'}">${pu}/${p.capacity}</span>
                        </div>
                        <div class="util-bar-track mt-2">
                            <div class="util-bar-fill" style="width:${pp}%;background:${pp>=100?'#ef4444':pp>80?'#f59e0b':'#059669'}"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : `
            <div class="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                <i data-lucide="radio" class="w-9 h-9 opacity-20"></i>
                <p class="text-sm font-semibold text-slate-500">Belum ada ODP</p>
                <p class="text-xs text-slate-400">Klik tombol <span class="font-bold text-emerald-600">+ Tambah ODP</span> di atas untuk menambahkan ODP ke ODC L2 ini</p>
            </div>`}
        </div>`;
    } else {
        // ODP
        const o = odps.find(x=>x.id===_infraSelectedId);
        if(!o) return;
        const parent = odcs.find(p=>p.id===o.odcId);
        const conCusts = customers.filter(c=>c.odpId===o.id);
        const used = conCusts.length;
        const percent = Math.round((used/o.capacity)*100);
        html = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#ecfdf5">
                            <i data-lucide="radio" class="w-4 h-4" style="color:#059669"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900">${o.name}</h3>
                        <span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">ODP</span>
                        ${percent>=100?'<span class="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold">PENUH</span>':percent>80?'<span class="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold">HAMPIR PENUH</span>':''}
                    </div>
                    <p class="text-xs font-mono text-slate-400 pl-10">${o.id}</p>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="openInfraModal('odp','${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-100 transition-all">
                        <i data-lucide="pencil" width="12"></i> Edit
                    </button>
                    <button onclick="deleteODP('${o.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold border border-red-100 transition-all">
                        <i data-lucide="trash-2" width="12"></i> Hapus
                    </button>
                </div>
            </div>
            ${(()=>{
                // Rantai jaringan ODP
                const odc2 = parent;
                const odc1 = odc2 ? odcs.find(x=>x.id===odc2.parentId) : null;
                const feeder = odc1 ? cables.find(x=>x.id===odc1.feederId) : null;
                // Warna core feeder → ODC L1
                const cFeeder = odc1?.feederCore ? fiberColors[(odc1.feederCore-1)%12] : null;
                // Warna kabel ODC L1 → ODC L2
                const pColors = odc1?.l1PortColors?(typeof odc1.l1PortColors==='string'?JSON.parse(odc1.l1PortColors):odc1.l1PortColors):null;
                const l1Port = odc2?.l1PortUsed ? parseInt(odc2.l1PortUsed) : null;
                const cidxL1L2 = pColors&&l1Port ? pColors[l1Port] : null;
                const cL1L2 = cidxL1L2 ? fiberColors[(parseInt(cidxL1L2)-1)%12] : null;
                return `<div class="px-6 pb-2">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Jalur Sinyal Lengkap</p>
                    <div class="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                        ${feeder?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Feeder</span><span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">${feeder.name}</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${odc1?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Core ${odc1.feederCore||'?'}</span><span class="w-6 h-6 rounded-full border-2 border-white shadow" style="background:${cFeeder?cFeeder.hex:'#cbd5e1'}"></span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${odc1?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">ODC L1</span><span class="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-lg">${odc1.name}</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${odc1?.l1Splitter?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Splitter</span><span class="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg">${odc1.l1Splitter}</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${cL1L2?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Port ${l1Port}</span><span class="w-6 h-6 rounded-full border-2 border-white shadow" style="background:${cL1L2.hex}" title="${cL1L2.name}"></span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${odc2?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">ODC L2</span><span class="bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded-lg">${odc2.name}</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${odc2?.l2Splitter?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Splitter</span><span class="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg">${odc2.l2Splitter}</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        ${o.odpCore?`<div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">Port ${String(parseInt(o.odpCore)).padStart(2,'0')}</span><span class="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">•</span></div><span class="text-slate-300 font-bold">→</span>`:''}
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 mb-1">ODP</span><span class="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-lg">${o.name}</span></div>
                    </div>
                </div>`;
            })()}
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-emerald-50 rounded-xl border border-emerald-100 p-4 col-span-2">
                    <p class="text-[10px] font-bold text-emerald-400 uppercase mb-1">Sumber: ODC Level 2</p>
                    <p class="font-semibold text-slate-800 text-sm">${parent?parent.name:'—'}</p>
                    ${o.odpCore?`<p class="text-xs text-emerald-600 mt-1 font-bold">Port Splitter: ${String(parseInt(o.odpCore)).padStart(2,'0')}</p>`:''}
                    ${parent?`<button class="text-[10px] text-indigo-500 font-mono mt-1 hover:underline" onclick="switchInfraTab('odc-l2');selectInfraItem('${parent.id}')">Lihat ODC L2 →</button>`:''}
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Splitter ODP</p>
                    <p class="font-bold text-xl text-emerald-700">${o.odpSplitter||'—'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${o.odpSplitter?(parseInt(o.odpSplitter.split(':')[1])||0)+' port pelanggan':''}</p>
                </div>
                <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Pelanggan</p>
                    <p class="font-bold text-2xl text-slate-800">${used}<span class="text-slate-400 text-base font-normal">/${o.capacity}</span></p>
                    <p class="text-[10px] mt-0.5" style="color:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#059669'}">${o.capacity-used} port tersedia</p>
                </div>
            </div>
            ${o.landmark?`<div class="px-6 pb-2"><span class="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg"><i data-lucide="map-pin" class="w-3 h-3"></i>Landmark: ${o.landmark}</span></div>`:''}
            ${o.lat&&o.lng?`<div class="px-6 pb-2"><a href="https://www.google.com/maps?q=${o.lat},${o.lng}" target="_blank" class="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-xs font-mono bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg"><i data-lucide="map-pin" class="w-3 h-3"></i>${o.lat}, ${o.lng}</a></div>`:''}
            <div class="px-6 pb-4 mt-2">
                <div class="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Utilisasi Port</span>
                    <span style="color:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#059669'}">${used}/${o.capacity} (${percent}%)</span>
                </div>
                <div class="util-bar-track" style="height:10px">
                    <div class="util-bar-fill" style="width:${percent}%;background:${percent>=100?'#ef4444':percent>80?'#f59e0b':'#059669'}"></div>
                </div>
            </div>
        </div>
        ${conCusts.length > 0 ? `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h4 class="font-bold text-slate-700 flex items-center gap-2">
                    <i data-lucide="users" class="w-4 h-4 text-orange-400"></i>
                    Pelanggan Terhubung
                    <span class="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">${conCusts.length}</span>
                </h4>
            </div>
            <div class="divide-y divide-slate-100">
                ${conCusts.map((c,i) => `
                <div class="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">${i+1}</div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${c.name}</p>
                            ${c.wa ? `<p class="text-[10px] text-slate-400">${c.wa}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${c.status==='Active'?'bg-emerald-50 text-emerald-600 border border-emerald-100':'bg-red-50 text-red-500 border border-red-100'}">${c.status||'Active'}</span>
                        ${c.map ? `<a href="${c.map}" target="_blank" class="text-blue-400 hover:text-blue-600 transition"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i></a>` : ''}
                    </div>
                </div>`).join('')}
            </div>
        </div>` : `
        <div class="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <i data-lucide="user-x" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
            <p class="text-slate-400 text-sm">Belum ada pelanggan terhubung ke ODP ini</p>
        </div>`}`;
    }
    emptyEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
    contentEl.innerHTML = html;
    lucide.createIcons();
}

function infraCard(data, subtitle, used, childLabel) {
    const percent = Math.round((used/data.capacity)*100);
    const barColor = percent > 80 ? 'bg-amber-500' : 'bg-blue-600';
    const type = data.level === 'L1' ? 'odc-l1' : 'odc-l2';
    return `
    <div class="bg-white p-5 rounded-xl border shadow-sm hover:border-blue-400 transition-all">
        <div class="flex justify-between items-start mb-2">
            <div><h4 class="font-bold text-slate-800">${data.name}</h4><span class="text-[10px] font-mono text-slate-400">${data.id}</span></div>
            <div class="flex gap-1">
                <button onclick="openInfraModal('${type}','${data.id}')" class="text-slate-300 hover:text-blue-500 transition"><i data-lucide="pencil" width="14"></i></button>
                <button onclick="deleteODC('${data.id}')" class="text-slate-300 hover:text-red-500 transition"><i data-lucide="trash-2" width="14"></i></button>
            </div>
        </div>
        <p class="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded border border-slate-100">${subtitle}</p>
        <div class="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>Utilisasi</span><span>${used}/${data.capacity} ${childLabel}</span></div>
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${barColor}" style="width:${percent}%"></div></div>
    </div>`;
}

function getGeoLocation(inputId = 'form') {
    const latId = inputId === 'form' ? 'form-lat' : inputId;
    const lngId = inputId === 'form' ? 'form-lng' : inputId; 
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            
            if(inputId === 'form') {
                document.getElementById('form-lat').value = lat;
                document.getElementById('form-lng').value = lng;
            } else if (inputId === 'cust-map') {
                document.getElementById('cust-map').value = `https://maps.google.com/?q=${lat},${lng}`;
            } else {
                 document.getElementById(inputId).value = `${lat}, ${lng}`;
            }
        }, err => alert(err.message));
    } else alert('Geolocation not supported');
}

function parseMapUrl(source) {
    let urlEl, latEl, lngEl;
    if(source === 'form') {
        urlEl = document.getElementById('form-maps-url');
        latEl = document.getElementById('form-lat');
        lngEl = document.getElementById('form-lng');
    } else if(source === 'cable-start') {
        urlEl = document.getElementById('map-url-start');
        const val = urlEl ? urlEl.value : '';
        const match = val.match(/@?([-]?\d+\.\d+),([-]?\d+\.\d+)/);
        if(match) { document.getElementById('cable-start').value = match[1]+', '+match[2]; urlEl.value=''; }
        else alert("Link tidak valid");
        return;
    } else if(source === 'cable-end') {
        urlEl = document.getElementById('map-url-end');
        const val = urlEl ? urlEl.value : '';
        const match = val.match(/@?([-]?\d+\.\d+),([-]?\d+\.\d+)/);
        if(match) { document.getElementById('cable-end').value = match[1]+', '+match[2]; urlEl.value=''; }
        else alert("Link tidak valid");
        return;
    } else {
        alert("Sumber tidak dikenal");
        return;
    }
    const url = urlEl ? urlEl.value : '';
    const match = url.match(/@?([-]?\d+\.\d+),([-]?\d+\.\d+)/);
    if (match) {
        latEl.value = match[1];
        lngEl.value = match[2];
    } else alert("Link tidak valid");
}

// --- CUSTOMER MANAGEMENT (NEW LOGIC AUTOCOMPLETE) ---
