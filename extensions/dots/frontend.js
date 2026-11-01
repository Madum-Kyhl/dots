import { loadDots, addDot } from './state.js';
import { renderShell, renderUI, initUI } from './ui.js';

async function init() {
    let metadata = {
        name: 'dots',
        version: 'v0.1.0',
        icon: 'ellipsis-vertical'
    };

    try {
        const manifestRes = await fetch(new URL('./manifest.json', import.meta.url));
        if (manifestRes.ok) {
            const manifest = await manifestRes.json();
            if (manifest.name) metadata.name = manifest.name;
            if (manifest.version) metadata.version = `v${manifest.version}`;
            if (manifest.icon) metadata.icon = manifest.icon;
        }
    } catch (err) {
        console.warn("Could not load manifest.json, using defaults.", err);
    }

    // Render static application shell
    document.getElementById('dots-view').innerHTML = renderShell(metadata);

    initUI();

    // Load initial data and render rows
    await loadDots();
    renderUI();

    // Handle new dot creation form
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

init();