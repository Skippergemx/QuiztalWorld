import Phaser from "phaser";
import { auth, db } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import modernUITheme, { UIHelpers } from '../utils/UITheme';

export default class GoogleLoginScene extends Phaser.Scene {
    private backgroundGraphics!: Phaser.GameObjects.Graphics;
    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private titleContainer!: Phaser.GameObjects.Container;
    private floatingShapesEvent!: Phaser.Time.TimerEvent;
    private loginCard!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: "GoogleLoginScene" });
    }

    preload() {
        // Remove Google icon loading
    }

    create() {
        // Create modern animated background with particles
        this.createModernBackground();
        
        // Create floating particles for ambiance
        this.createFloatingParticles();
        
        // Create modern title with glassmorphism effect
        this.createModernTitle();
        
        // Create login card with modern design
        this.createLoginCard();

        // Setup responsive layout
        this.scale.on('resize', this.handleResize, this);
        this.handleResize();
    }

    private createModernBackground() {
        // Create dynamic gradient background
        this.backgroundGraphics = this.add.graphics();
        this.updateBackgroundGradient();
        
        // Animate gradient colors
        this.tweens.add({
            targets: { hue: 0 },
            hue: 360,
            duration: 20000,
            repeat: -1,
            onUpdate: () => this.updateBackgroundGradient()
        });
    }

    private updateBackgroundGradient(hueShift: number = 0) {
        this.backgroundGraphics.clear();
        
        // Create animated gradient
        const color1 = UIHelpers.hexToNumber(modernUITheme.colors.background.primary);
        const color2 = UIHelpers.hexToNumber(modernUITheme.colors.background.secondary);
        const color3 = UIHelpers.hexToNumber(modernUITheme.colors.primary);
        
        this.backgroundGraphics.fillGradientStyle(color1, color2, color3, color1, 0.9);
        this.backgroundGraphics.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    private createFloatingParticles() {
        // Create simple geometric shapes as floating elements
        this.floatingShapesEvent = this.time.addEvent({
            delay: 300, // Faster spawn rate for more visibility
            callback: () => {
                this.createFloatingShape();
            },
            loop: true
        });
    }

    private createFloatingShape() {
        const shapes = ['circle', 'triangle', 'diamond', 'leaf', 'hexagon'];
        const shape = Phaser.Utils.Array.GetRandom(shapes);
        const size = Phaser.Math.Between(4, 12); // Larger sizes for better visibility
        const x = Phaser.Math.Between(0, this.scale.width);
        const y = this.scale.height + 20;
        
        const graphics = this.add.graphics();
        graphics.setPosition(x, y);
        graphics.setDepth(-1);
        
        // Solarpunk theme colors - bright, nature-inspired
        const solarpunkColors = [
            '#00ff88', // Bright green
            '#88ff00', // Electric lime
            '#ffaa00', // Solar orange
            '#ff6600', // Vibrant orange
            '#00aaff', // Sky blue
            '#ff0088', // Magenta pink
            '#aa88ff', // Purple-violet
            '#ffff00', // Bright yellow
            '#00ffaa'  // Cyan-green
        ];
        const color = UIHelpers.hexToNumber(Phaser.Utils.Array.GetRandom(solarpunkColors));
        
        // Higher alpha for better visibility
        graphics.fillStyle(color, 0.7);
        graphics.lineStyle(1, color, 0.9); // Add outline for more presence
        
        // Draw different shapes with solarpunk aesthetic
        switch (shape) {
            case 'circle':
                graphics.fillCircle(0, 0, size);
                graphics.strokeCircle(0, 0, size);
                break;
            case 'triangle':
                graphics.fillTriangle(-size, size, size, size, 0, -size);
                graphics.strokeTriangle(-size, size, size, size, 0, -size);
                break;
            case 'diamond':
                const diamond = [
                    { x: 0, y: -size },
                    { x: size, y: 0 },
                    { x: 0, y: size },
                    { x: -size, y: 0 }
                ];
                graphics.fillPoints(diamond);
                graphics.strokePoints(diamond, true);
                break;
            case 'leaf':
                // Organic leaf shape for nature theme using proper Phaser methods
                const leafPath = new Phaser.Geom.Polygon([
                    0, -size,              // Top point
                    size * 0.7, -size * 0.3,  // Upper right curve
                    size * 0.5, size * 0.2,   // Middle right
                    size * 0.2, size * 0.8,   // Lower right curve
                    0, size,               // Bottom point
                    -size * 0.2, size * 0.8,  // Lower left curve
                    -size * 0.5, size * 0.2,  // Middle left
                    -size * 0.7, -size * 0.3  // Upper left curve
                ]);
                graphics.fillPoints(leafPath.points);
                graphics.strokePoints(leafPath.points, true);
                break;
            case 'hexagon':
                // Tech-nature fusion hexagon
                const hexagon = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    hexagon.push({
                        x: Math.cos(angle) * size,
                        y: Math.sin(angle) * size
                    });
                }
                graphics.fillPoints(hexagon);
                graphics.strokePoints(hexagon, true);
                break;
        }
        
        // More dynamic animation with pulsing effect
        this.tweens.add({
            targets: graphics,
            y: -50,
            x: x + Phaser.Math.Between(-80, 80),
            alpha: { from: 0, to: 0.8 },
            scaleX: { from: 0.5, to: 1.2 },
            scaleY: { from: 0.5, to: 1.2 },
            rotation: Phaser.Math.PI2 * (Math.random() > 0.5 ? 1 : -1),
            duration: Phaser.Math.Between(8000, 12000),
            ease: 'Sine.easeInOut',
            onComplete: () => {
                graphics.destroy();
            }
        });
        
        // Add subtle pulsing effect
        this.tweens.add({
            targets: graphics,
            alpha: 0.4,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createModernTitle() {
        const isMobile = this.scale.width < 768;
        this.titleContainer = this.add.container(this.scale.width / 2, isMobile ? 120 : 150);

        // Main title with modern typography
        const mainTitle = this.add.text(0, 0, "Crystle World", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '56px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.primary,
            fontStyle: modernUITheme.typography.fontWeight.bold
        }).setOrigin(0.5);

        // Subtitle with accent color
        const subtitle = this.add.text(0, isMobile ? 40 : 50, "Learn • Earn • Explore", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '18px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.accent,
            fontStyle: modernUITheme.typography.fontWeight.medium
        }).setOrigin(0.5);

        // Glassmorphism background
        const titleBg = this.add.graphics();
        UIHelpers.createGradientFill(
            titleBg, -mainTitle.width/2 - 30, -mainTitle.height/2 - 20,
            mainTitle.width + 60, mainTitle.height + subtitle.height + 60,
            modernUITheme.gradients.glass, true
        );
        titleBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.3);
        titleBg.strokeRoundedRect(
            -mainTitle.width/2 - 30, -mainTitle.height/2 - 20,
            mainTitle.width + 60, mainTitle.height + subtitle.height + 60,
            modernUITheme.borderRadius.lg
        );

        this.titleContainer.add([titleBg, mainTitle, subtitle]);
        
        // Floating animation
        this.tweens.add({
            targets: this.titleContainer,
            y: this.titleContainer.y - 10,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createLoginCard() {
        const isMobile = this.scale.width < 768;
        this.loginCard = this.add.container(this.scale.width / 2, this.scale.height * 0.65);

        // Modern card background
        const cardWidth = isMobile ? 320 : 400;
        const cardHeight = isMobile ? 200 : 240;
        
        const cardBg = this.add.graphics();
        UIHelpers.createGradientFill(
            cardBg, -cardWidth/2, -cardHeight/2,
            cardWidth, cardHeight,
            modernUITheme.gradients.glass, true
        );
        cardBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.4);
        cardBg.strokeRoundedRect(
            -cardWidth/2, -cardHeight/2, cardWidth, cardHeight,
            modernUITheme.borderRadius.xl
        );

        // Welcome text
        const welcomeText = this.add.text(0, -60, "Welcome Adventurer!", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '24px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.primary,
            fontStyle: modernUITheme.typography.fontWeight.bold
        }).setOrigin(0.5);

        // Description text
        const descText = this.add.text(0, -20, "Sign in to start your Web3 learning journey", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '14px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.secondary,
            align: 'center'
        }).setOrigin(0.5);

        // Modern Google sign-in button
        const buttonWidth = isMobile ? 280 : 320;
        const buttonHeight = isMobile ? 50 : 56;
        const buttonContainer = this.add.container(0, 40);

        const buttonBg = this.add.graphics();
        UIHelpers.createGradientFill(
            buttonBg, -buttonWidth/2, -buttonHeight/2,
            buttonWidth, buttonHeight,
            modernUITheme.gradients.primary, true
        );
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.6);
        buttonBg.strokeRoundedRect(
            -buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight,
            modernUITheme.borderRadius.md
        );

        // Google icon (using emoji for now)
        const googleIcon = this.add.text(-100, 0, "🚀", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '14px')
        }).setOrigin(0.5);

        const buttonText = this.add.text(0, 0, "Continue with Google", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '16px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.inverse,
            fontStyle: modernUITheme.typography.fontWeight.medium
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, googleIcon, buttonText]);
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        ).setData('isButton', true);

        // Modern button interactions
        this.setupButtonInteractions(buttonContainer);

        this.loginCard.add([cardBg, welcomeText, descText, buttonContainer]);
        
        // Entrance animation
        this.loginCard.setAlpha(0).setScale(0.8);
        this.tweens.add({
            targets: this.loginCard,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            delay: 500,
            ease: 'Back.easeOut'
        });
    }

    private setupButtonInteractions(button: Phaser.GameObjects.Container) {
        const isMobile = this.scale.width < 768;
        
        button.on('pointerover', () => {
            if (!isMobile) {
                button.setScale(1.05);
                this.tweens.add({
                    targets: button,
                    y: button.y - 3,
                    duration: 150,
                    ease: 'Power2'
                });
            }
        });

        button.on('pointerout', () => {
            if (!isMobile) {
                button.setScale(1);
                this.tweens.add({
                    targets: button,
                    y: 40,
                    duration: 150,
                    ease: 'Power2'
                });
            }
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
        });

        button.on('pointerup', async () => {
            button.setScale(1);
            await this.handleModernLogin(button);
        });
    }

    private handleResize() {
        const isMobile = this.scale.width < 768;
        
        // Update background
        if (this.backgroundGraphics) {
            this.updateBackgroundGradient();
        }
        
        // Reposition title
        if (this.titleContainer) {
            this.titleContainer.setPosition(this.scale.width / 2, isMobile ? 120 : 150);
        }
        
        // Reposition login card
        if (this.loginCard) {
            this.loginCard.setPosition(this.scale.width / 2, this.scale.height * 0.65);
        }
    }

    private async handleModernLogin(buttonContainer: Phaser.GameObjects.Container) {
        // Create modern loading overlay
        this.createModernLoadingOverlay();
        buttonContainer.setVisible(false);
        this.updateModernLoadingProgress(0.1, "Initializing...");

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            await auth.signOut();
            this.updateModernLoadingProgress(0.3, "Opening Google Sign-in...");
            
            const result = await signInWithPopup(auth, provider);
            this.updateModernLoadingProgress(0.6, "Verifying account...");

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

            this.updateModernLoadingProgress(0.8, "Setting up your profile...");

            const playerObj = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "Unknown Adventurer",
            };
            localStorage.setItem("quiztal-player", JSON.stringify(playerObj));

            this.updateModernLoadingProgress(1, "Welcome to Crystle World!");

            // Success animation before transition
            this.tweens.add({
                targets: this.loginCard,
                alpha: 0,
                scaleY: 0,
                duration: 500,
                ease: 'Back.easeIn',
                onComplete: () => {
                    this.scene.start('WalletVerificationScene');
                }
            });
            
        } catch (error) {
            console.error("Modern login failed:", error);
            this.showModernError("Sign-in failed. Please try again.");
            buttonContainer.setVisible(true);
        }
    }

    private createModernLoadingOverlay() {
        const overlay = this.add.rectangle(
            this.scale.width / 2, this.scale.height / 2,
            this.scale.width, this.scale.height,
            UIHelpers.hexToNumber(modernUITheme.colors.background.overlay), 0.8
        ).setDepth(1000);

        this.loadingText = this.add.text(
            this.scale.width / 2, this.scale.height / 2 - 30,
            "Loading...", {
                fontSize: UIHelpers.getResponsiveFontSize(this.scale.width < 768, '18px'),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.primary,
                fontStyle: modernUITheme.typography.fontWeight.medium
            }
        ).setOrigin(0.5).setDepth(1001);

        this.loadingBar = this.add.graphics().setDepth(1001);
    }

    private updateModernLoadingProgress(percent: number, message: string) {
        const isMobile = this.scale.width < 768;
        const barWidth = isMobile ? 280 : 350;
        const barHeight = 6;
        const x = (this.scale.width - barWidth) / 2;
        const y = this.scale.height / 2 + 20;

        this.loadingText.setText(message);
        this.loadingBar.clear();
        
        // Modern loading bar background
        this.loadingBar.fillStyle(
            UIHelpers.hexToNumber(modernUITheme.colors.background.secondary), 0.5
        );
        this.loadingBar.fillRoundedRect(x, y, barWidth, barHeight, 3);
        
        // Animated progress fill with gradient effect
        if (percent > 0) {
            this.loadingBar.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent));
            this.loadingBar.fillRoundedRect(x, y, barWidth * percent, barHeight, 3);
            
            // Glow effect
            this.loadingBar.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
            this.loadingBar.strokeRoundedRect(
                x - 1, y - 1, (barWidth * percent) + 2, barHeight + 2, 4
            );
        }
    }

    private showModernError(message: string) {
        const isMobile = this.scale.width < 768;
        const errorCard = this.add.container(
            this.scale.width / 2, this.scale.height - 100
        );

        const cardWidth = isMobile ? 300 : 400;
        const cardHeight = 60;
        
        const errorBg = this.add.graphics();
        errorBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.error), 0.9);
        errorBg.fillRoundedRect(
            -cardWidth/2, -cardHeight/2, cardWidth, cardHeight,
            modernUITheme.borderRadius.md
        );
        errorBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.error), 1);
        errorBg.strokeRoundedRect(
            -cardWidth/2, -cardHeight/2, cardWidth, cardHeight,
            modernUITheme.borderRadius.md
        );

        const errorText = this.add.text(0, 0, message, {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '16px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.primary,
            align: 'center'
        }).setOrigin(0.5);

        errorCard.add([errorBg, errorText]);
        errorCard.setAlpha(0).setScale(0.8);

        this.tweens.add({
            targets: errorCard,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: errorCard,
                alpha: 0,
                scaleY: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => errorCard.destroy()
            });
        });
    }

    shutdown() {
        // Clean up modern elements
        this.scale.off('resize', this.handleResize, this);
        
        if (this.backgroundGraphics) this.backgroundGraphics.destroy();
        if (this.loadingBar) this.loadingBar.destroy();
        if (this.loadingText) this.loadingText.destroy();
        if (this.titleContainer) this.titleContainer.destroy();
        if (this.loginCard) this.loginCard.destroy();
        if (this.floatingShapesEvent) this.floatingShapesEvent.destroy();
    }
}