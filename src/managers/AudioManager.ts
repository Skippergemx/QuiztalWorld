export default class AudioManager {
    private static instance: AudioManager;
    private music?: Phaser.Sound.BaseSound;
    private correctSound?: Phaser.Sound.BaseSound;
    private wrongSound?: Phaser.Sound.BaseSound;
    private playerDamageSound?: Phaser.Sound.BaseSound;
    private monsterDamageSound?: Phaser.Sound.BaseSound;
    private combatMusic?: Phaser.Sound.BaseSound;
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
        // Initialize combat sounds
        this.playerDamageSound = scene.sound.add('player-damage');
        this.monsterDamageSound = scene.sound.add('monster-damage');
        this.combatMusic = scene.sound.add('combat-music');
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

    // Combat sound methods
    playPlayerDamageSound() {
        if (!this.isMuted && this.playerDamageSound) {
            this.playerDamageSound.play({ volume: this.lastVolume * 0.7 });
        }
    }

    playMonsterDamageSound() {
        if (!this.isMuted && this.monsterDamageSound) {
            this.monsterDamageSound.play({ volume: this.lastVolume * 0.7 });
        }
    }

    playPlayerAttackSound() {
        // Using monster damage sound as placeholder for player attack sound
        if (!this.isMuted && this.monsterDamageSound) {
            this.monsterDamageSound.play({ volume: this.lastVolume * 0.8 });
        }
    }

    playMonsterDeathSound() {
        // Using player damage sound as placeholder for monster death sound
        if (!this.isMuted && this.playerDamageSound) {
            this.playerDamageSound.play({ volume: this.lastVolume * 0.6 });
        }
    }

    playCombatMusic() {
        if (!this.isMuted && this.combatMusic) {
            // Stop regular music if playing
            if (this.music && this.music.isPlaying) {
                this.music.stop();
            }
            // Play combat music
            this.combatMusic.play({ volume: this.lastVolume * 0.8, loop: true });
        }
    }

    stopCombatMusic() {
        if (this.combatMusic && this.combatMusic.isPlaying) {
            this.combatMusic.stop();
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
        
        // Stop combat music
        if (this.combatMusic && this.combatMusic.isPlaying) {
            try {
                this.combatMusic.stop();
                console.log('⏹️ AudioManager: Combat music stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping combat music', e);
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
        
        // Stop combat sound effects
        if (this.playerDamageSound && this.playerDamageSound.isPlaying) {
            try {
                this.playerDamageSound.stop();
                console.log('⏹️ AudioManager: Player damage sound stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping player damage sound', e);
            }
        }
        
        if (this.monsterDamageSound && this.monsterDamageSound.isPlaying) {
            try {
                this.monsterDamageSound.stop();
                console.log('⏹️ AudioManager: Monster damage sound stopped');
            } catch (e) {
                console.warn('⚠️ AudioManager: Error stopping monster damage sound', e);
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
        
        // Stop and destroy combat music
        if (this.combatMusic) {
            try {
                if (this.combatMusic.isPlaying) {
                    this.combatMusic.stop();
                }
                this.combatMusic.destroy();
                this.combatMusic = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying combat music', e);
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
        
        // Destroy combat sound effects
        if (this.playerDamageSound) {
            try {
                if (this.playerDamageSound.isPlaying) {
                    this.playerDamageSound.stop();
                }
                this.playerDamageSound.destroy();
                this.playerDamageSound = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying player damage sound', e);
            }
        }
        
        if (this.monsterDamageSound) {
            try {
                if (this.monsterDamageSound.isPlaying) {
                    this.monsterDamageSound.stop();
                }
                this.monsterDamageSound.destroy();
                this.monsterDamageSound = undefined;
            } catch (e) {
                console.warn('⚠️ AudioManager: Error destroying monster damage sound', e);
            }
        }
        
        console.log('✅ AudioManager: Audio resources cleaned up');
    }
    
    // Method to set mute state
    setMuted(muted: boolean) {
        this.isMuted = muted;
        if (muted) {
            this.stopAllAudio();
        }
    }
    
    // Method to set volume
    setVolume(volume: number) {
        this.lastVolume = volume;
        // When volume changes, we'll update it on next play
        // Since BaseSound doesn't have setVolume, we'll handle it through play parameters
    }
}