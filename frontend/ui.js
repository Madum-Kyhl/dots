import { tasks, toggleTaskStatus } from './state.js';

export function renderUI() {
    const todoContainer = document.getElementById('todo-table-body');
    const doneContainer = document.getElementById('done-table-body');

    if (!todoContainer || !doneContainer) return;

    todoContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    tasks.forEach((task, index) => {
        const tr = document.createElement('tr');

        if (task.status === 'TODO') {
            tr.innerHTML = `
                <td>${escapeHTML(task.title)}</td>
                <td><button data-index="${index}" class="toggle-btn">Mark Done</button></td>
            `;
            todoContainer.appendChild(tr);
        } else {
            tr.innerHTML = `
                <td><del>${escapeHTML(task.title)}</del></td>
                <td><button data-index="${index}" class="toggle-btn">Reopen</button></td>
            `;
            doneContainer.appendChild(tr);
        }
    });

    // Bind action listeners to all dynamic buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            await toggleTaskStatus(idx);
            renderUI();
        };
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}