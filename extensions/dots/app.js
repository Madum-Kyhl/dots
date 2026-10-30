import { loadTasks, addTask } from './state.js';
import { renderUI } from './ui.js';

async function init() {
    await loadTasks();
    renderUI();

    const form = document.getElementById('add-task-form');
    const input = document.getElementById('task-title-input');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const title = input.value.trim();
            if (title) {
                await addTask(title);
                input.value = '';
                renderUI();
            }
        };
    }
}

// Boot application
init();