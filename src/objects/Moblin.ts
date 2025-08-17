import Phaser from 'phaser';
import { loadMoblinGiftBoxData, saveMoblinGiftBoxData } from '../utils/Database';

export default class Moblin extends Phaser.Physics.Arcade.Sprite {
    private target!: Phaser.Physics.Arcade.Sprite;
    private followDistance: number = 50;
    private moveSpeed: number = 160;
    private lastDirection: string = 'down';
    
    // Gift box collector properties
    private giftBoxText!: Phaser.GameObjects.Text;
    private giftBoxCount: number = 0;
    private maxGiftBoxes: number = 100;
    private lastGiftTime: number = 0;
    private giftInterval: number = 60000; // 60 seconds in milliseconds
    private isCollecting: boolean = true;

    // Shout messages
    private shoutMessages: string[] = [
        "I'm drawn to Gemantes! 🌟",
        "Gemantes make me feel special! 💎",
        "Press 'O' to collect my gift boxes! 🎁",
        "I follow players with Gemantes! 👣",
        "My gift boxes contain Quiztals! 💰",
        "Gemantes are my favorite! ✨",
        "Collect my gifts with 'O' key! ⌨️",
        "I love Gemante holders! ❤️",
        "More Gemantes = More gifts! 🎁",
        "I'll come if you have Gemantes! 🔍"
    ];
    private shoutText!: Phaser.GameObjects.Text;
    private lastShoutTime: number = 0;
    private shoutInterval: number = 8000; // 8 seconds

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'moblin_idle');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setDepth(5); // Above ground, below UI
        
        console.log('Moblin constructor - checking textures...');
        console.log('moblin_idle exists:', scene.textures.exists('moblin_idle'));
        console.log('moblin_walk exists:', scene.textures.exists('moblin_walk'));
        
        this.createAnimations();
        this.createGiftBoxDisplay();
        this.createShoutDisplay();
        this.loadGiftBoxData();
        this.lastGiftTime = Date.now();
        this.lastShoutTime = Date.now();
        
        // Wait for next frame before playing animation to ensure it's created
        scene.time.delayedCall(50, () => {
            if (this.scene.anims.exists('moblin-idle-down')) {
                console.log('Playing moblin-idle-down animation');
                this.play('moblin-idle-down');
            } else {
                console.error('moblin-idle-down animation does not exist!');
            }
        });
        
        // Make the moblin interactive
        this.makeInteractive();
        
        // Start shouting
        this.startShouting();
    }

    // Make the moblin interactive after it's created
    private makeInteractive() {
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', () => {
            // Just log for now, the actual interaction is handled in GameScene
            console.log('Moblin clicked');
        });
    }

    private createAnimations() {
        const directions = ["right", "up", "left", "down"];

        directions.forEach((dir, index) => {
            const walkKey = `moblin-walk-${dir}`;
            const idleKey = `moblin-idle-${dir}`;

            // Only create animation if it doesn't exist
            if (!this.scene.anims.exists(walkKey)) {
                try {
                    this.scene.anims.create({
                        key: walkKey,
                        frames: this.scene.anims.generateFrameNumbers('moblin_walk', {
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
                        frames: this.scene.anims.generateFrameNumbers('moblin_idle', {
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
    }

    private createGiftBoxDisplay() {
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
            
            // Reset scale effect
            this.scene.tweens.add({
                targets: giftBoxContainer,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // Add click event
        giftBoxContainer.on('pointerdown', () => {
            // Trigger gift box collection when clicked
            this.scene.events.emit('giftBoxClicked', this);
            
            // Add visual feedback for click
            this.scene.tweens.add({
                targets: giftBoxContainer,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        });
        
        // Store reference to the container for positioning
        (this as any).giftBoxContainer = giftBoxContainer;
        
        // Store base position for the floating animation
        giftBoxContainer.setData('baseX', this.x);
        giftBoxContainer.setData('baseY', this.y - 40);
        
        // Add a subtle floating animation to the gift box container
        // Store reference to the tween so we can update it later
        const floatingTween = this.scene.tweens.add({
            targets: giftBoxContainer,
            y: 0, // We'll calculate the actual position in the onUpdate callback
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const target = tween.targets[0] as Phaser.GameObjects.Container;
                const baseX = target.data.values.baseX as number;
                const baseY = target.data.values.baseY as number;
                if (baseX !== undefined && baseY !== undefined) {
                    // Calculate floating offset based on tween progress
                    const progress = tween.totalProgress;
                    const floatingOffset = Math.sin(progress * Math.PI * 2) * 3;
                    target.setX(baseX);
                    target.setY(baseY + floatingOffset);
                }
            }
        });
        
        // Store reference to the tween for later updates
        (this as any).giftBoxFloatingTween = floatingTween;
    }

    private createShoutDisplay() {
        // Create the shout text above the moblin
        this.shoutText = this.scene.add.text(
            this.x,
            this.y - 60,
            '',
            {
                fontSize: '12px',
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
        ).setOrigin(0.5)
         .setDepth(11) // Above gift box text
         .setVisible(false);
    }

    private async loadGiftBoxData() {
        // Load saved gift box data from Firestore
        try {
            // Get player ID from localStorage
            const userStr = localStorage.getItem('quiztal-player');
            if (!userStr) {
                console.log('No player data found, using default values');
                return;
            }
            
            const user = JSON.parse(userStr);
            const playerId = user.uid;
            
            if (!playerId) {
                console.log('No player ID found, using default values');
                return;
            }
            
            const giftBoxData = await loadMoblinGiftBoxData(playerId);
            if (giftBoxData) {
                this.giftBoxCount = Math.min(giftBoxData.count || 0, this.maxGiftBoxes);
                this.lastGiftTime = giftBoxData.lastGiftTime || Date.now();
                
                // Check if we should stop collecting (reached max)
                if (this.giftBoxCount >= this.maxGiftBoxes) {
                    this.isCollecting = false;
                }
                
                this.updateGiftBoxDisplay();
                console.log(`Loaded ${this.giftBoxCount} gift boxes from Firestore`);
            }
        } catch (error) {
            console.error('Error loading gift box data from Firestore:', error);
            this.giftBoxCount = 0;
            this.lastGiftTime = Date.now();
        }
    }

    private async saveGiftBoxData() {
        // Save gift box data to Firestore
        try {
            // Get player ID from localStorage
            const userStr = localStorage.getItem('quiztal-player');
            if (!userStr) {
                console.log('No player data found, skipping save');
                return;
            }
            
            const user = JSON.parse(userStr);
            const playerId = user.uid;
            
            if (!playerId) {
                console.log('No player ID found, skipping save');
                return;
            }
            
            const giftBoxData = {
                count: this.giftBoxCount,
                lastGiftTime: this.lastGiftTime
            };
            
            await saveMoblinGiftBoxData(playerId, giftBoxData);
        } catch (error) {
            console.error('Error saving gift box data to Firestore:', error);
        }
    }

    private updateGiftBoxDisplay() {
        if (this.giftBoxText) {
            // Show different displays based on count
            let displayText = '';
            
            if (this.giftBoxCount >= this.maxGiftBoxes) {
                displayText = '🎁✨ MAX! ✨';
                this.giftBoxText.setColor('#FF6B6B'); // Red color when maxed
            } else if (this.giftBoxCount === 0) {
                displayText = '🎁 0';
            } else {
                displayText = `🎁 ${this.giftBoxCount}`;
            }
            
            this.giftBoxText.setText(displayText);
        }
    }

    private async collectGiftBoxes() {
        if (!this.isCollecting || this.giftBoxCount >= this.maxGiftBoxes) {
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastGift = currentTime - this.lastGiftTime;

        // Check if enough time has passed (1 minute)
        if (timeSinceLastGift >= this.giftInterval) {
            // Random gift boxes between 1-3
            const newBoxes = Math.floor(Math.random() * 3) + 1;
            this.giftBoxCount = Math.min(this.giftBoxCount + newBoxes, this.maxGiftBoxes);
            
            this.lastGiftTime = currentTime;
            this.updateGiftBoxDisplay();
            await this.saveGiftBoxData();

            // Stop collecting if we've reached the max
            if (this.giftBoxCount >= this.maxGiftBoxes) {
                this.isCollecting = false;
                console.log('🎁 Moblin has reached maximum gift boxes!');
            }

            // Show a little celebration animation when collecting
            this.showCollectionAnimation(newBoxes);
            
            console.log(`🎁 Moblin collected ${newBoxes} gift boxes! Total: ${this.giftBoxCount}`);
        }
    }

    private showCollectionAnimation(newBoxes: number) {
        // Create temporary text showing the new boxes collected
        const collectText = this.scene.add.text(
            this.x,
            this.y - 60,
            `+${newBoxes} 🎁`,
            {
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#00FF00', // Bright green
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5)
         .setDepth(15);

        // Animate the collection text
        this.scene.tweens.add({
            targets: collectText,
            y: collectText.y - 30,
            alpha: 0,
            scale: 1.5,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                collectText.destroy();
            }
        });

        // Make the moblin "bounce" slightly when collecting
        this.scene.tweens.add({
            targets: this,
            scaleY: 1.1,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    setTarget(target: Phaser.Physics.Arcade.Sprite) {
        this.target = target;
    }

    async update() {
        if (!this.target) return;

        // Update gift box collection
        await this.collectGiftBoxes();

        // Update gift box display position to follow moblin
        if ((this as any).giftBoxContainer) {
            // Ensure gift box container is positioned correctly above the moblin
            const giftBoxYOffset = -40; // Position above the moblin's head
            // Update the base position for the floating animation
            (this as any).giftBoxContainer.setData('baseX', this.x);
            (this as any).giftBoxContainer.setData('baseY', this.y + giftBoxYOffset);
        }
        
        // Update shout text position to follow moblin
        if (this.shoutText) {
            // Ensure shout text is positioned correctly above the moblin
            const shoutYOffset = -60; // Position above the gift box
            this.shoutText.setPosition(this.x, this.y + shoutYOffset);
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // Follow if too far away
        if (distance > this.followDistance + 20) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );

            this.setVelocity(
                Math.cos(angle) * this.moveSpeed,
                Math.sin(angle) * this.moveSpeed
            );

            // Determine direction based on angle
            const direction = this.getDirectionFromAngle(angle);
            this.lastDirection = direction;
            this.play(`moblin-walk-${direction}`, true);
            
        } else if (distance < this.followDistance - 10) {
            // Too close, move away slightly
            const angle = Phaser.Math.Angle.Between(
                this.target.x, this.target.y,
                this.x, this.y
            );

            this.setVelocity(
                Math.cos(angle) * (this.moveSpeed * 0.5),
                Math.sin(angle) * (this.moveSpeed * 0.5)
            );

            const direction = this.getDirectionFromAngle(angle);
            this.lastDirection = direction;
            this.play(`moblin-walk-${direction}`, true);
            
        } else {
            // Perfect distance, idle
            this.setVelocity(0, 0);
            this.play(`moblin-idle-${this.lastDirection}`, true);
        }
    }

    private getDirectionFromAngle(angle: number): string {
        // Convert angle to degrees and normalize
        const degrees = Phaser.Math.RadToDeg(angle);
        const normalizedDegrees = (degrees + 360) % 360;

        // Determine direction based on angle
        if (normalizedDegrees >= 315 || normalizedDegrees < 45) {
            return 'right';
        } else if (normalizedDegrees >= 45 && normalizedDegrees < 135) {
            return 'down';
        } else if (normalizedDegrees >= 135 && normalizedDegrees < 225) {
            return 'left';
        } else {
            return 'up';
        }
    }

    // Teleport to player if too far (prevents getting stuck)
    teleportToTarget() {
        if (!this.target) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        if (distance > 200) {
            // Teleport to a position near the player
            const angle = Math.random() * Math.PI * 2;
            const offsetX = Math.cos(angle) * this.followDistance;
            const offsetY = Math.sin(angle) * this.followDistance;
            
            this.setPosition(
                this.target.x + offsetX,
                this.target.y + offsetY
            );

            // Update gift box text position after teleport
            if ((this as any).giftBoxContainer) {
                // Update the base position for the floating animation
                (this as any).giftBoxContainer.setData('baseX', this.x);
                (this as any).giftBoxContainer.setData('baseY', this.y - 40);
                
                // Restart the floating animation after teleport
                if ((this as any).giftBoxFloatingTween) {
                    (this as any).giftBoxFloatingTween.stop();
                }
                (this as any).giftBoxFloatingTween = this.scene.tweens.add({
                    targets: (this as any).giftBoxContainer,
                    y: 0, // We'll calculate the actual position in the onUpdate callback
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: (tween) => {
                        const target = tween.targets[0] as Phaser.GameObjects.Container;
                        const baseX = target.data.values.baseX as number;
                        const baseY = target.data.values.baseY as number;
                        if (baseX !== undefined && baseY !== undefined) {
                            // Calculate floating offset based on tween progress
                            const progress = tween.totalProgress;
                            const floatingOffset = Math.sin(progress * Math.PI * 2) * 3;
                            target.setX(baseX);
                            target.setY(baseY + floatingOffset);
                        }
                    }
                });
            }
            
            // Update shout text position after teleport
            if (this.shoutText) {
                this.shoutText.setPosition(this.x, this.y - 60);
            }
        }
    }

    // Public method to get current gift box count
    getGiftBoxCount(): number {
        return this.giftBoxCount;
    }

    // Public method to reset gift boxes (for when player collects them)
    async resetGiftBoxes() {
        this.giftBoxCount = 0;
        this.isCollecting = true;
        this.lastGiftTime = Date.now();
        this.updateGiftBoxDisplay();
        await this.saveGiftBoxData();
        console.log('🎁 Gift boxes reset, collection resumed!');
    }

    // Public method to manually collect gift boxes (if needed)
    async collectAllGiftBoxes(): Promise<number> {
        const collected = this.giftBoxCount;
        await this.resetGiftBoxes();
        return collected;
    }

    // Public method to interact with the moblin
    async interact() {
        const giftBoxCount = this.getGiftBoxCount();
        console.log(`Moblin has ${giftBoxCount} gift boxes`);
        // The actual collection logic is handled in GameScene
    }

    // Clean up when moblin is destroyed
    destroy(fromScene?: boolean) {
        if ((this as any).giftBoxContainer) {
            (this as any).giftBoxContainer.destroy();
        }
        super.destroy(fromScene);
    }

    // Start shouting periodically
    private startShouting() {
        this.scene.time.addEvent({
            delay: this.shoutInterval,
            callback: () => {
                this.shoutRandomMessage();
                // Restart for continuous shouting (but with interval check)
            },
            loop: false
        });
    }

    // Shout a random message
    private shoutRandomMessage() {
        const currentTime = Date.now();
        if (currentTime - this.lastShoutTime >= this.shoutInterval) {
            const randomMessage = Phaser.Utils.Array.GetRandom(this.shoutMessages);
            this.showShout(randomMessage);
            this.lastShoutTime = currentTime;
        }
        
        // Schedule next shout
        this.scene.time.delayedCall(this.shoutInterval, () => {
            this.shoutRandomMessage();
        });
    }

    // Show shout message
    private showShout(message: string) {
        if (this.shoutText) {
            this.shoutText.setText(message).setVisible(true);
            
            // Animate the shout text
            this.scene.tweens.add({
                targets: this.shoutText,
                alpha: 0,
                duration: 3000,
                onComplete: () => {
                    this.shoutText.setVisible(false).setAlpha(1);
                }
            });
        }
    }
}