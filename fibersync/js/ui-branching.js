function openBranchModal(editId = null) {
    document.getElementById('branch-modal').classList.remove('hidden');
    document.getElementById('branch-edit-id').value = editId || '';
    document.getElementById('branch-modal-title').innerText = editId ? 'Edit Branching' : 'Tambah Branching';
    document.getElementById('branch-name').value = '';
    document.getElementById('branch-feeder').innerHTML = '<option value="">-- Pilih Feeder --</option>' +
        cables.map(c => `<option value="${c.id}">${c.name} (${c.totalCores} Core)</option>`).join('');
    document.getElementById('branch-destination').value = '';
    document.getElementById('branch-loc').value = '';
    document.getElementById('branch-map-url').value = '';
    document.getElementById('branch-length').value = '';
    document.getElementById('branch-note').value = '';
    document.getElementById('branch-cable-type').value = '';
    document.getElementById('branch-cable-cores').value = '';
    document.getElementById('branch-cable-section').classList.add('hidden');
    document.getElementById('branch-cable-visual').innerHTML = '';
    document.getElementById('branch-cable-faulty-info').classList.add('hidden');
    _branchFaultyCores = [];
    selectedBranchCores = [];
    document.getElementById('branch-core-visual').innerHTML = '<p class="text-xs text-violet-400 italic w-full text-center py-2">Pilih Feeder terlebih dahulu</p>';
    document.getElementById('branch-core-selected-info').classList.add('hidden');
    if(editId) {
        const b = branchings.find(x => x.id === editId);
        if(b) {
            document.getElementById('branch-name').value = b.name;
            document.getElementById('branch-feeder').value = b.feederId;
            selectedBranchCores = b.cores || (b.core ? [b.core] : []);
            document.getElementById('branch-destination').value = b.destination;
            document.getElementById('branch-loc').value = b.location || '';
            document.getElementById('branch-length').value = b.length || '';
            document.getElementById('branch-note').value = b.note || '';
            if(b.cableType) document.getElementById('branch-cable-type').value = b.cableType;
            if(b.cableCores) document.getElementById('branch-cable-cores').value = b.cableCores;
            _branchFaultyCores = b.cableFaultyCores ? [...b.cableFaultyCores] : [];
            updateBranchCoreVisual();
            updateBranchCableVisual();
        }
    }
    lucide.createIcons();
}

function closeBranchModal() { document.getElementById('branch-modal').classList.add('hidden'); }

function updateBranchCableVisual() {
    const totalCores = parseInt(document.getElementById('branch-cable-cores').value) || 0;
    const cableType  = document.getElementById('branch-cable-type').value;
    const section    = document.getElementById('branch-cable-section');
    const container  = document.getElementById('branch-cable-visual');
    const infoEl     = document.getElementById('branch-cable-faulty-info');

    if(!totalCores || !cableType) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    container.innerHTML = '';

    for(let i = 0; i < totalCores; i++) {
        const num = i + 1;
        const color = fiberColors[i % 12];
        const isFaulty = _branchFaultyCores.includes(num);
        const wrap = document.createElement('div');
        wrap.className = 'relative flex flex-col items-center gap-0.5 cursor-pointer group';
        wrap.title = `Core ${num} — ${color.name}${isFaulty?' (RUSAK)':''}`;

        const boxStyle = isFaulty
            ? `background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,.25) 3px,rgba(255,255,255,.25) 6px);border:2px solid #dc2626;box-shadow:0 3px 8px -2px rgba(239,68,68,.5);`
            : `border:2px solid ${color.name==='PUTIH'?'#cbd5e1':color.hex};color:${color.name==='PUTIH'?'#94a3b8':color.hex};background:white;`;

        wrap.innerHTML = `
            <div class="w-10 h-10 rounded-xl flex flex-col items-center justify-center select-none transition-all group-hover:scale-110" style="${boxStyle}">
                <span class="text-xs font-extrabold leading-none ${isFaulty?'text-white':''}">${num}</span>
                <span class="text-[7px] font-bold leading-none mt-0.5 ${isFaulty?'text-red-100':'opacity-50'}">${color.name.substring(0,3)}</span>
            </div>
            ${isFaulty?'<span class="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] font-black px-1 rounded-full leading-tight">✕</span>':''}
            <span class="text-[7px] font-bold uppercase truncate w-10 text-center" style="color:${color.hex==='#cbd5e1'?'#94a3b8':color.hex}">${color.name}</span>`;

        wrap.addEventListener('click', () => {
            const idx = _branchFaultyCores.indexOf(num);
            if(idx > -1) _branchFaultyCores.splice(idx, 1);
            else _branchFaultyCores.push(num);
            updateBranchCableVisual();
        });
        container.appendChild(wrap);
    }
    lucide.createIcons();

    // Info ringkasan
    if(_branchFaultyCores.length > 0) {
        const names = _branchFaultyCores.slice().sort((a,b)=>a-b)
            .map(n => 'Core '+n+' ('+fiberColors[(n-1)%12].name+')').join(', ');
        infoEl.textContent = '✕ Core Rusak: ' + names;
        infoEl.classList.remove('hidden');
    } else { infoEl.classList.add('hidden'); }
}

function updateBranchCoreVisual() {
    const feederId = document.getElementById('branch-feeder').value;
    const editId = document.getElementById('branch-edit-id').value;
    const container = document.getElementById('branch-core-visual');
    if(!feederId) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic w-full text-center py-2">Pilih Feeder terlebih dahulu</p>';
        return;
    }
    const feeder = cables.find(c => c.id === feederId);
    if(!feeder) return;
    const prevFeeder = container.dataset.feeder;
    if(prevFeeder && prevFeeder !== feederId) selectedBranchCores = [];
    container.dataset.feeder = feederId;
    container.innerHTML = '';
    for(let i = 0; i < feeder.totalCores; i++) {
        const num = i + 1;
        const color = fiberColors[i % 12];
        const faulty = feeder.faultyCores && feeder.faultyCores.includes(num);
        const usedByODC = odcs.some(o => o.feederId === feederId && o.feederCore === num);
        const usedByBranch = branchings.some(b => b.feederId === feederId && b.id !== editId && (b.cores || (b.core ? [b.core] : [])).includes(num));
        const isSelected = selectedBranchCores.includes(num);
        const isDisabled = faulty || usedByODC || usedByBranch;
        let boxStyle = '', statusBadge = '';
        if(faulty) { boxStyle = 'background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px);border:2px solid #dc2626;'; statusBadge='<span class="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] font-black px-1 rounded-full">ERR</span>'; }
        else if(usedByODC) { boxStyle = 'background:'+color.hex+';opacity:0.45;'; statusBadge='<span class="absolute -top-1 -right-1 bg-blue-600 text-white text-[7px] font-black px-1 rounded-full">ODC</span>'; }
        else if(usedByBranch) { boxStyle = 'background:linear-gradient(135deg,#7c3aed,#a855f7);opacity:0.45;'; statusBadge='<span class="absolute -top-1 -right-1 bg-violet-600 text-white text-[7px] font-black px-1 rounded-full">BRC</span>'; }
        else if(isSelected) { boxStyle = 'background:linear-gradient(135deg,#7c3aed,#a855f7);box-shadow:0 0 0 3px #7c3aed,0 4px 12px -2px rgba(124,58,237,0.5);'; statusBadge='<span class="absolute -top-1 -right-1 bg-violet-600 text-white text-[7px] font-black px-1 rounded-full">✓</span>'; }
        else { boxStyle = 'border:2px dashed '+(color.name==='PUTIH'?'#94a3b8':color.hex)+';color:'+(color.name==='PUTIH'?'#94a3b8':color.hex)+';background:white;'; }
        const textColor = (isSelected || usedByODC || usedByBranch || faulty) ? 'text-white' : '';
        const btn = document.createElement('div');
        btn.className = 'relative flex flex-col items-center gap-1 ' + (isDisabled ? 'cursor-not-allowed' : 'cursor-pointer');
        btn.title = 'Core ' + num + ' — ' + color.name;
        btn.innerHTML = '<div class="w-12 h-12 rounded-xl flex flex-col items-center justify-center select-none transition-all ' + (!isDisabled?'hover:scale-110':'') + '" style="' + boxStyle + '"><span class="text-sm font-extrabold leading-none ' + textColor + '">' + num + '</span><span class="text-[8px] font-bold leading-none mt-0.5 ' + (isSelected?'text-violet-100':'opacity-50') + '">' + color.name.substring(0,3) + '</span></div>' + statusBadge + '<span class="text-[8px] font-bold uppercase" style="color:' + (color.hex==='#cbd5e1'?'#94a3b8':color.hex) + '">' + color.name + '</span>';
        if(!isDisabled) {
            btn.addEventListener('click', () => {
                const idx = selectedBranchCores.indexOf(num);
                if(idx > -1) selectedBranchCores.splice(idx, 1);
                else selectedBranchCores.push(num);
                updateBranchCoreVisual();
            });
        }
        container.appendChild(btn);
    }
    const infoEl = document.getElementById('branch-core-selected-info');
    const textEl = document.getElementById('branch-core-selected-text');
    if(selectedBranchCores.length > 0) {
        const names = selectedBranchCores.slice().sort((a,b)=>a-b).map(n => { const c=fiberColors[(n-1)%12]; return 'Core '+n+' ('+c.name+')'; }).join(', ');
        textEl.textContent = '✓ Terpilih: ' + names;
        infoEl.classList.remove('hidden');
    } else { infoEl.classList.add('hidden'); }
}

function getBranchGPS() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('branch-loc').value = pos.coords.latitude.toFixed(6) + ', ' + pos.coords.longitude.toFixed(6);
        }, err => alert(err.message));
    } else alert('Geolocation tidak didukung');
}

function parseBranchMapUrl() {
    const url = document.getElementById('branch-map-url').value;
    const m = url.match(/@?([-]?\d+\.\d+),([-]?\d+\.\d+)/) || url.match(/q=([-]?\d+\.\d+),([-]?\d+\.\d+)/);
    if(m) { document.getElementById('branch-loc').value = m[1]+', '+m[2]; document.getElementById('branch-map-url').value=''; }
    else alert('URL tidak valid');
}

function handleBranchSubmit() {
    const name = document.getElementById('branch-name').value.trim();
    const feederId = document.getElementById('branch-feeder').value;
    const destination = document.getElementById('branch-destination').value.trim();
    if(!name) { alert('Nama branching harus diisi.'); return; }
    if(!feederId) { alert('Pilih Feeder sumber.'); return; }
    if(selectedBranchCores.length === 0) { alert('Pilih minimal 1 core dari Feeder.'); return; }
    if(!destination) { alert('Tujuan harus diisi.'); return; }
    const cableType  = document.getElementById('branch-cable-type').value;
    const cableCores = document.getElementById('branch-cable-cores').value;
    const editId = document.getElementById('branch-edit-id').value;
    const feeder = cables.find(c => c.id === feederId);
    const coresInfo = selectedBranchCores.slice().sort((a,b)=>a-b).map(n => { const c=fiberColors[(n-1)%12]; return {num:n, colorName:c.name, colorHex:c.hex}; });
    const data = {
        id: editId || 'BRANCH-' + Math.floor(Math.random() * 100000),
        name, feederId, feederName: feeder ? feeder.name : '',
        cores: selectedBranchCores, coresInfo,
        core: selectedBranchCores[0],
        coreColorName: coresInfo[0]?.colorName || '',
        coreColorHex: coresInfo[0]?.colorHex || '',
        destination, location: document.getElementById('branch-loc').value,
        length: document.getElementById('branch-length').value,
        note: document.getElementById('branch-note').value,
        cableType: cableType || '',
        cableCores: cableCores ? parseInt(cableCores) : null,
        cableFaultyCores: _branchFaultyCores.slice()
    };
    if(editId) { const idx=branchings.findIndex(b=>b.id===editId); if(idx!==-1) branchings[idx]=data; }
    else branchings.push(data);
    saveData(); closeBranchModal(); renderBranching();
    if(selectedCableId === feederId) renderFeederDetail();
}

function deleteBranching(id) {
    if(!confirm('Hapus branching ini?')) return;
    branchings = branchings.filter(b => b.id !== id);
    if(_selectedBranchId === id) _selectedBranchId = null;
    saveData(); renderBranching(); renderFeederDetail();
}

function filterBranching(feederId) { currentBranchFilter=feederId; renderBranching(); }

function renderBranching() {
    // Update filter buttons
    const filterContainer = document.getElementById('br-filter-feeders');
    if(filterContainer) {
        filterContainer.innerHTML = cables.map(c =>
            '<button onclick="filterBranching(\'' + c.id + '\')" data-feeder="' + c.id + '" class="br-filter-btn px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600">' + c.name + '</button>'
        ).join('');
    }
    // Update active filter button
    document.querySelectorAll('.br-filter-btn, #br-filter-all').forEach(btn => {
        btn.classList.remove('bg-violet-600','text-white','border-violet-600');
        btn.classList.add('border-slate-200','text-slate-500');
    });
    const activeBtn = currentBranchFilter==='all' ? document.getElementById('br-filter-all') : document.querySelector('.br-filter-btn[data-feeder="' + currentBranchFilter + '"]');
    if(activeBtn) { activeBtn.classList.add('bg-violet-600','text-white','border-violet-600'); activeBtn.classList.remove('border-slate-200','text-slate-500'); }
    // Render sidebar list dan detail panel
    renderBranchingList();
    renderBranchDetail();
}

// =============================================
// --- FIX: Koordinat jadi link Google Maps ---
        // =============================================
// --- FIX: Koordinat jadi link Google Maps ---
// =============================================
function coordToMapLink(coord) {
    if(!coord || coord === '-') return `<span class="text-slate-400 text-xs">-</span>`;
    const m = coord.match(/([-]?\d+\.?\d*)[,\s]+([-]?\d+\.?\d*)/);
    if(m) {
        const lat = m[1], lng = m[2];
        return `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
            class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-xs underline decoration-dotted transition-colors cursor-pointer">
            <i data-lucide="map-pin" class="w-3 h-3 flex-shrink-0"></i>${coord}
        </a>`;
    }
    return `<span class="font-mono text-xs text-slate-500">${coord}</span>`;
}

// ====================================================
// GLOBAL SEARCH
// ====================================================
let _gsMatches = [], _gsIdx = -1;
function globalSearchInput(val) {
    const drop = document.getElementById('global-search-drop');
    _gsMatches = []; _gsIdx = -1; drop.innerHTML = '';
    if(!val){ drop.classList.add('hidden'); return; }
    const v = val.toLowerCase();
    cables.filter(c=>c.name.toLowerCase().includes(v)||c.id.toLowerCase().includes(v)).forEach(c=>_gsMatches.push({type:'feeder',emoji:'🔵',label:c.name,sub:c.id,data:c}));
    branchings.filter(b=>b.name.toLowerCase().includes(v)||b.destination.toLowerCase().includes(v)||(b.feederName||'').toLowerCase().includes(v)).forEach(b=>_gsMatches.push({type:'branching',emoji:'🟣',label:b.name,sub:'→ '+b.destination,data:b}));
    odcs.filter(o=>o.name.toLowerCase().includes(v)||o.id.toLowerCase().includes(v)).forEach(o=>_gsMatches.push({type:'odc',emoji:'🔷',label:o.name,sub:o.level+' · '+o.id,data:o}));
    odps.filter(o=>o.name.toLowerCase().includes(v)||o.id.toLowerCase().includes(v)).forEach(o=>_gsMatches.push({type:'odp',emoji:'🟢',label:o.name,sub:o.id,data:o}));
    customers.filter(c=>c.name.toLowerCase().includes(v)||c.id.toLowerCase().includes(v)).forEach(c=>_gsMatches.push({type:'customer',emoji:'🟠',label:c.name,sub:c.id,data:c}));
    if(_gsMatches.length===0){ drop.innerHTML='<div class="px-4 py-3 text-sm text-slate-400 italic text-center">Tidak ditemukan</div>'; drop.classList.remove('hidden'); return; }
    drop.classList.remove('hidden');
    _gsMatches.forEach((m,i)=>{
        const el=document.createElement('div');
        el.className='px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0';
        el.dataset.idx=i;
        el.innerHTML=`<span class="text-sm font-semibold text-slate-800">${m.emoji} ${m.label}</span><span class="text-xs text-slate-400 font-mono ml-3 shrink-0">${m.sub}</span>`;
        el.addEventListener('click',()=>{
            document.getElementById('global-search').value='';
            drop.classList.add('hidden');
            switchTab('tracking');
            document.getElementById('tracking-search').value = m.data.name||m.data.id;
            setTimeout(()=>{ showTrackingResult(m); document.getElementById('tracking-result').scrollIntoView({behavior:'smooth',block:'start'}); }, 120);
        });
        drop.appendChild(el);
    });
}
function globalSearchKeyNav(e) {
    const drop=document.getElementById('global-search-drop');
    const items=Array.from(drop.querySelectorAll('[data-idx]'));
    if(drop.classList.contains('hidden')||!items.length) return;
    if(e.key==='ArrowDown'){e.preventDefault();_gsIdx=Math.min(_gsIdx+1,items.length-1);items.forEach((el,i)=>el.style.background=i===_gsIdx?'#f0fdfa':'');}
    else if(e.key==='ArrowUp'){e.preventDefault();_gsIdx=Math.max(_gsIdx-1,0);items.forEach((el,i)=>el.style.background=i===_gsIdx?'#f0fdfa':'');}
    else if(e.key==='Enter'&&_gsIdx>=0){e.preventDefault();items[_gsIdx].click();}
    else if(e.key==='Escape'){drop.classList.add('hidden');document.getElementById('global-search').value='';}
}
document.addEventListener('click',e=>{
    const gs=document.getElementById('global-search'), dd=document.getElementById('global-search-drop');
    if(gs&&dd&&!gs.closest('.relative').contains(e.target)) dd.classList.add('hidden');
},true);

// ====================================================
// FAULTY CORE VISUAL PICKER
// ====================================================
function updateFaultyCoreVisual() {
    const total = parseInt(document.getElementById('cable-capacity').value)||0;
    const container = document.getElementById('faulty-core-visual');
    const infoEl = document.getElementById('faulty-core-info');
    if(!total){ container.innerHTML='<p class="text-xs text-slate-400 italic w-full text-center py-1">Pilih jumlah core terlebih dahulu</p>'; infoEl.classList.add('hidden'); return; }
    container.innerHTML='';
    for(let i=0;i<total;i++){
        const num=i+1, color=fiberColors[i%12], isFaulty=_faultyCores.includes(num);
        const boxStyle = isFaulty
            ? `background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px);border:2px solid #dc2626;box-shadow:0 4px 12px -2px rgba(239,68,68,0.5);`
            : `border:2px dashed ${color.name==='PUTIH'?'#94a3b8':color.hex};color:${color.name==='PUTIH'?'#94a3b8':color.hex};background:white;`;
        const btn=document.createElement('div');
        btn.className='relative flex flex-col items-center gap-1 cursor-pointer';
        btn.title=`Core ${num} — ${color.name}`;
        btn.innerHTML=`
            <div class="w-12 h-12 rounded-xl flex flex-col items-center justify-center select-none transition-all hover:scale-110" style="${boxStyle}">
                <span class="text-sm font-extrabold leading-none ${isFaulty?'text-white':''}">${num}</span>
                <span class="text-[8px] font-bold leading-none mt-0.5 ${isFaulty?'text-red-100':'opacity-50'}">${color.name.substring(0,3)}</span>
            </div>
            ${isFaulty?'<span class="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] font-black px-1 rounded-full leading-tight">✕</span>':''}
            <span class="text-[8px] font-bold uppercase" style="color:${color.hex==='#cbd5e1'?'#94a3b8':color.hex}">${color.name}</span>`;
        btn.addEventListener('click',()=>{
            const idx=_faultyCores.indexOf(num);
            if(idx>-1) _faultyCores.splice(idx,1); else _faultyCores.push(num);
            document.getElementById('cable-faulty').value=_faultyCores.join(',');
            updateFaultyCoreVisual();
        });
        container.appendChild(btn);
    }
    if(_faultyCores.length>0){
        infoEl.textContent='✕ Core Rusak: '+_faultyCores.slice().sort((a,b)=>a-b).map(n=>'Core '+n+' ('+fiberColors[(n-1)%12].name+')').join(', ');
        infoEl.classList.remove('hidden');
    } else { infoEl.classList.add('hidden'); }
}
// ====================================================
// BRANCHING SIDEBAR + DETAIL (FEEDER STYLE)
// ====================================================
let _selectedBranchId = null;

function selectBranch(id) {
    _selectedBranchId = id;
    renderBranchingList();
    renderBranchDetail();
}

function renderBranchingList() {
    const filtered = currentBranchFilter==='all' ? branchings : branchings.filter(b=>b.feederId===currentBranchFilter);
    const listEl = document.getElementById('branching-list');
    const emptyEl = document.getElementById('branching-empty');
    if(!filtered.length){ if(listEl) listEl.innerHTML=''; if(emptyEl) emptyEl.classList.remove('hidden'); return; }
    if(emptyEl) emptyEl.classList.add('hidden');
    if(listEl) listEl.innerHTML = filtered.map(b=>{
        const isActive = b.id === _selectedBranchId;
        const coresInfo = b.coresInfo||(b.core?[{num:b.core,colorName:b.coreColorName,colorHex:b.coreColorHex}]:[]);
        const coreDots = coresInfo.slice(0,4).map(ci=>`<span class="w-3 h-3 rounded-full border border-white/50" style="background:${ci.colorHex}" title="Core ${ci.num} ${ci.colorName}"></span>`).join('');
        return `<div class="rounded-xl border p-3 transition-all duration-200 cursor-pointer ${isActive?'border-violet-500 bg-violet-50/50 shadow-sm ring-1 ring-violet-500':'border-slate-200 bg-white hover:border-violet-300'} group" onclick="selectBranch('${b.id}')">
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0 pr-2">
                    <h4 class="font-bold text-sm ${isActive?'text-violet-700':'text-slate-700'} truncate">${b.name}</h4>
                    <p class="text-[10px] text-slate-400 font-mono truncate">${b.id}</p>
                </div>
                <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="event.stopPropagation();openBranchModal('${b.id}')" class="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 shadow-sm"><i data-lucide="pencil" width="11"></i></button>
                    <button onclick="event.stopPropagation();deleteBranching('${b.id}')" class="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm"><i data-lucide="trash-2" width="11"></i></button>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <div class="flex gap-0.5">${coreDots}</div>
                <span class="text-[10px] text-slate-500 truncate">→ ${b.destination}</span>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function renderBranchDetail() {
    const b = branchings.find(x=>x.id===_selectedBranchId);
    const nameEl=document.getElementById('br-detail-name'), idEl=document.getElementById('br-detail-id');
    const badgeEl=document.getElementById('br-detail-feeder-badge');
    const summaryEl=document.getElementById('br-summary-bar'), gridEl=document.getElementById('br-core-grid');
    if(!b){
        if(nameEl) nameEl.innerText='Pilih Branching';
        if(idEl) idEl.innerText='';
        if(badgeEl) badgeEl.classList.add('hidden');
        if(summaryEl) summaryEl.innerHTML='';
        if(gridEl) gridEl.innerHTML='';
        ['br-info-feeder','br-info-dest','br-info-length'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerText='-'; });
        const locEl=document.getElementById('br-info-loc'); if(locEl) locEl.innerHTML='-';
        const noteEl=document.getElementById('br-info-note'); if(noteEl) noteEl.classList.add('hidden');
        return;
    }
    const feeder=cables.find(c=>c.id===b.feederId);
    const coresInfo=b.coresInfo||(b.core?[{num:b.core,colorName:b.coreColorName,colorHex:b.coreColorHex}]:[]);

    if(nameEl) nameEl.innerText=b.name;
    if(idEl) idEl.innerText=b.id;
    if(badgeEl){ badgeEl.innerText=b.feederName||''; badgeEl.classList.remove('hidden'); }

    if(feeder){
        // Build core statuses — same logic as feeder
        let coreStatuses=Array(feeder.totalCores).fill('K'), coreLabels=Array(feeder.totalCores).fill('');
        (feeder.faultyCores||[]).forEach(n=>{ if(n>0&&n<=feeder.totalCores){coreStatuses[n-1]='R';coreLabels[n-1]='Rusak';} });
        odcs.forEach(o=>{ if(o.feederId===feeder.id&&o.feederCore&&o.feederCore<=feeder.totalCores&&coreStatuses[o.feederCore-1]!=='R'){coreStatuses[o.feederCore-1]='U';coreLabels[o.feederCore-1]=o.name;} });
        branchings.filter(br=>br.feederId===feeder.id).forEach(br=>{
            const bCores=br.cores||(br.core?[br.core]:[]);
            bCores.forEach(n=>{ if(n>0&&n<=feeder.totalCores&&coreStatuses[n-1]!=='R'){
                if(br.id===b.id){coreStatuses[n-1]='B';coreLabels[n-1]=br.name;}
                else if(coreStatuses[n-1]==='K'){coreStatuses[n-1]='U';coreLabels[n-1]=br.name;}
            }});
        });
        const T=feeder.totalCores, bC=coreStatuses.filter(s=>s==='B').length, uC=coreStatuses.filter(s=>s==='U').length, fC=coreStatuses.filter(s=>s==='R').length, eC=coreStatuses.filter(s=>s==='K').length;
        if(summaryEl) summaryEl.innerHTML=`<div class="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-4">
            <div class="flex items-center gap-2"><div class="w-3 h-8 rounded-sm bg-violet-600"></div><div><p class="text-xs font-bold text-violet-700">${bC} Core</p><p class="text-[10px] text-slate-400">Branching ini</p></div></div>
            <div class="flex items-center gap-2"><div class="w-3 h-8 rounded-sm bg-blue-600"></div><div><p class="text-xs font-bold text-blue-700">${uC} Core</p><p class="text-[10px] text-slate-400">Dipakai lain</p></div></div>
            <div class="flex items-center gap-2"><div class="w-3 h-8 rounded-sm bg-emerald-500"></div><div><p class="text-xs font-bold text-emerald-700">${eC} Core</p><p class="text-[10px] text-slate-400">Kosong</p></div></div>
            <div class="flex items-center gap-2"><div class="w-3 h-8 rounded-sm bg-red-500" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px)"></div><div><p class="text-xs font-bold text-red-600">${fC} Core</p><p class="text-[10px] text-slate-400">Rusak</p></div></div>
            <div class="flex-1 min-w-32"><div class="flex h-8 rounded-lg overflow-hidden">
                ${bC>0?`<div style="width:${Math.round(bC/T*100)}%" class="bg-violet-600 flex items-center justify-center text-[9px] text-white font-bold">${bC>1?bC:''}</div>`:''}
                ${uC>0?`<div style="width:${Math.round(uC/T*100)}%" class="bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">${uC>1?uC:''}</div>`:''}
                ${fC>0?`<div style="width:${Math.round(fC/T*100)};background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px)%" class="flex items-center justify-center text-[9px] text-white font-bold">${fC>1?fC:''}</div>`:''}
                ${eC>0?`<div style="width:${Math.round(eC/T*100)}%" class="bg-slate-200"></div>`:''}
            </div><p class="text-[9px] text-slate-400 mt-1 text-center">Feeder ${feeder.name}: ${T} Core</p></div>
        </div>`;
        if(gridEl) gridEl.innerHTML=coreStatuses.map((status,idx)=>{
            const num=idx+1, color=fiberColors[idx%12], label=coreLabels[idx];
            let boxStyle='', badgeHtml='', numCls='text-sm font-extrabold leading-none';
            if(status==='R'){
                boxStyle=`background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.25) 4px,rgba(255,255,255,.25) 8px);border:2px solid #dc2626;`;
                badgeHtml=`<span class="text-[9px] font-bold text-white/80 leading-none mt-0.5">ERR</span>`;
                numCls+=' text-white';
            } else if(status==='B'){
                boxStyle=`background:linear-gradient(135deg,#7c3aed,#a855f7);box-shadow:0 4px 12px -2px rgba(124,58,237,0.5);`;
                badgeHtml=`<span class="text-[9px] font-bold text-violet-100 leading-none mt-0.5">BRC</span>`;
                numCls+=' text-white';
            } else if(status==='U'){
                boxStyle=`background:${color.hex};box-shadow:0 4px 12px -2px ${color.hex}80;`;
                badgeHtml=`<span class="text-[9px] font-bold text-white/80 leading-none mt-0.5">USED</span>`;
                numCls+=' text-white';
            } else {
                boxStyle=`border:2px dashed ${color.name==='PUTIH'?'#94a3b8':color.hex};color:${color.name==='PUTIH'?'#94a3b8':color.hex};`;
                badgeHtml=`<span class="text-[9px] font-bold opacity-60 leading-none mt-0.5">FREE</span>`;
            }
            const tooltip = status==='R' ? `Core ${num} — RUSAK` : (label || color.name);
            return `<div class="flex flex-col items-center gap-1.5" title="${tooltip}">
                <div class="w-14 h-14 rounded-xl flex flex-col items-center justify-center select-none transition-transform hover:scale-110" style="${boxStyle}">
                    <span class="${numCls}">${num}</span>${badgeHtml}
                </div>
                <span class="text-[9px] font-bold uppercase tracking-wide truncate w-14 text-center" style="color:${status==='R'?'#ef4444':(color.hex==='#cbd5e1'?'#94a3b8':color.hex)}">${status==='R'?'RUSAK':color.name}</span>
                ${label&&status!=='R'?`<span class="text-[8px] text-slate-400 truncate w-16 text-center leading-tight">${label.length>12?label.substring(0,10)+'..':label}</span>`:''}
            </div>`;
        }).join('');
    } else {
        // Feeder tidak ditemukan: tampilkan core yang dipakai branching ini saja
        if(summaryEl) summaryEl.innerHTML=`<div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0"></i>Data feeder tidak ditemukan. Menampilkan core branching saja.</div>`;
        if(gridEl) gridEl.innerHTML=`<div class="flex flex-wrap gap-3">${coresInfo.map(ci=>`<div class="flex flex-col items-center gap-1.5"><div class="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white" style="background:${ci.colorHex}"><span class="text-sm font-extrabold">${ci.num}</span><span class="text-[9px] opacity-80">BRC</span></div><span class="text-[9px] font-bold uppercase" style="color:${ci.colorHex}">${ci.colorName}</span></div>`).join('')}</div>`;
    }

    const fi=document.getElementById('br-info-feeder'); if(fi) fi.innerText=b.feederName||'-';
    const di=document.getElementById('br-info-dest'); if(di) di.innerText=b.destination||'-';
    const li=document.getElementById('br-info-length'); if(li) li.innerText=b.length?b.length+'m':'-';
    const locEl=document.getElementById('br-info-loc');
    if(locEl){
        if(b.location){ const mm=b.location.match(/([-]?\d+\.?\d*)[,\s]+([-]?\d+\.?\d*)/); locEl.innerHTML=mm?`<a href="https://www.google.com/maps?q=${mm[1]},${mm[2]}" target="_blank" class="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono text-xs"><i data-lucide="map-pin" class="w-3 h-3"></i>${b.location}</a>`:b.location; }
        else locEl.innerText='-';
    }
    const noteEl=document.getElementById('br-info-note');
    if(noteEl){ if(b.note){noteEl.innerText=b.note;noteEl.classList.remove('hidden');}else{noteEl.classList.add('hidden');} }

    // Kabel Branching section
    const cableSection = document.getElementById('br-cable-section');
    const cableGrid    = document.getElementById('br-cable-grid');
    const cableBadge   = document.getElementById('br-cable-badge');
    const cableFaulty  = document.getElementById('br-cable-faulty-info');
    if(b.cableType && b.cableCores) {
        cableSection.classList.remove('hidden');
        cableBadge.textContent = b.cableType + ' · ' + b.cableCores + ' Core';
        const faultyList = b.cableFaultyCores || [];
        cableGrid.innerHTML = '';
        for(let i = 0; i < b.cableCores; i++) {
            const num = i+1, color = fiberColors[i%12], isFaulty = faultyList.includes(num);
            const boxStyle = isFaulty
                ? `background:#ef4444;background-image:repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,.25) 3px,rgba(255,255,255,.25) 6px);border:2px solid #dc2626;box-shadow:0 3px 8px -2px rgba(239,68,68,.5);`
                : (color.name==='PUTIH'?`border:2px solid #cbd5e1;color:#94a3b8;background:white;`:`border:2px solid ${color.hex};color:${color.hex};background:white;`);
            cableGrid.innerHTML += `<div class="flex flex-col items-center gap-0.5" title="Core ${num} — ${color.name}${isFaulty?' (RUSAK)':''}">
                <div class="w-10 h-10 rounded-xl flex flex-col items-center justify-center select-none" style="${boxStyle}">
                    <span class="text-xs font-extrabold leading-none ${isFaulty?'text-white':''}">${num}</span>
                    <span class="text-[7px] font-bold leading-none mt-0.5 ${isFaulty?'text-red-100':'opacity-50'}">${color.name.substring(0,3)}</span>
                </div>
                <span class="text-[7px] font-bold uppercase" style="color:${isFaulty?'#ef4444':(color.hex==='#cbd5e1'?'#94a3b8':color.hex)}">${isFaulty?'RUSAK':color.name}</span>
            </div>`;
        }
        if(faultyList.length > 0) {
            cableFaulty.textContent = '✕ Core Rusak: ' + faultyList.slice().sort((a,b)=>a-b).map(n=>'Core '+n+' ('+fiberColors[(n-1)%12].name+')').join(', ');
            cableFaulty.classList.remove('hidden');
        } else { cableFaulty.classList.add('hidden'); }
    } else {
        cableSection.classList.add('hidden');
    }
    lucide.createIcons();
}

