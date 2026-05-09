const API = {
    async getTracks() {
        const url = '/api/tracks';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch tracks');
        return await response.json();
    },

    async getNextTrack() {
        const url = '/api/next';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch next track');
        return await response.json();
    },

    async scanLibrary() {
        const response = await fetch('/api/scan', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to scan library');
        return await response.json();
    },

    getStreamUrl(trackId) {
        return `/api/stream/${trackId}`;
    },

};
