class Player {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.isPlaying = false;

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

    handleEnded() {
        this.isPlaying = false;
        if (this.onEnded) this.onEnded();
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

    async playTrack(track) {
        this.currentTrack = track;
        this.audio.src = API.getStreamUrl(track.id);
        await this.audio.play();

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
