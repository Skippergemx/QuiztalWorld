import Phaser from 'phaser';
import { NFTData } from '../types/nft';
import { loadNFTsFromDatabase } from '../utils/Database';
import { OptimizedNFTService } from '../services/OptimizedNFTService';

// Define the inventory item structure
export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: 'consumable' | 'material' | 'key';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    icon: string;
    // Add usage function for consumables
    use?: () => void;
}

// Define the inventory data structure
interface InventoryData {
    items: InventoryItem[];
    version: number;
}

interface TabContent {
    container: Phaser.GameObjects.Container;
    isActive: boolean;
}

export default class InventoryScene extends Phaser.Scene {
    private inventoryWindow!: Phaser.GameObjects.Container;
    private activeTab: string = 'items';
    private tabContents: { [key: string]: TabContent } = {};
    private tabButtons: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private tooltipContainer?: Phaser.GameObjects.Container;

    // Replace mockItems with actual inventory
    private inventoryItems: InventoryItem[] = [];
    private inventoryKey: string = 'quiztal-inventory';

    // Update these properties in the class
    private currentPage: number = 0;
    private itemsPerPage: number = 5; // Reduced from 15 to 5 items per page
    private nftCurrentPage: number = 0;
    private nftsPerPage: number = 5; // Reduced from 15 to 5 items per page

    // Add this property to the InventoryScene class
    private isMobile: boolean = false;

    constructor() {
        super({ key: 'InventoryScene' });
    }

    create() {
        // Load inventory data
        this.loadInventory();
        
        // Detect mobile
        this.isMobile = this.game.device.os.android || 
                       this.game.device.os.iOS || 
                       this.game.device.input.touch ||
                       this.scale.width < 768;

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.createInventoryWindow(centerX, centerY);
        this.createTabs();
        this.createTabContents();

        // Add keyboard listeners (only for desktop)
        if (!this.isMobile) {
            this.input.keyboard?.addKey('ESC').on('down', () => this.closeInventory());
            this.input.keyboard?.addKey('I').on('down', () => this.closeInventory());
        }
    }

    // Load inventory from localStorage
    private loadInventory(): void {
        try {
            const inventoryString = localStorage.getItem(this.inventoryKey);
            if (inventoryString) {
                const inventoryData: InventoryData = JSON.parse(inventoryString);
                this.inventoryItems = inventoryData.items;
                console.log('Loaded inventory with', this.inventoryItems.length, 'items');
            } else {
                // Initialize with empty inventory
                this.inventoryItems = [];
                this.saveInventory();
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.inventoryItems = [];
        }
    }

    // Save inventory to localStorage
    private saveInventory(): void {
        try {
            const inventoryData: InventoryData = {
                items: this.inventoryItems,
                version: 1
            };
            localStorage.setItem(this.inventoryKey, JSON.stringify(inventoryData));
        } catch (error) {
            console.error('Error saving inventory:', error);
        }
    }

    // Add an item to the inventory
    public addItem(itemId: string, quantity: number = 1): void {
        console.log('Adding item to inventory:', itemId, quantity);
        
        // Define item templates
        const itemTemplates: { [key: string]: Omit<InventoryItem, 'quantity'> } = {
            'health_crystal': {
                id: 'health_crystal',
                name: 'Health Crystal',
                description: 'Restores 50 HP when used',
                type: 'consumable',
                rarity: 'common',
                icon: '💖'
            },
            'mana_crystal': {
                id: 'mana_crystal',
                name: 'Mana Crystal',
                description: 'Restores 30 MP when used',
                type: 'consumable',
                rarity: 'common',
                icon: '💎'
            },
            'stamina_potion': {
                id: 'stamina_potion',
                name: 'Stamina Potion',
                description: 'Restores 30 Stamina when used',
                type: 'consumable',
                rarity: 'common',
                icon: '🔋'
            },
            'golden_key': {
                id: 'golden_key',
                name: 'Golden Key',
                description: 'Opens special chests',
                type: 'key',
                rarity: 'rare',
                icon: '🔑'
            },
            'dragon_scale': {
                id: 'dragon_scale',
                name: 'Dragon Scale',
                description: 'A rare crafting material',
                type: 'material',
                rarity: 'epic',
                icon: '🐉'
            },
            'phoenix_feather': {
                id: 'phoenix_feather',
                name: 'Phoenix Feather',
                description: 'A legendary crafting material',
                type: 'material',
                rarity: 'legendary',
                icon: '🔥'
            },
            'speed_potion': {
                id: 'speed_potion',
                name: 'Speed Potion',
                description: 'Increases movement speed',
                type: 'consumable',
                rarity: 'rare',
                icon: '⚡'
            },
            'mystic_orb': {
                id: 'mystic_orb',
                name: 'Mystic Orb',
                description: 'Contains mysterious power',
                type: 'material',
                rarity: 'epic',
                icon: '🔮'
            },
            'dungeon_key': {
                id: 'dungeon_key',
                name: 'Dungeon Key',
                description: 'Opens dungeon doors',
                type: 'key',
                rarity: 'rare',
                icon: '🗝️'
            }
        };

        // Check if item exists in templates
        const template = itemTemplates[itemId];
        if (!template) {
            console.warn('Unknown item ID:', itemId);
            return;
        }

        // Check if item already exists in inventory
        const existingItem = this.inventoryItems.find(item => item.id === itemId);
        const previousQuantity = existingItem ? existingItem.quantity : 0;
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('Updated existing item quantity:', existingItem.quantity);
        } else {
            // Add new item to inventory
            this.inventoryItems.push({
                ...template,
                quantity: quantity
            });
            console.log('Added new item to inventory');
        }

        // Save inventory
        this.saveInventory();
        console.log('Added', quantity, 'of', itemId, 'to inventory. New total:', this.getItemCount(itemId));
        
        // Check if this item should be auto-reassigned to any hotkey slot
        try {
            const uiScene = this.scene.get('UIScene') as any;
            console.log('UIScene reference:', uiScene);
            if (uiScene && uiScene.hotkeySlotManager) {
                // If the item was previously at zero quantity, force update the slots
                if (previousQuantity === 0) {
                    console.log('Item was previously at zero, forcing slot update');
                    uiScene.hotkeySlotManager.forceUpdateSlotsForItem(itemId);
                } else {
                    console.log('Calling checkAutoReassignItem for:', itemId);
                    uiScene.hotkeySlotManager.checkAutoReassignItem(itemId);
                }
            } else {
                console.log('UIScene or hotkeySlotManager not available for auto-reassign');
            }
        } catch (error) {
            console.error('Error during auto-reassign check:', error);
        }
    }

    // Remove an item from the inventory
    public removeItem(itemId: string, quantity: number = 1): boolean {
        const itemIndex = this.inventoryItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return false;
        }

        const item = this.inventoryItems[itemIndex];
        if (item.quantity <= quantity) {
            // Remove entire item
            this.inventoryItems.splice(itemIndex, 1);
        } else {
            // Reduce quantity
            item.quantity -= quantity;
        }

        // Save inventory
        this.saveInventory();
        console.log('Removed', quantity, 'of', itemId, 'from inventory');
        return true;
    }

    // Get item count
    public getItemCount(itemId: string): number {
        const item = this.inventoryItems.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }

    // Use an item (for consumables)
    public useItem(itemId: string): boolean {
        const item = this.inventoryItems.find(item => item.id === itemId);
        if (!item || item.type !== 'consumable' || item.quantity <= 0) {
            return false;
        }

        // Apply item effect based on item type
        let playerManager = null;
        
        // Try to get player manager through window object (most reliable when GameScene is paused)
        if (typeof window !== 'undefined') {
            // Try gameScene first (GameScene)
            if ((window as any).gameScene && (window as any).gameScene.playerManager) {
                playerManager = (window as any).gameScene.playerManager;
            } 
            // Try explorationScene (ExplorationScene)
            else if ((window as any).explorationScene && (window as any).explorationScene.playerManager) {
                playerManager = (window as any).explorationScene.playerManager;
            }
        }
        
        // Fallback to direct scene access
        if (!playerManager) {
            try {
                // Try to get from GameScene first
                const gameScene = this.scene.get('GameScene');
                if (gameScene && (gameScene as any).playerManager) {
                    playerManager = (gameScene as any).playerManager;
                }
            } catch (e) {
                // If that fails, try ExplorationScene
                try {
                    const explorationScene = this.scene.get('ExplorationScene');
                    if (explorationScene && (explorationScene as any).playerManager) {
                        playerManager = (explorationScene as any).playerManager;
                    }
                } catch (e2) {
                    console.error('Error accessing GameScene or ExplorationScene:', e, e2);
                }
            }
        }
        
        // Check if we have access to player manager
        if (!playerManager) {
            console.error('Could not access PlayerManager');
            return false;
        }

        // Apply effect based on item type
        switch (item.id) {
            case 'health_crystal':
                if (typeof playerManager.heal === 'function') {
                    playerManager.heal(50);
                    console.log('Player healed by 50 HP using Health Crystal');
                }
                break;
                
            case 'stamina_potion':
                if (typeof playerManager.restoreStamina === 'function') {
                    playerManager.restoreStamina(30);
                    console.log('Player stamina restored by 30 points using Stamina Potion');
                }
                break;
                
            case 'speed_potion':
                if (typeof playerManager.activateSpeedBoost === 'function') {
                    playerManager.activateSpeedBoost();
                    console.log('Speed boost activated using Speed Potion');
                }
                break;
                
            case 'mana_crystal':
                // Currently no mana system implemented, but placeholder for future
                console.log('Mana Crystal used (no mana system implemented)');
                break;
                
            default:
                console.log('Unknown consumable item used:', item.id);
                break;
        }

        // Remove one from inventory
        this.removeItem(itemId, 1);
        
        // Update hotkey slot quantities
        const uiScene = this.scene.get('UIScene') as any;
        if (uiScene && uiScene.hotkeySlotManager) {
            uiScene.hotkeySlotManager.updateAllSlotQuantities();
        }
        
        // Reset page if needed
        this.currentPage = 0;
        return true;
    }

    private closeInventory(): void {
        // Resume the game scene
        this.scene.resume('GameScene');
        
        // Stop the inventory scene
        this.scene.stop('InventoryScene');
        
        // Reset default cursor
        this.input.setDefaultCursor('default');
    }

    private createInventoryWindow(centerX: number, centerY: number): void {
        this.inventoryWindow = this.add.container(centerX, centerY);

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(
            0, 0,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        ).setOrigin(0.5);

        // Adjust window size for mobile
        const windowWidth = this.isMobile ? this.scale.width * 0.95 : 800;
        const windowHeight = this.isMobile ? this.scale.height * 0.9 : 500;

        const windowBorder = this.add.rectangle(
            0, 0,
            windowWidth, windowHeight,
            0x34495e
        ).setStrokeStyle(3, 0x3498db);

        const windowInner = this.add.rectangle(
            0, 0,
            windowWidth - 10, windowHeight - 10,
            0x2c3e50
        );

        // Adjust header position for mobile
        const headerY = this.isMobile ? -windowHeight/2 + 30 : -220;
        const headerBg = this.add.rectangle(
            0, headerY,
            windowWidth - 10, this.isMobile ? 50 : 60,
            0x3498db,
            0.2
        );

        const title = this.add.text(
            0, headerY,
            'Inventory',
            {
                fontSize: this.isMobile ? '18px' : '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Adjust close button for mobile
        const closeBtnX = this.isMobile ? windowWidth/2 - 30 : 370;
        const closeBtnY = headerY;
        const closeBtn = this.add.container(closeBtnX, closeBtnY);
        const closeBtnBg = this.add.circle(0, 0, this.isMobile ? 20 : 15, 0xe74c3c);
        const closeBtnText = this.add.text(
            0, 0,
            '✖',
            {
                fontSize: this.isMobile ? '14px' : '10px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        closeBtn.add([closeBtnBg, closeBtnText]);
        closeBtn.setInteractive(
            new Phaser.Geom.Circle(0, 0, this.isMobile ? 20 : 15),
            Phaser.Geom.Circle.Contains
        );

        closeBtn
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                closeBtnBg.setFillStyle(0xc0392b);
                this.input.setDefaultCursor('pointer');
            })
            .on('pointerout', () => {
                closeBtnBg.setFillStyle(0xe74c3c);
                this.input.setDefaultCursor('default');
            })
            .on('pointerdown', () => this.closeInventory());

        this.inventoryWindow.add([
            overlay,
            windowBorder,
            windowInner,
            headerBg,
            title,
            closeBtn
        ]);

        this.inventoryWindow.setDepth(1000);
    }

    private async createTabs(): Promise<void> {
        const tabsConfig = [
            { key: 'items', label: '🎒 Items', x: -150 },
            { key: 'nfts', label: '💎 NFTs', x: 150 }
        ];

        // Create tab container higher up
        const tabContainer = this.add.container(0, -220);

        tabsConfig.forEach(({ key, label, x }) => {
            const tab = this.createTabButton(x, 0, label, key);
            tabContainer.add(tab);
        });

        this.inventoryWindow.add(tabContainer);
    }

    private createTabButton(x: number, y: number, label: string, key: string): Phaser.GameObjects.Container {
        const tabContainer = this.add.container(x, y);
        
        // Adjust tab size for mobile
        const tabWidth = this.isMobile ? 120 : 200;
        const tabHeight = this.isMobile ? 40 : 50;
        
        const bg = this.add.rectangle(0, 0, tabWidth, tabHeight, 
            this.activeTab === key ? 0x27ae60 : 0x34495e
        )
        .setStrokeStyle(2, 0x3498db);

        this.tabButtons.set(key, bg);

        const text = this.add.text(0, 0, label, {
            fontSize: this.isMobile ? '10px' : '11px',
            color: '#ffffff',
            fontStyle: this.activeTab === key ? 'bold' : 'normal'
        }).setOrigin(0.5);

        tabContainer.add([bg, text]);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.switchTab(key);
                this.updateTabColors();
            })
            .on('pointerover', () => {
                if (this.activeTab !== key) {
                    bg.setFillStyle(0x2ecc71);
                }
                this.input.setDefaultCursor('pointer');
            })
            .on('pointerout', () => {
                if (this.activeTab !== key) {
                    bg.setFillStyle(0x34495e);
                }
                this.input.setDefaultCursor('default');
            });

        return tabContainer;
    }

    // Update the updateTabColors method to work with Rectangle
    private updateTabColors(): void {
        this.tabButtons.forEach((bg, key) => {
            bg.setFillStyle(key === this.activeTab ? 0x27ae60 : 0x34495e);
            bg.setStrokeStyle(2, 0x3498db);
        });
    }

    private switchTab(newTab: string): void {
        if (this.activeTab === newTab) return;

        // Hide current tab content
        if (this.tabContents[this.activeTab]) {
            this.tabContents[this.activeTab].container.setVisible(false);
            this.tabContents[this.activeTab].isActive = false;
        }

        // Show new tab content
        if (this.tabContents[newTab]) {
            this.tabContents[newTab].container.setVisible(true);
            this.tabContents[newTab].isActive = true;
        }

        // Update active tab
        this.activeTab = newTab;
        console.log(`Switched to tab: ${newTab}`);
    }

    private async createTabContents(): Promise<void> {
        // Create content area for Items using the new method
        const itemsContent = this.createItemsContent();
        
        // Create content area for NFTs
        const nftsContent = await this.createNFTsContent();

        // Set initial visibility based on active tab
        itemsContent.setVisible(this.activeTab === 'items');
        nftsContent.setVisible(this.activeTab === 'nfts');

        // Store tab contents
        this.tabContents = {
            items: {
                container: itemsContent,
                isActive: this.activeTab === 'items'
            },
            nfts: {
                container: nftsContent,
                isActive: this.activeTab === 'nfts'
            }
        };

        this.inventoryWindow.add([itemsContent, nftsContent]);
    }


    private createPageButton(x: number, y: number, symbol: string, onClick: () => void): Phaser.GameObjects.Container {
        const isMobile = this.isMobile;
        const button = this.add.container(x, y);
        
        // Larger touch target for mobile
        const touchTargetSize = isMobile ? 44 : 30; // Minimum 44px for mobile touch targets
        const visualSize = isMobile ? 30 : 20;
        
        // Create invisible touch area for better targeting
        const touchArea = this.add.rectangle(0, 0, touchTargetSize, touchTargetSize, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        
        // Visual button
        const bg = this.add.circle(0, 0, visualSize, 0x3498db);
        const text = this.add.text(0, 0, symbol, {
            fontSize: isMobile ? '20px' : '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([touchArea, bg, text]);
        
        touchArea
            .on('pointerover', () => {
                bg.setFillStyle(0x2980b9);
                this.input.setDefaultCursor('pointer');
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x3498db);
                this.input.setDefaultCursor('default');
            })
            .on('pointerdown', onClick);

        return button;
    }

    private updateItemsPage(container: Phaser.GameObjects.Container, grid: any): void {
        // Clear current items
        container.removeAll();

        // Calculate start and end indices for current page
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.inventoryItems.length);

        // Create item slots for current page
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.inventoryItems[i];
            const pageIndex = i - startIndex;
            const col = pageIndex % grid.columns;
            const row = Math.floor(pageIndex / grid.columns);

            const x = grid.startX + (col * (grid.width + grid.spacing));
            const y = grid.startY + (row * (grid.height + grid.spacing));

            const itemSlot = this.createItemSlot(x, y, item);
            container.add(itemSlot);
        }
    }

    private createItemSlot(x: number, y: number, item: InventoryItem): Phaser.GameObjects.Container {
        const slot = this.add.container(x, y);
        const size = 90; // Match NFT card size

        // Background with rarity color
        const bg = this.add.rectangle(0, 0, size, size, 
            this.getRarityBackgroundColor(item.rarity)
        ).setStrokeStyle(2, 0x3498db);

        // Adjusted icon position and size
        const icon = this.add.text(0, -15, item.icon, {
            fontSize: '25px',    // Increased by 25%
        }).setOrigin(0.5);

        // Adjusted name position and size
        const name = this.add.text(0, 25, item.name, {
            fontSize: '9px',     // Increased by 25%
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 80 }
        }).setOrigin(0.5);

        // Adjusted quantity position and size
        const quantity = this.add.text(35, -35, `x${item.quantity}`, {
            fontSize: '10px',    // Increased by 25%
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Adjusted type indicator position and size
        const typeIcon = this.add.text(-35, -35, 
            item.type === 'consumable' ? '🔮' : 
            item.type === 'material' ? '📦' : '🗝️', 
            { fontSize: '10px' } // Increased by 25%
        );

        slot.add([bg, icon, name, quantity, typeIcon]);

        // Add hover effects
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setStrokeStyle(2, 0xffd700);
                this.showItemTooltip(item, x, y);
            })
            .on('pointerout', () => {
                bg.setStrokeStyle(2, 0x3498db);
                this.hideItemTooltip();
            })
            // Add click functionality for consumables
            .on('pointerdown', () => {
                if (item.type === 'consumable') {
                    this.showHotkeyAssignmentUI(item.id);
                } else {
                    // For non-consumables, just show tooltip
                    this.showItemTooltip(item, x, y);
                }
            });

        return slot;
    }
    
    // Show UI for assigning item to hotkey slot
    private showHotkeyAssignmentUI(itemId: string): void {
        // Get the UIScene to access the hotkey manager
        const uiScene = this.scene.get('UIScene') as any;
        if (!uiScene || !uiScene.hotkeySlotManager) {
            console.warn('UIScene or hotkeySlotManager not available');
            return;
        }
        
        const hotkeyManager = uiScene.hotkeySlotManager;
        const availableSlots = hotkeyManager.getAvailableSlotIds();
        
        // Create a simple UI to select a slot
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Background overlay
        const overlay = this.add.rectangle(
            centerX, centerY,
            this.scale.width, this.scale.height,
            0x000000, 0.7
        ).setOrigin(0.5).setDepth(2000);
        
        // Dialog container
        const dialog = this.add.container(centerX, centerY).setDepth(2001);
        
        // Dialog background
        const dialogBg = this.add.rectangle(0, 0, 300, 200, 0x2c3e50)
            .setStrokeStyle(2, 0x3498db);
        dialog.add(dialogBg);
        
        // Title
        const title = this.add.text(0, -70, 'Assign to Hotkey Slot', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dialog.add(title);
        
        // Instructions
        const instructions = this.add.text(0, -40, 'Click a slot number to assign:', {
            fontSize: '12px',
            color: '#bbbbbb'
        }).setOrigin(0.5);
        dialog.add(instructions);
        
        // Create slot buttons
        const buttonSize = 30;
        const spacing = 10;
        const totalWidth = (availableSlots.length * buttonSize) + ((availableSlots.length - 1) * spacing);
        const startX = -totalWidth / 2 + buttonSize / 2;
        
        availableSlots.forEach((slotId: number, index: number) => {
            const x = startX + (index * (buttonSize + spacing));
            const displayNumber = slotId === 10 ? '0' : slotId.toString();
            
            const button = this.add.container(x, 0);
            const buttonBg = this.add.rectangle(0, 0, buttonSize, buttonSize, 0x34495e)
                .setStrokeStyle(1, 0x3498db);
            const buttonText = this.add.text(0, 0, displayNumber, {
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            button.add([buttonBg, buttonText]);
            
            // Make button interactive
            buttonBg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    buttonBg.setFillStyle(0x3498db);
                })
                .on('pointerout', () => {
                    buttonBg.setFillStyle(0x34495e);
                })
                .on('pointerdown', () => {
                    // Assign item to this slot
                    const success = hotkeyManager.assignItemToSlot(slotId, itemId);
                    if (success) {
                        console.log(`Assigned item ${itemId} to slot ${slotId}`);
                        
                        // Show confirmation
                        const confirmation = this.add.text(
                            centerX, centerY,
                            `Assigned to slot ${displayNumber}!`,
                            {
                                fontSize: '16px',
                                color: '#2ecc71',
                                backgroundColor: '#000000',
                                padding: { x: 10, y: 5 }
                            }
                        ).setOrigin(0.5).setDepth(2002);
                        
                        // Remove confirmation after 2 seconds
                        this.time.delayedCall(2000, () => {
                            confirmation.destroy();
                        });
                    } else {
                        console.warn(`Failed to assign item ${itemId} to slot ${slotId}`);
                    }
                    
                    // Close dialog
                    overlay.destroy();
                    dialog.destroy();
                });
            
            dialog.add(button);
        });
        
        // Close button
        const closeBtn = this.add.container(0, 80);
        const closeBg = this.add.rectangle(0, 0, 80, 30, 0xe74c3c);
        const closeText = this.add.text(0, 0, 'Cancel', {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeText]);
        
        closeBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                closeBg.setFillStyle(0xc0392b);
            })
            .on('pointerout', () => {
                closeBg.setFillStyle(0xe74c3c);
            })
            .on('pointerdown', () => {
                overlay.destroy();
                dialog.destroy();
            });
        
        dialog.add(closeBtn);
        
        // Allow closing with ESC key
        this.input.keyboard?.addKey('ESC').on('down', () => {
            overlay.destroy();
            dialog.destroy();
        });
    }

    // Add helper method for rarity background colors
    private getRarityBackgroundColor(rarity: string): number {
        const colors = {
            common: 0x4a4a4a,
            rare: 0x3498db,
            epic: 0x9b59b6,
            legendary: 0xf1c40f
        };
        return colors[rarity as keyof typeof colors];
    }

    private showItemTooltip(item: InventoryItem, x: number, y: number): void {
        // Hide any existing tooltip
        this.hideItemTooltip();

        // Create tooltip container
        const tooltip = this.add.container(x + 75, y);

        // Tooltip background
        const bg = this.add.rectangle(0, 0, 200, 120, 0x000000, 0.8)
            .setStrokeStyle(1, 0x3498db);

        // Item info - reduce all font sizes by 50%
        const name = this.add.text(-90, -50, item.name, {
            fontSize: '10px',    // Increased by 25%
            color: '#ffffff',
            fontStyle: 'bold'
        });

        const rarity = this.add.text(-90, -30, item.rarity.toUpperCase(), {
            fontSize: '8px',     // Increased by 25%
            color: this.getRarityColor(item.rarity)
        });

        const description = this.add.text(-90, -10, item.description, {
            fontSize: '8px',     // Increased by 25%
            color: '#ffffff',
            wordWrap: { width: 180 }
        });

        tooltip.add([bg, name, rarity, description]);
        tooltip.setDepth(2000);

        // Store reference to hide later
        this.tooltipContainer = tooltip;
    }

    private hideItemTooltip(): void {
        if (this.tooltipContainer) {
            this.tooltipContainer.destroy();
            this.tooltipContainer = undefined;
        }
    }

    private getRarityColor(rarity: string): string {
        const colors = {
            common: '#ffffff',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f1c40f'
        };
        return colors[rarity as keyof typeof colors];
    }

    private async createNFTsContent(): Promise<Phaser.GameObjects.Container> {
        const container = this.add.container(0, 0);

        // Create content background
        const contentBg = this.add.rectangle(
            0, 30,
            750, 350,     // Reduced height from 450 to 350
            0x2c3e50,
            0.2
        ).setOrigin(0.5);

        // Create container for NFT cards
        const nftsContainer = this.add.container(0, 30);

        // Grid configuration
        const grid = {
            columns: 5,          // Increased columns to use space better
            rows: 1,            // Single row since we only show 5 items
            width: 100,          // Smaller card size
            height: 100,
            spacing: 15,         // Reduced spacing
            startX: -240,        // Adjusted for center alignment
            startY: -50         // Moved up slightly
        };

        // Get saved NFTs
        let nfts: NFTData[] | null = null;
        const savedNFTsString = localStorage.getItem('quiztal-nfts');

        if (savedNFTsString) {
            console.log('Loading NFTs from localStorage.');
            nfts = JSON.parse(savedNFTsString);
        } else {
            // Fallback to Firestore if localStorage is empty
            const playerDataStr = localStorage.getItem("quiztal-player");
            if (playerDataStr) {
                const playerData = JSON.parse(playerDataStr);
                console.log('localStorage is empty, loading NFTs from Firestore...');
                nfts = await loadNFTsFromDatabase(playerData.uid);
                // If loaded from Firestore, update localStorage for this session
                if (nfts) {
                    localStorage.setItem('quiztal-nfts', JSON.stringify(nfts));
                }
            }
        }

        if (nfts && nfts.length > 0) {

            // Calculate total pages
            const totalPages = Math.ceil(nfts.length / this.nftsPerPage);

            // Create page navigation buttons
            const prevButton = this.createPageButton(-320, 100, '←', () => {
                if (this.nftCurrentPage > 0) {
                    this.nftCurrentPage--;
                    this.updateNFTsPage(nftsContainer, grid, nfts);
                }
            });

            const nextButton = this.createPageButton(320, 100, '→', () => {
                if (this.nftCurrentPage < totalPages - 1) {
                    this.nftCurrentPage++;
                    this.updateNFTsPage(nftsContainer, grid, nfts);
                }
            });

            // Move page indicator between buttons
            const pageText = this.add.text(0, 100, 
                `Page ${this.nftCurrentPage + 1} / ${totalPages}`, {
                fontSize: '12px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Initial page setup
            this.updateNFTsPage(nftsContainer, grid, nfts);

            container.add([contentBg, nftsContainer, prevButton, nextButton, pageText]);
        } else {
            const noNFTsText = this.add.text(0, 0, 'No NFTs Found', {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add([contentBg, noNFTsText]);
        }

        return container;
    }

    private updateNFTsPage(container: Phaser.GameObjects.Container, grid: any, nfts: NFTData[]): void {
        // Clear current NFTs
        container.removeAll();

        // Calculate start and end indices for current page
        const startIndex = this.nftCurrentPage * this.nftsPerPage;
        const endIndex = Math.min(startIndex + this.nftsPerPage, nfts.length);

        // Create NFT cards for current page
        for (let i = startIndex; i < endIndex; i++) {
            const nft = nfts[i];
            const pageIndex = i - startIndex;
            const col = pageIndex % grid.columns;
            const row = Math.floor(pageIndex / grid.columns);

            const x = grid.startX + (col * (grid.width + grid.spacing));
            const y = grid.startY + (row * (grid.height + grid.spacing));

            const card = this.createNFTCard(x, y, nft);
            container.add(card);
        }

        // If any images were queued for loading by createNFTCard, start the loader once.
        // This is much more efficient than starting it inside a loop.
        if (this.load.inflight.size > 0) {
            this.load.start();
        }
    }

    private createNFTCard(x: number, y: number, nft: NFTData): Phaser.GameObjects.Container {
        const card = this.add.container(x, y);
        const size = 90;

        // Debug log to check collection type
        console.log(`Creating NFT card for ${nft.name}:`, {
            tokenId: nft.tokenId,
            collectionType: nft.collectionType
        });

        // Card background with distinct colors per collection
        const bg = this.add.rectangle(0, 0, size, size, 
            nft.collectionType === 'erc1155' ? 0x8e44ad : 0x2c3e50 // Purple for Gemante, Dark blue for CrysteGuard
        ).setStrokeStyle(2, nft.collectionType === 'erc1155' ? 0x9b59b6 : 0x3498db);

        // Loading text - reduce from 12px to 6px
        const loadingText = this.add.text(0, 0, 'Loading...', {
            fontSize: '6px', // Reduced from 12px
            color: '#ffffff'
        }).setOrigin(0.5);

        card.add([bg, loadingText]);

        // Load NFT image with collection-specific key
        const imageKey = `nft-${nft.collectionType}-${nft.tokenId}`; // Add collection type to key
        
        // Convert IPFS URLs to HTTP URLs before loading
        OptimizedNFTService.convertIPFSToHTTPWithFallback(nft.image).then((httpUrl: string) => {
            if (!this.textures.exists(imageKey)) {
                console.log('Loading NFT image:', {
                    key: imageKey,
                    url: httpUrl,
                    type: nft.collectionType
                });
                this.load.image(imageKey, httpUrl);
                this.load.once(`filecomplete-image-${imageKey}`, () => {
                    this.addNFTImage(card, imageKey, loadingText, nft);
                });
                this.load.start();
            } else {
                this.addNFTImage(card, imageKey, loadingText, nft);
            }
        }).catch((error: any) => {
            console.error('Error converting IPFS URL:', error);
            // Fallback to original URL if conversion fails
            if (!this.textures.exists(imageKey)) {
                console.log('Loading NFT image (fallback):', {
                    key: imageKey,
                    url: nft.image,
                    type: nft.collectionType
                });
                this.load.image(imageKey, nft.image);
                this.load.once(`filecomplete-image-${imageKey}`, () => {
                    this.addNFTImage(card, imageKey, loadingText, nft);
                });
                this.load.start();
            } else {
                this.addNFTImage(card, imageKey, loadingText, nft);
            }
        });

        // Make card interactive with collection-specific hover effects
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setStrokeStyle(2, nft.collectionType === 'erc1155' ? 0xffd700 : 0x2ecc71);
            })
            .on('pointerout', () => {
                bg.setStrokeStyle(2, nft.collectionType === 'erc1155' ? 0x9b59b6 : 0x3498db);
            })
            .on('pointerdown', () => {
                console.log('NFT clicked:', {
                    name: nft.name,
                    type: nft.collectionType,
                    tokenId: nft.tokenId
                });
            });

        return card;
    }

    private addNFTImage(card: Phaser.GameObjects.Container, imageKey: string, loadingText: Phaser.GameObjects.Text, nft: NFTData): void {
        loadingText.destroy();
        
        const image = this.add.image(0, 0, imageKey);
        
        // Scale down image to fit the thumbnail size
        const maxSize = 80;
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        image.setScale(scale);

        // Add collection-specific badge with distinct styling
        const badge = this.add.text(-35, -35, 
            nft.collectionType === 'erc1155' ? '💎' : '🛡️', 
            { 
                fontSize: '7px', // Reduced from 14px
                shadow: {
                    color: nft.collectionType === 'erc1155' ? '#8e44ad' : '#2c3e50',
                    blur: 2,
                    fill: true
                }
            }
        );

        // Add collection type text - reduce from 10px to 5px
        const typeText = this.add.text(0, 35, 
            nft.collectionType === 'erc1155' ? 'Gemante' : 'CrysteGuard',
            {
                fontSize: '5px', // Reduced from 10px
                color: '#ffffff',
                backgroundColor: nft.collectionType === 'erc1155' ? '#8e44ad' : '#2c3e50',
                padding: { x: 4, y: 2 }
            }
        ).setOrigin(0.5);

        card.add([image, badge, typeText]);
    }

    private createItemsContent(): Phaser.GameObjects.Container {
        const container = this.add.container(0, 0);

        // Create content background - match NFT tab
        const contentBg = this.add.rectangle(
            0, 30,
            750, 350,     // Reduced height from 450 to 350
            0x2c3e50,
            0.2
        ).setOrigin(0.5);

        const itemsContainer = this.add.container(0, 30);

        // Match grid configuration with NFT tab
        const grid = {
            columns: 5,
            rows: 1,            // Single row since we only show 5 items
            width: 100,
            height: 100,
            spacing: 20,         // Increased spacing for better padding
            startX: -250,        // Adjusted for center alignment
            startY: -50        // Moved up to center content better
        };

        // Add debug logging
        console.log('Total inventory items:', this.inventoryItems.length);
        const totalPages = Math.ceil(this.inventoryItems.length / this.itemsPerPage);
        console.log('Total pages:', totalPages);
        console.log('Current page:', this.currentPage);

        const prevButton = this.createPageButton(-320, 100, '←', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                console.log('Moving to page:', this.currentPage);
                this.updateItemsPage(itemsContainer, grid);
                // Update page text
                if (pageText) {
                    pageText.setText(`Page ${this.currentPage + 1} / ${totalPages}`);
                }
            }
        });

        const nextButton = this.createPageButton(320, 100, '→', () => {
            if (this.currentPage < totalPages - 1) {
                this.currentPage++;
                console.log('Moving to page:', this.currentPage);
                this.updateItemsPage(itemsContainer, grid);
                // Update page text
                if (pageText) {
                    pageText.setText(`Page ${this.currentPage + 1} / ${totalPages}`);
                }
            }
        });

        // Move page indicator between buttons
        const pageText = this.add.text(0, 100, 
            `Page ${this.currentPage + 1} / ${totalPages || 1}`, {
            fontSize: '15px',    // Increased by 25%
            color: '#ffffff'
        }).setOrigin(0.5);

        this.updateItemsPage(itemsContainer, grid);
        container.add([contentBg, itemsContainer, prevButton, nextButton, pageText]);
        return container;
    }
}