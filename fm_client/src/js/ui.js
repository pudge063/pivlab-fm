const UI = {
    elements: {
        trackInfo: document.getElementById('trackInfo'),
        tracksContainer: document.getElementById('tracksContainer'),
        progressFill: document.getElementById('progressFill'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),
        trackCount: document.getElementById('trackCount'),
        playBtn: document.getElementById('playBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        scanBtn: document.getElementById('scanBtn'),
        progressBar: document.getElementById('progressBar'),

        // rating
        ratingValue: document.getElementById('ratingValue'),
        likeBtn: document.getElementById('likeBtn'),
        dislikeBtn: document.getElementById('dislikeBtn'),
    },

    formatTime(seconds) {
        if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
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
            this.elements.trackInfo.innerHTML = '<div class="no-track">Выберите трек</div>';
        }
    },

    renderTracks(tracks, currentTrackId) {
        this.elements.tracksContainer.innerHTML = tracks.map(track => `
            <div class="track-item ${currentTrackId === track.id ? 'playing' : ''}"
                 data-track-id="${track.id}">
                <span class="track-item-title">${track.artist || 'Unknown'} - ${track.title || 'Unknown'}</span>
                <span class="track-item-duration">${this.formatTime(track.duration)}</span>
            </div>
        `).join('');
    },

    updateProgress(currentTime, duration) {
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            this.elements.progressFill.style.width = Math.min(percent, 100) + '%';
            this.elements.currentTime.textContent = this.formatTime(currentTime);

            if (this.elements.duration.textContent === '0:00') {
                this.elements.duration.textContent = this.formatTime(duration);
            }
        }
    },

    updatePlayButton(isPlaying) {
        this.elements.playBtn.textContent = isPlaying ? '⏸' : '▶';
    },

    setButtonsEnabled(enabled) {
        this.elements.prevBtn.disabled = !enabled;
        this.elements.nextBtn.disabled = !enabled;
    },

    setScanButtonLoading(isLoading) {
        this.elements.scanBtn.disabled = isLoading;
    },

    updateTrackCount(count) {
        this.elements.trackCount.textContent = count;
    },

    updateRating(rating) {
        this.elements.ratingValue.textContent = rating;
    },

    setRatingButtonsEnabled(enabled) {
        this.elements.likeBtn.disabled = !enabled;
        this.elements.dislikeBtn.disabled = !enabled;
    },
};
