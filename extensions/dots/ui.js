import { getDots, toggleDotStatus } from './state.js';

export function renderShell({ name, version, icon }) {
    return `
        <div class="flex items-center space-x-2 mb-6">
            <div class="p-2 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <h1 class="text-xl font-extrabold tracking-tight text-slate-900">${name}</h1>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${version}</span>
        </div>
        <form id="add-dot-form" class="flex gap-2">
            <input type="text" id="dot-title-input" placeholder="Enter new dot title..." required class="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
            <button type="submit" class="px-5 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 text-sm transition-all">Add Dot</button>
        </form>
        <hr class="border-slate-100 my-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl">
                <h2 class="text-sm font-bold lowercase tracking-wider text-slate-400 mb-4">dots</h2>
                <table class="w-full text-left text-sm"><tbody id="dots-table-body" class="divide-y divide-slate-200/60"></tbody></table>
            </div>
            <div class="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl">
                <h2 class="text-sm font-bold lowercase tracking-wider text-slate-400 mb-4">done</h2>
                <table class="w-full text-left text-sm"><tbody id="done-table-body" class="divide-y divide-slate-200/60"></tbody></table>
            </div>
        </div>
    `;
}

export function renderUI() {
    const dotsContainer = document.getElementById('dots-table-body');
    const doneContainer = document.getElementById('done-table-body');

    if (!dotsContainer || !doneContainer) return;

    dotsContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    getDots().forEach((dot) => {
        const tr = document.createElement('tr');

        if (dot.status === 'dots') {
            tr.innerHTML = `
                <td>${escapeHTML(dot.title)}</td>
                <td><button data-id="${dot.id}" class="toggle-btn">trace</button></td>
            `;
            dotsContainer.appendChild(tr);
        } else {
            tr.innerHTML = `
                <td><del>${escapeHTML(dot.title)}</del></td>
                <td><button data-id="${dot.id}" class="toggle-btn">retrace</button></td>
            `;
            doneContainer.appendChild(tr);
        }
    });
}

export function initUI() {
    const dotsView = document.getElementById('dots-view');
    if (!dotsView) return;

    // Use event delegation to handle toggle clicks efficiently
    dotsView.addEventListener('click', async (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        if (id) {
            await toggleDotStatus(id);
            renderUI();
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}