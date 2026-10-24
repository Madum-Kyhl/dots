export let tasks = [];

export async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks from API');
        tasks = await response.json();
        return tasks;
    } catch (err) {
        console.error("Error loading tasks:", err);
        return [];
    }
}

export async function addTask(title) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        if (!response.ok) throw new Error('Failed to add task');
        const newTask = await response.json();
        tasks.push(newTask);
    } catch (err) {
        console.error("Error adding task:", err);
    }
}

export async function toggleTaskStatus(id) {
    try {
        const response = await fetch(`/api/tasks/${id}/toggle`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to toggle task');
        const updated = await response.json();
        const task = tasks.find(t => t.id == id);
        if (task) task.status = updated.status;
    } catch (err) {
        console.error("Error toggling task status:", err);
    }
}