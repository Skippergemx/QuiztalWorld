import Phaser from 'phaser';

export class Monster extends Phaser.Physics.Arcade.Sprite {
    protected health: number;
    protected maxHealth: number;
    protected speed: number;
    protected damage: number;
    protected isAggressive: boolean;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number
    ) {
        super(scene, x, y, texture, frame);
        
        // Initialize properties
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 50;
        this.damage = 10;
        this.isAggressive = false;
        
        // Enable physics
        scene.physics.world.enable(this);
        this.setCollideWorldBounds(true);
        
        // Add to scene
        scene.add.existing(this);
    }

    // Basic methods that all monsters will have
    public takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
        }
    }

    protected die(): void {
        // Handle death animation and cleanup
        this.destroy();
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // Getters
    public getHealth(): number {
        return this.health;
    }

    public getMaxHealth(): number {
        return this.maxHealth;
    }

    public isAlive(): boolean {
        return this.health > 0;
    }
}