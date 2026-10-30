export let dots = [];

export async function loadDots() {
    try {
        const response = await fetch('/api/dots');
        if (!response.ok) throw new Error('Failed to fetch dots from API');
        dots = await response.json();
        return dots;
    } catch (err) {
        console.error("Error loading dots:", err);
        return [];
    }
}

export async function addDot(title) {
    try {
        const response = await fetch('/api/dots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        if (!response.ok) throw new Error('Failed to add dot');
        const newDot = await response.json();
        dots.push(newDot);
    } catch (err) {
        console.error("Error adding dot:", err);
    }
}

export async function toggleDotStatus(id) {
    try {
        const response = await fetch(`/api/dots/${id}/toggle`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to toggle dot');
        const updated = await response.json();
        const dot = dots.find(t => t.id == id);
        if (dot) dot.status = updated.status;
    } catch (err) {
        console.error("Error toggling dot status:", err);
    }
}