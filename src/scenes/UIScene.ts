import Phaser from 'phaser';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Web3Service } from '../services/Web3Service';

export default class UIScene extends Phaser.Scene {
    private uiContainer!: Phaser.GameObjects.Container;
    private backgroundPanel!: Phaser.GameObjects.Rectangle;
    private balanceText!: Phaser.GameObjects.Text;
    private playerId: string = '';
    private balanceUnsubscribe?: () => void;
    private keyI!: Phaser.Input.Keyboard.Key; // <-- Added keyI property
    private walletBtn!: Phaser.GameObjects.Text; // Update or add this property
    private web3Service: Web3Service;
    
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
            this.createFooterInstructions(); // Add this line

            // Setup event listeners
            this.scale.on('resize', this.updateLayout, this);

            // Replace loadPlayerBalance() call with setupBalanceListener
            this.setupBalanceListener();

            // Add keyboard listener for inventory
            if (this.input.keyboard) {
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
                this.keyI.on('down', () => this.openInventory());
            }
        } catch (error) {
            console.error('Error initializing UI:', error);
            this.playerId = '';
        }
    }

    private createUIPanel() {
        const isMobile = this.scale.width < 768;
        const panelHeight = isMobile ? 60 : 50;  // Increased height for mobile

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
                text: '💎',  // Add claim button first
                tooltip: 'Claim Tokens',
                color: '#9b59b6',  // Purple color for claim button
                hoverColor: '#8e44ad',
                callback: () => this.openTokenClaim()
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

        // Adjust position for mobile - update spacing for new button
        let xPosition = this.scale.width - (isMobile ? 150 : 280);  // Adjusted for extra button
        buttonConfigs.forEach(config => {
            const button = this.createNavButton(
                config.text,
                config.tooltip,
                config.color,
                config.hoverColor,
                config.callback
            ).setPosition(xPosition, isMobile ? 5 : 10);

            this.uiContainer.add(button);
            xPosition += isMobile ? 50 : 80;
        });
    }

    private createNavButton(text: string, tooltip: string, color: string, hoverColor: string, callback: () => void): Phaser.GameObjects.Container {
        const isMobile = this.scale.width < 768;
        const buttonSize = isMobile ? 35 : 40;
        const button = this.add.container(0, 0);
        const touchPadding = isMobile ? 15 : 10;  // Larger touch area for mobile
        
        const bg = this.add.rectangle(0, 0, buttonSize, buttonSize, parseInt(color.replace('#', '0x')))
            .setOrigin(0);

        const icon = this.add.text(buttonSize/2, buttonSize/2, text, {
            fontSize: isMobile ? '14px' : '15px',
            padding: { x: 2, y: 2 }
        }).setOrigin(0.5);

        // Hide tooltip on mobile
        const tooltipText = !isMobile ? this.add.text(buttonSize/2, buttonSize + 8, tooltip, {
            fontSize: '9px',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 6 },
            color: '#ffffff'
        })
        .setOrigin(0.5, 0)
        .setVisible(false) : null;

        const touchArea = this.add.rectangle(
            -touchPadding, 
            -touchPadding, 
            buttonSize + (touchPadding * 2), 
            buttonSize + (touchPadding * 2), 
            0x000000, 
            0
        )
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            bg.setFillStyle(parseInt(hoverColor.replace('#', '0x')));
            if (tooltipText) tooltipText.setVisible(!isMobile);
        })
        .on('pointerout', () => {
            bg.setFillStyle(parseInt(color.replace('#', '0x')));
            if (tooltipText) tooltipText.setVisible(false);
        })
        .on('pointerdown', callback);

        const elements = [bg, icon, touchArea];
        if (tooltipText) elements.push(tooltipText);
        button.add(elements);
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
            'Tap NPCs to interact | Tap 🎒 for Inventory' :
            '⬅️➡️⬆️⬇️ or WASD to move | Press C near NPCs | Press I for Inventory';

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

        // Update layout method to handle footer
        const originalLayout = this.updateLayout;
        this.updateLayout = () => {
            originalLayout.call(this);
            footerBg.setPosition(0, this.scale.height - 40)
                .setDisplaySize(this.scale.width, 40);
            instructionsText.setPosition(this.scale.width / 2, this.scale.height - 20);
        };
    }

    private updateLayout() {
        this.backgroundPanel.setSize(this.scale.width, 60);
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

    private handleLogout() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            try {
                // Check if localStorage is available
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem('quiztal-player');
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
        
        // Remove keyboard listener
        if (this.keyI) {
            this.keyI.removeAllListeners();
            if (this.input.keyboard) {
                this.input.keyboard.removeKey(this.keyI);
            }
        }

        // Disconnect wallet
        this.web3Service.disconnect();
    }
}

