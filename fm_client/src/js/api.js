const API = {
    async getTracks() {
        const response = await fetch('/api/tracks');
        if (!response.ok) throw new Error('Failed to fetch tracks');
        return await response.json();
    },

    async getNextTrack() {
        const response = await fetch('/api/next');
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

    async likeTrack(trackId) {
        const response = await fetch(`/api/tracks/${trackId}/like`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to like track');
        return await response.json();
    },

    async dislikeTrack(trackId) {
        const response = await fetch(`/api/tracks/${trackId}/dislike`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to dislike track');
        return await response.json();
    },
};
