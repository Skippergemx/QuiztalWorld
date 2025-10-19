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

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Define spawn area (you can adjust these values based on your map)
    this.spawnArea = {
      x: 100,
      y: 100,
      width: 700,
      height: 500
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
    console.log(`👾 MonsterManager: Initialized with max ${this.maxMonsters} monsters`);
    
    // Initial spawn
    this.spawnMonsters();
  }

  public update(): void {
    // Check if we need to spawn more monsters
    if (this.scene.time.now > this.lastSpawnTime + this.spawnInterval) {
      this.spawnMonsters();
      this.lastSpawnTime = this.scene.time.now;
    }
  }

  private spawnMonsters(): void {
    // Only spawn if we have fewer monsters than the max
    while (this.monsters.length < this.maxMonsters) {
      const x = Phaser.Math.Between(this.spawnArea.x, this.spawnArea.x + this.spawnArea.width);
      const y = Phaser.Math.Between(this.spawnArea.y, this.spawnArea.y + this.spawnArea.height);
      
      // Check if position is valid (not inside a wall)
      if (this.isPositionValid(x, y)) {
        const monster = new FieldMonster(this.scene, x, y);
        this.monsters.push(monster);
        console.log(`👾 Monster spawned at (${x}, ${y}). Total monsters: ${this.monsters.length}`);
      }
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
    MonsterManager.instance = null;
  }
}