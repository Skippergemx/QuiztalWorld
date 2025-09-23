import Phaser from 'phaser';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
// import { Web3Service } from '../services/Web3Service';
import QuiztalRewardTracker from '../components/QuiztalRewardTracker';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import modernUITheme, { UIHelpers } from '../utils/UITheme';

export default class UIScene extends Phaser.Scene {
    private uiContainer!: Phaser.GameObjects.Container;
    private backgroundPanel!: Phaser.GameObjects.Rectangle;
    private balanceText!: Phaser.GameObjects.Text;
    private playerId: string = '';
    private balanceUnsubscribe?: () => void;
    private keyI!: Phaser.Input.Keyboard.Key; // <-- Added keyI property
    private keyR!: Phaser.Input.Keyboard.Key; // <-- Added keyR property for rewards
    private walletBtn!: Phaser.GameObjects.Text; // Update or add this property
    // private web3Service: Web3Service;
    private rewardTracker!: QuiztalRewardTracker; // Reward tracker component
    private headerButtons: Phaser.GameObjects.Container[] = []; // Track header buttons for resize
    private footerBg!: Phaser.GameObjects.Rectangle; // Footer background
    private footerText!: Phaser.GameObjects.Text; // Footer text
    private footerGraphics!: Phaser.GameObjects.Graphics; // Footer graphics

    constructor() {
        super({ key: 'UIScene' });
        // this.web3Service = new Web3Service();
    }

    create() {
        try {
            // Check if localStorage is available
            if (typeof window !== 'undefined' && window.localStorage) {
                const userDataStr = window.localStorage.getItem('quiztal-player');
                const user = userDataStr ? JSON.parse(userDataStr) : { uid: '' };
                this.playerId = user.uid || '';
            } else {
                this.playerId = '';
                console.warn('localStorage is not available');
            }

            // Create main UI container
            this.uiContainer = this.add.container(0, 0).setDepth(1000);

            // Create UI elements
            this.createUIPanel();
            this.createButtons();
            this.createBalanceDisplay();
            this.createFooterInstructions();

            // Initialize reward tracking
            this.initializeRewardTracking();

            // Setup event listeners
            this.scale.on('resize', this.updateLayout, this);

            // Replace loadPlayerBalance() call with setupBalanceListener
            this.setupBalanceListener();

            // Add keyboard listeners
            if (this.input.keyboard) {
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
                this.keyI.on('down', () => this.openInventory());
                
                this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
                this.keyR.on('down', () => this.toggleRewardTracker());
            }
        } catch (error) {
            console.error('Error initializing UI:', error);
            this.playerId = '';
        }
    }

    private createUIPanel() {
        const isMobile = this.scale.width < 768;
        const panelHeight = isMobile ? 70 : 50;

        // Create modern gradient background
        const graphics = this.add.graphics();
        UIHelpers.createGradientFill(
            graphics, 
            0, 0, 
            this.scale.width, panelHeight,
            modernUITheme.gradients.dark,
            true
        );
        
        // Add subtle glow effect
        graphics.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
        graphics.strokeRect(0, 0, this.scale.width, panelHeight);
        
        this.backgroundPanel = this.add.rectangle(0, 0, this.scale.width, panelHeight, 
            UIHelpers.hexToNumber(modernUITheme.colors.background.secondary), 0.95)
            .setOrigin(0)
            .setStrokeStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.6)
            .setScrollFactor(0);

        this.uiContainer.add([graphics, this.backgroundPanel]);
    }

    private createButtons() {
        const isMobile = this.scale.width < 768;
        const buttonConfigs = [
            {
                text: '📖',  // Guide book button
                tooltip: 'Guide Book',
                color: '#3498db',  // Blue color for guide book
                hoverColor: '#2980b9',
                callback: () => this.openGuideBook()
            },
            {
                text: '💎',  // Claim tokens button
                tooltip: 'Claim Tokens',
                color: '#9b59b6',  // Purple color for claim button
                hoverColor: '#8e44ad',
                callback: () => this.openTokenClaim()
            },
            {
                text: '💎',  // Wallet verification button
                tooltip: 'Wallet',
                color: '#9b59b6',  // Purple color for wallet
                hoverColor: '#8e44ad',
                callback: () => this.openWalletWindow()
            },
            {
                text: '🎯',  // Session rewards tracker button
                tooltip: 'Session Rewards',
                color: '#f39c12',  // Orange/gold color for rewards
                hoverColor: '#e67e22',
                callback: () => this.toggleRewardTracker()
            },
            {
                text: '🎒',
                tooltip: 'Inventory',
                color: '#2ecc71',
                hoverColor: '#34f585ff',
                callback: () => this.openInventory()
            },
            {
                text: '🚪',
                tooltip: 'Logout',
                color: '#e74c3c',
                hoverColor: '#fc4e3bff',
                callback: () => this.handleLogout()
            }
        ];

        // Calculate safe button positioning for mobile
        const buttonSize = isMobile ? 35 : 40;
        const buttonSpacing = isMobile ? 45 : 80; // Reduced spacing for mobile
        const rightMargin = isMobile ? 20 : 20; // Safe margin from right edge
        
        // Calculate total width needed for all buttons
        const totalButtonsWidth = (buttonConfigs.length * buttonSize) + ((buttonConfigs.length - 1) * (buttonSpacing - buttonSize));
        
        // Start position ensuring buttons fit within screen
        let xPosition = Math.max(
            this.scale.width - totalButtonsWidth - rightMargin,
            rightMargin + buttonSize / 2
        );

        // Store button references for repositioning on resize
        this.headerButtons = [];

        buttonConfigs.forEach(config => {
            const button = this.createNavButton(
                config.text,
                config.tooltip,
                config.color,
                config.hoverColor,
                config.callback
            ).setPosition(xPosition, isMobile ? 30 : 25); // Center vertically in header

            this.uiContainer.add(button);
            this.headerButtons.push(button);
            xPosition += buttonSpacing;
        });
    }

    private createNavButton(text: string, tooltip: string, color: string, hoverColor: string, callback: () => void): Phaser.GameObjects.Container {
        const isMobile = this.scale.width < 768;
        const buttonSize = isMobile ? 44 : 44; // Minimum 44px for mobile touch targets
        const button = this.add.container(0, 0);
        const touchPadding = isMobile ? 12 : 10; // Increased padding for mobile
        
        // Create modern button background with gradient
        const buttonGraphics = this.add.graphics();
        const bgColor1 = UIHelpers.hexToNumber(color);
        const bgColor2 = UIHelpers.hexToNumber(hoverColor);
        
        // Initial state - subtle gradient
        buttonGraphics.fillGradientStyle(bgColor1, bgColor1, bgColor2, bgColor2, 0.9);
        buttonGraphics.fillRoundedRect(
            -buttonSize/2, -buttonSize/2, 
            buttonSize, buttonSize, 
            modernUITheme.borderRadius.md
        );
        
        // Add border with glow effect
        buttonGraphics.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.4);
        buttonGraphics.strokeRoundedRect(
            -buttonSize/2, -buttonSize/2, 
            buttonSize, buttonSize, 
            modernUITheme.borderRadius.md
        );

        // Create icon with better typography
        const icon = this.add.text(0, 0, text, {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, '20px'), // Slightly larger for better visibility
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.text.primary,
            padding: { x: 2, y: 2 }
        }).setOrigin(0.5);

        // Add subtle text shadow for depth
        icon.setStroke(modernUITheme.colors.background.primary, 1);

        // Create modern tooltip for desktop
        const tooltipText = !isMobile ? this.add.text(0, buttonSize/2 + 20, tooltip, {
            fontSize: modernUITheme.typography.fontSize.xs,
            fontFamily: modernUITheme.typography.fontFamily.primary,
            backgroundColor: modernUITheme.colors.background.card,
            color: modernUITheme.colors.text.primary,
            padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5, 0)
        .setVisible(false)
        .setAlpha(0) : null;

        // Create interactive area with minimum touch target size
        const touchAreaSize = Math.max(buttonSize + (touchPadding * 2), 44); // Ensure minimum 44px touch target
        const touchArea = this.add.rectangle(
            0, 0, 
            touchAreaSize, 
            touchAreaSize, 
            0x000000, 
            0
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            // Smooth hover animation
            this.tweens.add({
                targets: [buttonGraphics, icon],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: modernUITheme.animations.duration.fast,
                ease: modernUITheme.animations.easing.easeOut
            });
            
            // Update gradient for hover state
            buttonGraphics.clear();
            buttonGraphics.fillGradientStyle(bgColor2, bgColor2, bgColor1, bgColor1, 1);
            buttonGraphics.fillRoundedRect(
                -buttonSize/2, -buttonSize/2, 
                buttonSize, buttonSize, 
                modernUITheme.borderRadius.md
            );
            buttonGraphics.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
            buttonGraphics.strokeRoundedRect(
                -buttonSize/2, -buttonSize/2, 
                buttonSize, buttonSize, 
                modernUITheme.borderRadius.md
            );
            
            // Show tooltip with animation
            if (tooltipText) {
                tooltipText.setVisible(true);
                this.tweens.add({
                    targets: tooltipText,
                    alpha: 1,
                    y: tooltipText.y - 5,
                    duration: modernUITheme.animations.duration.fast,
                    ease: modernUITheme.animations.easing.easeOut
                });
            }
        })
        .on('pointerout', () => {
            // Smooth scale back animation
            this.tweens.add({
                targets: [buttonGraphics, icon],
                scaleX: 1,
                scaleY: 1,
                duration: modernUITheme.animations.duration.fast,
                ease: modernUITheme.animations.easing.easeOut
            });
            
            // Reset to normal state
            buttonGraphics.clear();
            buttonGraphics.fillGradientStyle(bgColor1, bgColor1, bgColor2, bgColor2, 0.9);
            buttonGraphics.fillRoundedRect(
                -buttonSize/2, -buttonSize/2, 
                buttonSize, buttonSize, 
                modernUITheme.borderRadius.md
            );
            buttonGraphics.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.4);
            buttonGraphics.strokeRoundedRect(
                -buttonSize/2, -buttonSize/2, 
                buttonSize, buttonSize, 
                modernUITheme.borderRadius.md
            );
            
            // Hide tooltip with animation
            if (tooltipText) {
                this.tweens.add({
                    targets: tooltipText,
                    alpha: 0,
                    y: tooltipText.y + 5,
                    duration: modernUITheme.animations.duration.fast,
                    ease: modernUITheme.animations.easing.easeOut,
                    onComplete: () => tooltipText.setVisible(false)
                });
            }
        })
        .on('pointerdown', () => {
            // Satisfying click animation
            this.tweens.add({
                targets: [buttonGraphics, icon],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 60,
                ease: modernUITheme.animations.easing.easeIn,
                yoyo: true,
                onComplete: () => {
                    // Add ripple effect
                    const ripple = this.add.graphics();
                    ripple.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
                    ripple.fillCircle(0, 0, 5);
                    button.add(ripple);
                    
                    this.tweens.add({
                        targets: ripple,
                        scaleX: 4,
                        scaleY: 4,
                        alpha: 0,
                        duration: modernUITheme.animations.duration.normal,
                        ease: modernUITheme.animations.easing.easeOut,
                        onComplete: () => ripple.destroy()
                    });
                    
                    callback();
                }
            });
        });

        const elements = [buttonGraphics, icon, touchArea];
        if (tooltipText) elements.push(tooltipText);
        button.add(elements);
        
        button.setSize(touchAreaSize, touchAreaSize);

        return button;
    }

    // Update createBalanceDisplay method
    private createBalanceDisplay() {
        const isMobile = this.scale.width < 768;
        
        // Create container with improved positioning
        const balanceContainer = this.add.container(
            UIHelpers.getResponsiveSpacing(isMobile, 20, 15), 
            UIHelpers.getResponsiveSpacing(isMobile, 10, 8)
        );

        // Create modern balance text with better typography
        this.balanceText = this.add.text(0, 0, 'Loading balance...', {
            fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.md),
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: modernUITheme.colors.accent,
            fontStyle: 'bold', // Use fontStyle instead of fontWeight
            padding: { 
                x: UIHelpers.getResponsiveSpacing(isMobile, 12, 8), 
                y: UIHelpers.getResponsiveSpacing(isMobile, 6, 4) 
            },
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: modernUITheme.colors.background.primary,
                blur: 4,
                fill: true
            }
        }).setScrollFactor(0);

        // Create modern wallet display with card-like appearance
        this.walletBtn = this.add.text(
            0,
            this.balanceText.height + UIHelpers.getResponsiveSpacing(isMobile, 6, 4),
            '🦊 Loading wallet...', 
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.sm),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.info,
                backgroundColor: modernUITheme.colors.background.card,
                padding: { 
                    x: UIHelpers.getResponsiveSpacing(isMobile, 10, 8), 
                    y: UIHelpers.getResponsiveSpacing(isMobile, 4, 3) 
                }
            }
        ).setScrollFactor(0);

        // Add subtle interactive effects
        this.walletBtn.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.tweens.add({
                    targets: this.walletBtn,
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: modernUITheme.animations.duration.fast,
                    ease: modernUITheme.animations.easing.easeOut
                });
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: this.walletBtn,
                    scaleX: 1,
                    scaleY: 1,
                    duration: modernUITheme.animations.duration.fast,
                    ease: modernUITheme.animations.easing.easeOut
                });
            });

        balanceContainer.add([this.balanceText, this.walletBtn]);
        this.uiContainer.add(balanceContainer);
    }

    // Update setupBalanceListener method
    private setupBalanceListener() {
      // Clear any existing listener first
      try {
        if (this.balanceUnsubscribe && typeof this.balanceUnsubscribe === 'function') {
          this.balanceUnsubscribe();
          this.balanceUnsubscribe = undefined;
        }
      } catch (e) {
        console.warn('⚠️ UIScene: Error unsubscribing from previous balance listener', e);
      }
      
      // Only set up listener if we have a valid player ID
      if (!this.playerId) {
        console.log('ℹ️ UIScene: No player ID, skipping balance listener setup');
        return;
      }

      try {
        const playerRef = doc(db, "players", this.playerId);
        
        // Add a check for authentication state before setting up listener
        const unsubscribe = onSnapshot(playerRef, (doc) => {
          // Add safety check for scene existence
          if (!this.scene || !this.scene.isActive()) {
            console.log('ℹ️ UIScene: Scene destroyed, ignoring snapshot update');
            return;
          }
          
          if (doc.exists()) {
            const playerData = doc.data();
            // Update balance
            const balance = playerData.quiztals || 0;
            this.updateBalanceDisplay(balance);
            
            // Update wallet display
            const boundWallet = playerData.walletAddress;
            if (boundWallet) {
              const shortAddress = `${boundWallet.substring(0, 6)}...${boundWallet.substring(boundWallet.length - 4)}`;
              this.walletBtn.setText(`🦊 ${shortAddress}`).setColor('#2ecc71');
            } else {
              this.walletBtn.setText('🦊 No Wallet Bound').setColor('#e74c3c');
            }
          } else {
            this.updateBalanceDisplay(0);
            this.walletBtn.setText('🦊 No Wallet Bound').setColor('#e74c3c');
          }
        }, (error) => {
          // Add safety check for scene existence
          if (!this.scene || !this.scene.isActive()) {
            console.log('ℹ️ UIScene: Scene destroyed, ignoring error');
            return;
          }
          
          console.error("Error listening to player data:", error);
          // Add safety check before updating text
          if (this.balanceText && this.balanceText.active) {
            this.balanceText.setText('Error loading balance');
          }
          if (this.walletBtn && this.walletBtn.active) {
            this.walletBtn.setText('❌ Error').setColor('#e74c3c');
          }
        });
        
        // Store the unsubscribe function
        this.balanceUnsubscribe = unsubscribe;
      } catch (error) {
        console.error("Error setting up balance listener:", error);
        // Add safety check before updating text
        if (this.balanceText && this.balanceText.active) {
          this.balanceText.setText('Error loading balance');
        }
        if (this.walletBtn && this.walletBtn.active) {
          this.walletBtn.setText('❌ Error').setColor('#e74c3c');
        }
      }
    }

    // Remove unnecessary wallet-related methods:
    // - handleWalletConnection
    // - checkWalletConnection
    // - updateWalletDisplay

    // Update updateBalanceDisplay to handle layout
    private updateBalanceDisplay(amount: number) {
        if (this.balanceText) {
            this.balanceText
                .setText(`💰 ${amount.toLocaleString()} Quiztals`)
                .setStyle({
                    fontSize: '16px',
                    color: '#f1c40f',
                    fontStyle: 'bold',
                    padding: { x: 10, y: 5 },
                    shadow: {
                        offsetX: 1,
                        offsetY: 1,
                        color: '#000',
                        blur: 2,
                        fill: true
                    }
                });
        }
    }

    private createFooterInstructions() {
        const isMobile = this.scale.width < 768;
        
        // Enhanced instructions with better context
        const instructions = isMobile ?
            '👍 Tap NPCs to learn | 🎯 Session Rewards | 🎒 Your Items' :
            'WASD/⬅️➡️⬆️⬇️ Move | C Interact | R Rewards | I Inventory | PgUp/PgDn Scroll';

        // Create modern footer background with gradient
        const footerHeight = isMobile ? 35 : 45;
        const footerGraphics = this.add.graphics();
        
        UIHelpers.createGradientFill(
            footerGraphics,
            0,
            this.scale.height - footerHeight,
            this.scale.width,
            footerHeight,
            modernUITheme.gradients.dark,
            true
        );
        
        // Add subtle top border
        footerGraphics.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.3);
        footerGraphics.strokeRect(0, this.scale.height - footerHeight, this.scale.width, 1);

        const footerBg = this.add.rectangle(
            0,
            this.scale.height - footerHeight,
            this.scale.width,
            footerHeight,
            UIHelpers.hexToNumber(modernUITheme.colors.background.secondary),
            0.9
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(999);

        // Create modern instructions text
        const instructionsText = this.add.text(
            this.scale.width / 2,
            this.scale.height - (footerHeight / 2),
            instructions,
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.sm),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.secondary,
                align: 'center',
                padding: { 
                    x: UIHelpers.getResponsiveSpacing(isMobile, 10, 8), 
                    y: UIHelpers.getResponsiveSpacing(isMobile, 6, 4) 
                },
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: modernUITheme.colors.background.primary,
                    blur: 2,
                    fill: true
                }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000);

        this.uiContainer.add([footerGraphics, footerBg, instructionsText]);

        // Store footer elements for resize handling
        this.footerBg = footerBg;
        this.footerText = instructionsText;
        this.footerGraphics = footerGraphics;

        // Update layout method to handle footer
        this.updateLayout = () => {
            const isMobile = this.scale.width < 768;
            const panelHeight = isMobile ? 70 : 50;
            const footerHeight = isMobile ? 35 : 45;
            
            // Update background panel
            this.backgroundPanel.setSize(this.scale.width, panelHeight);
            
            // Reposition header buttons
            this.repositionHeaderButtons();
            
            // Update footer
            this.footerBg.setPosition(0, this.scale.height - footerHeight)
                .setDisplaySize(this.scale.width, footerHeight);
            this.footerText.setPosition(this.scale.width / 2, this.scale.height - (footerHeight / 2));
            
            // Update footer graphics
            this.footerGraphics.clear();
            UIHelpers.createGradientFill(
                this.footerGraphics,
                0,
                this.scale.height - footerHeight,
                this.scale.width,
                footerHeight,
                modernUITheme.gradients.dark,
                true
            );
            this.footerGraphics.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.3);
            this.footerGraphics.strokeRect(0, this.scale.height - footerHeight, this.scale.width, 1);
        };
    }

    private updateLayout() {
        const isMobile = this.scale.width < 768;
        const panelHeight = isMobile ? 70 : 50;
        
        // Update background panel
        this.backgroundPanel.setSize(this.scale.width, panelHeight);
        
        // Reposition header buttons on resize
        this.repositionHeaderButtons();
        
        // Update footer if it exists
        if (this.footerBg && this.footerText && this.footerGraphics) {
            const footerHeight = isMobile ? 35 : 45;
            this.footerBg.setPosition(0, this.scale.height - footerHeight)
                .setDisplaySize(this.scale.width, footerHeight);
            this.footerText.setPosition(this.scale.width / 2, this.scale.height - (footerHeight / 2));
            
            // Update footer graphics
            this.footerGraphics.clear();
            UIHelpers.createGradientFill(
                this.footerGraphics,
                0,
                this.scale.height - footerHeight,
                this.scale.width,
                footerHeight,
                modernUITheme.gradients.dark,
                true
            );
            this.footerGraphics.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.3);
            this.footerGraphics.strokeRect(0, this.scale.height - footerHeight, this.scale.width, 1);
        }
    }
    
    private repositionHeaderButtons() {
        if (this.headerButtons.length === 0) return;
        
        const isMobile = this.scale.width < 768;
        const buttonSize = isMobile ? 35 : 40;
        const buttonSpacing = isMobile ? 45 : 80;
        const rightMargin = isMobile ? 20 : 20;
        
        // Calculate total width needed for all buttons including spacing
        const totalButtonsWidth = (this.headerButtons.length * buttonSize) + ((this.headerButtons.length - 1) * (buttonSpacing - buttonSize));
        
        // Calculate safe starting position to ensure buttons don't go off-screen
        // Use Math.min to ensure we don't position buttons too far left
        let xPosition = Math.min(
            this.scale.width - totalButtonsWidth - rightMargin,
            this.scale.width - rightMargin - (buttonSize / 2)
        );
        
        // Ensure minimum left position to prevent cut-off on small screens
        const minLeftPosition = rightMargin + (buttonSize / 2);
        xPosition = Math.max(xPosition, minLeftPosition);
        
        // Reposition each button
        this.headerButtons.forEach((button) => {
            button.setPosition(xPosition, isMobile ? 35 : 25); // Slightly lower on mobile for better visibility
            xPosition += buttonSpacing;
        });
        
        console.log(`📱 UIScene: Repositioned ${this.headerButtons.length} header buttons for ${isMobile ? 'mobile' : 'desktop'}`);
    }

    private openInventory() {
        // Check if InventoryScene is active
        const isInventoryOpen = this.scene.isActive('InventoryScene');

        if (isInventoryOpen) {
            // Close inventory if it's open
            this.scene.stop('InventoryScene');
            this.scene.resume('GameScene');
        } else {
            // Open inventory if it's closed
            this.scene.launch('InventoryScene', {
                onClose: () => this.scene.resume('GameScene')
            });
            this.scene.pause('GameScene');
        }
    }

    // Add method to handle token claim scene
    private openTokenClaim() {
        // Check if TokenClaimScene is active
        const isClaimOpen = this.scene.isActive('TokenClaimScene');

        if (isClaimOpen) {
            // Close claim if it's open
            this.scene.stop('TokenClaimScene');
            this.scene.resume('GameScene');
        } else {
            // Open claim scene directly - wallet check will happen in TokenClaimScene
            this.scene.launch('TokenClaimScene', {
                onClose: () => this.scene.resume('GameScene')
            });
            this.scene.pause('GameScene');
        }
    }

    /**
     * Open or close the guide book scene
     */
    private openGuideBook() {
        // Check if GuideBookScene is active
        const isGuideBookOpen = this.scene.isActive('GuideBookScene');

        if (isGuideBookOpen) {
            // Close guide book if it's open
            this.scene.stop('GuideBookScene');
            this.scene.resume('GameScene');
        } else {
            // Open guide book if it's closed
            this.scene.launch('GuideBookScene');
            this.scene.pause('GameScene');
        }
    }

    /**
     * Initialize reward tracking system
     */
    private initializeRewardTracking(): void {
        // Initialize the reward session
        QuiztalRewardLog.initializeSession();
        
        // Create the reward tracker UI component
        this.rewardTracker = new QuiztalRewardTracker(this);
        
        // Show it initially if there are existing rewards in session
        const stats = QuiztalRewardLog.getSessionStats();
        if (stats.rewardCount > 0) {
            this.rewardTracker.show();
        }
        
        console.log('🎯 Reward tracking initialized:', QuiztalRewardLog.getSessionSummary());
    }
    
    /**
     * Toggle the reward tracker display
     */
    private toggleRewardTracker(): void {
        if (this.rewardTracker) {
            this.rewardTracker.toggle();
        }
    }

    /**
     * Open or close the wallet verification window
     */
    private openWalletWindow() {
        // Check if WalletWindowScene is active
        const isWalletWindowOpen = this.scene.isActive('WalletWindowScene');

        if (isWalletWindowOpen) {
            // Close wallet window if it's open
            this.scene.stop('WalletWindowScene');
            this.scene.resume('GameScene');
        } else {
            // Open wallet window if it's closed
            this.scene.launch('WalletWindowScene', {
                onClose: () => this.scene.resume('GameScene')
            });
            this.scene.pause('GameScene');
        }
    }

    private handleLogout() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            try {
                // Check if localStorage is available
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem('quiztal-player');
                    
                    // Clear reward log on logout as requested
                    QuiztalRewardLog.clearLog();
                    console.log('🗑️ Reward log cleared on logout');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
            
            // Stop all active scenes
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.stop('InventoryScene');
            
            // Start GoogleLoginScene with fade in
            this.scene.start('GoogleLoginScene', {
                onStart: () => this.cameras.main.fadeIn(500, 0, 0, 0)
            });
        });
    }

    // Update shutdown method
    shutdown() {
        console.log('🛑 UIScene: Starting shutdown...');
        
        // Clean up Firebase listeners first
        try {
            if (this.balanceUnsubscribe && typeof this.balanceUnsubscribe === 'function') {
                this.balanceUnsubscribe();
                this.balanceUnsubscribe = undefined;
            }
        } catch (e) {
            console.warn('⚠️ UIScene: Error unsubscribing from balance listener', e);
        }
        
        // Clean up reward tracker
        try {
            if (this.rewardTracker) {
                this.rewardTracker.destroy();
                (this.rewardTracker as any) = null;
            }
        } catch (e) {
            console.warn('⚠️ UIScene: Error destroying reward tracker', e);
        }
        
        // Clean up keyboard listeners
        try {
            if (this.input && this.input.keyboard) {
                this.input.keyboard.removeAllListeners();
            }
        } catch (e) {
            console.warn('⚠️ UIScene: Error cleaning up keyboard listeners', e);
        }
        
        // Clean up UI elements
        try {
            if (this.uiContainer) {
                this.uiContainer.destroy(true); // Destroy children as well
                (this.uiContainer as any) = null;
            }
        } catch (e) {
            console.warn('⚠️ UIScene: Error destroying UI container', e);
        }
        
        // Clean up header buttons array
        try {
            this.headerButtons = [];
        } catch (e) {
            console.warn('⚠️ UIScene: Error cleaning up header buttons array', e);
        }
        
        console.log('✅ UIScene: Shutdown complete');
    }
}

