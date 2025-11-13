import Phaser from 'phaser';

export default class SplashScene extends Phaser.Scene {
    constructor() {
        super({ key: "SplashScene" });
    }

    preload() {
        console.log("🔄 Loading Splash Screen...");
        
        // Load the splash art
        this.load.image("splash", "assets/ui/splash.png");
        
        // Add a timeout to ensure we move to the next scene even if loading fails
        this.load.on('loaderror', () => {
            console.warn("⚠️ Splash image failed to load, proceeding to next scene");
            this.time.delayedCall(1000, () => {
                this.scene.start("BootScene");
            });
        });
    }

    create() {
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
                        console.log("➡️ Transitioning to Boot Scene...");
                        this.scene.start("BootScene");
                    }
                });
            });
        } else {
            console.warn("⚠️ Splash image not found, skipping splash screen");
            // Add a simple text splash screen as fallback
            const splashText = this.add.text(width / 2, height / 2, "Niftdood World", {
                fontSize: "32px",
                color: "#f1c40f",
                align: "center"
            }).setOrigin(0.5);
            
            // Fade in the text
            splashText.setAlpha(0);
            this.tweens.add({
                targets: splashText,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
            
            // After 2 seconds, fade out and transition to the next scene
            this.time.delayedCall(2000, () => {
                this.tweens.add({
                    targets: splashText,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        console.log("➡️ Transitioning to Boot Scene...");
                        this.scene.start("BootScene");
                    }
                });
            });
        }
    }
}