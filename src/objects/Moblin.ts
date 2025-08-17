import Phaser from 'phaser';

export default class Moblin extends Phaser.Physics.Arcade.Sprite {
    private target!: Phaser.Physics.Arcade.Sprite;
    private followDistance: number = 50;
    private moveSpeed: number = 160;
    private lastDirection: string = 'down';

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
        
        // Wait for next frame before playing animation to ensure it's created
        scene.time.delayedCall(50, () => {
            if (this.scene.anims.exists('moblin-idle-down')) {
                console.log('Playing moblin-idle-down animation');
                this.play('moblin-idle-down');
            } else {
                console.error('moblin-idle-down animation does not exist!');
            }
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

    setTarget(target: Phaser.Physics.Arcade.Sprite) {
        this.target = target;
    }

    update() {
        if (!this.target) return;

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
        }
    }
}