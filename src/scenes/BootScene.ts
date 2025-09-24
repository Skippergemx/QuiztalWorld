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
        this.load.audio('moblin-giftbox', 'assets/audio/Moblin_giftbox.wav'); // Add Moblin gift box sound

        // ✅ Load Tileset & Map
        this.load.image("tiles", "assets/tilesets/tileset.png");
        this.load.tilemapTiledJSON("map", "assets/maps/map.json");

        // ✅ Load NPC Huntboy as a spritesheet (REMOVED duplicate image load)
        this.load.spritesheet("npc_huntboy", "assets/npc/npc_huntboy_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load Mr. Rug Pull spritesheets (idle and walk)
        this.load.spritesheet("npc_mrrugpull", "assets/npc/npc_mrrugpull_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_mrrugpull_walk", "assets/npc/npc_mrrugpull_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load Artizen Gent spritesheets (idle and walk)
        this.load.spritesheet("npc_artizengent", "assets/npc/npc_artizengent_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_artizengent_walk", "assets/npc/npc_artizengent_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load 3RDWeb Guy spritesheets (idle and walk)
        this.load.spritesheet("npc_thirdwebguy", "assets/npc/npc_thirdwebguy_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_thirdwebguy_walk", "assets/npc/npc_thirdwebguy_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load Alchemy Man spritesheets (idle and walk)
        this.load.spritesheet("npc_alchemyman", "assets/npc/npc_alchemyman_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_alchemyman_walk", "assets/npc/npc_alchemyman_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });

        // ✅ Load Moblin pet spritesheets (idle and walk)
        this.load.spritesheet("moblin_idle", "assets/pets/moblin_idle.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("moblin_walk", "assets/pets/moblin_walk.png", {
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

        // ✅ Load Mobile Control Assets
        this.load.image('joystick-base', 'assets/ui/joystick-base.png');
        this.load.image('joystick', 'assets/ui/joystick.png');
        this.load.image('button-interact', 'assets/ui/button-interact.png');
        this.load.image('arrow-left', 'assets/ui/arrow-left.png');
        this.load.image('arrow-right', 'assets/ui/arrow-right.png');
        this.load.image('button-confirm', 'assets/ui/button-confirm.png');

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

    create() {
        console.log("✅ All assets loaded!");

        // Initialize the audio manager after loading
        AudioManager.getInstance().initSounds(this);

        // Start background music
        this.startBackgroundMusic();

        // Just log the token address if needed for debugging
        console.log('Token Address:', import.meta.env.VITE_QUIZTAL_TOKEN_ADDRESS);

        // Start the next scene
        this.scene.start("CharacterSelectionScene");
    }
}