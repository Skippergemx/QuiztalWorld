import Phaser from 'phaser';
import { loadMoblinGiftBoxData, saveMoblinGiftBoxData } from '../utils/Database';
import { NetworkMonitor } from '../utils/NetworkMonitor';

export default abstract class BasePet extends Phaser.Physics.Arcade.Sprite {
    protected target!: Phaser.Physics.Arcade.Sprite;
    protected followDistance: number = 50;
    protected moveSpeed: number = 160;
    protected lastDirection: string = 'down';
    protected networkMonitor: NetworkMonitor;
    
    // Gift box collector properties
    protected giftBoxText!: Phaser.GameObjects.Text;
    protected giftBoxCount: number = 0;
    protected maxGiftBoxes: number = 100;
    protected lastGiftTime: number = 0;
    protected giftInterval: number = 60000; // 60 seconds in milliseconds
    protected isCollecting: boolean = true;

    // Shout messages
    protected shoutMessages: string[] = [];
    
    // Network offline messages
    protected offlineMessages: string[] = [];
    
    protected shoutText!: Phaser.GameObjects.Text;
    protected lastShoutTime: number = 0;
    protected shoutInterval: number = 8000; // 8 seconds

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setDepth(5); // Above ground, below UI
        
        // Check if textures exist
        console.log(`${this.getPetType()} constructor - checking textures...`);
        console.log(`${this.getIdleTexture()} exists:`, scene.textures.exists(this.getIdleTexture()));
        console.log(`${this.getWalkTexture()} exists:`, scene.textures.exists(this.getWalkTexture()));
        
        this.createAnimations();
        this.createGiftBoxDisplay();
        this.createShoutDisplay();
        this.loadGiftBoxData();
        this.lastGiftTime = Date.now();
        this.lastShoutTime = Date.now();
        
        // Wait for next frame before playing animation to ensure it's created
        if (scene.time) {
            scene.time.delayedCall(50, () => {
                const idleAnimKey = `${this.getPetType()}-idle-down`;
                if (this.scene && this.scene.anims.exists(idleAnimKey)) {
                    console.log(`Playing ${idleAnimKey} animation`);
                    this.play(idleAnimKey);
                } else {
                    console.error(`${idleAnimKey} animation does not exist!`);
                }
            });
        }
        
        // Make the pet interactive
        this.makeInteractive();
        
        // Start shouting
        this.startShouting();
        
        // Get network monitor instance
        this.networkMonitor = NetworkMonitor.getInstance(scene);
    }

    // Abstract methods that must be implemented by subclasses
    protected abstract getPetType(): string;
    protected abstract getIdleTexture(): string;
    protected abstract getWalkTexture(): string;
    protected abstract createPetAnimations(): void;
    protected abstract getShoutMessages(): string[];
    protected abstract getOfflineMessages(): string[];

    // Make the pet interactive after it's created
    private makeInteractive() {
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', () => {
            // When the pet is clicked, show the pet selection UI
            console.log(`${this.getPetType()} clicked - showing pet selection UI`);
            
            // Check if scene exists before accessing it
            if (!this.scene) {
                console.warn('Scene not available for pet interaction');
                return;
            }
            
            // Get the PetManager instance from the scene
            const petManager = (this.scene as any).petManager;
            if (petManager && typeof petManager.showPetSelectionUI === 'function') {
                // Always show pet selection UI when pet is clicked, regardless of gift boxes
                petManager.showPetSelectionUI();
            } else {
                console.warn('PetManager not found or showPetSelectionUI method not available');
            }
        });
    }

    private createAnimations() {
        // Check if scene exists before accessing it
        if (!this.scene) {
            console.warn('Scene not available for animation creation');
            return;
        }
        
        // Create base animations
        const directions = ["right", "up", "left", "down"];
        const petType = this.getPetType();

        directions.forEach((dir, index) => {
            const walkKey = `${petType}-walk-${dir}`;
            const idleKey = `${petType}-idle-${dir}`;

            // Only create animation if it doesn't exist
            if (!this.scene.anims.exists(walkKey)) {
                try {
                    this.scene.anims.create({
                        key: walkKey,
                        frames: this.scene.anims.generateFrameNumbers(this.getWalkTexture(), {
                            start: index * 6,
                            end: index * 6 + 5,
                        }),
                        frameRate: 8,
                        repeat: -1
                    });
                    console.log(`Created animation: ${walkKey}`);
                } catch (error) {
                    console.error(`Failed to create animation ${walkKey}:`, error);
                }
            }

            if (!this.scene.anims.exists(idleKey)) {
                try {
                    this.scene.anims.create({
                        key: idleKey,
                        frames: this.scene.anims.generateFrameNumbers(this.getIdleTexture(), {
                            start: index * 6,
                            end: index * 6 + 5,
                        }),
                        frameRate: 3,
                        repeat: -1
                    });
                    console.log(`Created animation: ${idleKey}`);
                } catch (error) {
                    console.error(`Failed to create animation ${idleKey}:`, error);
                }
            }
        });

        // Allow subclasses to create additional animations
        this.createPetAnimations();
    }

    private createGiftBoxDisplay() {
        // Check if scene exists before accessing it
        if (!this.scene) {
            console.warn('Scene not available for gift box display creation');
            return;
        }
        
        // Create a container for the gift box UI
        const giftBoxContainer = this.scene.add.container(this.x, this.y - 40);
        
        // Create background for the gift box UI (like a tooltip)
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.7);
        background.fillRoundedRect(-30, -15, 60, 30, 5);
        background.lineStyle(2, 0xFFD700, 1);
        background.strokeRoundedRect(-30, -15, 60, 30, 5);
        
        // Create the gift box text
        this.giftBoxText = this.scene.add.text(
            0,
            0,
            '🎁 0',
            {
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#FFD700', // Gold color
                stroke: '#000000',
                strokeThickness: 2,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);
        
        // Add all elements to the container
        giftBoxContainer.add([background, this.giftBoxText]);
        giftBoxContainer.setDepth(10);
        
        // Make the entire container interactive
        giftBoxContainer.setInteractive(
            new Phaser.Geom.Rectangle(-30, -15, 60, 30),
            Phaser.Geom.Rectangle.Contains
        );
        
        // Add hover effect
        giftBoxContainer.on('pointerover', () => {
            background.clear();
            background.fillStyle(0x000000, 0.9);
            background.fillRoundedRect(-30, -15, 60, 30, 5);
            background.lineStyle(2, 0xFFFFFF, 1);
            background.strokeRoundedRect(-30, -15, 60, 30, 5);
            
            // Add a subtle scale effect on hover
            this.scene.tweens.add({
                targets: giftBoxContainer,
                scale: 1.1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        giftBoxContainer.on('pointerout', () => {
            background.clear();
            background.fillStyle(0x000000, 0.7);
            background.fillRoundedRect(-30, -15, 60, 30, 5);
            background.lineStyle(2, 0xFFD700, 1);
            background.strokeRoundedRect(-30, -15, 60, 30, 5);
            
            // Reset scale
            this.scene.tweens.add({
                targets: giftBoxContainer,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // Store reference to container for position updates
        (this as any).giftBoxContainer = giftBoxContainer;
    }

    private createShoutDisplay() {
        // Check if scene exists before accessing it
        if (!this.scene) {
            console.warn('Scene not available for shout display creation');
            return;
        }
        
        this.shoutText = this.scene.add.text(this.x, this.y - 70, '', {
            fontSize: '12px',
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            stroke: '#FFD700',
            strokeThickness: 1,
            wordWrap: { width: 200 },
            align: 'center'
        }).setOrigin(0.5);
        
        this.shoutText.setVisible(false);
        this.shoutText.setDepth(15);
    }

    private async loadGiftBoxData() {
        try {
            const playerId = this.getPlayerId();
            if (playerId) {
                const giftBoxData = await loadMoblinGiftBoxData(playerId);
                if (giftBoxData) {
                    this.giftBoxCount = giftBoxData.count || 0;
                    this.lastGiftTime = giftBoxData.lastGiftTime || Date.now();
                    this.updateGiftBoxDisplay();
                }
            }
        } catch (error) {
            console.error('Error loading gift box data:', error);
        }
    }

    protected async saveGiftBoxData() {
        try {
            const playerId = this.getPlayerId();
            if (playerId) {
                await saveMoblinGiftBoxData(playerId, {
                    count: this.giftBoxCount,
                    lastGiftTime: this.lastGiftTime
                });
            }
        } catch (error) {
            console.error('Error saving gift box data:', error);
        }
    }

    private getPlayerId(): string {
        try {
            const userDataStr = localStorage.getItem('niftdood-player');
            if (userDataStr) {
                const user = JSON.parse(userDataStr);
                return user.uid || '';
            }
        } catch (e) {
            console.warn('Could not parse user from localStorage', e);
        }
        return '';
    }

    protected updateGiftBoxDisplay() {
        if (this.giftBoxText) {
            this.giftBoxText.setText(`🎁 ${this.giftBoxCount}`);
        }
        
        // Update container position to follow pet
        const container = (this as any).giftBoxContainer;
        if (container) {
            container.setPosition(this.x, this.y - 40);
        }
    }

    public setTarget(target: Phaser.Physics.Arcade.Sprite) {
        this.target = target;
    }

    public async update(): Promise<void> {
        if (!this.target || !this.active) return;

        // Update gift box display position
        this.updateGiftBoxDisplay();

        // Update shout text position
        if (this.shoutText) {
            this.shoutText.setPosition(this.x, this.y - 70);
        }

        // Move toward target if too far away
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        
        if (distance > this.followDistance) {
            // Calculate direction to target
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            
            // Move toward target
            this.setVelocity(
                Math.cos(angle) * this.moveSpeed,
                Math.sin(angle) * this.moveSpeed
            );
            
            // Determine direction for animation
            let direction = 'down';
            if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                direction = Math.cos(angle) > 0 ? 'right' : 'left';
            } else {
                direction = Math.sin(angle) > 0 ? 'down' : 'up';
            }
            
            // Play walking animation if direction changed
            if (direction !== this.lastDirection) {
                this.lastDirection = direction;
                const animKey = `${this.getPetType()}-walk-${direction}`;
                if (this.scene && this.scene.anims.exists(animKey)) {
                    this.play(animKey);
                }
            }
        } else {
            // Stop moving and play idle animation
            this.setVelocity(0, 0);
            
            const animKey = `${this.getPetType()}-idle-${this.lastDirection}`;
            if (this.scene && this.scene.anims.exists(animKey)) {
                // Check if we're not already playing this animation
                if (this.anims && this.anims.currentAnim && this.anims.currentAnim.key !== animKey) {
                    this.play(animKey);
                } else if (!this.anims || !this.anims.currentAnim) {
                    this.play(animKey);
                }
            }
        }

        // Generate gift boxes periodically
        if (this.isCollecting && Date.now() - this.lastGiftTime > this.giftInterval) {
            if (this.giftBoxCount < this.maxGiftBoxes) {
                this.giftBoxCount++;
                this.lastGiftTime = Date.now();
                this.updateGiftBoxDisplay();
                await this.saveGiftBoxData();
            }
        }

        // Shout periodically
        if (Date.now() - this.lastShoutTime > this.shoutInterval) {
            this.shoutRandomMessage();
        }
    }

    public teleportToTarget(): void {
        if (!this.target) return;
        
        const offsetX = Phaser.Math.Between(-this.followDistance, this.followDistance);
        const offsetY = Phaser.Math.Between(-this.followDistance, this.followDistance);
        
        this.setPosition(this.target.x + offsetX, this.target.y + offsetY);
        this.setVelocity(0, 0);
        
        // Play teleport effect
        this.playTeleportEffect();
    }

    private playTeleportEffect(): void {
        // Check if scene exists before accessing it
        if (!this.scene) {
            console.warn('Scene not available for teleport effect');
            return;
        }
        
        // Create a simple teleport effect using existing glow texture
        const glow = this.scene.add.image(this.x, this.y, 'glow');
        glow.setAlpha(0.7);
        glow.setScale(2);
        
        // Add tint for visual effect
        glow.setTint(0x3498db); // Blue tint
        
        // Animate the glow
        this.scene.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 4,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                glow.destroy();
            }
        });
    }

    public startShouting(): void {
        // Initial shout after a short delay
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(2000, () => {
                this.shoutRandomMessage();
            });
        }
    }

    protected shoutRandomMessage(): void {
        if (!this.shoutText || !this.scene || !this.scene.time) return;
        
        let message: string;
        
        // Check network status
        if (this.networkMonitor && typeof this.networkMonitor.getIsOnline === 'function' && !this.networkMonitor.getIsOnline()) {
            const offlineMessages = this.getOfflineMessages();
            message = offlineMessages[Math.floor(Math.random() * offlineMessages.length)];
        } else {
            const shoutMessages = this.getShoutMessages();
            message = shoutMessages[Math.floor(Math.random() * shoutMessages.length)];
        }
        
        this.shoutText.setText(message);
        this.shoutText.setVisible(true);
        
        // Hide message after 3 seconds
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(3000, () => {
                if (this.shoutText) {
                    this.shoutText.setVisible(false);
                }
            });
        }
        
        this.lastShoutTime = Date.now();
    }

    public async collectAllGiftBoxes(): Promise<number> {
        const collected = this.giftBoxCount;
        this.giftBoxCount = 0;
        this.updateGiftBoxDisplay();
        await this.saveGiftBoxData();
        return collected;
    }

    public getGiftBoxCount(): number {
        return this.giftBoxCount;
    }

    public destroy(fromScene?: boolean): void {
        // Clean up gift box container
        const container = (this as any).giftBoxContainer;
        if (container) {
            container.destroy();
        }
        
        // Clean up shout text
        if (this.shoutText) {
            this.shoutText.destroy();
        }
        
        super.destroy(fromScene);
    }
}