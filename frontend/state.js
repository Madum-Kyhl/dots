export let tasks = [];

export async function loadTasks() {
    try {
        const response = await fetch('/tasks.csv');
        if (!response.ok) throw new Error('Failed to fetch CSV');
        const text = await response.text();
        tasks = parseCSV(text);
        return tasks;
    } catch (err) {
        console.error("Error loading tasks:", err);
        return [];
    }
}

export function parseCSV(text) {
    const rows = text.trim().split('\n');
    return rows.slice(1).map(row => {
        const parts = row.split(',');
        return {
            status: parts[0]?.trim() || 'TODO',
            title: parts.slice(1).join(',').trim()
        };
    }).filter(task => task.title.length > 0);
}

export async function saveTasks() {
    let csvRows = ["status,title"];
    tasks.forEach(task => {
        csvRows.push(`${task.status},${task.title}`);
    });

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csv: csvRows.join('\n') })
        });
        if (!response.ok) throw new Error('Failed to save tasks');
    } catch (err) {
        console.error("Error saving tasks:", err);
    }
}

export async function addTask(title) {
    tasks.push({ status: 'TODO', title });
    await saveTasks();
}

export async function toggleTaskStatus(index) {
    if (tasks[index]) {
        tasks[index].status = tasks[index].status === 'TODO' ? 'DONE' : 'TODO';
        await saveTasks();
    }
}