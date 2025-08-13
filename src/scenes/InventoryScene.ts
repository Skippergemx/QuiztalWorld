import Phaser from 'phaser';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../utils/firebase';

interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface TabContent {
    container: Phaser.GameObjects.Container;
    isActive: boolean;
}

interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

export default class InventoryScene extends Phaser.Scene {
    private overlay!: Phaser.GameObjects.Rectangle;
    private window!: Phaser.GameObjects.Container;
    private items: InventoryItem[] = [];
    private playerId: string;
    private tabContents: { [key: string]: TabContent } = {};
    private activeTabKey: string = 'items';
    private tooltipContainer?: Phaser.GameObjects.Container;
    private tabY!: number;

    constructor() {
        super({ key: 'InventoryScene' });
        this.playerId = JSON.parse(localStorage.getItem('quiztal-player') || '{}')?.uid || '';
        
        // Add mock items
        this.items = [
            {
                id: '1',
                name: 'Health Crystal',
                description: 'Restores health points',
                quantity: 3,
                icon: '💖',
                rarity: 'common'
            },
            {
                id: '2',
                name: 'Magic Staff',
                description: 'Increases magic power',
                quantity: 1,
                icon: '👑',
                rarity: 'rare'
            },
            {
                id: '3',
                name: 'Ancient Crown',
                description: 'A legendary crown of power',
                quantity: 1,
                icon: '👑',
                rarity: 'legendary'
            },
            {
                id: '4',
                name: 'Mystery Box',
                description: 'Contains random rewards',
                quantity: 5,
                icon: '🎁',
                rarity: 'epic'
            },
            {
                id: '5',
                name: 'Lucky Coin',
                description: 'Brings good fortune',
                quantity: 10,
                icon: '🎁',
                rarity: 'rare'
            }
        ];
    }

    preload() {
        // Preload NFT images if they exist
        const savedNFTs = localStorage.getItem('quiztal-nfts');
        if (savedNFTs) {
            const nfts: NFTData[] = JSON.parse(savedNFTs);
            nfts.forEach(nft => {
                this.load.image(`nft-${nft.tokenId}`, nft.image);
            });
        }
    }

    create() {
        this.createBackground();
        this.createWindow();
        this.createTabs();
        this.setupInventoryListener();
        
        // Show entrance animation
        this.window.setScale(0.8);
        this.tweens.add({
            targets: this.window,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    private createBackground() {
        this.overlay = this.add.rectangle(
            0, 0, 
            this.scale.width, 
            this.scale.height, 
            0x000000, 0.7
        )
        .setOrigin(0)
        .setInteractive()
        .on('pointerdown', () => this.closeInventory());
    }

    private createWindow() {
        const width = Math.min(800, this.scale.width * 0.8);
        const height = Math.min(600, this.scale.height * 0.8);

        this.window = this.add.container(this.scale.width/2, this.scale.height/2);

        // Background with border
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50)
            .setStrokeStyle(2, 0x3498db);

        // Create header container
        const headerContainer = this.add.container(0, -height/2);
        
        // Title background
        const titleBg = this.add.rectangle(
            0, 
            0, 
            width, 
            50, 
            0x34495e
        ).setOrigin(0.5, 0);

        // Title text
        const title = this.add.text(0, 25, '📦 Inventory', {
            fontSize: '20px',
            color: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(
            width/2 - 40, 
            25, 
            '✖',
            { 
                fontSize: '20px', 
                color: '#ffffff',
                padding: { x: 10, y: 5 }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setTint(0xff0000))
        .on('pointerout', () => closeBtn.clearTint())
        .on('pointerdown', () => this.closeInventory());

        headerContainer.add([titleBg, title, closeBtn]);

        // Create content area
        const contentBg = this.add.rectangle(
            0,
            0,
            width - 40,
            height - 120,
            0x2c3e50
        ).setStrokeStyle(1, 0x3498db);

        // Store tabY in class property to use it in createTabs
        this.tabY = -height/2 + 70;

        // Create scroll area for items (if needed)
        const scrollArea = this.add.container(0, 20);

        this.window.add([bg, headerContainer, contentBg, scrollArea]);
    }

    private createTabs() {
        const tabData = [
            { key: 'items', label: '🎒 Items', x: -100 },
            { key: 'nfts', label: '💎 NFTs', x: 100 }
        ];

        tabData.forEach(({ key, label, x }) => {
            // Use tabY from class property instead of hardcoded value
            const tab = this.createTabButton(x, this.tabY, label, key);
            this.window.add(tab);

            // Create content container
            const content = this.add.container(0, 0);
            content.setVisible(key === this.activeTabKey);
            this.window.add(content);

            this.tabContents[key] = {
                container: content,
                isActive: key === this.activeTabKey
            };
        });

        // Load initial content
        this.switchTab(this.activeTabKey);
    }

    // Update createTabButton method
    private createTabButton(x: number, y: number, label: string, key: string): Phaser.GameObjects.Container {
        const tab = this.add.container(x, y);
        
        // Define colors for active and inactive states
        const colors = {
            active: 0x2ecc71,    // Green color for active tab
            inactive: 0x2c3e50,  // Dark blue for inactive tab
            hover: 0x3498db      // Blue for hover state
        };
        
        const bg = this.add.rectangle(0, 0, 180, 45, colors.inactive)
            .setStrokeStyle(2, 0x3498db);

        const text = this.add.text(0, 0, label, {
            fontSize: '16px',
            color: '#ffffff',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5);

        tab.add([bg, text]);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.switchTab(key))
            .on('pointerover', () => bg.setFillStyle(colors.hover))
            .on('pointerout', () => {
                bg.setFillStyle(this.activeTabKey === key ? colors.active : colors.inactive);
            });

        // Set initial state
        if (key === this.activeTabKey) {
            bg.setFillStyle(colors.active);
        }

        return tab;
    }

    private switchTab(key: string) {
        // Update tab states
        Object.entries(this.tabContents).forEach(([tabKey, content]) => {
            content.isActive = tabKey === key;
            content.container.setVisible(tabKey === key);
        });

        this.activeTabKey = key;

        // Load content based on tab
        if (key === 'items') {
            this.loadItems();
        } else {
            this.loadNFTs();
        }
    }

    private loadItems() {
        const content = this.tabContents.items.container;
        content.removeAll(true);

        // Create grid layout for items with better spacing
        const gridConfig = {
            itemsPerRow: 4,
            itemWidth: 100,
            itemHeight: 100,
            spacing: 20,
            startX: -160,    // Adjusted for centering
            startY: -40      // Space below tabs
        };

        this.items.forEach((item, index) => {
            const row = Math.floor(index / gridConfig.itemsPerRow);
            const col = index % gridConfig.itemsPerRow;

            const x = gridConfig.startX + (col * (gridConfig.itemWidth + gridConfig.spacing));
            const y = gridConfig.startY + (row * (gridConfig.itemHeight + gridConfig.spacing));

            this.createItemSlot(x, y, item, content);
        });
    }

    // Update createItemSlot method
    private createItemSlot(x: number, y: number, item: InventoryItem, parent: Phaser.GameObjects.Container) {
        const rarityColors = {
            common: 0x95a5a6,
            rare: 0x3498db,
            epic: 0x9b59b6,
            legendary: 0xf1c40f
        };

        const slot = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 100, 100, rarityColors[item.rarity])
            .setStrokeStyle(2, 0x3498db);

        // Adjust text positions
        const icon = this.add.text(0, -15, item.icon, { 
            fontSize: '28px',
            padding: { x: 2, y: 2 }
        }).setOrigin(0.5);

        const name = this.add.text(0, 25, item.name, {
            fontSize: '11px',
            color: '#ffffff',
            wordWrap: { width: 80 },
            align: 'center'
        }).setOrigin(0.5);

        // Adjust quantity badge position
        if (item.quantity > 1) {
            const qty = this.add.text(30, -30, `x${item.quantity}`, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#2c3e50',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);
            slot.add(qty);
        }

        slot.add([bg, icon, name]);
        parent.add(slot);

        // Make slot interactive
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.showItemTooltip(item, x, y))
            .on('pointerout', () => this.hideItemTooltip());
    }

    private showItemTooltip(item: InventoryItem, x: number, y: number) {
        // Hide any existing tooltip
        this.hideItemTooltip();

        // Create tooltip container
        this.tooltipContainer = this.add.container(x + 120, y);

        // Create tooltip background
        const padding = { x: 15, y: 10 };
        const tooltipBg = this.add.rectangle(
            0, 0,
            220, 120,
            0x2c3e50
        )
        .setStrokeStyle(2, 0x3498db)
        .setOrigin(0);

        // Create tooltip content
        const titleText = this.add.text(padding.x, padding.y, item.name, {
            fontSize: '16px',
            color: this.getRarityColor(item.rarity),
            fontStyle: 'bold'
        });

        const descriptionText = this.add.text(padding.x, titleText.y + 30, item.description, {
            fontSize: '14px',
            color: '#ffffff',
            wordWrap: { width: 200 }
        });

        const rarityText = this.add.text(padding.x, descriptionText.y + 40, `Rarity: ${item.rarity}`, {
            fontSize: '14px',
            color: this.getRarityColor(item.rarity)
        });

        // Add elements to tooltip
        this.tooltipContainer.add([tooltipBg, titleText, descriptionText, rarityText]);
        this.tabContents[this.activeTabKey].container.add(this.tooltipContainer);
    }

    private hideItemTooltip() {
        if (this.tooltipContainer) {
            this.tooltipContainer.destroy();
            this.tooltipContainer = undefined;
        }
    }

    private getRarityColor(rarity: string): string {
        const colors = {
            common: '#95a5a6',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f1c40f'
        };
        return colors[rarity as keyof typeof colors];
    }

    private loadNFTs() {
        const content = this.tabContents.nfts.container;
        content.removeAll(true);

        try {
            const savedNFTs = localStorage.getItem('quiztal-nfts');
            const nfts: NFTData[] = savedNFTs ? JSON.parse(savedNFTs) : [];

            if (nfts.length === 0) {
                this.showNFTMessage('No verified NFTs found', content);
                return;
            }

            // Define grid configuration similar to items layout
            const gridConfig = {
                itemsPerRow: 3,
                itemWidth: 140,
                itemHeight: 140,
                spacing: 20,
                startX: -150,  // Centered position for 3 items
                startY: -40    // Match the items tab spacing
            };

            // Display NFTs in a grid with new configuration
            nfts.slice(0, 5).forEach((nft, index) => {
                const row = Math.floor(index / gridConfig.itemsPerRow);
                const col = index % gridConfig.itemsPerRow;

                const x = gridConfig.startX + (col * (gridConfig.itemWidth + gridConfig.spacing));
                const y = gridConfig.startY + (row * (gridConfig.itemHeight + gridConfig.spacing));

                this.createNFTSlot(x, y, nft, content);
            });

            // Adjust "View More" button position based on grid
            if (nfts.length > 5) {
                this.showViewMoreButton(content, gridConfig.startY + 300);  // Position below the grid
            }
        } catch (error) {
            console.error('Error loading NFTs:', error);
            this.showNFTMessage('Failed to load NFTs', content);
        }
    }

    private createNFTSlot(x: number, y: number, nft: NFTData, parent: Phaser.GameObjects.Container) {
        const slot = this.add.container(x, y);

        // Create slot background
        const bg = this.add.rectangle(0, 0, 140, 140, 0x2c3e50)
            .setStrokeStyle(2, 0x3498db);

        // Add NFT image if it's loaded
        const imageKey = `nft-${nft.tokenId}`;
        
        // Create loading text
        const loadingText = this.add.text(0, -10, 'Loading...', {
            fontSize: '14px',
            color: '#ffffff',
        }).setOrigin(0.5);

        // Create loading spinner emoji that rotates
        const loadingSpinner = this.add.text(0, 15, '⭕', {
            fontSize: '24px'
        }).setOrigin(0.5);

        // Add rotation animation to spinner
        this.tweens.add({
            targets: loadingSpinner,
            angle: 360,
            duration: 2000,
            repeat: -1
        });

        // Add loading elements to slot
        slot.add([bg, loadingText, loadingSpinner]);

        // Try to load the image
        if (this.textures.exists(imageKey)) {
            // Remove loading elements
            loadingText.destroy();
            loadingSpinner.destroy();

            const image = this.add.image(0, 0, imageKey)
                .setOrigin(0.5);
                
            // Scale image to fit slot
            const scale = Math.min(130 / image.width, 130 / image.height);
            image.setScale(scale);
            
            slot.add(image);
        } else {
            // Set up a one-time texture load listener
            this.textures.once(`addtexture-${imageKey}`, () => {
                // Remove loading elements
                loadingText.destroy();
                loadingSpinner.destroy();

                const image = this.add.image(0, 0, imageKey)
                    .setOrigin(0.5);
                    
                // Scale image to fit slot
                const scale = Math.min(130 / image.width, 130 / image.height);
                image.setScale(scale);
                
                slot.add(image);
            });

            // Handle load error after timeout
            this.time.delayedCall(10000, () => {
                if (!this.textures.exists(imageKey)) {
                    loadingText.destroy();
                    loadingSpinner.destroy();
                    
                    // Show error placeholder
                    const errorText = this.add.text(0, 0, '❌', {
                        fontSize: '40px'
                    }).setOrigin(0.5);
                    slot.add(errorText);
                }
            });
        }

        // Add token ID label
        const tokenIdText = this.add.text(0, 60, `#${nft.tokenId}`, {
            fontSize: '14px',
            color: '#3498db',
            backgroundColor: '#2c3e50',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5);

        slot.add(tokenIdText);
        parent.add(slot);

        // Make slot interactive
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setStrokeStyle(2, 0xf1c40f);
                this.showNFTTooltip(nft, x, y);
            })
            .on('pointerout', () => {
                bg.setStrokeStyle(2, 0x3498db);
                this.hideItemTooltip();
            });
    }

    private showNFTTooltip(nft: NFTData, x: number, y: number) {
        this.hideItemTooltip();

        this.tooltipContainer = this.add.container(x + 160, y);

        const tooltipBg = this.add.rectangle(
            0, 0,
            220, 100,
            0x2c3e50
        )
        .setStrokeStyle(2, 0x3498db)
        .setOrigin(0);

        const titleText = this.add.text(10, 10, nft.name, {
            fontSize: '16px',
            color: '#f1c40f',
            fontStyle: 'bold'
        });

        const descriptionText = this.add.text(10, 40, nft.description, {
            fontSize: '14px',
            color: '#ffffff',
            wordWrap: { width: 200 }
        });

        this.tooltipContainer.add([tooltipBg, titleText, descriptionText]);
        this.tabContents[this.activeTabKey].container.add(this.tooltipContainer);
    }

    // Update showNFTMessage method
    private showNFTMessage(message: string, parent: Phaser.GameObjects.Container) {
        const text = this.add.text(0, 0, message, {
            fontSize: '16px', // Reduced from 18px
            color: '#ffffff',
            align: 'center',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        parent.add(text);
    }

    // Update showViewMoreButton to accept Y position
    private showViewMoreButton(parent: Phaser.GameObjects.Container, y: number = 150) {
        const button = this.add.text(0, y, '🔍 View Full Collection', {
            fontSize: '14px',
            color: '#3498db',
            backgroundColor: '#2c3e50',
            padding: { x: 12, y: 6 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.open('https://market.crystle.world', '_blank');
        })
        .on('pointerover', () => button.setBackgroundColor('#34495e'))
        .on('pointerout', () => button.setBackgroundColor('#2c3e50'));
        
        parent.add(button);
    }

    private setupInventoryListener() {
        if (!this.playerId) return;

        const unsubscribe = onSnapshot(doc(db, "players", this.playerId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data?.inventory) {
                    this.items = data.inventory;
                    if (this.activeTabKey === 'items') {
                        this.loadItems();
                    }
                }
            }
        });

        this.events.once('shutdown', unsubscribe);
    }

    private closeInventory() {
        // Add fade out animation to overlay
        this.tweens.add({
            targets: this.overlay,
            alpha: 0,
            duration: 200,
            onComplete: () => this.scene.stop()
        });

        // Add scale down animation to window
        this.tweens.add({
            targets: this.window,
            scale: 0.8,
            duration: 200,
            ease: 'Back.in'
        });
    }
}