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
    private infoButton!: Phaser.GameObjects.Container;
    private explainerModal: {
        overlay: Phaser.GameObjects.Graphics;
        cardBg: Phaser.GameObjects.Graphics;
        title: Phaser.GameObjects.Text;
        content: Phaser.GameObjects.Text;
        closeBtn: Phaser.GameObjects.Container;
    } | null = null;

    constructor() {
        super({ key: "GoogleLoginScene" });
    }

    preload() {
        // Load the background image
        this.load.image('login-background', 'assets/ui/splash02.png');
    }

    create() {
        // Create background image
        this.createModernBackground();
        
        // Create floating particles for ambiance
        this.createFloatingParticles();
        
        // Create modern title with glassmorphism effect
        this.createModernTitle();
        
        // Create login card with modern design
        this.createLoginCard();

        // Create info button for game explainer
        this.createInfoButton();

        // Setup responsive layout
        this.scale.on('resize', this.handleResize, this);
        this.handleResize();
    }

    private createModernBackground() {
        // Create the background image
        const background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'login-background');
        
        // Scale the background to fit the screen while maintaining aspect ratio
        const scaleX = this.scale.width / background.width;
        const scaleY = this.scale.height / background.height;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage
        background.setScale(scale);
        
        // Set depth to ensure it's behind other elements
        background.setDepth(-2);
    }

    private updateBackgroundGradient() {
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
        const mainTitle = this.add.text(0, 0, "Niftdood World", {
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
        // Use a more responsive positioning approach for mobile devices
        const verticalPosition = isMobile ? 
            Math.min(this.scale.height * 0.65, this.scale.height - 250) : 
            this.scale.height * 0.65;
        this.loginCard = this.add.container(this.scale.width / 2, verticalPosition);

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

        const buttonText = this.add.text(0, 0, "GOOGLE LOGIN", {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '16px'),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: '#000000', /* Black text */
            fontStyle: modernUITheme.typography.fontWeight.bold
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

    // Add the new info button creation method here
    private createInfoButton() {
        const isMobile = this.scale.width < 768;
        const buttonSize = isMobile ? 40 : 50;
        const buttonX = this.scale.width - buttonSize - 20;
        const buttonY = buttonSize + 20;
        
        this.infoButton = this.add.container(buttonX, buttonY);

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.9);
        buttonBg.fillCircle(0, 0, buttonSize / 2);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 1);
        buttonBg.strokeCircle(0, 0, buttonSize / 2);

        const infoText = this.add.text(0, 0, "i", {
            fontSize: isMobile ? '20px' : '24px',
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: '#ffffff',
            fontStyle: modernUITheme.typography.fontWeight.bold
        }).setOrigin(0.5);

        this.infoButton.add([buttonBg, infoText]);
        this.infoButton.setInteractive(new Phaser.Geom.Circle(0, 0, buttonSize / 2), Phaser.Geom.Circle.Contains);
        
        // Add hover effects for non-mobile devices
        if (!isMobile) {
            this.infoButton.on('pointerover', () => {
                this.tweens.add({
                    targets: this.infoButton,
                    scale: 1.1,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            this.infoButton.on('pointerout', () => {
                this.tweens.add({
                    targets: this.infoButton,
                    scale: 1,
                    duration: 200,
                    ease: 'Power2'
                });
            });
        }

        this.infoButton.on('pointerdown', () => {
            this.showGameExplainer();
        });
    }

    // Replace the showGameExplainer method with an improved scrollable version
    private showGameExplainer() {
        // Create semi-transparent background overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setDepth(2000);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains);

        // Create modal card
        const isMobile = this.scale.width < 768;
        const cardWidth = Math.min(500, this.scale.width * 0.8);
        const cardHeight = Math.min(600, this.scale.height * 0.8);
        const cardX = (this.scale.width - cardWidth) / 2;
        const cardY = (this.scale.height - cardHeight) / 2;

        const cardBg = this.add.graphics().setDepth(2001);
        UIHelpers.createGradientFill(
            cardBg, cardX, cardY, cardWidth, cardHeight,
            modernUITheme.gradients.glass, true
        );
        cardBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.6);
        cardBg.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, modernUITheme.borderRadius.lg);

        // Add title
        const title = this.add.text(
            this.scale.width / 2, 
            cardY + 40, 
            "About Niftdood World", 
            {
                fontSize: isMobile ? '20px' : '24px',
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.primary,
                fontStyle: modernUITheme.typography.fontWeight.bold
            }
        ).setOrigin(0.5).setDepth(2002);

        // Define content area dimensions
        const contentX = cardX + 20;
        const contentY = cardY + 90;
        const contentWidth = cardWidth - 40;
        const contentHeight = cardHeight - 150;

        // Create a mask for the scrollable content area
        const maskShape = this.add.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.beginPath();
        maskShape.fillRect(contentX, contentY, contentWidth, contentHeight);
        const mask = maskShape.createGeometryMask();

        // Create content
        const content = this.add.text(
            contentX, 
            contentY, 
            this.getGameExplainerContent(),
            {
                fontSize: isMobile ? '14px' : '16px',
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.secondary,
                wordWrap: { width: contentWidth - 20 },
                lineSpacing: 4
            }
        ).setOrigin(0, 0).setDepth(2003);

        // Apply mask to content
        content.setMask(mask);

        // Add scroll indicators only if content overflows
        const scrollIndicator = this.add.graphics().setDepth(2004);
        const contentHeightActual = content.height;
        const maxScroll = Math.max(0, contentHeightActual - contentHeight + 20);
        
        if (maxScroll > 0) {
            scrollIndicator.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.7);
            scrollIndicator.fillRoundedRect(
                cardX + cardWidth - 15, 
                cardY + 100, 
                8, 
                30
            );
        } else {
            scrollIndicator.setVisible(false);
        }

        // Add close button
        const closeBtnSize = 30;
        const closeBtn = this.add.container(
            cardX + cardWidth - closeBtnSize - 10, 
            cardY + closeBtnSize + 10
        ).setDepth(2005);

        const closeBg = this.add.graphics();
        closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.error), 0.8);
        closeBg.fillCircle(0, 0, closeBtnSize / 2);

        const closeText = this.add.text(0, 0, "✕", {
            fontSize: isMobile ? '18px' : '20px',
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: '#ffffff',
            fontStyle: modernUITheme.typography.fontWeight.bold
        }).setOrigin(0.5);

        closeBtn.add([closeBg, closeText]);
        closeBtn.setInteractive(new Phaser.Geom.Circle(0, 0, closeBtnSize / 2), Phaser.Geom.Circle.Contains);
        
        // Add hover effect for close button on non-mobile devices
        if (!isMobile) {
            closeBtn.on('pointerover', () => {
                closeBg.clear();
                closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.error), 1);
                closeBg.fillCircle(0, 0, closeBtnSize / 2);
            });

            closeBtn.on('pointerout', () => {
                closeBg.clear();
                closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.error), 0.8);
                closeBg.fillCircle(0, 0, closeBtnSize / 2);
            });
        }

        // Scrolling functionality
        let startY = 0;
        let startContentY = contentY;
        let hitArea: Phaser.GameObjects.Graphics | null = null;
        
        // Only enable dragging if content overflows
        if (maxScroll > 0) {
            // Create an invisible hit area for scrolling
            hitArea = this.add.graphics().setDepth(2006);
            hitArea.fillStyle(0x000000, 0.01); // Invisible but interactive
            hitArea.fillRect(contentX, contentY, contentWidth, contentHeight);
            hitArea.setInteractive(new Phaser.Geom.Rectangle(contentX, contentY, contentWidth, contentHeight), Phaser.Geom.Rectangle.Contains);
            
            hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                startY = pointer.y;
                startContentY = content.y;
            });
            
            hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                if (pointer.isDown) {
                    const deltaY = pointer.y - startY;
                    let newY = startContentY + deltaY;
                    
                    // Apply bounds
                    newY = Phaser.Math.Clamp(newY, contentY - maxScroll, contentY);
                    
                    content.setY(newY);
                    
                    // Update scroll indicator position
                    const scrollRatio = (contentY - newY) / maxScroll;
                    scrollIndicator.clear();
                    scrollIndicator.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.7);
                    scrollIndicator.fillRoundedRect(
                        cardX + cardWidth - 15, 
                        cardY + 100 + (scrollRatio * (contentHeight - 70)), 
                        8, 
                        30
                    );
                }
            });
            
            // Add mouse wheel support
            this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
                // Check if pointer is over the content area
                if (pointer.x >= contentX && pointer.x <= contentX + contentWidth &&
                    pointer.y >= contentY && pointer.y <= contentY + contentHeight) {
                    
                    let newY = content.y - deltaY * 0.5; // Adjust scroll speed
                    newY = Phaser.Math.Clamp(newY, contentY - maxScroll, contentY);
                    content.setY(newY);
                    
                    // Update scroll indicator position
                    const scrollRatio = (contentY - newY) / maxScroll;
                    scrollIndicator.clear();
                    scrollIndicator.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.7);
                    scrollIndicator.fillRoundedRect(
                        cardX + cardWidth - 15, 
                        cardY + 100 + (scrollRatio * (contentHeight - 70)), 
                        8, 
                        30
                    );
                }
            });
        }

        // Close functionality
        const closeExplainer = () => {
            overlay.destroy();
            cardBg.destroy();
            title.destroy();
            content.destroy();
            maskShape.destroy();
            scrollIndicator.destroy();
            closeBtn.destroy();
            
            if (hitArea) {
                hitArea.destroy();
            }
            
            // Clean up event listeners
            this.input.off('wheel');
            
            this.explainerModal = null;
        };

        closeBtn.on('pointerdown', closeExplainer);
        overlay.on('pointerdown', closeExplainer);

        // Store references for cleanup
        this.explainerModal = { overlay, cardBg, title, content, closeBtn };

        // Entrance animation
        cardBg.setAlpha(0);
        title.setAlpha(0);
        content.setAlpha(0);
        closeBtn.setAlpha(0);
        scrollIndicator.setAlpha(0);

        this.tweens.add({
            targets: [cardBg, title, content, closeBtn, scrollIndicator],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    // Add the content for the explainer
    private getGameExplainerContent(): string {
        return `Welcome to Niftdood World, an innovative Web3 educational metaverse where you can learn about blockchain technology through interactive gameplay!

Learning Through Play:
• Engage with expert NPCs who teach different aspects of Web3
• Answer quiz questions to earn Niftdood tokens as rewards
• Explore a vibrant world filled with blockchain-themed adventures

Key Features:
• Four unique character classes to choose from
• Over 10 specialized NPCs teaching Web3, NFTs, DeFi, and security
• Collectible NFTs that enhance your character's abilities
• Turn-based combat system with strategic skill usage
• Wallet integration for managing your in-game assets

How to Play:
1. Select your character class
2. Explore the world and interact with NPCs
3. Answer quiz questions correctly to earn Niftdoods
4. Use Niftdoods to purchase items and upgrade your character
5. Battle monsters and complete quests for additional rewards

In Niftdood World, education meets adventure. Each NPC specializes in different aspects of Web3 technology, providing you with valuable knowledge while you play. Answer correctly to earn Niftdood tokens, which can be used to unlock new areas, purchase items, and trade with other players.

Our game makes learning about blockchain technology fun and engaging, preparing you for the decentralized future while you enjoy an immersive gaming experience.

Ready to start your Web3 learning journey? Sign in with Google to begin!`;
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

    // Update handleResize to position the info button correctly
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
        
        // Reposition login card with better mobile handling
        if (this.loginCard) {
            const verticalPosition = isMobile ? 
                Math.min(this.scale.height * 0.65, this.scale.height - 250) : 
                this.scale.height * 0.65;
            this.loginCard.setPosition(this.scale.width / 2, verticalPosition);
        }

        // Reposition info button
        if (this.infoButton) {
            const buttonSize = isMobile ? 40 : 50;
            const buttonX = this.scale.width - buttonSize - 20;
            const buttonY = buttonSize + 20;
            this.infoButton.setPosition(buttonX, buttonY);
        }
    }

    private async handleModernLogin(buttonContainer: Phaser.GameObjects.Container) {
        // Flag to prevent multiple login attempts
        if ((this as any).isLoggingIn) {
            console.log('⚠️ GoogleLoginScene: Login already in progress');
            return;
        }
        (this as any).isLoggingIn = true;
        
        // Create modern loading overlay
        this.createModernLoadingOverlay();
        buttonContainer.setVisible(false);
        this.updateModernLoadingProgress(0.1, "Initializing...");

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            // Sign out any existing user and stop any running scenes
            try {
                await auth.signOut();
                console.log('✅ GoogleLoginScene: Signed out existing user');
            } catch (signOutError) {
                console.warn('⚠️ GoogleLoginScene: Error during sign out', signOutError);
            }
            
            // Clean up any existing Firebase listeners and data
            try {
                // Clear any existing player data
                localStorage.removeItem("niftdood-player");
                localStorage.removeItem("niftdood-nfts");
                console.log('✅ GoogleLoginScene: Cleared existing localStorage data');
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error clearing localStorage', e);
            }
            
            // Stop any potentially running game scenes to prevent conflicts
            try {
                const scenesToStop = ['GameScene', 'UIScene', 'CharacterSelectionScene', 'WalletWindowScene', 'NFTWindowScene'];
                scenesToStop.forEach(sceneKey => {
                    try {
                        // Check if scene exists and is active before trying to stop it
                        if (this.scene.get(sceneKey)) {
                            if (this.scene.isActive(sceneKey)) {
                                console.log(`🛑 GoogleLoginScene: Stopping active scene ${sceneKey}`);
                                this.scene.stop(sceneKey);
                            }
                        }
                    } catch (e) {
                        console.warn(`⚠️ GoogleLoginScene: Error checking/stopping scene ${sceneKey}`, e);
                    }
                });
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error stopping existing scenes', e);
            }
            
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
                console.log('✅ GoogleLoginScene: Created new player document');
            }

            this.updateModernLoadingProgress(0.8, "Setting up your profile...");

            const playerObj = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "Unknown Adventurer",
                character: "" // Initialize character as empty
            };
            localStorage.setItem("niftdood-player", JSON.stringify(playerObj));
            console.log('✅ GoogleLoginScene: Saved player data to localStorage');

            this.updateModernLoadingProgress(1, "Welcome to Niftdood World!");

            // Success animation before transition
            this.tweens.add({
                targets: this.loginCard,
                alpha: 0,
                scaleY: 0,
                duration: 500,
                ease: 'Back.easeIn',
                onComplete: () => {
                    // Clean up before transitioning
                    this.cleanupBeforeTransition();
                    // Go directly to CharacterSelectionScene instead of WalletVerificationScene
                    this.scene.start('CharacterSelectionScene');
                }
            });
            
        } catch (error: any) {
            console.error("❌ GoogleLoginScene: Modern login failed:", error);
            
            // More detailed error handling
            let errorMessage = "Sign-in failed. Please try again.";
            if (error.code) {
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "Sign-in was cancelled. Please try again.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Network error. Please check your connection and try again.";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "This account has been disabled.";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "Too many requests. Please try again later.";
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = "Sign-in popup was cancelled. Please try again.";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Sign-in popup was blocked. Please allow popups for this site and try again.";
                        break;
                    default:
                        errorMessage = `Sign-in error: ${error.code}`;
                }
            } else if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
                // Handle Cross-Origin policy issues
                console.warn('⚠️ GoogleLoginScene: Cross-Origin policy issue detected. This is usually safe to ignore if login was cancelled.');
                errorMessage = "Sign-in process interrupted. Please try again.";
            }
            
            this.showModernError(errorMessage);
            buttonContainer.setVisible(true);
            
            // Clean up loading overlay on error
            this.cleanupLoadingOverlay();
        } finally {
            // Reset login flag
            (this as any).isLoggingIn = false;
        }
    }

    private cleanupBeforeTransition() {
        console.log('🧹 GoogleLoginScene: Cleaning up before transition...');
        
        try {
            // Clean up any loading overlay
            this.cleanupLoadingOverlay();
            
            // Clean up tweens
            try {
                this.tweens.killTweensOf(this);
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error killing tweens during transition', e);
            }
            
            // Clean up any timers
            try {
                this.time.removeAllEvents();
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error removing timers during transition', e);
            }
            
            // Perform complete resource cleanup
            this.cleanupAllResources();
            
            console.log('✅ GoogleLoginScene: Pre-transition cleanup completed');
        } catch (error) {
            console.warn('⚠️ GoogleLoginScene: Error during pre-transition cleanup', error);
        }
    }
    
    private cleanupLoadingOverlay() {
        try {
            if ((this as any).loadingOverlay) {
                const overlay = (this as any).loadingOverlay;
                
                // Clean up each element individually with error handling
                const elements = ['overlay', 'cardBg', 'glow', 'icon', 'spinner', 'loadingBar'];
                elements.forEach(key => {
                    if (overlay[key]) {
                        try {
                            // Check if the element has a destroy method before calling it
                            if (typeof overlay[key].destroy === 'function') {
                                overlay[key].destroy();
                            }
                        } catch (e) {
                            console.warn(`⚠️ GoogleLoginScene: Error destroying overlay element ${key}`, e);
                        }
                    }
                });
                
                (this as any).loadingOverlay = null;
            }
        } catch (error) {
            console.warn('⚠️ GoogleLoginScene: Error cleaning up loading overlay', error);
        }
    }

    private createModernLoadingOverlay() {
        // Create a semi-transparent background overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setDepth(1000);

        // Create a modern card for the loading content
        const cardWidth = 350;
        const cardHeight = 200;
        const cardX = (this.scale.width - cardWidth) / 2;
        const cardY = (this.scale.height - cardHeight) / 2;

        const cardBg = this.add.graphics().setDepth(1001);
        cardBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.95);
        cardBg.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, modernUITheme.borderRadius.lg);
        cardBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.6);
        cardBg.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, modernUITheme.borderRadius.lg);

        // Add a subtle glow effect
        const glow = this.add.graphics().setDepth(1000);
        glow.lineStyle(4, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
        glow.strokeRoundedRect(cardX - 2, cardY - 2, cardWidth + 4, cardHeight + 4, modernUITheme.borderRadius.lg + 2);

        // Add icon or decorative element
        const icon = this.add.text(
            cardX + cardWidth / 2,
            cardY + 50,
            "🚀",
            {
                fontSize: '48px',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(1002);

        // Add loading text with modern styling
        this.loadingText = this.add.text(
            cardX + cardWidth / 2,
            cardY + 100,
            "Loading...", {
                fontSize: UIHelpers.getResponsiveFontSize(this.scale.width < 768, '18px'),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.primary,
                fontStyle: modernUITheme.typography.fontWeight.medium,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(1002);

        // Create animated spinner
        const spinner = this.add.graphics().setDepth(1002);
        spinner.lineStyle(4, UIHelpers.hexToNumber(modernUITheme.colors.accent), 1);
        spinner.strokeCircle(0, 0, 12);
        spinner.setPosition(cardX + cardWidth / 2, cardY + 150);

        // Animate the spinner
        this.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        // Initialize the loading bar
        this.loadingBar = this.add.graphics().setDepth(1002);

        // Store references for updates
        (this as any).loadingOverlay = { overlay, cardBg, glow, icon, spinner, loadingBar: this.loadingBar };
    }

    private updateModernLoadingProgress(percent: number, message: string) {
        // Ensure loadingBar exists
        if (!this.loadingBar) {
            console.warn('Loading bar not initialized');
            return;
        }

        const isMobile = this.scale.width < 768;
        const cardWidth = 350;
        const cardX = (this.scale.width - cardWidth) / 2;
        const cardY = (this.scale.height - 200) / 2;

        this.loadingText.setText(message);
        
        // Update spinner animation based on progress
        const spinner = (this as any).loadingOverlay?.spinner;
        if (spinner) {
            // Add a pulse effect to the spinner
            this.tweens.add({
                targets: spinner,
                scale: 1.1,
                duration: 300,
                yoyo: true,
                repeat: 0
            });
        }

        // Update loading bar with modern design
        this.loadingBar.clear();
        
        const barWidth = isMobile ? 280 : 300;
        const barHeight = 8;
        const x = cardX + (cardWidth - barWidth) / 2;
        const y = cardY + 170;

        // Modern loading bar background with gradient
        this.loadingBar.fillGradientStyle(
            UIHelpers.hexToNumber(modernUITheme.colors.background.secondary),
            UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
            UIHelpers.hexToNumber(modernUITheme.colors.background.secondary),
            UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
            0.5
        );
        this.loadingBar.fillRoundedRect(x, y, barWidth, barHeight, 4);
        
        // Animated progress fill with gradient effect
        if (percent > 0) {
            // Create a gradient for the progress fill
            this.loadingBar.fillGradientStyle(
                UIHelpers.hexToNumber(modernUITheme.colors.accent),
                UIHelpers.hexToNumber('#f39c12'), // Slightly darker shade
                UIHelpers.hexToNumber(modernUITheme.colors.accent),
                UIHelpers.hexToNumber('#f39c12'),
                1
            );
            this.loadingBar.fillRoundedRect(x, y, barWidth * percent, barHeight, 4);
            
            // Add a shine effect to the progress
            this.loadingBar.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.3);
            this.loadingBar.fillRoundedRect(x, y, barWidth * percent, barHeight / 2, 4);
            
            // Glow effect around the progress
            this.loadingBar.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.4);
            this.loadingBar.strokeRoundedRect(
                x - 1, y - 1, (barWidth * percent) + 2, barHeight + 2, 5
            );
        }
        
        // Add a subtle animation to the progress text
        this.tweens.add({
            targets: this.loadingText,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
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

    private cleanupAllResources() {
        console.log('🧹 GoogleLoginScene: Starting complete resource cleanup...');
        
        try {
            // Clean up explainer modal if it exists
            if (this.explainerModal) {
                try {
                    this.explainerModal.overlay.destroy();
                    this.explainerModal.cardBg.destroy();
                    this.explainerModal.title.destroy();
                    this.explainerModal.content.destroy();
                    this.explainerModal.closeBtn.destroy();
                } catch (e) {
                    console.warn('⚠️ GoogleLoginScene: Error destroying explainer modal', e);
                }
                this.explainerModal = null;
            }

            // Clean up event listeners
            try {
                this.scale.off('resize', this.handleResize, this);
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error removing resize listener', e);
            }
            
            // Clean up floating shapes timer
            if (this.floatingShapesEvent) {
                try {
                    this.floatingShapesEvent.remove(false); // Don't dispatch pending events
                } catch (e) {
                    console.warn('⚠️ GoogleLoginScene: Error removing floating shapes timer', e);
                }
                this.floatingShapesEvent = null as any;
            }
            
            // Clean up all graphics objects
            const graphicsObjects = [
                this.backgroundGraphics,
                this.loadingBar
            ];
            
            graphicsObjects.forEach(obj => {
                if (obj) {
                    try {
                        // Check if the object has a destroy method before calling it
                        if (typeof obj.destroy === 'function') {
                            obj.destroy();
                        }
                    } catch (e) {
                        console.warn('⚠️ GoogleLoginScene: Error destroying graphics object', e);
                    }
                }
            });
            
            this.backgroundGraphics = null as any;
            this.loadingBar = null as any;
            
            // Clean up text objects
            if (this.loadingText) {
                try {
                    if (typeof this.loadingText.destroy === 'function') {
                        this.loadingText.destroy();
                    }
                } catch (e) {
                    console.warn('⚠️ GoogleLoginScene: Error destroying loading text', e);
                }
            }
            this.loadingText = null as any;
            
            // Clean up container objects
            const containers = [
                this.titleContainer,
                this.loginCard,
                this.infoButton
            ];
            
            containers.forEach(container => {
                if (container) {
                    try {
                        // Check if the container has a destroy method before calling it
                        if (typeof container.destroy === 'function') {
                            container.destroy();
                        }
                    } catch (e) {
                        console.warn('⚠️ GoogleLoginScene: Error destroying container', e);
                    }
                }
            });
            
            this.titleContainer = null as any;
            this.loginCard = null as any;
            this.infoButton = null as any;
            
            // Clean up any loading overlay elements
            this.cleanupLoadingOverlay();
            
            // Clean up any tweens associated with this scene
            try {
                this.tweens.killTweensOf(this);
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error killing tweens', e);
            }
            
            // Clean up any timers
            try {
                this.time.removeAllEvents();
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error removing timers', e);
            }
            
            // Clean up any remaining game objects
            try {
                // Get all children and destroy them
                if (this.children && typeof this.children.getAll === 'function') {
                    const children = this.children.getAll();
                    if (Array.isArray(children)) {
                        children.forEach((child: any) => {
                            if (child) {
                                try {
                                    // Skip destroying the scene itself
                                    if (child !== this && typeof child.destroy === 'function') {
                                        child.destroy();
                                    }
                                } catch (e) {
                                    console.warn('⚠️ GoogleLoginScene: Error destroying child object', e);
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('⚠️ GoogleLoginScene: Error cleaning up child objects', e);
            }
            
            // Reset flags
            (this as any).isLoggingIn = false;
            
            console.log('✅ GoogleLoginScene: Complete resource cleanup completed');
        } catch (error) {
            console.error('❌ GoogleLoginScene: Error during complete resource cleanup', error);
        }
    }

    shutdown() {
        console.log('🧹 GoogleLoginScene: Starting comprehensive cleanup...');
        this.cleanupAllResources();
    }
    
    // Phaser scene destroy method
    destroy() {
        console.log('🧨 GoogleLoginScene: Destroying scene...');
        this.cleanupAllResources();
    }

}
