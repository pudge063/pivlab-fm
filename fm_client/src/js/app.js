document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация
    const player = new Player();
    let tracks = [];

    const volumeSlider = document.getElementById('volumeSlider');
    const volumePercent = document.getElementById('volumePercent');
    const volumeIcon = document.getElementById('volumeIcon');

    // Установка начальной громкости через метод плеера
    player.setVolume(volumeSlider.value);

    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;

        // Используем метод плеера для изменения громкости
        player.setVolume(value);

        // Обновляем UI
        volumePercent.textContent = value + '%';

        // Меняем иконку
        if (value == 0) {
            volumeIcon.textContent = '🔇';
        } else if (value < 30) {
            volumeIcon.textContent = '🔈';
        } else if (value < 70) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    });

    // Загрузка треков
    async function loadTracks() {
        try {
            tracks = await API.getTracks();
            UI.renderTracks(tracks, player.currentTrack?.id);
            UI.updateTrackCount(tracks.length);
        } catch (error) {
            console.error('Error loading tracks:', error);
        }
    }

    // Воспроизведение следующего трека
    async function playNextTrack() {
        try {
            const track = await API.getNextTrack();
            if (!tracks.find(t => t.id === track.id)) {
                tracks.push(track);
            }
            await player.playTrack(track);
        } catch (error) {
            console.error('Error playing next track:', error);
        }
    }

    // Обработчики плеера
    player.onTimeUpdate = (currentTime, duration) => {
        UI.updateProgress(currentTime, duration);
    };

    player.onEnded = playNextTrack;

    player.onPlayStateChange = (isPlaying) => {
        UI.updatePlayButton(isPlaying);
    };

    player.onTrackChange = (track) => {
        UI.updateTrackInfo(track);
        UI.renderTracks(tracks, track.id);
        UI.setButtonsEnabled(true);
        UI.setRatingButtonsEnabled(true);
    };

    // Обработчики событий интерфейса
    UI.elements.playBtn.addEventListener('click', () => {
        if (!player.currentTrack) {
            playNextTrack();
        } else if (player.isPlaying) {
            player.pause();
        } else {
            player.resume();
        }
    });

    UI.elements.nextBtn.addEventListener('click', playNextTrack);

    UI.elements.prevBtn.addEventListener('click', () => {
        if (player.currentTrack) {
            player.seek(0);
            player.resume();
        }
    });

    UI.elements.tracksContainer.addEventListener('click', (e) => {
        const trackItem = e.target.closest('.track-item');
        if (trackItem) {
            const trackId = parseInt(trackItem.dataset.trackId);
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                player.playTrack(track);
            }
        }
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

    const toggleTracksBtn = document.getElementById('toggleTracksBtn');
    const searchContainer = document.getElementById('searchContainer');
    const tracksContainer = document.getElementById('tracksContainer');
    const searchInput = document.getElementById('searchInput');

    let isTracksVisible = false;
    let tracksLoaded = false;

    let isRatingLocked = false;

    toggleTracksBtn.addEventListener('click', async () => {
        isTracksVisible = !isTracksVisible;

        if (isTracksVisible) {
            if (!tracksLoaded) {
                try {
                    tracks = await API.getTracks();
                    UI.renderTracks(tracks, player.currentTrack?.id);
                    UI.updateTrackCount(tracks.length);
                    tracksLoaded = true;
                } catch (error) {
                    console.error('Error loading tracks:', error);
                    tracksContainer.innerHTML = '<div class="error">Ошибка загрузки</div>';
                }
            }

            tracksContainer.style.display = 'block';
            searchContainer.style.display = 'block';
            toggleTracksBtn.classList.add('active');
            toggleTracksBtn.textContent = 'Скрыть список';
        } else {
            tracksContainer.style.display = 'none';
            searchContainer.style.display = 'none';
            toggleTracksBtn.classList.remove('active');
            toggleTracksBtn.textContent = 'Список треков';
        }
    });

    // Поиск по трекам
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        if (searchTerm === '') {
            UI.renderTracks(tracks, player.currentTrack?.id);
        } else {
            const filteredTracks = tracks.filter(track =>
                (track.title && track.title.toLowerCase().includes(searchTerm)) ||
                (track.artist && track.artist.toLowerCase().includes(searchTerm))
            );
            UI.renderTracks(filteredTracks, player.currentTrack?.id);
        }
    });

    // update rating (like)
    UI.elements.likeBtn.addEventListener('click', async () => {
        if (!player.currentTrack) return;

        isRatingLocked = true;
        UI.setRatingButtonsEnabled(false);

        try {
            const result = await API.likeTrack(player.currentTrack.id);
            UI.updateRating(result.rating);

            // Обновляем рейтинг в массиве tracks
            const trackIndex = tracks.findIndex(t => t.id === result.id);
            if (trackIndex !== -1) {
                tracks[trackIndex].rating = result.rating;
            }
        } catch (error) {
            console.error('Error liking track:', error);
        }
    });

    // update rating (dislike)
    UI.elements.dislikeBtn.addEventListener('click', async () => {
        if (!player.currentTrack) return;

        isRatingLocked = true;
        UI.setRatingButtonsEnabled(false);

        try {
            const result = await API.dislikeTrack(player.currentTrack.id);
            UI.updateRating(result.rating);

            // Обновляем рейтинг в массиве tracks
            const trackIndex = tracks.findIndex(t => t.id === result.id);
            if (trackIndex !== -1) {
                tracks[trackIndex].rating = result.rating;
            }
        } catch (error) {
            console.error('Error disliking track:', error);
        }
        playNextTrack();
    });

    // Начальная загрузка
    // await loadTracks();
});
