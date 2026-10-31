import { getExtensions } from './api.js';
import { switchView } from './router.js';

async function initPlatform() {
    try {
        const extensions = await getExtensions();
        const navContainer = document.getElementById('extensionNav');
        const hostContainer = document.getElementById('extensionHost');

        navContainer.innerHTML = '';
        hostContainer.innerHTML = '';

        extensions.forEach(ext => {
            // 1. Generate Navigation Button Dynamically
            const btn = document.createElement('button');
            btn.id = `nav-${ext.id}-btn`;
            btn.className = "px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer";
            btn.textContent = ext.name;
            btn.onclick = () => switchView(ext.id, extensions);
            navContainer.appendChild(btn);

            // 2. Generate View Section Container Dynamically
            const section = document.createElement('section');
            section.id = `${ext.id}-view`;
            section.className = "hidden space-y-6";
            hostContainer.appendChild(section);

            // 3. Dynamically Load Extension Frontend Script Module
            const script = document.createElement('script');
            script.type = 'module';
            script.src = `/extensions/${ext.id}/frontend.js`;
            document.body.appendChild(script);
        });

        if (extensions.length > 0) {
            switchView(extensions[0].id, extensions);
        }
    } catch (err) {
        console.error('Error initializing dynamic platform:', err);
    }
}

document.addEventListener('DOMContentLoaded', initPlatform);