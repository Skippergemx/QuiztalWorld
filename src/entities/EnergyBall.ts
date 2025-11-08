import Phaser from 'phaser';

export class EnergyBall extends Phaser.Physics.Arcade.Sprite {
    private damage: number;
    private speed: number;
    private directionAngle: number;
    private monsterCheckCallback: ((ball: any) => void) | null = null;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        targetX: number,
        targetY: number
    ) {
        // Use the glow texture for the energy ball
        super(scene, x, y, 'glow');
        
        // Initialize properties
        this.damage = 25;
        this.speed = 300;
        
        // Calculate angle to target
        this.directionAngle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        
        // Debug information
        console.log('EnergyBall created:', {
            startX: x,
            startY: y,
            targetX: targetX,
            targetY: targetY,
            angle: this.directionAngle,
            degrees: Phaser.Math.RadToDeg(this.directionAngle)
        });
        
        // Enable physics
        scene.physics.world.enable(this);
        
        // Set circle body for better collision detection
        if (this.body) {
            this.body.setCircle(8);
            this.body.setOffset(4, 4);
        }
        
        // Set depth to appear above most objects
        this.setDepth(100);
        
        // Add to scene
        scene.add.existing(this);
        
        // Scale the glow effect to make it look like an energy ball
        this.setScale(0.5);
        
        // Create visual effect
        this.createVisualEffect();
        
        // Set velocity toward target using direct velocity calculation
        if (this.body) {
            // Check if body is ArcadeBody2D (dynamic body)
            if (this.body instanceof Phaser.Physics.Arcade.Body) {
                // Calculate direction vector
                const dx = targetX - x;
                const dy = targetY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize and scale by speed
                if (distance > 0) {
                    const vx = (dx / distance) * this.speed;
                    const vy = (dy / distance) * this.speed;
                    this.body.setVelocity(vx, vy);
                    console.log('EnergyBall velocity set:', { vx, vy });
                }
            } else {
                // Fallback to velocityFromRotation
                scene.physics.velocityFromRotation(this.directionAngle, this.speed, this.body.velocity);
                console.log('EnergyBall velocity set (fallback):', this.body.velocity);
            }
        }
        
        // Add lifespan timer (destroy after 3 seconds if it doesn't hit anything)
        scene.time.delayedCall(3000, () => {
            if (this.active) {
                this.destroy();
            }
        });
        
        // Add update callback to check for monster collisions
        scene.events.on('postupdate', this.checkMonsterCollisions, this);
    }

    private createVisualEffect(): void {
        // Create a glowing effect for the energy ball
        const glow = this.scene.add.graphics();
        glow.fillStyle(0x00ffff, 0.5);
        glow.fillCircle(0, 0, 12);
        glow.setPosition(this.x, this.y);
        glow.setDepth(this.depth - 1);
        
        // Animate the glow
        this.scene.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 2,
            duration: 1000,
            repeat: -1,
            yoyo: true
        });
        
        // Update glow position with energy ball
        this.scene.events.on('postupdate', () => {
            if (this.active) {
                glow.setPosition(this.x, this.y);
            } else {
                glow.destroy();
            }
        });
    }

    public getDamage(): number {
        return this.damage;
    }

    public hitTarget(): void {
        // Create hit effect
        this.createHitEffect();
        
        // Destroy the energy ball
        this.destroy();
    }

    private createHitEffect(): void {
        // Create explosion effect when energy ball hits something
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0x00ffff, 0.8);
        explosion.fillCircle(0, 0, 20);
        explosion.setPosition(this.x, this.y);
        explosion.setDepth(100);
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Create particle effects
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0x00ffff, 0.7);
            particle.fillCircle(0, 0, 3);
            particle.setPosition(this.x, this.y);
            particle.setDepth(100);
            
            // Animate particles flying outward
            const angle = (i / 6) * Math.PI * 2;
            const distance = 30;
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    // Set callback for monster checking
    public setMonsterCheckCallback(callback: (ball: any) => void): void {
        this.monsterCheckCallback = callback;
    }
    
    // Check for monster collisions
    private checkMonsterCollisions(): void {
        // Add null checks to prevent errors when the energy ball is being destroyed
        if (!this.scene || !this.active) {
            this.cleanupEventListeners();
            return;
        }
        
        if (this.monsterCheckCallback && this.active) {
            this.monsterCheckCallback(this);
        }
        
        // Clean up if the energy ball is no longer active
        if (!this.active) {
            this.cleanupEventListeners();
        }
    }
    
    // Cleanup event listeners
    private cleanupEventListeners(): void {
        if (this.scene) {
            this.scene.events.off('postupdate', this.checkMonsterCollisions, this);
        }
    }
    
    // Override destroy method to clean up events
    public destroy(): void {
        this.cleanupEventListeners();
        // Call parent destroy method
        super.destroy();
    }
}