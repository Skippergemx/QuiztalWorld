import Phaser from 'phaser';
import { Monster } from './Monster';

export class FieldMonster extends Monster {
    private roamArea: { x: number; y: number; width: number; height: number };
    private moveTarget: { x: number; y: number };
    private moveTimer: number = 0;
    private moveInterval: number = 2000; // Change direction every 2 seconds
    private playerDetectionRange: number = 150;
    private isChasing: boolean = false;
    private chaseTimer: number = 0;
    private chaseDuration: number = 5000; // Chase for 5 seconds max

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number
    ) {
        // Using the monster idle texture
        super(scene, x, y, 'mobster_idle');
        
        // Initialize monster-specific properties
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 30;
        this.damage = 15;
        this.isAggressive = true;
        
        // Define roam area (monsters will stay within this area)
        this.roamArea = {
            x: Math.max(0, x - 200),
            y: Math.max(0, y - 200),
            width: 400,
            height: 400
        };
        
        // Set initial move target
        this.moveTarget = { x, y };
        this.setNewRoamTarget();
        
        // Setup animations
        this.setupAnimations();
        
        // Start with idle animation
        this.play('monster-idle');
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

        // Create attack animation (using walk frames as placeholder)
        if (!this.scene.anims.exists('monster-attack')) {
            this.scene.anims.create({
                key: 'monster-attack',
                frames: this.scene.anims.generateFrameNumbers('mobster_walk', { start: 0, end: 3 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }

    public update(playerX: number, playerY: number): void {
        // Check if we should chase the player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y, playerX, playerY
        );

        if (distanceToPlayer < this.playerDetectionRange && this.isAggressive) {
            this.chasePlayer(playerX, playerY);
        } else {
            // If we were chasing, continue roaming after a short time
            if (this.isChasing) {
                this.chaseTimer += this.scene.game.loop.delta;
                if (this.chaseTimer > this.chaseDuration) {
                    this.stopChasing();
                }
            }
            this.roam();
        }
    }

    private chasePlayer(playerX: number, playerY: number): void {
        if (!this.isChasing) {
            this.isChasing = true;
            this.chaseTimer = 0;
            this.play('monster-walk', true);
        }

        // Move toward player
        this.scene.physics.moveTo(this, playerX, playerY, this.speed * 1.5);
        
        // Flip sprite based on movement direction
        if (playerX < this.x) {
            this.flipX = true;
        } else {
            this.flipX = false;
        }
    }

    private stopChasing(): void {
        this.isChasing = false;
        this.chaseTimer = 0;
        this.setNewRoamTarget();
    }

    private roam(): void {
        // Update move timer
        this.moveTimer += this.scene.game.loop.delta;
        
        // Check if it's time to set a new target
        if (this.moveTimer > this.moveInterval) {
            this.setNewRoamTarget();
            this.moveTimer = 0;
        }
        
        // Move toward target
        if (this.body) {
            this.scene.physics.moveTo(this, this.moveTarget.x, this.moveTarget.y, this.speed);
            
            // Play walk animation if not already playing
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== 'monster-walk') {
                this.play('monster-walk', true);
            }
            
            // Flip sprite based on movement direction
            if (this.moveTarget.x < this.x) {
                this.flipX = true;
            } else {
                this.flipX = false;
            }
            
            // Check if we've reached the target (within 10 pixels)
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
            if (distance < 10) {
                // Reached target, set idle animation
                this.setVelocity(0, 0);
                if (!this.anims.currentAnim || this.anims.currentAnim.key !== 'monster-idle') {
                    this.play('monster-idle', true);
                }
            }
        }
    }

    private setNewRoamTarget(): void {
        // Set a new random target within the roam area
        this.moveTarget.x = Phaser.Math.Between(this.roamArea.x, this.roamArea.x + this.roamArea.width);
        this.moveTarget.y = Phaser.Math.Between(this.roamArea.y, this.roamArea.y + this.roamArea.height);
    }

    public takeDamage(amount: number): void {
        super.takeDamage(amount);
        
        // Visual feedback when taking damage
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }

    protected die(): void {
        // Play death animation
        this.play('monster-attack'); // Using attack animation as placeholder for death
        this.scene.time.delayedCall(500, () => {
            super.die();
        });
    }
}