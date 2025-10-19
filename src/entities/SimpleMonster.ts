import Phaser from 'phaser';

export class SimpleMonster extends Phaser.Physics.Arcade.Sprite {
    private health: number = 50;
    private speed: number = 30;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Use the monster idle texture
        super(scene, x, y, 'mobster_idle');
        
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        // Set up animations for monster sprites
        this.setupAnimations();
        this.play('monster-idle');
        
        // Set body size for collision
        if (this.body) {
            this.body.setSize(28, 28);
            this.body.setOffset(2, 4);
        }
    }

    private setupAnimations(): void {
        // Create idle animation
        if (!this.scene.anims.exists('monster-idle')) {
            this.scene.anims.create({
                key: 'monster-idle',
                frames: this.scene.anims.generateFrameNumbers('mobster_idle', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        }

        // Create walk animation
        if (!this.scene.anims.exists('monster-walk')) {
            this.scene.anims.create({
                key: 'monster-walk',
                frames: this.scene.anims.generateFrameNumbers('mobster_walk', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    public update(playerX: number, playerY: number): void {
        // Simple AI: move toward player if nearby
        const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        
        if (distance < 100) {
            // Move toward player
            this.scene.physics.moveTo(this, playerX, playerY, this.speed);
            this.play('monster-walk', true);
            
            // Flip sprite based on direction
            this.flipX = playerX < this.x;
        } else {
            // Idle if player is far
            this.setVelocity(0, 0);
            this.play('monster-idle', true);
        }
    }

    public takeDamage(amount: number): void {
        this.health -= amount;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
}