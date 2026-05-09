const UI = {
    elements: {
        trackInfo: document.getElementById('trackInfo'),
        progressFill: document.getElementById('progressFill'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),
        trackCount: document.getElementById('trackCount'),
        playBtn: document.getElementById('playBtn'),
        nextBtn: document.getElementById('nextBtn'),
        scanBtn: document.getElementById('scanBtn'),
        progressBar: document.getElementById('progressBar'),
    },

    formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    updateTrackInfo(track) {
        if (track) {
            this.elements.trackInfo.innerHTML = `
                <div class="track-title">${track.title || 'Unknown'}</div>
                <div class="track-artist">${track.artist || 'Unknown'}</div>
            `;
        } else {
            this.elements.trackInfo.innerHTML = '<div class="no-track">No track</div>';
        }
    },

    updateProgress(currentTime, duration) {
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            this.elements.progressFill.style.width = Math.min(percent, 100) + '%';
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        }
    },

    updateDuration(duration) {
        this.elements.duration.textContent = this.formatTime(duration);
    },

    updatePlayButton(isPlaying) {
        this.elements.playBtn.textContent = isPlaying ? '⏸' : '▶';
    },

    setButtonsEnabled(enabled) {
        this.elements.nextBtn.disabled = !enabled;
    },

    setScanButtonLoading(isLoading) {
        this.elements.scanBtn.disabled = isLoading;
    },

    updateTrackCount(count) {
        this.elements.trackCount.textContent = count;
    },

};
