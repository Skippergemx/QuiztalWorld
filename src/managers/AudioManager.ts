export default class AudioManager {
    private static instance: AudioManager;
    private music?: Phaser.Sound.BaseSound;
    private correctSound?: Phaser.Sound.BaseSound;
    private wrongSound?: Phaser.Sound.BaseSound;
    private isMuted: boolean = false;
    private lastVolume: number = 0.5;

    private constructor() {}

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    initSounds(scene: Phaser.Scene) {
        this.correctSound = scene.sound.add('Correct_Answer');
        this.wrongSound = scene.sound.add('Wrong_Answer');
    }

    playCorrectSound() {
        if (!this.isMuted && this.correctSound) {
            this.correctSound.play({ volume: this.lastVolume });
        }
    }

    playWrongSound() {
        if (!this.isMuted && this.wrongSound) {
            this.wrongSound.play({ volume: this.lastVolume });
        }
    }

    setMusic(music: Phaser.Sound.BaseSound) {
        this.music = music;
        console.log('🎵 AudioManager: Setting music', music);
        // Start with current volume setting
        if (this.isMuted) {
            this.playSound(0);
        } else {
            this.playSound(this.lastVolume);
        }
    }

    private playSound(volume: number) {
        if (this.music) {
            console.log('🎵 AudioManager: Playing sound with volume', volume);
            try {
                this.music.play({ volume });
                console.log('🎵 AudioManager: Started playing music');
            } catch (error) {
                console.warn('⚠️ AudioManager: Failed to play music', error);
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