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
    private isIdle: boolean = false; // Track if monster is currently idle
    private idleTimer: number = 0; // Track how long monster has been idle
    private idleDuration: number = 3000; // Idle for 3 seconds before moving again
    private monsterType: string;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        monsterType: string = 'mobster'
    ) {
        // Using the monster idle texture based on type
        const texture = monsterType === 'mobster02' ? 'mobster_idle02' : 'mobster_idle';
        super(scene, x, y, texture);
        
        this.monsterType = monsterType;
        
        // Initialize monster-specific properties
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 30;
        this.damage = 15;
        this.isAggressive = true;
        
        // Set depth to match Moblin pet (5) for proper z-axis alignment
        this.setDepth(5);
        
        // Define roam area (monsters will stay within this area)
        // Increased roam area size to 800x800 to allow better coverage of the map
        this.roamArea = {
            x: Math.max(50, x - 400),  // Ensure we stay within map bounds (50px margin)
            y: Math.max(50, y - 400),  // Ensure we stay within map bounds (50px margin)
            width: 800,  // Larger roam area
            height: 800  // Larger roam area
        };
        
        // Set initial move target
        this.moveTarget = { x, y };
        this.setNewRoamTarget();
        
        // Setup animations
        this.setupAnimations();
        
        // Start with idle animation
        this.play(`${this.monsterType}-idle`);
    }

    private setupAnimations(): void {
        const idleKey = this.monsterType === 'mobster02' ? 'mobster_idle02' : 'mobster_idle';
        const walkKey = this.monsterType === 'mobster02' ? 'mobster_walk02' : 'mobster_walk';
        
        // Create idle animation
        if (!this.scene.anims.exists(`${this.monsterType}-idle`)) {
            this.scene.anims.create({
                key: `${this.monsterType}-idle`,
                frames: this.scene.anims.generateFrameNumbers(idleKey, { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        }

        // Create walk animation
        if (!this.scene.anims.exists(`${this.monsterType}-walk`)) {
            this.scene.anims.create({
                key: `${this.monsterType}-walk`,
                frames: this.scene.anims.generateFrameNumbers(walkKey, { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Create attack animation (using walk frames as placeholder)
        if (!this.scene.anims.exists(`${this.monsterType}-attack`)) {
            this.scene.anims.create({
                key: `${this.monsterType}-attack`,
                frames: this.scene.anims.generateFrameNumbers(walkKey, { start: 0, end: 3 }),
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
            // If we were idle, reset idle state when starting to chase
            if (this.isIdle) {
                this.isIdle = false;
                this.idleTimer = 0;
            }
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
            this.play(`${this.monsterType}-walk`, true);
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
        // Reset idle state when stopping chase
        this.isIdle = false;
        this.idleTimer = 0;
    }

    private roam(): void {
        // If monster is currently idle, update idle timer
        if (this.isIdle) {
            this.idleTimer += this.scene.game.loop.delta;
            
            // Check if idle duration has passed
            if (this.idleTimer > this.idleDuration) {
                this.isIdle = false;
                this.idleTimer = 0;
                // Set a new roam target when coming out of idle
                this.setNewRoamTarget();
            }
            // Stay idle, don't move
            return;
        }
        
        // Update move timer
        this.moveTimer += this.scene.game.loop.delta;
        
        // Move toward target
        if (this.body) {
            this.scene.physics.moveTo(this, this.moveTarget.x, this.moveTarget.y, this.speed);
            
            // Play walk animation if not already playing
            if (!this.anims.currentAnim || this.anims.currentAnim.key !== `${this.monsterType}-walk`) {
                this.play(`${this.monsterType}-walk`, true);
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
                if (!this.anims.currentAnim || this.anims.currentAnim.key !== `${this.monsterType}-idle`) {
                    this.play(`${this.monsterType}-idle`, true);
                }
                // Enter idle state
                this.isIdle = true;
                this.idleTimer = 0;
                this.moveTimer = 0; // Reset move timer
                return; // Don't set new target immediately
            }
            
            // Check if it's time to set a new target (only if not idle)
            if (this.moveTimer > this.moveInterval) {
                this.setNewRoamTarget();
                this.moveTimer = 0;
            }
        }
    }

    private setNewRoamTarget(): void {
        // Set a new random target within the roam area
        this.moveTarget.x = Phaser.Math.Between(this.roamArea.x, this.roamArea.x + this.roamArea.width);
        this.moveTarget.y = Phaser.Math.Between(this.roamArea.y, this.roamArea.y + this.roamArea.height);
        // When setting a new target, monster is no longer idle
        this.isIdle = false;
        this.idleTimer = 0;
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
        this.play(`${this.monsterType}-attack`); // Using attack animation as placeholder for death
        this.scene.time.delayedCall(500, () => {
            super.die();
        });
    }
}