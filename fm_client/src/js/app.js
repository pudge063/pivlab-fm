document.addEventListener('DOMContentLoaded', async () => {
    const player = new Player();
    let tracks = [];

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            document.getElementById('nextBtn').click();
        });
    }

    const volumeSlider = document.getElementById('volumeSlider');
    const volumePercent = document.getElementById('volumePercent');
    const volumeIcon = document.getElementById('volumeIcon');

    player.setVolume(volumeSlider.value);

    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        player.setVolume(value);
        volumePercent.textContent = value + '%';
    });

    async function loadTracks() {
        try {
            tracks = await API.getTracks();
            UI.updateTrackCount(tracks.length);
        } catch (error) {
            console.error('Error loading tracks:', error);
        }
    }

    player.onTimeUpdate = (currentTime, duration) => {
        UI.updateProgress(currentTime, duration);
    };

    player.onPlayStateChange = (isPlaying) => {
        UI.updatePlayButton(isPlaying);
    };

    player.onTrackChange = (track) => {
        UI.updateTrackInfo(track);
        UI.updateDuration(track.duration);
        UI.setButtonsEnabled(true);
    };

    UI.elements.playBtn.addEventListener('click', () => {
        if (!player.currentTrack) {
            player.playNextTrack();
        } else if (player.isPlaying) {
            player.pause();
        } else {
            player.resume();
        }
    });

    UI.elements.nextBtn.addEventListener('click', () => {
        player.playNextTrack();
    });

    UI.elements.progressBar.addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        player.seek(percent);
    });

    UI.elements.scanBtn.addEventListener('click', async () => {
        UI.setScanButtonLoading(true);
        try {
            await API.scanLibrary();
            await loadTracks();
        } catch (error) {
            console.error('Error scanning library:', error);
        } finally {
            UI.setScanButtonLoading(false);
        }
    });

    loadTracks();

});
