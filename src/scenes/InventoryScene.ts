import Phaser from 'phaser';

interface TabContent {
    container: Phaser.GameObjects.Container;
    isActive: boolean;
}

interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
    collectionType: 'erc721' | 'erc1155';
}

// Add this interface at the top with other interfaces
interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: 'consumable' | 'material' | 'key';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    icon: string;
}

export default class InventoryScene extends Phaser.Scene {
    private inventoryWindow!: Phaser.GameObjects.Container;
    private activeTab: string = 'items';
    private tabContents: { [key: string]: TabContent } = {};
    private tabButtons: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private tooltipContainer?: Phaser.GameObjects.Container;

    // Add this property to the InventoryScene class
    private mockItems: InventoryItem[] = [
        // First page items (existing)
        {
            id: 'health_crystal',
            name: 'Health Crystal',
            description: 'Restores 50 HP when used',
            quantity: 5,
            type: 'consumable',
            rarity: 'common',
            icon: '💖'
        },
        {
            id: 'mana_crystal',
            name: 'Mana Crystal',
            description: 'Restores 30 MP when used',
            quantity: 3,
            type: 'consumable',
            rarity: 'common',
            icon: '💎'
        },
        {
            id: 'golden_key',
            name: 'Golden Key',
            description: 'Opens special chests',
            quantity: 1,
            type: 'key',
            rarity: 'rare',
            icon: '🔑'
        },
        {
            id: 'dragon_scale',
            name: 'Dragon Scale',
            description: 'A rare crafting material',
            quantity: 2,
            type: 'material',
            rarity: 'epic',
            icon: '🐉'
        },
        // Second page items (new)
        {
            id: 'phoenix_feather',
            name: 'Phoenix Feather',
            description: 'A legendary crafting material',
            quantity: 1,
            type: 'material',
            rarity: 'legendary',
            icon: '🔥'
        },
        {
            id: 'speed_potion',
            name: 'Speed Potion',
            description: 'Increases movement speed',
            quantity: 3,
            type: 'consumable',
            rarity: 'rare',
            icon: '⚡'
        },
        {
            id: 'mystic_orb',
            name: 'Mystic Orb',
            description: 'Contains mysterious power',
            quantity: 2,
            type: 'material',
            rarity: 'epic',
            icon: '🔮'
        },
        {
            id: 'dungeon_key',
            name: 'Dungeon Key',
            description: 'Opens dungeon doors',
            quantity: 1,
            type: 'key',
            rarity: 'rare',
            icon: '🗝️'
        }
    ];

    // Update these properties in the class
    private currentPage: number = 0;
    private itemsPerPage: number = 5; // Reduced from 15 to 5 items per page
    private nftCurrentPage: number = 0;
    private nftsPerPage: number = 5; // Reduced from 15 to 5 items per page

    constructor() {
        super({ key: 'InventoryScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.createInventoryWindow(centerX, centerY);
        this.createTabs();
        this.createTabContents();

        // Add keyboard listeners
        this.input.keyboard?.addKey('ESC').on('down', () => this.closeInventory());
        this.input.keyboard?.addKey('I').on('down', () => this.closeInventory());
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

        // Reduce window size
        const windowBorder = this.add.rectangle(
            0, 0,
            800, 500,  // Reduced height from 600 to 500
            0x34495e
        ).setStrokeStyle(3, 0x3498db);

        // Adjust inner window size
        const windowInner = this.add.rectangle(
            0, 0,
            790, 490,  // Reduced height from 590 to 490
            0x2c3e50
        );

        // Adjust header position
        const headerBg = this.add.rectangle(
            0, -220,   // Moved down from -270 to -220
            790, 60,
            0x3498db,
            0.2
        );

        // Adjust title position
        const title = this.add.text(
            0, -220,   // Moved down from -270 to -220
            'Inventory',
            {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Adjust close button position
        const closeBtn = this.add.container(370, -220);  // Moved down from -270 to -220
        const closeBtnBg = this.add.circle(0, 0, 15, 0xe74c3c);
        const closeBtnText = this.add.text(
            0, 0,
            '✖',
            {
                fontSize: '10px', // Reduced from 20px
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        closeBtn.add([closeBtnBg, closeBtnText]);
        closeBtn.setInteractive(
            new Phaser.Geom.Circle(0, 0, 15),
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

        // Create tabs container with better positioning
        const tabsContainer = this.add.container(0, -160);

        this.inventoryWindow.add([
            overlay,
            windowBorder,
            windowInner,
            headerBg,
            title,
            closeBtn,
            tabsContainer
        ]);

        this.inventoryWindow.setDepth(1000);
    }

    private closeInventory(): void {
        // Resume the game scene
        this.scene.resume('GameScene');
        
        // Stop the inventory scene
        this.scene.stop('InventoryScene');
        
        // Reset default cursor
        this.input.setDefaultCursor('default');
    }

    private createTabs(): void {
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
        
        // Create tab background using Rectangle instead of Graphics
        const bg = this.add.rectangle(0, 0, 200, 50, 
            this.activeTab === key ? 0x27ae60 : 0x34495e
        )
        .setStrokeStyle(2, 0x3498db);

        // Add to tabButtons map
        this.tabButtons.set(key, bg);

        const text = this.add.text(0, 0, label, {
            fontSize: '11px',  // Reduced from 22px
            color: '#ffffff',
            fontStyle: this.activeTab === key ? 'bold' : 'normal'
        }).setOrigin(0.5);

        tabContainer.add([bg, text]);

        // Make tab interactive
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

    private createTabContents(): void {
        // Create content area for Items using the new method
        const itemsContent = this.createItemsContent();
        
        // Create content area for NFTs
        const nftsContent = this.createNFTsContent();

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
        const button = this.add.container(x, y);
        
        // Smaller, more subtle button
        const bg = this.add.circle(0, 0, 20, 0x3498db);
        const text = this.add.text(0, 0, symbol, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        
        bg.setInteractive({ useHandCursor: true })
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
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.mockItems.length);

        // Create item slots for current page
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.mockItems[i];
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
            });

        return slot;
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

    private createNFTsContent(): Phaser.GameObjects.Container {
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
        const savedNFTs = localStorage.getItem('quiztal-nfts');
        console.log('Saved NFTs:', savedNFTs);

        if (savedNFTs) {
            const nfts: NFTData[] = JSON.parse(savedNFTs);
            console.log('Parsed NFTs:', nfts);

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
        if (!this.textures.exists(imageKey)) {
            console.log('Loading NFT image:', {
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

        // Create container for items
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
        console.log('Total mock items:', this.mockItems.length);
        const totalPages = Math.ceil(this.mockItems.length / this.itemsPerPage);
        console.log('Total pages:', totalPages);
        console.log('Current page:', this.currentPage);

        const prevButton = this.createPageButton(-320, 100, '←', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                console.log('Moving to page:', this.currentPage);
                this.updateItemsPage(itemsContainer, grid);
                // Update page text
                pageText.setText(`Page ${this.currentPage + 1} / ${totalPages}`);
            }
        });

        const nextButton = this.createPageButton(320, 100, '→', () => {
            if (this.currentPage < totalPages - 1) {
                this.currentPage++;
                console.log('Moving to page:', this.currentPage);
                this.updateItemsPage(itemsContainer, grid);
                // Update page text
                pageText.setText(`Page ${this.currentPage + 1} / ${totalPages}`);
            }
        });

        // Move page indicator between buttons
        const pageText = this.add.text(0, 100, 
            `Page ${this.currentPage + 1} / ${totalPages}`, {
            fontSize: '15px',    // Increased by 25%
            color: '#ffffff'
        }).setOrigin(0.5);

        this.updateItemsPage(itemsContainer, grid);
        container.add([contentBg, itemsContainer, prevButton, nextButton, pageText]);
        return container;
    }
}