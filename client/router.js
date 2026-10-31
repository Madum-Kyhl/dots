let activeViewId = null;

export function switchView(viewId, extensions) {
    activeViewId = viewId;

    extensions.forEach(ext => {
        const btn = document.getElementById(`nav-${ext.id}-btn`);
        const viewEl = document.getElementById(`${ext.id}-view`);
        const isActive = ext.id === viewId;

        if (btn) {
            btn.className = isActive
                ? "px-4 py-1.5 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all"
                : "px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-900 transition-all";
        }

        if (viewEl) {
            viewEl.classList.toggle('hidden', !isActive);
        }
    });

    document.title = `bits & ${viewId}`;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}