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
        const graphics = this.add.graphics();
        graphics.fillStyle(0x2c3e50, 0.95);
        graphics.fillRect(0, 0, this.scale.width, 60);
        
        this.backgroundPanel = this.add.rectangle(0, 0, this.scale.width, 60, 0x000000, 0.85)
            .setOrigin(0)
            .setStrokeStyle(1, 0x3498db, 0.5)
            .setScrollFactor(0);

        this.uiContainer.add(this.backgroundPanel);
    }

    private createButtons() {
        const buttonConfigs = [
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

        // Adjust starting position since we removed one button
        let xPosition = this.scale.width - 200;
        buttonConfigs.forEach(config => {
            const button = this.createNavButton(
                config.text,
                config.tooltip,
                config.color,
                config.hoverColor,
                config.callback
            ).setPosition(xPosition, 10);

            this.uiContainer.add(button);
            xPosition += 80;
        });
    }

    private createNavButton(text: string, tooltip: string, color: string, hoverColor: string, callback: () => void): Phaser.GameObjects.Container {
        const buttonSize = 40;
        const button = this.add.container(0, 0);
        const touchPadding = 10;
        
        const bg = this.add.rectangle(0, 0, buttonSize, buttonSize, parseInt(color.replace('#', '0x')))
            .setOrigin(0);

        // Update icon with smaller font size
        const icon = this.add.text(buttonSize/2, buttonSize/2, text, {
            fontSize: '15px',  // Decreased from 24px
            padding: { x: 2, y: 2 }  // Added padding to prevent cutoff
        }).setOrigin(0.5);

        // Update tooltip with adjusted font size and more padding
        const tooltipText = this.add.text(buttonSize/2, buttonSize + 8, tooltip, {
            fontSize: '9px',  // Decreased from 14px
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 6 },  // Increased padding
            color: '#ffffff'
        })
        .setOrigin(0.5, 0)
        .setVisible(false);

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
            tooltipText.setVisible(true);
        })
        .on('pointerout', () => {
            bg.setFillStyle(parseInt(color.replace('#', '0x')));
            tooltipText.setVisible(false);
        })
        .on('pointerdown', () => {
            bg.setFillStyle(parseInt(hoverColor.replace('#', '0x')));
            setTimeout(() => {
                bg.setFillStyle(parseInt(color.replace('#', '0x')));
                callback();
            }, 100);
        });

        button.add([bg, icon, tooltipText, touchArea]);
        button.setSize(buttonSize + (touchPadding * 2), buttonSize + (touchPadding * 2));

        return button;
    }

    // Update createBalanceDisplay method
    private createBalanceDisplay() {
        const balanceContainer = this.add.container(20, 20);

        // Create balance text
        this.balanceText = this.add.text(0, 0, 'Loading balance...', {
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
        })
        .setScrollFactor(0);

        // Create wallet display (not interactive)
        this.walletBtn = this.add.text(this.balanceText.width + 20, 0, '🦊 Loading...', {
            fontSize: '14px',
            color: '#3498db',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        })
        .setScrollFactor(0);

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

            // Update wallet position based on new balance text width
            if (this.walletBtn) {
                this.walletBtn.setX(this.balanceText.width + 20);
            }
        }
    }

    private createFooterInstructions() {
        const footerBg = this.add.rectangle(
            0,
            this.scale.height - 40,
            this.scale.width,
            40,
            0x2c3e50,
            0.85
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(999);

        const instructions = [
            '⬅️➡️⬆️⬇️ or WASD to move',
            '| Press C near NPCs to interact',
            '| Press I for Inventory'
        ].join(' ');

        const instructionsText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 20,
            instructions,
            {
                fontSize: '14px',
                color: '#ffffff',
                padding: { x: 10, y: 5 }
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

