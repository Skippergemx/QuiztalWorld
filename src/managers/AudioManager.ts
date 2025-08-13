export default class AudioManager {
    private static instance: AudioManager;
    private music?: Phaser.Sound.BaseSound;
    private isMuted: boolean = false;
    private lastVolume: number = 0.5;

    private constructor() {}

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    setMusic(music: Phaser.Sound.BaseSound) {
        this.music = music;
        // Start with current volume setting
        if (this.isMuted) {
            this.playSound(0);
        } else {
            this.playSound(this.lastVolume);
        }
    }

    toggleMute() {
        if (this.music) {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.playSound(0);
            } else {
                this.playSound(this.lastVolume);
            }
        }
    }

    setVolume(volume: number) {
        const newVolume = Math.max(0, Math.min(1, volume));
        this.lastVolume = newVolume;
        if (!this.isMuted) {
            this.playSound(newVolume);
        }
    }

    private playSound(volume: number) {
        if (this.music) {
            const wasPlaying = this.music.isPlaying;
            this.music.stop();
            this.music.play({ volume });
            if (!wasPlaying) {
                this.music.stop();
            }
        }
    }

    stop() {
        if (this.music) {
            this.music.stop();
        }
    }

    isPlaying(): boolean {
        return this.music ? this.music.isPlaying : false;
    }
}