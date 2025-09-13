/**
 * NFTDisplayManager - Manages NFT grid display and interactions
 * 
 * This class encapsulates all NFT display functionality:
 * - NFT grid layout and responsive design
 * - Card creation and styling
 * - Scrolling and viewport management
 * - Image loading and error handling
 * - Interactive features and animations
 * 
 * @example
 * ```typescript
 * const nftManager = new NFTDisplayManager(scene);
 * await nftManager.displayNFTs(nftArray);
 * nftManager.setupScrolling(container, scrollConfig);
 * ```
 */

import Phaser from "phaser";
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { NFTData } from '../../types/nft';
import {
    INFTDisplayManager,
    NFTGridConfig,
    ScrollConfig,
    NFTCardDimensions,
    NFTDisplayState
} from './types';

export class NFTDisplayManager implements INFTDisplayManager {
    private scene: Phaser.Scene;
    private state: NFTDisplayState;
    private loadingOverlay: LoadingOverlay;
    
    // UI Components
    private nftContainer: Phaser.GameObjects.Container | null = null;
    private scrollMask: Phaser.GameObjects.Graphics | null = null;
    private contentContainer: Phaser.GameObjects.Container | null = null;
    
    // Scroll configuration
    private scrollZone: Phaser.GameObjects.Zone | null = null;
    private isDragging: boolean = false;
    private startY: number = 0;
    private currentScrollConfig: ScrollConfig | null = null;

    // Grid configuration constants
    private readonly GRID_DEFAULTS = {
        minCardWidth: 150,
        maxCardWidth: 240,
        aspectRatio: 1.4,
        spacing: 30,
        topMargin: 20,
        bottomMargin: 40
    };

    private readonly SCROLL_DEFAULTS = {
        padding: 60,
        headerHeight: 120,
        scrollSpeed: 0.5
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.loadingOverlay = new LoadingOverlay(scene);
        
        this.state = {
            initialized: false,
            visible: false,
            interactive: false,
            loading: false,
            nftsLoaded: 0,
            totalNFTs: 0,
            scrollPosition: 0,
            gridLayout: 'detailed',
            sortOrder: 'date',
            filterActive: false,
            loadingMoreNFTs: false
        };

        this.initialize();
    }

    private initialize(): void {
        this.state.initialized = true;
        console.log('NFTDisplayManager: Initialized successfully');
    }

    /**
     * Displays NFTs in a grid layout with scrolling
     */
    public async displayNFTs(nfts: NFTData[]): Promise<void> {
        try {
            console.log('NFTDisplayManager: Displaying', nfts.length, 'NFTs');
            
            if (nfts.length === 0) {
                this.showNoNFTMessage();
                return;
            }

            // Show loading overlay
            this.loadingOverlay.show('Fetching your NFTs...', nfts.length);
            this.state.loading = true;
            this.state.totalNFTs = nfts.length;

            // Clean up previous display
            this.cleanup();

            // Create main container and content container
            this.createMainContainer();
            
            // Validate containers were created
            if (!this.nftContainer) {
                throw new Error('Failed to create main NFT container');
            }
            if (!this.contentContainer) {
                throw new Error('Failed to create content container');
            }
            
            console.log('NFTDisplayManager: Containers initialized successfully');

            // Create header
            this.createHeader();

            // Create grid configuration
            const gridConfig = this.calculateGridConfig();
            const scrollConfig = this.calculateScrollConfig();
            
            console.log('NFTDisplayManager: Grid config:', gridConfig);
            console.log('NFTDisplayManager: Scroll config:', scrollConfig);

            // Create and display NFT grid
            await this.createNFTGrid(nfts, gridConfig, scrollConfig);

            // Setup scrolling
            this.setupScrolling(this.contentContainer!, scrollConfig);

            // Create close button
            this.createCloseButton();

            this.state.visible = true;
            this.state.interactive = true;
            this.state.loading = false;
            this.loadingOverlay.hide();
            
            console.log('NFTDisplayManager: NFT display completed successfully');

        } catch (error) {
            console.error('NFTDisplayManager: Error displaying NFTs', error);
            this.loadingOverlay.hide();
            this.state.loading = false;
            
            // Clean up on error
            this.cleanup();
            
            throw error;
        }
    }

    /**
     * Creates NFT grid with proper layout
     */
    public async createNFTGrid(nfts: NFTData[], config: NFTGridConfig, scrollConfig: ScrollConfig): Promise<Phaser.GameObjects.Container> {
        console.log('NFTDisplayManager: Creating NFT grid with', nfts.length, 'NFTs');
        
        if (!this.contentContainer) {
            console.error('NFTDisplayManager: Content container is null or undefined');
            console.error('NFTDisplayManager: nftContainer exists:', !!this.nftContainer);
            throw new Error('Content container not initialized');
        }
        
        console.log('NFTDisplayManager: Content container verified, proceeding with grid creation');

        // Calculate grid width for centering
        const gridWidth = (config.cardWidth * config.itemsPerRow) + 
                         (config.spacing * (config.itemsPerRow - 1));
        const startX = ((this.scene.scale.width - (scrollConfig.padding * 2)) - gridWidth) / 2;

        // Create NFT cards
        let maxHeight = 0;
        const loadPromises: Promise<void>[] = [];

        nfts.forEach((nft, index) => {
            const row = Math.floor(index / config.itemsPerRow);
            const col = index % config.itemsPerRow;
            
            const x = startX + (col * (config.cardWidth + config.spacing)) + 
                     (config.cardWidth / 2);
            const y = config.topMargin + (row * (config.cardHeight + config.spacing)) + 
                     (config.cardHeight / 2);

            const cardDimensions: NFTCardDimensions = { x, y, width: config.cardWidth, height: config.cardHeight };
            const card = this.createNFTCard(nft, cardDimensions);
            
            this.contentContainer!.add(card);

            // Track loading promise for this card
            const loadPromise = this.loadNFTImage(nft, card);
            loadPromises.push(loadPromise);

            // Update maxHeight including bottom margin
            maxHeight = Math.max(maxHeight, y + config.cardHeight / 2 + config.bottomMargin);
        });

        console.log('NFTDisplayManager: Created', nfts.length, 'NFT cards, waiting for images to load');

        // Wait for all images to load or fail
        await Promise.allSettled(loadPromises);

        // Initialize currentScrollConfig and store max height for scrolling calculations
        this.currentScrollConfig = scrollConfig;
        this.currentScrollConfig.maxHeight = maxHeight;
        
        console.log('NFTDisplayManager: Grid creation completed, maxHeight:', maxHeight);

        return this.contentContainer;
    }

    /**
     * Creates individual NFT card
     */
    public createNFTCard(nft: NFTData, dimensions: NFTCardDimensions): Phaser.GameObjects.Container {
        const card = this.scene.add.container(dimensions.x, dimensions.y);

        // Card shadow
        const shadow = this.scene.add.graphics()
            .fillStyle(0x000000, 0.2)
            .fillRoundedRect(
                -dimensions.width/2 + 2, 
                -dimensions.height/2 + 2, 
                dimensions.width, 
                dimensions.height, 
                12
            );

        // Card background
        const bg = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 1)
            .fillRoundedRect(
                -dimensions.width/2, 
                -dimensions.height/2, 
                dimensions.width, 
                dimensions.height, 
                12
            );
        
        // Image container
        const imageSize = dimensions.width - 40;
        const imageContainer = this.scene.add.container(0, -dimensions.height/6);
        
        // Image placeholder with loading spinner
        const imagePlaceholder = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(
                -imageSize/2,
                -imageSize/2,
                imageSize,
                imageSize,
                8
            );

        // Add loading spinner
        const loadingSpinner = this.scene.add.text(0, 0, '⟳', {
            fontSize: '32px',
            color: '#3498db'
        }).setOrigin(0.5);

        // Animate the loading spinner
        this.scene.tweens.add({
            targets: loadingSpinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        imageContainer.add([imagePlaceholder, loadingSpinner]);

        // Store loading spinner reference for cleanup
        (card as any).loadingSpinner = loadingSpinner;

        // NFT name
        const name = this.scene.add.text(0, dimensions.height/4, nft.name, {
            fontSize: dimensions.width < 200 ? '14px' : '16px',
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
            wordWrap: { width: dimensions.width - 20 }
        }).setOrigin(0.5);

        // NFT ID and collection info
        const idText = `#${nft.tokenId}${nft.collectionType === 'erc1155' ? ' • Gemante' : ''}`;
        const id = this.scene.add.text(0, dimensions.height/4 + 30, idText, {
            fontSize: dimensions.width < 200 ? '12px' : '14px',
            color: '#3498db',
            align: 'center'
        }).setOrigin(0.5);

        // Add hover effects
        this.addCardInteractions(card, bg, dimensions);

        card.add([shadow, bg, imageContainer, name, id]);
        
        // Store references for image loading
        (card as any).imageContainer = imageContainer;
        (card as any).imagePlaceholder = imagePlaceholder;
        (card as any).imageSize = imageSize;
        (card as any).nftData = nft;

        return card;
    }

    /**
     * Sets up scrolling functionality for the NFT container
     */
    public setupScrolling(container: Phaser.GameObjects.Container, config: ScrollConfig): void {
        if (!container || !this.nftContainer) return;

        // currentScrollConfig should already be set by createNFTGrid
        if (!this.currentScrollConfig) {
            console.warn('NFTDisplayManager: currentScrollConfig not set, using provided config');
            this.currentScrollConfig = config;
        }

        // Create scroll mask (invisible - only used for clipping)
        this.scrollMask = this.scene.add.graphics()
            .fillStyle(0xffffff, 1)  // Color doesn't matter since it's used as mask only
            .fillRect(
                config.padding,
                config.headerHeight,
                this.scene.scale.width - (config.padding * 2),
                config.viewportHeight
            );

        // Apply mask to content container
        container.setMask(new Phaser.Display.Masks.GeometryMask(this.scene, this.scrollMask));

        // Create scroll zone
        this.scrollZone = this.scene.add.zone(
            config.padding,
            config.headerHeight,
            this.scene.scale.width - (config.padding * 2),
            config.viewportHeight
        ).setOrigin(0).setInteractive();

        // Only add the scroll zone to the container, not the mask
        this.nftContainer.add([this.scrollZone]);

        // Setup scroll boundaries
        const minY = config.headerHeight + 20;
        const maxY = -((config as any).maxHeight - config.viewportHeight);

        // Setup input handlers
        this.setupScrollInputHandlers(container, minY, maxY, config);

        // Add scroll indicator if needed
        this.addScrollIndicator(config);
    }

    /**
     * Shows message when no NFTs are found
     */
    public showNoNFTMessage(): void {
        console.log('NFTDisplayManager: Showing no NFT message');
        
        // Create message container
        const container = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);

        // Add message text
        const message = this.scene.add.text(0, -20, 'No NFTs found in this wallet', {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add marketplace link
        const link = this.scene.add.text(0, 20, 'Visit Marketplace', {
            fontSize: '16px',
            color: '#3498db',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.open('https://market.crystle.world', '_blank');
        });

        container.add([message, link]);
        this.nftContainer = container;
        this.state.visible = true;
    }

    /**
     * Handles screen resize events
     */
    public handleResize(): void {
        if (!this.state.visible || !this.nftContainer) return;

        console.log('NFTDisplayManager: Handling resize');
        
        // For now, just hide and let parent recreate
        // More sophisticated resize handling could be implemented
        this.cleanup();
    }

    /**
     * Gets current display state
     */
    public getState(): Readonly<NFTDisplayState> {
        return { ...this.state };
    }

    /**
     * Hides the NFT display without destroying it
     */
    public hide(): void {
        if (this.nftContainer) {
            this.nftContainer.setVisible(false);
            this.state.visible = false;
        }
    }

    /**
     * Shows the NFT display if it exists
     */
    public show(): void {
        if (this.nftContainer) {
            this.nftContainer.setVisible(true);
            this.state.visible = true;
        }
    }

    /**
     * Cleans up all NFT display components
     */
    public cleanup(): void {
        // Remove input listeners
        if (this.scene.input) {
            this.scene.input.off('wheel');
            this.scene.input.off('pointerdown');
            this.scene.input.off('pointermove');
            this.scene.input.off('pointerup');
        }

        // Destroy containers
        if (this.nftContainer) {
            this.nftContainer.destroy();
            this.nftContainer = null;
        }

        if (this.contentContainer) {
            this.contentContainer = null;
        }

        if (this.scrollMask) {
            this.scrollMask = null;
        }

        if (this.scrollZone) {
            this.scrollZone = null;
        }

        // Reset state
        this.state.visible = false;
        this.state.interactive = false;
        this.state.nftsLoaded = 0;
        this.state.scrollPosition = 0;

        console.log('NFTDisplayManager: Cleanup completed');
    }

    // Private helper methods

    private createMainContainer(): void {
        this.nftContainer = this.scene.add.container(0, 0);
        // Set high depth for modal overlay - above all game elements but below system dialogs
        // Following project depth hierarchy: UI=999-1000, Special UI=1000-2000, so use 1800
        this.nftContainer.setDepth(1800);

        // Add semi-transparent background
        const bg = this.scene.add.rectangle(
            0, 0,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000, 0.9
        ).setOrigin(0);

        // Add window frame
        const frame = this.scene.add.graphics();
        frame.lineStyle(2, 0x3498db, 1);
        frame.strokeRoundedRect(20, 20, this.scene.scale.width - 40, this.scene.scale.height - 40, 10);

        // Create content container for NFT cards
        this.contentContainer = this.scene.add.container(0, 0);
        
        this.nftContainer.add([bg, frame, this.contentContainer]);
        
        console.log('NFTDisplayManager: Main container created with depth 1800 for proper z-ordering');
    }

    private createHeader(): void {
        if (!this.nftContainer) return;

        // Create header container
        const headerContainer = this.scene.add.container(0, 0);
        
        // Add title with icon
        const title = this.scene.add.text(
            this.scene.scale.width / 2,
            60,
            '✨ NFT Collection Verified',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5);

        // Add subtitle
        const subtitle = this.scene.add.text(
            this.scene.scale.width / 2,
            100,
            'Your NFTs have been successfully verified',
            {
                fontSize: '18px',
                color: '#4CAF50',
                fontStyle: 'italic'
            }
        ).setOrigin(0.5);

        headerContainer.add([title, subtitle]);
        this.nftContainer.add(headerContainer);
    }

    private createCloseButton(): void {
        if (!this.nftContainer) return;

        const closeBtn = this.scene.add.text(
            this.scene.scale.width - 60,
            30,
            '✖',
            {
                fontSize: '32px',
                color: '#ffffff'
            }
        )
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setTint(0xff0000))
        .on('pointerout', () => closeBtn.clearTint())
        .on('pointerdown', () => {
            this.handleCloseButton();
        });

        this.nftContainer.add(closeBtn);
    }

    private calculateGridConfig(): NFTGridConfig {
        const isMobile = this.scene.scale.width < 768;
        const itemsPerRow = isMobile ? 2 : 3;
        
        const availableWidth = this.scene.scale.width - (this.SCROLL_DEFAULTS.padding * 3);
        const spacingTotal = this.GRID_DEFAULTS.spacing * (itemsPerRow - 1);
        const cardWidth = Math.min(
            (availableWidth - spacingTotal) / itemsPerRow,
            this.GRID_DEFAULTS.maxCardWidth
        );

        return {
            itemsPerRow,
            spacing: this.GRID_DEFAULTS.spacing,
            cardWidth: Math.max(cardWidth, this.GRID_DEFAULTS.minCardWidth),
            cardHeight: Math.max(cardWidth, this.GRID_DEFAULTS.minCardWidth) * this.GRID_DEFAULTS.aspectRatio,
            topMargin: this.GRID_DEFAULTS.topMargin,
            bottomMargin: this.GRID_DEFAULTS.bottomMargin
        };
    }

    private calculateScrollConfig(): ScrollConfig {
        return {
            padding: this.SCROLL_DEFAULTS.padding,
            headerHeight: this.SCROLL_DEFAULTS.headerHeight,
            viewportHeight: this.scene.scale.height - 180,
            scrollSpeed: this.SCROLL_DEFAULTS.scrollSpeed
        };
    }

    private async loadNFTImage(nft: NFTData, card: Phaser.GameObjects.Container): Promise<void> {
        return new Promise((resolve) => {
            const imageKey = `nft-${nft.collectionType}-${nft.tokenId}`;
            const imageContainer = (card as any).imageContainer;
            const imagePlaceholder = (card as any).imagePlaceholder;
            const loadingSpinner = (card as any).loadingSpinner;
            const imageSize = (card as any).imageSize;

            // Check if image is already loaded
            if (this.scene.textures.exists(imageKey)) {
                this.displayLoadedImage(imageKey, imageContainer, imagePlaceholder, loadingSpinner, imageSize, nft);
                this.state.nftsLoaded++;
                resolve();
                return;
            }

            // Load image based on collection type
            if (nft.collectionType === 'erc1155') {
                this.scene.load.image({
                    key: imageKey,
                    url: nft.image
                });
            } else {
                this.scene.load.image(imageKey, nft.image);
            }

            // Handle successful load
            this.scene.load.once(`filecomplete-image-${imageKey}`, () => {
                this.displayLoadedImage(imageKey, imageContainer, imagePlaceholder, loadingSpinner, imageSize, nft);
                this.state.nftsLoaded++;
                resolve();
            });

            // Handle load error
            this.scene.load.once(`loaderror`, (fileObj: any) => {
                if (fileObj.key === imageKey) {
                    console.error('NFTDisplayManager: Error loading image', nft.image);
                    this.displayImageError(imageContainer, imagePlaceholder, loadingSpinner);
                    this.state.nftsLoaded++;
                    resolve();
                }
            });

            // Start loading immediately for this image
            this.scene.load.start();
        });
    }

    private displayLoadedImage(
        imageKey: string,
        imageContainer: Phaser.GameObjects.Container,
        imagePlaceholder: Phaser.GameObjects.Graphics,
        loadingSpinner: Phaser.GameObjects.Text,
        imageSize: number,
        nft: NFTData
    ): void {
        const image = this.scene.add.image(0, 0, imageKey);
        const scale = Math.min(
            imageSize / image.width,
            imageSize / image.height
        );
        
        image.setScale(scale);
        
        // Remove placeholder and spinner
        if (imagePlaceholder && imagePlaceholder.scene) {
            imagePlaceholder.destroy();
        }
        if (loadingSpinner && loadingSpinner.scene) {
            loadingSpinner.destroy();
        }
        
        imageContainer.add(image);

        // Add collection badge for Gemante
        if (nft.collectionType === 'erc1155') {
            const badge = this.scene.add.text(-imageSize/2 + 10, -imageSize/2 + 10, '✨', {
                fontSize: '16px'
            });
            imageContainer.add(badge);
        }
    }

    private displayImageError(
        imageContainer: Phaser.GameObjects.Container,
        imagePlaceholder: Phaser.GameObjects.Graphics,
        loadingSpinner: Phaser.GameObjects.Text
    ): void {
        // Remove placeholder and spinner
        if (imagePlaceholder && imagePlaceholder.scene) {
            imagePlaceholder.destroy();
        }
        if (loadingSpinner && loadingSpinner.scene) {
            loadingSpinner.destroy();
        }
        
        const errorText = this.scene.add.text(0, 0, '❌', {
            fontSize: '32px'
        }).setOrigin(0.5);
        imageContainer.add(errorText);
    }

    private addCardInteractions(
        card: Phaser.GameObjects.Container, 
        bg: Phaser.GameObjects.Graphics, 
        dimensions: NFTCardDimensions
    ): void {
        card.setInteractive(
            new Phaser.Geom.Rectangle(
                -dimensions.width/2, 
                -dimensions.height/2, 
                dimensions.width, 
                dimensions.height
            ), 
            Phaser.Geom.Rectangle.Contains
        )
        .on('pointerover', () => {
            bg.clear()
              .fillStyle(0x34495e, 1)
              .fillRoundedRect(-dimensions.width/2, -dimensions.height/2, dimensions.width, dimensions.height, 12);
        })
        .on('pointerout', () => {
            bg.clear()
              .fillStyle(0x2c3e50, 1)
              .fillRoundedRect(-dimensions.width/2, -dimensions.height/2, dimensions.width, dimensions.height, 12);
        });
    }

    private setupScrollInputHandlers(
        container: Phaser.GameObjects.Container,
        minY: number,
        maxY: number,
        config: ScrollConfig
    ): void {
        // Handle pointer events for scrolling
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.y >= config.headerHeight && 
                pointer.y <= config.headerHeight + config.viewportHeight) {
                this.isDragging = true;
                this.startY = pointer.y - container.y;
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                const newY = Phaser.Math.Clamp(
                    pointer.y - this.startY,
                    maxY,
                    minY
                );
                container.y = newY;
                this.state.scrollPosition = newY;
            }
        });

        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Handle mouse wheel scrolling
        this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
            const newY = Phaser.Math.Clamp(
                container.y - (deltaY * config.scrollSpeed),
                maxY,
                minY
            );
            container.y = newY;
            this.state.scrollPosition = newY;
        });
    }

    private addScrollIndicator(config: ScrollConfig): void {
        if (!this.nftContainer || !this.currentScrollConfig?.maxHeight) return;
        
        if (this.currentScrollConfig.maxHeight > config.viewportHeight) {
            const scrollIndicator = this.scene.add.text(
                this.scene.scale.width - config.padding - 10,
                config.headerHeight + 15,
                '⚡ Scroll',
                {
                    fontSize: '16px',
                    color: '#3498db',
                    backgroundColor: '#2c3e50',
                    padding: { x: 12, y: 8 }
                }
            ).setOrigin(1, 0).setAlpha(0.8);

            this.nftContainer.add(scrollIndicator);

            // Fade out indicator after delay
            this.scene.tweens.add({
                targets: scrollIndicator,
                alpha: 0,
                delay: 2000,
                duration: 500
            });
        }
    }

    private handleCloseButton(): void {
        console.log('NFTDisplayManager: Close button clicked');
        
        // Emit event for parent to handle
        this.scene.events.emit('nftDisplayClosed');
        
        // Clean up and hide
        this.cleanup();
    }
}