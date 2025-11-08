import Phaser from 'phaser';
import { FieldMonster } from '../entities/FieldMonster';

export default class MonsterManager {
  private scene: Phaser.Scene;
  private monsters: FieldMonster[] = [];
  private maxMonsters: number = 10;
  private spawnArea: { x: number; y: number; width: number; height: number };
  private spawnInterval: number = 5000; // 5 seconds
  private lastSpawnTime: number = 0;
  private static instance: MonsterManager | null = null;
  private respawnTimers: Phaser.Time.TimerEvent[] = []; // Track respawn timers

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Define spawn area to cover the entire field01 map (50x50 tiles at 32px each = 1600x1600px)
    this.spawnArea = {
      x: 50,    // Margin from left edge
      y: 50,    // Margin from top edge
      width: 1500,  // 1600px - 100px margins
      height: 1500  // 1600px - 100px margins
    };
  }

  public static getInstance(scene: Phaser.Scene): MonsterManager {
    if (!MonsterManager.instance) {
      MonsterManager.instance = new MonsterManager(scene);
    }
    MonsterManager.instance.scene = scene;
    return MonsterManager.instance;
  }

  public initialize(maxMonsters: number = 10): void {
    this.maxMonsters = maxMonsters;
    // Reset the last spawn time to ensure immediate spawning
    this.lastSpawnTime = 0;
    console.log(`👾 MonsterManager: Initialized with max ${this.maxMonsters} monsters`);
    
    // Clear any existing monsters to ensure a clean state
    this.clearMonsters();
    
    // Reset spawn time to prevent immediate spawning from update() method
    this.lastSpawnTime = this.scene.time.now;
    
    // Initial spawn
    this.spawnMonsters();
  }
  
  // Clear all existing monsters
  private clearMonsters(): void {
    // Clean up all existing monsters
    this.monsters.forEach(monster => {
      if (monster && typeof monster.destroy === 'function') {
        monster.destroy();
      }
    });
    this.monsters = [];
    
    // Clear any pending respawn timers
    this.clearRespawnTimers();
    
    // Update the CombatManager's monster list
    this.updateCombatManagerMonsters();
  }
  
  // Clear all pending respawn timers
  private clearRespawnTimers(): void {
    this.respawnTimers.forEach(timer => {
      if (timer) {
        timer.remove(false);
      }
    });
    this.respawnTimers = [];
  }

  public update(playerX?: number, playerY?: number): void {
    // Check if we need to spawn more monsters
    if (this.scene.time.now > this.lastSpawnTime + this.spawnInterval) {
      this.spawnMonsters();
      this.lastSpawnTime = this.scene.time.now;
    }
    
    // Update all monsters with player position if provided
    if (playerX !== undefined && playerY !== undefined) {
      this.monsters.forEach(monster => {
        if (monster && typeof monster.update === 'function') {
          monster.update(playerX, playerY);
        }
      });
    }
  }

  private spawnMonsters(): void {
    // Ensure we never exceed the max number of monsters
    // Remove excess monsters if we have too many
    while (this.monsters.length > this.maxMonsters) {
      const excessMonster = this.monsters.pop();
      if (excessMonster) {
        excessMonster.destroy();
        console.log(`👾 Excess monster removed. Total monsters: ${this.monsters.length}`);
      }
    }
    
    // Only spawn if we have fewer monsters than the max
    let monstersSpawned = 0;
    while (this.monsters.length < this.maxMonsters) {
      const x = Phaser.Math.Between(this.spawnArea.x, this.spawnArea.x + this.spawnArea.width);
      const y = Phaser.Math.Between(this.spawnArea.y, this.spawnArea.y + this.spawnArea.height);
      
      // Check if position is valid (not inside a wall)
      if (this.isPositionValid(x, y)) {
        // Randomly select monster type (33% chance for each type)
        const rand = Math.random();
        let monsterType = 'mobster';
        if (rand < 0.33) {
            monsterType = 'mobster';
        } else if (rand < 0.66) {
            monsterType = 'mobster02';
        } else {
            monsterType = 'mobster03';
        }
        
        const monster = new FieldMonster(this.scene, x, y, monsterType);
        this.monsters.push(monster);
        monstersSpawned++;
        console.log(`👾 ${monsterType} spawned at (${x}, ${y}). Total monsters: ${this.monsters.length}`);
      }
    }
    
    // If we spawned new monsters or had to remove excess, update the CombatManager's monster list
    if (monstersSpawned > 0 || this.monsters.length > this.maxMonsters) {
      // Ensure we have exactly the right number of monsters
      while (this.monsters.length > this.maxMonsters) {
        const excessMonster = this.monsters.pop();
        if (excessMonster) {
          excessMonster.destroy();
          console.log(`👾 Excess monster removed during cleanup. Total monsters: ${this.monsters.length}`);
        }
      }
      
      this.updateCombatManagerMonsters();
    }
  }
  
  // Update the CombatManager's monster list
  private updateCombatManagerMonsters(): void {
    // Notify the CombatManager to update its monster list
    if (this.scene && (this.scene as any).combatManager) {
      (this.scene as any).combatManager.registerMonsters(this.monsters);
    }
  }

  private isPositionValid(_x: number, _y: number): boolean {
    // Simple validation - in a real implementation, you might want to check
    // against the tilemap to ensure the position is not inside a wall
    return true;
  }

  public removeMonster(monster: FieldMonster): void {
    const index = this.monsters.indexOf(monster);
    if (index !== -1) {
      this.monsters.splice(index, 1);
      console.log(`👾 Monster removed. Total monsters: ${this.monsters.length}`);
    }
  }

  /**
   * Handle monster defeat - called when a monster is defeated in combat
   */
  public handleMonsterDefeated(monster: FieldMonster): void {
    // Remove the monster from our list
    const index = this.monsters.indexOf(monster);
    if (index !== -1) {
      this.monsters.splice(index, 1);
      console.log(`👾 Monster defeated. Total monsters: ${this.monsters.length}`);
    }
    
    // Schedule a respawn after a delay and track the timer
    const respawnTimer = this.scene.time.delayedCall(3000, () => {
      this.spawnMonsters();
      // Remove this timer from our tracking array
      const timerIndex = this.respawnTimers.indexOf(respawnTimer);
      if (timerIndex !== -1) {
        this.respawnTimers.splice(timerIndex, 1);
      }
    });
    
    // Track the respawn timer
    this.respawnTimers.push(respawnTimer);
  }

  public getMonsterCount(): number {
    return this.monsters.length;
  }

  public getMaxMonsters(): number {
    return this.maxMonsters;
  }

  public setMaxMonsters(max: number): void {
    this.maxMonsters = max;
    // If we now have more monsters than the new max, remove excess monsters
    while (this.monsters.length > this.maxMonsters) {
      const monster = this.monsters.pop();
      if (monster) {
        monster.destroy();
      }
    }
  }

  public destroy(): void {
    // Clean up all monsters
    this.monsters.forEach(monster => {
      if (monster && typeof monster.destroy === 'function') {
        monster.destroy();
      }
    });
    this.monsters = [];
    
    // Clear all pending respawn timers
    this.clearRespawnTimers();
    
    // Reset the singleton instance
    MonsterManager.instance = null;
  }
}