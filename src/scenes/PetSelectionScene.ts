import Phaser from 'phaser';
import PetManager from '../managers/PetManager';

export default class PetSelectionScene extends Phaser.Scene {
    private petWindow!: Phaser.GameObjects.Container;
    // private activeTab: string = 'pets'; // Not used in pet selection scene
    private isMobile: boolean = false;
    private petManager: PetManager | null = null;

    constructor() {
        super({ key: 'PetSelectionScene' });
    }

    create() {
        // Get reference to PetManager from the current active scene
        const gameScene = this.scene.get('GameScene') as any;
        const explorationScene = this.scene.get('ExplorationScene') as any;
        
        // Check which scene is active and get the PetManager from it
        if (explorationScene && explorationScene.petManager) {
            this.petManager = explorationScene.petManager;
        } else if (gameScene && gameScene.petManager) {
            this.petManager = gameScene.petManager;
        }

        // Detect mobile
        this.isMobile = this.game.device.os.android || 
                       this.game.device.os.iOS || 
                       this.game.device.input.touch ||
                       this.scale.width < 768;

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.createPetWindow(centerX, centerY);
        this.createPetContent();

        // Add keyboard listeners (only for desktop)
        if (!this.isMobile) {
            this.input.keyboard?.addKey('ESC').on('down', () => this.closePetSelection());
            this.input.keyboard?.addKey('P').on('down', () => this.closePetSelection());
        }
    }

    private closePetSelection(): void {
        // Stop the pet selection scene
        this.scene.stop('PetSelectionScene');
        
        // Reset default cursor
        this.input.setDefaultCursor('default');
    }

    private createPetWindow(centerX: number, centerY: number): void {
        this.petWindow = this.add.container(centerX, centerY);

        // Create semi-transparent overlay that blocks input to underlying scene
        const overlay = this.add.rectangle(
            0, 0,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        ).setOrigin(0.5);
        
        // Make overlay interactive to block input to underlying scene
        overlay.setInteractive();

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

        // Create header
        const headerY = this.isMobile ? -windowHeight/2 + 30 : -220;
        const headerBg = this.add.rectangle(
            0, headerY,
            windowWidth - 10, this.isMobile ? 50 : 60,
            0x3498db,
            0.2
        );

        const title = this.add.text(
            0, headerY,
            'Pet Selection',
            {
                fontSize: this.isMobile ? '18px' : '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Create close button
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
            .on('pointerdown', () => this.closePetSelection());

        this.petWindow.add([
            overlay,
            windowBorder,
            windowInner,
            headerBg,
            title,
            closeBtn
        ]);

        this.petWindow.setDepth(1000);
    }

    private createPetContent(): void {
        const contentContainer = this.add.container(0, 0);
        
        // Get available pet types from PetManager
        const petTypes = this.petManager?.getAvailablePetTypes() || ['moblin', 'spmech01'];
        const currentPetType = this.petManager?.getCurrentPetType() || 'moblin';
        
        // Create pet options
        const startY = -150;
        const spacing = 120;
        
        petTypes.forEach((petType: string, index: number) => {
            const y = startY + index * spacing;
            
            // Create pet container
            const petContainer = this.add.container(0, y);
            
            // Create background for pet option
            const petBg = this.add.rectangle(
                0, 0,
                600, 100,
                currentPetType === petType ? 0xf1c40f : 0x34495e
            ).setStrokeStyle(2, 0x3498db);
            
            // Create pet preview using image assets
            let petImage: Phaser.GameObjects.Image | null = null;
            let imageKey = '';
            
            if (petType === 'moblin') {
                imageKey = 'SPMECH'; // Use SPMECH.png for moblin
            } else if (petType === 'spmech01') {
                imageKey = 'SPMECH01'; // Use SPMECH01.png for spmech01
            }
            
            if (imageKey) {
                // Load the image if it's not already loaded
                if (!this.textures.exists(imageKey)) {
                    this.load.image(imageKey, `assets/pets/${imageKey}.png`);
                    // If we're in the create phase, we need to load the image differently
                    try {
                        petImage = this.add.image(-200, 0, imageKey);
                        petImage.setScale(0.5); // Scale down for better fit
                    } catch (e) {
                        console.warn(`Could not load image ${imageKey}`, e);
                    }
                } else {
                    petImage = this.add.image(-200, 0, imageKey);
                    petImage.setScale(0.5); // Scale down for better fit
                }
            }
            
            // Pet name
            const petName = this.add.text(
                0, 0,
                petType.charAt(0).toUpperCase() + petType.slice(1),
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
            
            // Add visual indicator for current pet
            let currentIndicator: Phaser.GameObjects.Text | null = null;
            if (currentPetType === petType) {
                currentIndicator = this.add.text(200, 0, '✓ Selected', {
                    fontSize: '14px',
                    color: '#f1c40f',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            
            // Add elements to container
            const elements: Phaser.GameObjects.GameObject[] = [petBg, petName];
            if (petImage) {
                elements.push(petImage);
            }
            if (currentIndicator) {
                elements.push(currentIndicator);
            }
            petContainer.add(elements);
            
            // Make container interactive
            petBg.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    console.log(`🐾 PetSelectionScene: Selected pet type: ${petType}`);
                    
                    // Show loading indicator
                    const loadingText = this.add.text(0, 0, 'Switching pet...', {
                        fontSize: '16px',
                        color: '#ffffff',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    
                    // Disable all pet options during switching
                    this.petWindow.getAll().forEach(child => {
                        if (child instanceof Phaser.GameObjects.Rectangle) {
                            child.setInteractive(false);
                        }
                    });
                    
                    if (this.petManager) {
                        this.petManager.switchPet(petType as any, () => {
                            // Remove loading indicator
                            loadingText.destroy();
                            this.closePetSelection();
                        });
                    } else {
                        // If no petManager, close immediately
                        loadingText.destroy();
                        this.closePetSelection();
                    }
                })
                .on('pointerover', () => {
                    petBg.setFillStyle(0xf1c40f);
                })
                .on('pointerout', () => {
                    petBg.setFillStyle(currentPetType === petType ? 0xf1c40f : 0x34495e);
                });
            
            contentContainer.add(petContainer);
        });
        
        this.petWindow.add(contentContainer);
    }
}