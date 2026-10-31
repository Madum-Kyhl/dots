import { dots, toggleDotStatus } from './state.js';

export function renderUI() {
    const dotsContainer = document.getElementById('dots-table-body');
    const doneContainer = document.getElementById('done-table-body');

    if (!dotsContainer || !doneContainer) return;

    dotsContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    dots.forEach((dot) => {
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

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.target.getAttribute('data-id');
            await toggleDotStatus(id);
            renderUI();
        };
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}