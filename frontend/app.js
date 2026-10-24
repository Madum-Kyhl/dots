let tasks = []; // Create global state array to hold tasks in memory.

/**
 * Asynchronously fetches the tasks.csv file from the server,
 * parses the text response, and triggers the render pipeline.
 * Falls back to a CORS warning if accessed via file:// protocol.
 */
async function loadTasks() {
    try {
        const response = await fetch('/tasks.csv');
        if (!response.ok) throw new Error();
        const text = await response.text();
        tasks = parseCSV(text);                 // Store in global array
        render();                               // Render from global array
    } catch (err) {
        document.getElementById('task-list').innerHTML = `
            <li>CORS restriction: Serve via local server to load tasks.csv. See README for instructions.</li>
        `;
    }
}

/**
 * Parses raw CSV text data into an array of task objects.
 * Skips the header row and extracts status and title pairs.
 */
function parseCSV(text) {
    const rows = text.trim().split('\n');
    return rows.slice(1).map(row => {
        const parts = row.split(',');
        return {
            status: parts[0]?.trim(),
            title: parts.slice(1).join(',').trim()
        };
    });
}

// Serializes tasks array back to CSV and POSTs to server disk
async function saveTasks() {
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
        if (!response.ok) throw new Error('Failed to save');
    } catch (err) {
        console.error("Error saving tasks to disk:", err);
    }
}

// Toggles a task's status from TODO to DONE, re-renders, and saves to disk
async function toggleTask(index) {
    if (tasks[index].status === 'TODO') {
        tasks[index].status = 'DONE';
        render();
        await saveTasks();
    }
}

/**
 * Clears the current list and dynamically generates HTML list items
 * for each task, applying strikethrough formatting if the status is DONE.
 */
function render() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        const isDone = task.status === 'DONE';

        li.innerHTML = `
            ${isDone ? `<del>${task.title}</del>` : task.title} 
            <strong>[${task.status}]</strong>
        `;

        // Bind click event to toggle state for this specific index
        li.onclick = () => toggleTask(index);
        list.appendChild(li);
    });
}

// Trigger initial task loading sequence on script load
loadTasks();