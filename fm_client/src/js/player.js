class Player {
    constructor() {
        this.audio = new Audio();

        this.currentTrack = null;
        this.isPlaying = false;

        this.nextTrack = null;
        this.nextSrc = null;

        this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
        this.handleEnded = this.handleEnded.bind(this);
        this.handlePlay = this.handlePlay.bind(this);
        this.handlePause = this.handlePause.bind(this);

        this.setupListeners();
    }

    setVolume(value) {
        this.audio.volume = value / 100;
    }

    setupListeners() {
        this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
        this.audio.addEventListener('ended', this.handleEnded);
        this.audio.addEventListener('play', this.handlePlay);
        this.audio.addEventListener('pause', this.handlePause);
    }

    handleTimeUpdate() {
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.audio.currentTime, this.getDuration());
        }
    }

    handlePlay() {
        this.isPlaying = true;
        if (this.onPlayStateChange) this.onPlayStateChange(true);
    }

    handlePause() {
        this.isPlaying = false;
        if (this.onPlayStateChange) this.onPlayStateChange(false);
    }

    getDuration() {
        if (this.audio.duration && isFinite(this.audio.duration) && this.audio.duration > 0) {
            return this.audio.duration;
        }
        return this.currentTrack?.duration || 0;
    }

    async preloadNext() {
        try {
            const track = await API.getNextTrack();
            this.nextTrack = track;
            this.nextSrc = API.getStreamUrl(track.id);
            const nextAudio = new Audio();
            nextAudio.src = this.nextSrc;
            await nextAudio.load();
        } catch (e) {
            console.error('Error on preload next track:', e);
        }
    }

    async playTrack(track) {
        this.currentTrack = track;
        this.audio.src = API.getStreamUrl(track.id);

        try {
            this.audio.play();
            this.preloadNext();
        } catch (error) {
            console.error('Error on play track:', error);
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title || 'Unknown',
                artist: track.artist || 'Unknown',
            });
        }

        if (this.onTrackChange) {
            this.onTrackChange(track);
        }
    }

    async playNextTrack() {
        if (this.nextSrc) {
            this.audio.src = this.nextSrc;
            this.currentTrack = this.nextTrack;

            try {
                this.audio.play();
                this.preloadNext();
                UI.updateTrackInfo(this.currentTrack);
            } catch (error) {
                console.error('First error on start play track', error);
                setTimeout(() => {
                    this.audio.play().catch(err => console.error('Second error on start play track:', err));
                }, 500);
            }
        } else {
            try {
                this.track = await API.getNextTrack();
                await this.playTrack(this.track);
            } catch (error) {
                console.error('Error playing next track:', error);
            }
        }
    }

    async handleEnded() {
        if (this.nextSrc) {
            this.audio.src = this.nextSrc;
            this.currentTrack = this.nextTrack;

            try {
                this.audio.play();
                this.preloadNext();
                UI.updateTrackInfo(this.currentTrack);
                UI.setRatingButtonsEnabled(true);
            } catch (error) {
                console.error('First error on handleEnded next play track', error);
                setTimeout(() => {
                    this.audio.play().catch(err => console.error('Second error on handleEnded next play track:', err));
                }, 500);
            }
        }
    }

    pause() {
        this.audio.pause();
    }

    resume() {
        this.audio.play();
    }

    seek(percent) {
        const duration = this.getDuration();
        if (duration > 0) {
            this.audio.currentTime = percent * duration;
        }
    }

    destroy() {
        this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
        this.audio.removeEventListener('ended', this.handleEnded);
        this.audio.removeEventListener('play', this.handlePlay);
        this.audio.removeEventListener('pause', this.handlePause);
    }
}
