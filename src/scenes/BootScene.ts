export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    preload() {
        console.log("🔄 Loading Assets...");

        // Add progress tracking
        let loadingProgress = 0;
        const totalAssets = 30; // Approximate number of assets being loaded
        
        // Function to update progress
        const updateProgress = () => {
            loadingProgress++;
            const percent = Math.min(100, Math.round((loadingProgress / totalAssets) * 100));
            
            // Update progress bar if it exists
            if (typeof window !== 'undefined' && (window as any).updateProgress) {
                (window as any).updateProgress(percent);
            }
        };

        // Add audio loading
        this.load.audio('bgm', [
            'assets/audio/background_music.mp3',
            'assets/audio/background_music.ogg'
        ]);
        this.load.audio('Correct_Answer', 'assets/audio/Correct_Answer.wav');
        this.load.audio('Wrong_Answer', 'assets/audio/Wrong_Answer.wav');
        this.load.audio('moblin-giftbox', 'assets/audio/Moblin_giftbox.wav'); // Add Moblin gift box sound
        this.load.on('filecomplete-audio-bgm', updateProgress);
        this.load.on('filecomplete-audio-Correct_Answer', updateProgress);
        this.load.on('filecomplete-audio-Wrong_Answer', updateProgress);
        this.load.on('filecomplete-audio-moblin-giftbox', updateProgress);

        // ✅ Load Tileset & Map
        this.load.image("tiles", "assets/tilesets/tileset.png");
        this.load.tilemapTiledJSON("map", "assets/maps/map.json");
        this.load.on('filecomplete-image-tiles', updateProgress);
        this.load.on('filecomplete-tilemapJSON-map', updateProgress);

        // ✅ Load NPC Huntboy as a spritesheet (REMOVED duplicate image load)
        this.load.spritesheet("npc_huntboy", "assets/npc/npc_huntboy_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-npc_huntboy', updateProgress);

        // ✅ Load Mr. Rug Pull spritesheets (idle and walk)
        this.load.spritesheet("npc_mrrugpull", "assets/npc/npc_mrrugpull_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_mrrugpull_walk", "assets/npc/npc_mrrugpull_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-npc_mrrugpull', updateProgress);
        this.load.on('filecomplete-spritesheet-npc_mrrugpull_walk', updateProgress);

        // ✅ Load Artizen Gent spritesheets (idle and walk)
        this.load.spritesheet("npc_artizengent", "assets/npc/npc_artizengent_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_artizengent_walk", "assets/npc/npc_artizengent_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-npc_artizengent', updateProgress);
        this.load.on('filecomplete-spritesheet-npc_artizengent_walk', updateProgress);

        // ✅ Load 3RDWeb Guy spritesheets (idle and walk)
        this.load.spritesheet("npc_thirdwebguy", "assets/npc/npc_thirdwebguy_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_thirdwebguy_walk", "assets/npc/npc_thirdwebguy_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-npc_thirdwebguy', updateProgress);
        this.load.on('filecomplete-spritesheet-npc_thirdwebguy_walk', updateProgress);

        // ✅ Load Alchemy Man spritesheets (idle and walk)
        this.load.spritesheet("npc_alchemyman", "assets/npc/npc_alchemyman_idle_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("npc_alchemyman_walk", "assets/npc/npc_alchemyman_walk_1.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-npc_alchemyman', updateProgress);
        this.load.on('filecomplete-spritesheet-npc_alchemyman_walk', updateProgress);

        // ✅ Load Moblin pet spritesheets (idle and walk)
        this.load.spritesheet("moblin_idle", "assets/pets/moblin_idle.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.spritesheet("moblin_walk", "assets/pets/moblin_walk.png", {
            frameWidth: 32,
            frameHeight: 53,
        });
        this.load.on('filecomplete-spritesheet-moblin_idle', updateProgress);
        this.load.on('filecomplete-spritesheet-moblin_walk', updateProgress);

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
        this.load.on('filecomplete-spritesheet-player_lsxd_walk_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_lsxd_idle_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_penski_walk_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_penski_idle_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_sarah_walk_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_sarah_idle_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_xander_walk_1', updateProgress);
        this.load.on('filecomplete-spritesheet-player_xander_idle_1', updateProgress);

        // Load effects (update the path if needed)
        this.load.image('player-glow', 'assets/effects/glow.png');
        this.load.on('filecomplete-image-player-glow', updateProgress);

        // ✅ Load Mobile Control Assets
        this.load.image('joystick-base', 'assets/ui/joystick-base.png');
        this.load.image('joystick', 'assets/ui/joystick.png');
        this.load.image('button-interact', 'assets/ui/button-interact.png');
        this.load.image('arrow-left', 'assets/ui/arrow-left.png');
        this.load.image('arrow-right', 'assets/ui/arrow-right.png');
        this.load.image('button-confirm', 'assets/ui/button-confirm.png');
        this.load.on('filecomplete-image-joystick-base', updateProgress);
        this.load.on('filecomplete-image-joystick', updateProgress);
        this.load.on('filecomplete-image-button-interact', updateProgress);
        this.load.on('filecomplete-image-arrow-left', updateProgress);
        this.load.on('filecomplete-image-arrow-right', updateProgress);
        this.load.on('filecomplete-image-button-confirm', updateProgress);

        // Load splash image for display after loading
        this.load.image("splash", "assets/ui/splash.png");
        this.load.on('filecomplete-image-splash', updateProgress);
    }

    create() {
        console.log("✅ All assets loaded!");

        // Update progress to 100%
        if (typeof window !== 'undefined' && (window as any).updateProgress) {
            (window as any).updateProgress(100);
        }

        // Show splash screen after loading is complete
        this.showSplashScreen();
    }

    private showSplashScreen() {
        console.log("🎨 Displaying Splash Screen...");
        
        // Get the game dimensions
        const { width, height } = this.scale;
        
        // Create a black background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
        
        // Check if splash image was loaded successfully
        if (this.textures.exists("splash")) {
            // Add the splash image
            const splash = this.add.image(width / 2, height / 2, "splash");
            
            // Scale the splash image to fill the screen while maintaining aspect ratio
            const scaleX = width / splash.width;
            const scaleY = height / splash.height;
            const scale = Math.max(scaleX, scaleY); // Use max to fill the screen
            splash.setScale(scale);
            
            // Fade in the splash screen
            splash.setAlpha(0);
            this.tweens.add({
                targets: splash,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
            
            // After 3 seconds, fade out and transition to the next scene
            this.time.delayedCall(3000, () => {
                this.tweens.add({
                    targets: splash,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        console.log("➡️ Transitioning to Character Selection Scene...");
                        // Hide loading screen
                        if (typeof window !== 'undefined' && (window as any).hideLoadingScreen) {
                            (window as any).hideLoadingScreen();
                        }
                        // Start the next scene
                        this.scene.start("CharacterSelectionScene");
                    }
                });
            });
        } else {
            console.warn("⚠️ Splash image not found, proceeding to next scene");
            // Hide loading screen
            if (typeof window !== 'undefined' && (window as any).hideLoadingScreen) {
                (window as any).hideLoadingScreen();
            }
            // Start the next scene directly
            this.scene.start("CharacterSelectionScene");
        }
    }
}