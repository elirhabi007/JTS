async function runAI() {
    const key = document.getElementById('ai-api-key').value;
    const prompt = document.getElementById('ai-prompt').value;
    if(!key) return alert('Masukkan API Key');
    document.getElementById('btn-ai-run').innerText = 'Menganalisis...';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: `Act as Network Engineer. Context: ${odcs.length} ODCs, ${odps.length} ODPs. User: ${prompt}` }] }] })
        });
        const data = await res.json();
        if(data.candidates) {
            document.getElementById('ai-response-text').innerText = data.candidates[0].content.parts[0].text;
            document.getElementById('ai-result').classList.remove('hidden');
        }
    } catch(e) { alert('Error API'); }
    document.getElementById('btn-ai-run').innerHTML = `<span>Mulai Analisis</span> <i data-lucide="zap" width="18"></i>`; lucide.createIcons();
}

function renderDashboard() {
    // ── Hitung statistik ──────────────────────────────────────
    const totalCores   = cables.reduce((s, c) => s + (c.totalCores || 0), 0);
    const usedCores    = odcs.filter(o => o.feederCore).length + branchings.reduce((s, b) => s + (b.cores || [b.core]).filter(Boolean).length, 0);
    const totalODC     = odcs.length;
    const fullODC      = odcs.filter(o => {
        const used = o.level === 'L1' ? odcs.filter(s => s.parentId === o.id).length : odps.filter(p => p.odcId === o.id).length;
        return used >= o.capacity;
    }).length;
    const totalODP     = odps.length;
    const fullODP      = odps.filter(o => customers.filter(c => c.odpId === o.id).length >= o.capacity).length;
    const totalPelanggan = customers.length;
    const odpWithSlot  = odps.filter(o => customers.filter(c => c.odpId === o.id).length < o.capacity).length;

    // ── Stat Cards ────────────────────────────────────────────
    const stats = [
        {
            label: 'Kabel Feeder',
            val: cables.length,
            sub: `${usedCores} / ${totalCores} core terpakai`,
            icon: 'cable',
            color: 'blue',
            bar: totalCores ? Math.round(usedCores / totalCores * 100) : 0,
            barColor: 'bg-blue-500'
        },
        {
            label: 'Total ODC',
            val: totalODC,
            sub: `${fullODC} penuh · ${totalODC - fullODC} tersedia`,
            icon: 'server',
            color: 'indigo',
            bar: totalODC ? Math.round(fullODC / totalODC * 100) : 0,
            barColor: fullODC / totalODC >= 0.8 ? 'bg-red-500' : 'bg-indigo-500'
        },
        {
            label: 'Total ODP',
            val: totalODP,
            sub: `${fullODP} penuh · ${totalODP - fullODP} tersedia`,
            icon: 'share-2',
            color: 'emerald',
            bar: totalODP ? Math.round(fullODP / totalODP * 100) : 0,
            barColor: fullODP / totalODP >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
        },
        {
            label: 'Total Pelanggan',
            val: totalPelanggan,
            sub: `${odpWithSlot} ODP masih ada slot`,
            icon: 'users',
            color: 'orange',
            bar: null
        },
    ];

    document.getElementById('stats-container').innerHTML = stats.map(s => `
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-wide">${s.label}</p>
                    <p class="text-3xl font-bold text-slate-800 mt-0.5">${s.val}</p>
                </div>
                <div class="p-2.5 bg-${s.color}-100 text-${s.color}-600 rounded-xl">
                    <i data-lucide="${s.icon}" width="22"></i>
                </div>
            </div>
            <p class="text-xs text-slate-400 mb-2">${s.sub}</p>
            ${s.bar !== null ? `
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="${s.barColor} h-full transition-all" style="width:${s.bar}%"></div>
            </div>` : ''}
        </div>`).join('');

    // ── Feeder Summary Cards ──────────────────────────────────
    document.getElementById('feeder-summary-container').innerHTML = cables.length === 0
        ? '<p class="text-slate-400 text-sm italic col-span-3">Belum ada data feeder.</p>'
        : cables.map(c => {
            const cODCs     = odcs.filter(o => o.feederId === c.id);
            const cBranch   = branchings.filter(b => b.feederId === c.id);
            const usedC     = cODCs.length + cBranch.reduce((s, b) => s + (b.cores || (b.core ? [b.core] : [])).length, 0);
            const faultyC   = (c.faultyCores || []).length;
            const freeC     = c.totalCores - usedC - faultyC;
            const pct       = c.totalCores ? Math.round(usedC / c.totalCores * 100) : 0;
            const barColor  = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#2563eb';

            // hitung pelanggan downstream feeder ini
            const downODPs  = odps.filter(p => {
                const odc2 = odcs.find(o => o.id === p.odcId);
                if (!odc2) return false;
                if (odc2.feederId === c.id) return true;
                const odc1 = odcs.find(o => o.id === odc2.parentId);
                return odc1 && odc1.feederId === c.id;
            });
            const downCust  = customers.filter(cu => downODPs.some(p => p.id === cu.odpId)).length;

            return `<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <div class="min-w-0 pr-2">
                        <h4 class="font-bold text-slate-800 truncate">${c.name}</h4>
                        <span class="text-[10px] font-mono text-slate-400">${c.id}</span>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">${c.type}</span>
                </div>
                <!-- Core bar -->
                <div class="mb-3">
                    <div class="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Core Terpakai</span>
                        <span class="font-bold" style="color:${barColor}">${usedC} / ${c.totalCores}</span>
                    </div>
                    <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full" style="width:${pct}%;background:${barColor};transition:width .4s"></div>
                    </div>
                </div>
                <!-- Stats row -->
                <div class="grid grid-cols-4 gap-1 text-center">
                    <div class="bg-blue-50 rounded-lg p-2">
                        <p class="text-base font-bold text-blue-700">${cODCs.length}</p>
                        <p class="text-[9px] text-blue-400 font-semibold uppercase">ODC</p>
                    </div>
                    <div class="bg-violet-50 rounded-lg p-2">
                        <p class="text-base font-bold text-violet-700">${cBranch.length}</p>
                        <p class="text-[9px] text-violet-400 font-semibold uppercase">Branch</p>
                    </div>
                    <div class="bg-emerald-50 rounded-lg p-2">
                        <p class="text-base font-bold text-emerald-700">${freeC < 0 ? 0 : freeC}</p>
                        <p class="text-[9px] text-emerald-400 font-semibold uppercase">Kosong</p>
                    </div>
                    <div class="bg-orange-50 rounded-lg p-2">
                        <p class="text-base font-bold text-orange-700">${downCust}</p>
                        <p class="text-[9px] text-orange-400 font-semibold uppercase">Plgn</p>
                    </div>
                </div>
                ${faultyC > 0 ? `<div class="mt-2 text-[11px] text-red-500 font-semibold flex items-center gap-1"><i data-lucide="alert-triangle" width="12"></i> ${faultyC} core rusak</div>` : ''}
            </div>`;
        }).join('');

    // ── ODP Utilisasi Bar List ────────────────────────────────
    const odpSorted = [...odps].map(o => {
        const used = customers.filter(c => c.odpId === o.id).length;
        const pct  = o.capacity ? Math.round(used / o.capacity * 100) : 0;
        const odc  = odcs.find(d => d.id === o.odcId);
        return { ...o, used, pct, odcName: odc ? odc.name : '-' };
    }).sort((a, b) => b.pct - a.pct);

    document.getElementById('odp-util-list').innerHTML = odpSorted.length === 0
        ? '<p class="text-slate-400 text-sm italic text-center py-6">Belum ada data ODP.</p>'
        : odpSorted.map(o => {
            const barCol = o.pct >= 90 ? 'bg-red-500' : o.pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500';
            return `<div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <div class="min-w-0 pr-2">
                        <span class="text-xs font-bold text-slate-700 truncate block">${o.name}</span>
                        <span class="text-[10px] text-slate-400">${o.odcName}</span>
                    </div>
                    <span class="text-xs font-mono font-bold flex-shrink-0 ${o.pct >= 90 ? 'text-red-600' : o.pct >= 75 ? 'text-amber-600' : 'text-emerald-600'}">${o.used}/${o.capacity}</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="${barCol} h-full transition-all" style="width:${o.pct}%"></div>
                </div>
            </div>`;
        }).join('');

    // ── ODP Hampir Penuh (≥75%) ───────────────────────────────
    const warnODPs = odpSorted.filter(o => o.pct >= 75);
    const warnEl   = document.getElementById('odp-warning-list');
    const emptyEl  = document.getElementById('odp-warning-empty');
    if (warnODPs.length === 0) {
        warnEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
    } else {
        emptyEl.classList.add('hidden');
        warnEl.innerHTML = warnODPs.map(o => {
            const badgeColor = o.pct >= 100 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200';
            const label      = o.pct >= 100 ? 'PENUH' : o.pct + '%';
            const sisa       = o.capacity - o.used;
            return `<div class="flex items-center justify-between p-3 rounded-xl border ${o.pct >= 100 ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}">
                <div class="min-w-0 pr-3">
                    <p class="text-sm font-bold text-slate-800 truncate">${o.name}</p>
                    <p class="text-[11px] text-slate-400">${o.odcName} · ${o.used}/${o.capacity} port</p>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}">${label}</span>
                    ${sisa > 0 ? `<span class="text-[10px] text-slate-400">sisa ${sisa} port</span>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    // ── Topology Summary per Feeder ───────────────────────────
    document.getElementById('topology-container').innerHTML = cables.length === 0
        ? '<p class="text-slate-400 text-sm italic">Belum ada data jaringan.</p>'
        : cables.map(c => {
            const l1s    = odcs.filter(o => o.feederId === c.id && o.level === 'L1');
            const l1Ids  = l1s.map(o => o.id);
            const l2s    = odcs.filter(o => o.level === 'L2' && l1Ids.includes(o.parentId));
            const l2Ids  = l2s.map(o => o.id);
            const oODPs  = odps.filter(p => l2Ids.includes(p.odcId));
            const odpIds = oODPs.map(p => p.id);
            const custs  = customers.filter(cu => odpIds.includes(cu.odpId));

            // Tinggi node: ikon 40px + gap 4px + angka ~20px + gap 4px + label ~12px = ~80px total
            // Arrow harus tepat di tengah ikon = 20px dari atas node (setengah 40px)
            const node = (icon, label, count, color) =>
                `<div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-xl bg-${color}-100 text-${color}-600 flex items-center justify-center">
                        <i data-lucide="${icon}" width="18"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-800">${count}</p>
                    <p class="text-[10px] text-slate-400 font-semibold uppercase">${label}</p>
                </div>`;

            // Bungkus arrow dalam div setinggi node, arrow di tengah ikon (top: 20px = setengah 40px)
            const arrow = `<div class="flex-shrink-0" style="height:80px;display:flex;align-items:flex-start;padding-top:12px">
                <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
            </div>`;

            return `<div class="flex items-start gap-1 p-4 bg-slate-50 rounded-xl border border-slate-100 flex-wrap gap-y-3">
                <div class="flex flex-col justify-start mr-2 min-w-0" style="padding-top:10px">
                    <p class="text-xs font-bold text-slate-700 truncate max-w-[120px]">${c.name}</p>
                    <p class="text-[10px] text-slate-400 font-mono">${c.totalCores} core</p>
                </div>
                <div class="w-px bg-slate-200 mx-1" style="height:80px;margin-top:0"></div>
                ${node('cable','Feeder',1,'blue')}${arrow}
                ${node('server','ODC L1',l1s.length,'indigo')}${arrow}
                ${node('cpu','ODC L2',l2s.length,'purple')}${arrow}
                ${node('share-2','ODP',oODPs.length,'emerald')}${arrow}
                ${node('users','Pelanggan',custs.length,'orange')}
            </div>`;
        }).join('');

    lucide.createIcons();
}

// =============================================
// --- BRANCHING MODULE ---
// =============================================
let currentBranchFilter = 'all';
let selectedBranchCores = [];

let _branchFaultyCores = [];  // faulty cores pada kabel branching itu sendiri

