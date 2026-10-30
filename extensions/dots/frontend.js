import { loadDots, addDot } from './state.js';
import { renderUI } from './ui.js';

async function init() {
    let appName = 'dots';
    let appVersion = 'v0.1.0';
    let appIcon = 'ellipsis-vertical';

    try {
        const manifestUrl = new URL('./manifest.json', import.meta.url);
        const manifestRes = await fetch(manifestUrl);
        if (manifestRes.ok) {
            const manifest = await manifestRes.json();
            if (manifest.name) appName = manifest.name;
            if (manifest.version) appVersion = `v${manifest.version}`;
            if (manifest.icon) appIcon = manifest.icon;
        }
    } catch (err) {
        console.warn("Could not load manifest.json, using defaults.", err);
    }

    document.getElementById('dots-view').innerHTML = `
        <div class="flex items-center space-x-2 mb-6">
            <div class="p-2 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <i data-lucide="${appIcon}" class="w-5 h-5"></i>
            </div>
            <h1 class="text-xl font-extrabold tracking-tight text-slate-900">${appName}</h1>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${appVersion}</span>
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

    await loadDots();
    renderUI();

    const form = document.getElementById('add-dot-form');
    const input = document.getElementById('dot-title-input');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const title = input.value.trim();
            if (title) {
                await addDot(title);
                input.value = '';
                renderUI();
            }
        };
    }
}

// Boot application
init();