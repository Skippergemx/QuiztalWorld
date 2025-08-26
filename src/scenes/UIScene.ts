import Phaser from 'phaser';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Web3Service } from '../services/Web3Service';
import QuiztalRewardTracker from '../components/QuiztalRewardTracker';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';

export default class UIScene extends Phaser.Scene {
    private uiContainer!: Phaser.GameObjects.Container;
    private backgroundPanel!: Phaser.GameObjects.Rectangle;
    private balanceText!: Phaser.GameObjects.Text;
    private playerId: string = '';
    private balanceUnsubscribe?: () => void;
    private keyI!: Phaser.Input.Keyboard.Key; // <-- Added keyI property
    private keyR!: Phaser.Input.Keyboard.Key; // <-- Added keyR property for rewards
    private walletBtn!: Phaser.GameObjects.Text; // Update or add this property
    private web3Service: Web3Service;
    private rewardTracker!: QuiztalRewardTracker; // Reward tracker component
    private headerButtons: Phaser.GameObjects.Container[] = []; // Track header buttons for resize
    private footerBg!: Phaser.GameObjects.Rectangle; // Footer background
    private footerText!: Phaser.GameObjects.Text; // Footer text

    constructor() {
        super({ key: 'UIScene' });
        this.web3Service = new Web3Service();
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
        const panelHeight = isMobile ? 70 : 50;  // Increased height for mobile to accommodate larger buttons

        const graphics = this.add.graphics();
        graphics.fillStyle(0x2c3e50, 0.95);
        graphics.fillRect(0, 0, this.scale.width, panelHeight);
        
        this.backgroundPanel = this.add.rectangle(0, 0, this.scale.width, panelHeight, 0x000000, 0.85)
            .setOrigin(0)
            .setStrokeStyle(1, 0x3498db, 0.5)
            .setScrollFactor(0);

        this.uiContainer.add(this.backgroundPanel);
    }

    private createButtons() {
        const isMobile = this.scale.width < 768;
        const buttonConfigs = [
            {
                text: '💎',  // Claim tokens button
                tooltip: 'Claim Tokens',
                color: '#9b59b6',  // Purple color for claim button
                hoverColor: '#8e44ad',
                callback: () => this.openTokenClaim()
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
        const touchPadding = isMobile ? 15 : 10;
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
        const buttonSize = isMobile ? 35 : 40;
        const button = this.add.container(0, 0);
        const touchPadding = isMobile ? 8 : 10;  // Reduced padding to prevent screen overflow
        
        const bg = this.add.rectangle(0, 0, buttonSize, buttonSize, parseInt(color.replace('#', '0x')))
            .setOrigin(0.5); // Center origin for better positioning

        const icon = this.add.text(0, 0, text, {
            fontSize: isMobile ? '16px' : '18px', // Slightly larger for better visibility
            padding: { x: 2, y: 2 }
        }).setOrigin(0.5);

        // Hide tooltip on mobile
        const tooltipText = !isMobile ? this.add.text(0, buttonSize/2 + 15, tooltip, {
            fontSize: '9px',
            backgroundColor: '#2c3e50',
            padding: { x: 8, y: 4 },
            color: '#ffffff'
        })
        .setOrigin(0.5, 0)
        .setVisible(false) : null;

        // Create touch area that doesn't extend beyond reasonable bounds
        const touchArea = this.add.rectangle(
            0, 0, 
            buttonSize + (touchPadding * 2), 
            buttonSize + (touchPadding * 2), 
            0x000000, 
            0
        )
        .setOrigin(0.5) // Center origin
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            bg.setFillStyle(parseInt(hoverColor.replace('#', '0x')));
            bg.setScale(1.1); // Slight scale effect for feedback
            if (tooltipText) tooltipText.setVisible(!isMobile);
        })
        .on('pointerout', () => {
            bg.setFillStyle(parseInt(color.replace('#', '0x')));
            bg.setScale(1);
            if (tooltipText) tooltipText.setVisible(false);
        })
        .on('pointerdown', () => {
            // Visual feedback on tap
            bg.setScale(0.9);
            this.time.delayedCall(100, () => {
                bg.setScale(1);
            });
            callback();
        });

        const elements = [bg, icon, touchArea];
        if (tooltipText) elements.push(tooltipText);
        button.add(elements);
        
        // Set proper size for container
        button.setSize(buttonSize + (touchPadding * 2), buttonSize + (touchPadding * 2));

        return button;
    }

    // Update createBalanceDisplay method
    private createBalanceDisplay() {
        const isMobile = this.scale.width < 768;
        
        // Create container with adjusted Y position
        const balanceContainer = this.add.container(
            isMobile ? 10 : 20, 
            isMobile ? 5 : 10
        );

        // Create balance text
        this.balanceText = this.add.text(0, 0, 'Loading balance...', {
            fontSize: isMobile ? '14px' : '16px',
            color: '#f1c40f',
            fontStyle: 'bold',
            padding: { x: isMobile ? 5 : 10, y: 2 },
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 2,
                fill: true
            }
        }).setScrollFactor(0);

        // Create wallet display below balance
        this.walletBtn = this.add.text(
            0,  // Always align with balance text
            this.balanceText.height + 2,  // Position just below balance
            '🦊 Loading...', 
            {
                fontSize: isMobile ? '12px' : '14px',
                color: '#3498db',
                backgroundColor: '#2c3e50',
                padding: { x: isMobile ? 5 : 10, y: 2 }
            }
        ).setScrollFactor(0);

        balanceContainer.add([this.balanceText, this.walletBtn]);
        this.uiContainer.add(balanceContainer);
    }

    // Update setupBalanceListener method
    private setupBalanceListener() {
        if (!this.playerId) return;

        const playerRef = doc(db, "players", this.playerId);
        
        this.balanceUnsubscribe = onSnapshot(playerRef, (doc) => {
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
            console.error("Error listening to player data:", error);
            this.balanceText.setText('Error loading balance');
            this.walletBtn.setText('❌ Error').setColor('#e74c3c');
        });
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
        
        // Don't show keyboard instructions on mobile
        const instructions = isMobile ?
            'Tap NPCs to interact | Tap 🎯 for Session Rewards | Tap 🎒 for Inventory' :
            '⬅️➡️⬆️⬇️ or WASD to move | Press C near NPCs | Press R for Rewards | Press I for Inventory | PgUp/PgDn to scroll';

        const footerBg = this.add.rectangle(
            0,
            this.scale.height - (isMobile ? 30 : 40),
            this.scale.width,
            isMobile ? 30 : 40,
            0x2c3e50,
            0.85
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(999);

        const instructionsText = this.add.text(
            this.scale.width / 2,
            this.scale.height - (isMobile ? 15 : 20),
            instructions,
            {
                fontSize: isMobile ? '12px' : '14px',
                color: '#ffffff',
                padding: { x: isMobile ? 5 : 10, y: 5 }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(999);

        this.uiContainer.add([footerBg, instructionsText]);

        // Store footer elements for resize handling
        this.footerBg = footerBg;
        this.footerText = instructionsText;

        // Update layout method to handle footer
        const originalLayout = this.updateLayout;
        this.updateLayout = () => {
            const isMobile = this.scale.width < 768;
            const panelHeight = isMobile ? 70 : 50;
            
            // Update background panel
            this.backgroundPanel.setSize(this.scale.width, panelHeight);
            
            // Reposition header buttons
            this.repositionHeaderButtons();
            
            // Update footer
            this.footerBg.setPosition(0, this.scale.height - (isMobile ? 30 : 40))
                .setDisplaySize(this.scale.width, isMobile ? 30 : 40);
            this.footerText.setPosition(this.scale.width / 2, this.scale.height - (isMobile ? 15 : 20));
        };
    }

    private updateLayout() {
        const isMobile = this.scale.width < 768;
        const panelHeight = isMobile ? 70 : 50;
        
        // Update background panel
        this.backgroundPanel.setSize(this.scale.width, panelHeight);
        
        // Reposition header buttons on resize
        this.repositionHeaderButtons();
    }
    
    private repositionHeaderButtons() {
        if (this.headerButtons.length === 0) return;
        
        const isMobile = this.scale.width < 768;
        const buttonSize = isMobile ? 35 : 40;
        const buttonSpacing = isMobile ? 45 : 80;
        const rightMargin = isMobile ? 20 : 20;
        
        // Calculate total width needed
        const totalButtonsWidth = (this.headerButtons.length * buttonSize) + ((this.headerButtons.length - 1) * (buttonSpacing - buttonSize));
        
        // Calculate safe starting position
        let xPosition = Math.max(
            this.scale.width - totalButtonsWidth - rightMargin,
            rightMargin + buttonSize / 2
        );
        
        // Reposition each button
        this.headerButtons.forEach((button, index) => {
            button.setPosition(xPosition, isMobile ? 30 : 25);
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
        if (this.balanceUnsubscribe) {
            this.balanceUnsubscribe();
        }
        this.scale.off('resize', this.updateLayout, this);
        
        // Remove keyboard listeners
        if (this.keyI) {
            this.keyI.removeAllListeners();
            if (this.input.keyboard) {
                this.input.keyboard.removeKey(this.keyI);
            }
        }
        
        if (this.keyR) {
            this.keyR.removeAllListeners();
            if (this.input.keyboard) {
                this.input.keyboard.removeKey(this.keyR);
            }
        }
        
        // Clean up reward tracker
        if (this.rewardTracker) {
            this.rewardTracker.destroy();
        }

        // Disconnect wallet
        this.web3Service.disconnect();
    }
}

