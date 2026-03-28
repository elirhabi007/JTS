function makeFeederCode(name) {
    if (!name) return 'XX';
    const clean = name.replace(/^(FEEDER|FDR|KABEL|CBL)[\s\-]*/i,'').trim();
    const words = clean.split(/[\s\-_]+/).filter(Boolean);
    if (words.length === 1) return words[0].substring(0,6).toUpperCase();
    return words.slice(0,3).map(w => w.substring(0,2).toUpperCase()).join('.');
}

function updateODCL1SplitterPorts() {
    const splitter  = document.getElementById('form-l1-splitter').value;
    const block     = document.getElementById('block-l1-ports');
    const container = document.getElementById('l1-port-colors');
    if (!splitter) { block.classList.add('hidden'); return; }
    const count = parseInt(splitter.split(':')[1]) || 0;
    block.classList.remove('hidden');
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const colorOpts = fiberColors.map((c,idx) =>
            `<option value="${idx+1}">${c.name} (${CORE_CODE[c.name]||'C?'})</option>`
        ).join('');
        container.innerHTML += `
        <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">${i}</div>
            <select id="l1-port-color-${i}" class="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none" onchange="updatePortColorDot(${i})">
                <option value="">-- Warna Kabel Port ${i} --</option>
                ${colorOpts}
            </select>
            <span id="l1-port-dot-${i}" class="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></span>
        </div>`;
    }
}

function updatePortColorDot(portNum) {
    const sel = document.getElementById(`l1-port-color-${portNum}`);
    const dot = document.getElementById(`l1-port-dot-${portNum}`);
    if (!sel || !dot) return;
    const coreIdx = parseInt(sel.value);
    if (coreIdx && fiberColors[coreIdx-1]) {
        dot.style.background   = fiberColors[coreIdx-1].hex;
        dot.style.borderColor  = fiberColors[coreIdx-1].hex;
    } else {
        dot.style.background  = '';
        dot.style.borderColor = '#cbd5e1';
    }
}

function updateODCL2PortOptions() {
    const l1Id   = document.getElementById('form-parent-l1').value;
    const portSel= document.getElementById('form-l1-port-used');
    const preview= document.getElementById('l1-port-color-preview');
    portSel.innerHTML = '<option value="">-- Pilih port --</option>';
    if (preview) preview.classList.add('hidden');
    if (!l1Id) return;
    const odc1 = odcs.find(o => o.id === l1Id);
    if (!odc1) return;

    // Gunakan splitter jika ada, fallback ke capacity
    const splitter = odc1.l1Splitter || '';
    const count    = splitter
        ? (parseInt(splitter.split(':')[1]) || 0)
        : (odc1.capacity || 0);

    if (count === 0) {
        portSel.innerHTML = '<option value="">ODC L1 belum ada splitter — set splitter dulu</option>';
        return;
    }

    // Port yang sudah dipakai ODC L2 lain (kecuali yang sedang diedit)
    const editId    = document.getElementById('form-id').value;
    const usedPorts = odcs.filter(o =>
        o.level === 'L2' && o.parentId === l1Id && o.l1PortUsed && o.id !== editId
    ).map(o => parseInt(o.l1PortUsed));

    for (let i = 1; i <= count; i++) {
        const colorIdx = odc1.l1PortColors ? odc1.l1PortColors[i] : null;
        const color    = colorIdx ? fiberColors[colorIdx - 1] : null;
        const isUsed   = usedPorts.includes(i);
        const opt      = document.createElement('option');
        opt.value      = i;
        opt.text       = `Port ${String(i).padStart(2,'0')}${color ? ' — Kabel ' + color.name + ' (' + (CORE_CODE[color.name]||'C?') + ')' : ''}${isUsed ? ' [TERPAKAI]' : ''}`;
        opt.disabled   = isUsed;
        portSel.appendChild(opt);
    }
}

function updateODCL2SplitterPorts() {
    const l1Id    = document.getElementById('form-parent-l1').value;
    const portVal = document.getElementById('form-l1-port-used').value;
    const preview = document.getElementById('l1-port-color-preview');
    if (!portVal || !l1Id) { preview.classList.add('hidden'); return; }
    const odc1     = odcs.find(o => o.id === l1Id);
    const colorIdx = odc1?.l1PortColors?.[parseInt(portVal)];
    const color    = colorIdx ? fiberColors[colorIdx-1] : null;
    if (color) {
        document.getElementById('l1-port-color-dot').style.background  = color.hex;
        document.getElementById('l1-port-color-label').textContent     = `Kabel ${color.name} (${CORE_CODE[color.name]||'C?'}) masuk ke ODC L2 ini`;
        preview.classList.remove('hidden');
    } else { preview.classList.add('hidden'); }
}

function updateODPCapacity() {
    const splitter = document.getElementById('form-odp-splitter').value;
    const badge    = document.getElementById('odp-capacity-badge');
    const label    = document.getElementById('odp-capacity-label');
    if (!splitter) { badge.classList.add('hidden'); return; }
    const count = parseInt(splitter.split(':')[1]) || 0;
    label.textContent = `Kapasitas: ${count} port pelanggan`;
    badge.classList.remove('hidden');
    lucide.createIcons();
}

function onODCL2Changed() {
    const odcL2Id = document.getElementById('form-parent-l2').value;
    const portSel = document.getElementById('form-odp-core');
    const preview = document.getElementById('odp-port-color-preview');
    portSel.innerHTML = '<option value="">-- Pilih port --</option>';
    if (preview) preview.classList.add('hidden');
    document.getElementById('odp-name-suggest').classList.add('hidden');
    if (!odcL2Id) return;
    const odc2     = odcs.find(o => o.id === odcL2Id);
    if (!odc2) return;
    const splitter = odc2.l2Splitter || '';
    const count    = splitter ? parseInt(splitter.split(':')[1]) : (odc2.capacity || 2);
    const usedPorts= odps.filter(p => p.odcId===odcL2Id && p.odpCore).map(p=>parseInt(p.odpCore));
    for (let i = 1; i <= count; i++) {
        const isUsed = usedPorts.includes(i);
        const opt = document.createElement('option');
        opt.value    = i;
        opt.text     = `Port ${String(i).padStart(2,'0')}${isUsed?' [TERPAKAI]':''}`;
        opt.disabled = isUsed;
        portSel.appendChild(opt);
    }
    portSel.onchange = function() { updateODPPortPreview(odcL2Id); autoSuggestODPName(); };
    setTimeout(autoSuggestODPName, 50);
}

function updateODPPortPreview(odcL2Id) {
    const preview  = document.getElementById('odp-port-color-preview');
    if (!preview) return;
    const odc2     = odcs.find(o => o.id === odcL2Id);
    const odc1     = odc2 ? odcs.find(o => o.id === odc2.parentId) : null;
    const portUsed = odc2?.l1PortUsed ? parseInt(odc2.l1PortUsed) : null;
    const colorIdx = portUsed && odc1?.l1PortColors ? odc1.l1PortColors[portUsed] : null;
    const color    = colorIdx ? fiberColors[colorIdx-1] : null;
    if (color) {
        document.getElementById('odp-port-color-dot').style.background = color.hex;
        document.getElementById('odp-port-color-label').textContent    = `Kabel masuk: ${color.name} (${CORE_CODE[color.name]||'C?'}) dari ODC L1`;
        preview.classList.remove('hidden');
    } else { preview.classList.add('hidden'); }
}

function populateODPCoreOptions(odcL2Id) { onODCL2Changed(); }

function autoSuggestODPName() {
    const odcL2Id  = document.getElementById('form-parent-l2').value;
    const portVal  = document.getElementById('form-odp-core').value;
    const landmark = (document.getElementById('form-odp-landmark').value||'').trim().toUpperCase();
    const suggestEl= document.getElementById('odp-name-suggest');
    const textEl   = document.getElementById('odp-name-suggest-text');
    const infoEl   = document.getElementById('odp-name-suggest-info');
    const brkEl    = document.getElementById('odp-name-breakdown');
    if (!odcL2Id) { suggestEl.classList.add('hidden'); return; }
    const odc2   = odcs.find(o => o.id === odcL2Id);
    if (!odc2) { suggestEl.classList.add('hidden'); return; }
    const odc1   = odcs.find(o => o.id === odc2.parentId);
    const feeder = odc1 ? cables.find(c => c.id === odc1.feederId) : null;

    const feederCode    = makeFeederCode(feeder?.name || '');
    let   coreFeederCode= '';
    if (odc1?.feederCore) {
        const c = fiberColors[(odc1.feederCore-1)%12];
        coreFeederCode = CORE_CODE[c.name] || 'C?';
    }
    let cableL1L2Code = '';
    const l1PortUsed  = odc2.l1PortUsed ? parseInt(odc2.l1PortUsed) : null;
    if (l1PortUsed && odc1?.l1PortColors?.[l1PortUsed]) {
        const c = fiberColors[odc1.l1PortColors[l1PortUsed]-1];
        cableL1L2Code = CORE_CODE[c.name] || 'C?';
    }
    const splitterL2 = odc2.l2Splitter || '';
    const portCode   = portVal ? String(portVal).padStart(2,'0') : '';

    const parts = ['ODP', feederCode];
    if (coreFeederCode) parts.push(coreFeederCode);
    if (cableL1L2Code)  parts.push(cableL1L2Code);
    if (splitterL2)     parts.push('S'+splitterL2);
    if (portCode)       parts.push(portCode);
    if (landmark)       parts.push(landmark);
    textEl.textContent = parts.join('-');

    const segs = [
        { label:'Tipe',      val:'ODP',           color:'bg-slate-700 text-white' },
        { label:'Feeder',    val:feederCode,       color:'bg-blue-600 text-white' },
        coreFeederCode ? { label:'Core Feeder', val:coreFeederCode, color:'bg-sky-500 text-white' } : null,
        cableL1L2Code  ? { label:'Kabel L1→L2', val:cableL1L2Code, color:'bg-indigo-500 text-white' } : null,
        splitterL2     ? { label:'Split L2',    val:'S'+splitterL2, color:'bg-violet-500 text-white' } : null,
        portCode       ? { label:'Port',        val:portCode,       color:'bg-teal-500 text-white' } : null,
        landmark       ? { label:'Lokasi',      val:landmark,       color:'bg-orange-500 text-white' } : null,
    ].filter(Boolean);

    brkEl.innerHTML = segs.map((s,i) =>
        `<div class="flex flex-col items-center">
            <span class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">${s.label}</span>
            <span class="text-xs font-bold font-mono px-2 py-0.5 rounded ${s.color}">${s.val}</span>
        </div>${i<segs.length-1?'<span class="text-slate-300 font-bold self-end mb-1 text-sm">-</span>':''}`
    ).join('');

    const existingODPs = odps.filter(p=>p.odcId===odcL2Id);
    infoEl.textContent = `${feeder?.name||'-'} → ${odc1?.name||'-'} [${splitterL2||'?'}] → ${odc2.name} · ${existingODPs.length} ODP terpasang · sisa ${(odc2.capacity||0)-existingODPs.length} port`;
    suggestEl.classList.remove('hidden');
    lucide.createIcons();
}

function applyODPSuggest() {
    const suggested = document.getElementById('odp-name-suggest-text').textContent;
    if (suggested) {
        document.getElementById('form-name').value = suggested;
        const nameEl = document.getElementById('form-name');
        nameEl.classList.add('ring-2','ring-emerald-400','border-emerald-400');
        setTimeout(()=>nameEl.classList.remove('ring-2','ring-emerald-400','border-emerald-400'),1500);
        nameEl.scrollIntoView({behavior:'smooth',block:'center'});
    }
}

document.addEventListener('change', function(e) {
    if (e.target.id === 'form-l1-splitter')  updateODCL1SplitterPorts();
    if (e.target.id === 'form-parent-l1')    { updateODCL2PortOptions(); updateODCL2SplitterPorts(); }
    if (e.target.id === 'form-l1-port-used') updateODCL2SplitterPorts();
    if (e.target.id === 'form-parent-l2')    onODCL2Changed();
});

function openInfraModal(type, id = null, presetOdcL2Id = null) {

    // Reset suggest panel
    document.getElementById('odp-name-suggest').classList.add('hidden');
    const modal = document.getElementById('infra-modal');
    const form = document.getElementById('infra-form');
    form.reset();
    document.getElementById('form-maps-url').value = '';
    document.getElementById('form-type').value = type;
    document.getElementById('form-id').value = id || '';
    document.getElementById('modal-title').innerText = id ? `Edit ${type.toUpperCase()}` : `Tambah ${type.toUpperCase()}`;
    const fieldFeeder = document.getElementById('block-feeder');
    const fieldParentL1 = document.getElementById('block-parent-l1');
    const fieldParentL2 = document.getElementById('block-parent-l2');
    fieldFeeder.classList.add('hidden');
    fieldParentL1.classList.add('hidden');
    fieldParentL2.classList.add('hidden');
    if (type === 'odc-l1') {
        fieldFeeder.classList.remove('hidden');
        document.getElementById('form-feeder-id').innerHTML = '<option value="">-- Pilih Feeder --</option>' + cables.map(c => `<option value="${c.id}">${c.name} (${c.totalCores}c)</option>`).join('');
        // Reset splitter fields
        document.getElementById('form-l1-splitter').value = '';
        document.getElementById('block-l1-ports').classList.add('hidden');
    } else if (type === 'odc-l2') {
        fieldParentL1.classList.remove('hidden');
        const l1s = odcs.filter(o => o.level === 'L1');
        document.getElementById('form-parent-l1').innerHTML = l1s.length ? l1s.map(o => {
            const used = odcs.filter(sub => sub.parentId === o.id).length;
            const full = used >= o.capacity;
            const splitterInfo = o.l1Splitter ? `SP.${o.l1Splitter}` : 'Tanpa Splitter';
            return `<option value="${o.id}" ${full?'disabled':''}>${o.name} (${splitterInfo}) Used: ${used}/${o.capacity} ${full?'[FULL]':''}</option>`;
        }).join('') : '<option value="">Tidak ada ODC Level 1</option>';
        document.getElementById('form-l2-splitter').value = '';
        document.getElementById('l1-port-color-preview').classList.add('hidden');
        // Auto-populate port splitter berdasarkan ODC L1 yang sudah terpilih
        if (!id && l1s.length > 0) setTimeout(updateODCL2PortOptions, 50);
    } else { 
        fieldParentL2.classList.remove('hidden');
        // Filter ODC L2: hanya tampilkan turunan dari ODC L1 yang sama
        // Jika ada presetOdcL2Id (dari tombol + Tambah ODP di halaman ODC L2),
        // atau jika edit ODP (id ada), gunakan odcId dari data untuk filter
        // Referensi ODC L2: dari preset (klik +Tambah ODP) atau dari data edit
        let _refOdcL2Id = presetOdcL2Id || (id ? (odps.find(o=>o.id===id)||{}).odcId : null);
        let l2s = odcs.filter(o => o.level === 'L2');
        if (_refOdcL2Id) {
            const srcODC = odcs.find(o => o.id === _refOdcL2Id);
            if (srcODC) {
                // Coba filter berdasarkan parentId (ODC L1 yang sama)
                const parentId = srcODC.parentId || srcODC.parentl1 || srcODC.parent_id || srcODC.odcL1Id || '';
                if (parentId) {
                    const siblings = l2s.filter(o =>
                        (o.parentId || o.parentl1 || o.parent_id || o.odcL1Id || '') === parentId
                    );
                    l2s = siblings.length ? siblings : [srcODC];
                } else {
                    // parentId tidak ada — tampilkan hanya ODC L2 ini saja
                    l2s = [srcODC];
                }
            }
        }
        document.getElementById('form-parent-l2').innerHTML = l2s.length ? l2s.map(o => {
            const used = odps.filter(p => p.odcId === o.id).length;
            const full = used >= o.capacity;
            return `<option value="${o.id}" ${full?'disabled':''}>${o.name} (Used: ${used}/${o.capacity}) ${full?'[FULL]':''}` + `</option>`;
        }).join('') : '<option value="">Tidak ada ODC Level 2</option>';

        // Reset field ODP
        document.getElementById('form-odp-core').innerHTML = '<option value="">-- Pilih ODC L2 dulu --</option>';
        document.getElementById('form-odp-splitter').value = '';
        document.getElementById('odp-capacity-badge').classList.add('hidden');
        document.getElementById('form-odp-landmark').value = '';
        const prevEl = document.getElementById('odp-port-color-preview');
        if (prevEl) prevEl.classList.add('hidden');
        // Sembunyikan banner pre-fill dulu
        const banner = document.getElementById('odp-prefill-banner');
        if (banner) banner.classList.add('hidden');

        // ── AUTO-FILL dari ODC L2 induk (saat buka dari tombol + Tambah ODP) ──
        if (!id && presetOdcL2Id) {
            const srcODC = odcs.find(o => o.id === presetOdcL2Id);
            if (srcODC) {
                // Jalankan semua pre-fill setelah modal render
                setTimeout(() => {
                    // 1. Auto-select ODC L2 di dropdown
                    const selL2 = document.getElementById('form-parent-l2');
                    if (selL2) selL2.value = presetOdcL2Id;

                    // 2. Auto-fill GPS dari koordinat ODC L2
                    if (srcODC.lat && srcODC.lng) {
                        document.getElementById('form-lat').value = srcODC.lat;
                        document.getElementById('form-lng').value = srcODC.lng;
                    }

                    // 3. Populate port dropdown
                    onODCL2Changed();

                    setTimeout(() => {
                        // 4. Auto-pilih port pertama yang kosong
                        const portSel = document.getElementById('form-odp-core');
                        const firstFree = Array.from(portSel.options).find(o => o.value && !o.disabled);
                        if (firstFree) {
                            portSel.value = firstFree.value;
                            updateODPPortPreview(presetOdcL2Id);
                        }

                        // 5. Auto-suggest nama ODP
                        autoSuggestODPName();

                        // 6. Tampilkan banner info
                        const b   = document.getElementById('odp-prefill-banner');
                        const txt = document.getElementById('odp-prefill-text');
                        if (b && txt) {
                            txt.textContent = `ODC L2 & koordinat GPS otomatis diisi dari: ${srcODC.name}`;
                            b.classList.remove('hidden');
                        }

                        lucide.createIcons();
                    }, 100);
                }, 60);
            }
        } else if (!id && l2s.length > 0) {
            setTimeout(onODCL2Changed, 50);
        }
    }
    if (id) {
        const data = type.includes('odc') ? odcs.find(o => o.id === id) : odps.find(o => o.id === id);
        if (data) {
            document.getElementById('form-name').value = data.name;
            document.getElementById('form-lat').value = data.lat;
            document.getElementById('form-lng').value = data.lng;
            if(type === 'odc-l1') {
                document.getElementById('form-feeder-id').value = data.feederId;
                updateFeederCoreOptions();
                document.getElementById('form-feeder-core').value = data.feederCore;
                // Restore splitter ODC L1 — tunggu DOM siap
                if (data.l1Splitter) {
                    document.getElementById('form-l1-splitter').value = data.l1Splitter;
                    updateODCL1SplitterPorts(); // render port rows dulu
                }
                // Restore warna kabel per port dengan delay lebih panjang
                setTimeout(() => {
                    if (data.l1Splitter) {
                        document.getElementById('form-l1-splitter').value = data.l1Splitter;
                        updateODCL1SplitterPorts();
                    }
                    const colors = data.l1PortColors;
                    if (colors) {
                        // l1PortColors bisa berupa string JSON dari Sheets
                        const parsed = typeof colors === 'string' ? JSON.parse(colors) : colors;
                        Object.entries(parsed).forEach(([port, colorIdx]) => {
                            const sel = document.getElementById(`l1-port-color-${port}`);
                            if (sel) { sel.value = colorIdx; updatePortColorDot(parseInt(port)); }
                        });
                    }
                }, 150);
            } else if (type === 'odc-l2') {
                document.getElementById('form-parent-l1').value = data.parentId;
                updateODCL2PortOptions();
                setTimeout(() => {
                    if (data.l1PortUsed) {
                        document.getElementById('form-l1-port-used').value = data.l1PortUsed;
                        updateODCL2SplitterPorts();
                    }
                    if (data.l2Splitter) document.getElementById('form-l2-splitter').value = data.l2Splitter;
                }, 150);
            } else {
                document.getElementById('form-parent-l2').value = data.odcId;
                populateODPCoreOptions(data.odcId);
                if (data.odpCore) document.getElementById('form-odp-core').value = data.odpCore;
                if (data.odpSplitter) {
                    document.getElementById('form-odp-splitter').value = data.odpSplitter;
                    updateODPCapacity();
                }
                if (data.landmark) document.getElementById('form-odp-landmark').value = data.landmark;
                document.getElementById('odp-name-suggest').classList.add('hidden');
            }
        }
    }
    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeInfraModal() { document.getElementById('infra-modal').classList.add('hidden'); }

function handleInfraSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('form-type').value;
    const id   = document.getElementById('form-id').value;
    const name = document.getElementById('form-name').value;
    const lat  = document.getElementById('form-lat').value;
    const lng  = document.getElementById('form-lng').value;

    if (type.includes('odc')) {
        let level = type === 'odc-l1' ? 'L1' : 'L2';
        let newData = { name, lat, lng, level };

        if (type === 'odc-l1') {
            newData.feederId   = document.getElementById('form-feeder-id').value;
            newData.feederCore = parseInt(document.getElementById('form-feeder-core').value);
            newData.l1Splitter = document.getElementById('form-l1-splitter').value;
            // Kapasitas = jumlah output splitter L1
            newData.capacity   = newData.l1Splitter ? parseInt(newData.l1Splitter.split(':')[1]) : 0;
            // Warna kabel per port {1: colorIdx, 2: colorIdx, ...}
            if (newData.l1Splitter) {
                const count = newData.capacity;
                const portColors = {};
                for (let i = 1; i <= count; i++) {
                    const sel = document.getElementById(`l1-port-color-${i}`);
                    if (sel && sel.value) portColors[i] = parseInt(sel.value);
                }
                newData.l1PortColors = portColors;
            }
        } else {
            newData.parentId   = document.getElementById('form-parent-l1').value;
            newData.l1PortUsed = document.getElementById('form-l1-port-used').value;
            newData.l2Splitter = document.getElementById('form-l2-splitter').value;
            // Kapasitas = jumlah output splitter L2
            newData.capacity   = newData.l2Splitter ? parseInt(newData.l2Splitter.split(':')[1]) : 0;
        }

        if (id) {
            const idx = odcs.findIndex(o => o.id === id);
            odcs[idx] = { ...odcs[idx], ...newData };
        } else {
            newData.id = (type === 'odc-l1' ? 'ODC-L1-' : 'ODC-L2-') + Math.floor(Math.random() * 10000);
            odcs.push(newData);
        }
    } else {
        // ODP — kapasitas dari splitter ODP yang dipilih
        const odcId      = document.getElementById('form-parent-l2').value;
        const odpCore    = document.getElementById('form-odp-core').value;
        const odpSplitter= document.getElementById('form-odp-splitter').value;
        const landmark   = (document.getElementById('form-odp-landmark').value || '').trim().toUpperCase();
        const capacity   = odpSplitter ? parseInt(odpSplitter.split(':')[1]) : 0;
        if (id) {
            const idx = odps.findIndex(o => o.id === id);
            odps[idx] = { ...odps[idx], name, odcId, lat, lng, capacity, odpCore, odpSplitter, landmark };
        } else {
            odps.push({ id: 'ODP-' + Math.floor(Math.random() * 10000), name, odcId, lat, lng, capacity, odpCore, odpSplitter, landmark });
        }
    }
    saveData(); renderInfraTables(); closeInfraModal();
}

function deleteODC(id) { if (confirm('Hapus ODC?')) { odcs = odcs.filter(o => o.id !== id); if(_infraSelectedId===id) _infraSelectedId=null; saveData(); renderInfraTables(); } }
function deleteODP(id) { if (confirm('Hapus ODP?')) { odps = odps.filter(o => o.id !== id); if(_infraSelectedId===id) _infraSelectedId=null; saveData(); renderInfraTables(); } }
