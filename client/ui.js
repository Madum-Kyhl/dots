import { tasks, toggleTaskStatus } from './state.js';

export function renderUI() {
    const todoContainer = document.getElementById('todo-table-body');
    const doneContainer = document.getElementById('done-table-body');

    if (!todoContainer || !doneContainer) return;

    todoContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    tasks.forEach((task) => {
        const tr = document.createElement('tr');

        if (task.status === 'TODO') {
            tr.innerHTML = `
                <td>${escapeHTML(task.title)}</td>
                <td><button data-id="${task.id}" class="toggle-btn">Mark Done</button></td>
            `;
            todoContainer.appendChild(tr);
        } else {
            tr.innerHTML = `
                <td><del>${escapeHTML(task.title)}</del></td>
                <td><button data-id="${task.id}" class="toggle-btn">Reopen</button></td>
            `;
            doneContainer.appendChild(tr);
        }
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.target.getAttribute('data-id');
            await toggleTaskStatus(id);
            renderUI();
        };
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}