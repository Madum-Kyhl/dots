export async function getExtensions() {
    const res = await fetch('/api/extensions');
    if (!res.ok) throw new Error('Failed to fetch extensions');
    return await res.json();
}