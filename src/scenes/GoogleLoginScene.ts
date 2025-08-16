import Phaser from "phaser";
import { auth, db } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default class GoogleLoginScene extends Phaser.Scene {
    private gradientOverlay!: Phaser.GameObjects.Graphics;
    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private logo!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: "GoogleLoginScene" });
    }

    preload() {
        // Remove Google icon loading
    }

    create() {
        // Create animated background
        this.createAnimatedBackground();
        
        // Create logo container
        this.createLogo();

        // Check login status
        this.checkLogin();
    }

    private createAnimatedBackground() {
        // Create gradient background
        this.gradientOverlay = this.add.graphics();
        this.drawGradient(0x001a33, 0x330066);
    }

    private createLogo() {
        this.logo = this.add.container(this.scale.width / 2, 40);

        // Adjust title size based on screen width
        const fontSize = this.scale.width < 768 ? "32px" : "48px";
        const titleText = this.add.text(0, 0, "Crystle World", {
            fontSize: fontSize,
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        // Adjust glow effect size for mobile
        const glowSize = this.scale.width < 768 ? 12 : 16;
        const glow = this.add.graphics();
        glow.lineStyle(glowSize, 0x3498db, 0.1);
        glow.strokeRoundedRect(
            -titleText.width / 2 - 15,
            -titleText.height / 2 - 8,
            titleText.width + 30,
            titleText.height + 16,
            8
        );

        this.logo.add([glow, titleText]);

        // Adjust animation for mobile
        this.tweens.add({
            targets: this.logo,
            y: this.scale.width < 768 ? 40 : 50,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private async checkLogin() {
        const playerData = localStorage.getItem("quiztal-player");
        if (playerData) {
            try {
                // Check if player has a bound wallet
                const playerDoc = await getDoc(doc(db, "players", JSON.parse(playerData).uid));
                const walletAddress = playerDoc.data()?.walletAddress;

                if (walletAddress) {
                    // Clear existing NFT data to ensure fresh verification
                    localStorage.removeItem('quiztal-nfts');
                    console.log('Cleared NFTs from localStorage for fresh verification');
                }

                // Move to wallet verification
                this.scene.start('WalletVerificationScene');
            } catch (error) {
                console.error('Error checking player wallet:', error);
                this.scene.start('WalletVerificationScene');
            }
        } else {
            this.showLoginButton();
        }
    }

    private showLoginButton() {
        const buttonContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);

        // Adjust button size for mobile
        const buttonWidth = this.scale.width < 768 ? 300 : 375;
        const buttonHeight = this.scale.width < 768 ? 50 : 60;
        
        const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0xffffff)
            .setInteractive({ useHandCursor: true });

        // Add button text - now centered without icon
        const fontSize = this.scale.width < 768 ? "20px" : "24px";
        const buttonText = this.add.text(0, 0, "Sign in with Google", {
            fontSize: fontSize,
            color: "#333333",
            fontStyle: "bold"
        }).setOrigin(0.5, 0.5);  // Set origin to center

        buttonContainer.add([buttonBg, buttonText]);

        // Adjust hover effects for touch devices
        if (!this.sys.game.device.input.touch) {
            // Only add hover effects for non-touch devices
            buttonBg.on('pointerover', () => {
                buttonContainer.setScale(1.05);
                this.tweens.add({
                    targets: buttonContainer,
                    y: buttonContainer.y - 5,
                    duration: 200
                });
            });

            buttonBg.on('pointerout', () => {
                buttonContainer.setScale(1);
                this.tweens.add({
                    targets: buttonContainer,
                    y: this.scale.height / 2,
                    duration: 200
                });
            });
        }

        // Add active state for touch feedback
        buttonBg.on('pointerdown', () => {
            buttonContainer.setScale(0.95);
        });

        buttonBg.on('pointerup', async () => {
            buttonContainer.setScale(1);
            await this.handleLogin(buttonContainer);
        });
    }

    private async handleLogin(buttonContainer: Phaser.GameObjects.Container) {
        // Show loading animation
        buttonContainer.visible = false;
        this.showLoadingBar();
        this.updateLoadingProgress(0.2);

        try {
            const provider = new GoogleAuthProvider();
            // Add these lines to force account selection
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // Clear any existing auth state before signing in
            await auth.signOut();
            
            const result = await signInWithPopup(auth, provider);
            this.updateLoadingProgress(0.4);

            const user = result.user;
            const playerRef = doc(db, "players", user.uid);
            const playerSnap = await getDoc(playerRef);

            if (!playerSnap.exists()) {
                await setDoc(playerRef, {
                    quiztals: 100,
                    character: "",
                    createdAt: Date.now(),
                    displayName: user.displayName || "Unknown Adventurer",
                });
            }

            this.updateLoadingProgress(0.7);

            const playerObj = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "Unknown Adventurer",
            };
            localStorage.setItem("quiztal-player", JSON.stringify(playerObj));

            this.updateLoadingProgress(1);

            // Clean up
            buttonContainer.destroy();
            this.loadingBar.destroy();
            this.loadingText.destroy();

            // Move to wallet verification
            this.scene.start('WalletVerificationScene');
        } catch (error) {
            console.error("Login failed:", error);
            this.showError("Login failed. Please try again.");
            buttonContainer.visible = true;
        }
    }

    // Helper methods
    private showLoadingBar() {
        this.loadingBar = this.add.graphics();
        
        // Adjust loading text size for mobile
        const fontSize = this.scale.width < 768 ? "16px" : "20px";
        this.loadingText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 20,
            "Loading...",
            {
                fontSize: fontSize,
                color: "#ffffff",
            }
        ).setOrigin(0.5);
    }

    private updateLoadingProgress(percent: number) {
        // Adjust bar size for mobile
        const barWidth = this.scale.width < 768 ? 250 : 300;
        const barHeight = this.scale.width < 768 ? 4 : 6;
        const x = (this.scale.width - barWidth) / 2;
        const y = this.scale.height / 2 + 50;

        this.loadingBar.clear();
        
        // Background of the bar
        this.loadingBar.fillStyle(0xffffff, 0.2);
        this.loadingBar.fillRoundedRect(x, y, barWidth, barHeight, 3);
        
        // Filled portion of the bar with single color instead of gradient
        this.loadingBar.fillStyle(0x4a9eff);
        this.loadingBar.fillRoundedRect(x, y, barWidth * percent, barHeight, 3);

        // Add shine effect to simulate gradient
        if (percent > 0) {
            this.loadingBar.fillStyle(0x9742ff, 0.3);
            this.loadingBar.fillRoundedRect(
                x + (barWidth * percent) - 30,
                y,
                30,
                barHeight,
                3
            );
        }
    }

    private showError(message: string) {
        // Adjust error container for mobile
        const errorWidth = this.scale.width < 768 ? 300 : 400;
        const errorHeight = this.scale.width < 768 ? 50 : 60;
        
        const errorContainer = this.add.container(
            this.scale.width / 2,
            this.scale.height / 2 + 100
        );

        const errorBg = this.add.rectangle(
            0, 0,
            errorWidth, errorHeight,
            0xff3333, 0.9
        ).setOrigin(0.5);

        const errorText = this.add.text(
            0, 0,
            message,
            {
                fontSize: this.scale.width < 768 ? "16px" : "20px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        errorContainer.add([errorBg, errorText]);

        // Fade in animation
        errorContainer.setAlpha(0);
        this.tweens.add({
            targets: errorContainer,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        // Auto-hide with fade out
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: errorContainer,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => errorContainer.destroy()
            });
        });
    }

    private drawGradient(color1: number, color2: number) {
        this.gradientOverlay.clear();
        this.gradientOverlay.fillGradientStyle(color1, color1, color2, color2, 1);
        this.gradientOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    shutdown() {
        if (this.gradientOverlay) this.gradientOverlay.destroy();
        if (this.loadingBar) this.loadingBar.destroy();
        if (this.loadingText) this.loadingText.destroy();
    }
}