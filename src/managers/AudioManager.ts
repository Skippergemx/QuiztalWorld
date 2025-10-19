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

    stopAllAudio(): void {
        console.log('⏹️ AudioManager: Stopping all audio...');
        
        // Stop music
        if (this.music && this.music.isPlaying) {
            try {
                this.music.stop();
                console.log('⏹️ AudioManager: Music stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping music', e);
            }
        }
        
        // Stop sound effects
        if (this.correctSound && this.correctSound.isPlaying) {
            try {
                this.correctSound.stop();
                console.log('⏹️ AudioManager: Correct sound stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping correct sound', e);
            }
        }
        
        if (this.wrongSound && this.wrongSound.isPlaying) {
            try {
                this.wrongSound.stop();
                console.log('⏹️ AudioManager: Wrong sound stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping wrong sound', e);
            }
        }
    }

    destroy(): void {
        console.log('🧹 AudioManager: Cleaning up audio resources...');
        
        // Stop and destroy music
        if (this.music) {
            try {
                if (this.music.isPlaying) {
                    this.music.stop();
                }
                this.music.destroy();
                this.music = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying music', e);
            }
        }
        
        // Destroy sound effects
        if (this.correctSound) {
            try {
                if (this.correctSound.isPlaying) {
                    this.correctSound.stop();
                }
                this.correctSound.destroy();
                this.correctSound = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying correct sound', e);
            }
        }
        
        if (this.wrongSound) {
            try {
                if (this.wrongSound.isPlaying) {
                    this.wrongSound.stop();
                }
                this.wrongSound.destroy();
                this.wrongSound = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying wrong sound', e);
            }
        }
        
        console.log('✅ AudioManager: Audio resources cleaned up');
    }
}