import AudioManager from '../managers/AudioManager';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    preload() {
        console.log("🔄 Loading Assets...");

        // Add audio loading
        this.load.audio('bgm', [
            'assets/audio/background_music.mp3',
            'assets/audio/background_music.ogg'
        ]);
        this.load.audio('Correct_Answer', 'assets/audio/Correct_Answer.wav');
        this.load.audio('Wrong_Answer', 'assets/audio/Wrong_Answer.wav');

        // ✅ Load Tileset & Map
        this.load.image("tiles", "assets/tilesets/tileset.png");
        this.load.tilemapTiledJSON("map", "assets/maps/map.json");

        // ✅ Load NPC Huntboy as a spritesheet (REMOVED duplicate image load)
        this.load.spritesheet("npc_huntboy", "assets/npc/npc_huntboy_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load Player Spritesheets (Idle & Walk)
        const characters = ["lsxd", "penski", "sarah", "xander"];
        characters.forEach((char) => {
            this.load.spritesheet(
                `player_${char}_walk_1`, 
                `assets/characters/player_${char}_walk_1.png`, 
                { frameWidth: 32, frameHeight: 53 }
            );
            this.load.spritesheet(
                `player_${char}_idle_1`, 
                `assets/characters/player_${char}_idle_1.png`, 
                { frameWidth: 32, frameHeight: 53 }
            );
        });

        // Load effects (update the path if needed)
        this.load.image('player-glow', 'assets/effects/glow.png');

        this.load.once("complete", () => {
            console.log("✅ All assets loaded!");
            this.startBackgroundMusic();
            this.scene.start("LoginCharacterScene");
        });

        this.load.start();
    }

    private startBackgroundMusic() {
        const music = this.sound.add('bgm', {
            volume: 0.5,
            loop: true
        });
        
        // Check if audio is supported
        if (music) {
            AudioManager.getInstance().setMusic(music);
            music.play();
        } else {
            console.warn('Audio not supported in this environment');
        }
    }

    async create() {
        // Initialize the audio manager after loading
        AudioManager.getInstance().initSounds(this);

        // Just log the token address if needed for debugging
        console.log('Token Address:', import.meta.env.VITE_QUIZTAL_TOKEN_ADDRESS);
    }
}