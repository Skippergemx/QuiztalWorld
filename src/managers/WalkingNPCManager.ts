import Phaser from 'phaser';
import WalkingNPC from '../objects/WalkingNPC';
import PathfindingManager from './PathfindingManager';

export default class WalkingNPCManager {
  private scene: Phaser.Scene;
  private walkingNPCs: WalkingNPC[] = [];
  private lastUpdate: number = 0;
  private static instance: WalkingNPCManager;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene: Phaser.Scene): WalkingNPCManager {
    if (!WalkingNPCManager.instance) {
      WalkingNPCManager.instance = new WalkingNPCManager(scene);
    }
    WalkingNPCManager.instance.scene = scene;
    return WalkingNPCManager.instance;
  }

  /**
   * Register a walking NPC with the manager
   */
  public registerWalkingNPC(npc: WalkingNPC): void {
    if (!this.walkingNPCs.includes(npc)) {
      this.walkingNPCs.push(npc);
    }
  }

  /**
   * Unregister a walking NPC from the manager
   */
  public unregisterWalkingNPC(npc: WalkingNPC): void {
    const index = this.walkingNPCs.indexOf(npc);
    if (index !== -1) {
      this.walkingNPCs.splice(index, 1);
    }
  }

  /**
   * Update all walking NPCs
   * This should be called from the main game loop
   */
  public updateWalkingNPCs(): void {
    // Additional safety check for scene validity
    if (!this.scene || !this.scene.game) {
      return;
    }

    const currentTime = this.scene.time.now;
    const deltaTime = currentTime - this.lastUpdate;
    this.lastUpdate = currentTime;

    // Update all registered walking NPCs
    // Create a copy of the array to avoid issues if NPCs are removed during iteration
    const npcsToUpdate = [...this.walkingNPCs];
    npcsToUpdate.forEach((npc, index) => {
      try {
        // Additional safety check to ensure NPC is still valid
        if (npc && typeof npc.update === 'function') {
          // Check if NPC scene is still valid
          if (npc.scene && npc.scene.game && !npc.scene.game.destroy) {
            npc.update(deltaTime);
          } else {
            // Remove the invalid NPC from our list
            const invalidIndex = this.walkingNPCs.indexOf(npc);
            if (invalidIndex !== -1) {
              this.walkingNPCs.splice(invalidIndex, 1);
            }
          }
        } else {
          // Remove the invalid NPC from our list
          const invalidIndex = this.walkingNPCs.indexOf(npc);
          if (invalidIndex !== -1) {
            this.walkingNPCs.splice(invalidIndex, 1);
          }
        }
      } catch (error) {
        // Error updating walking NPC silently handled
      }
    });
  }

  /**
   * Get all registered walking NPCs
   */
  public getWalkingNPCs(): WalkingNPC[] {
    return [...this.walkingNPCs]; // Return a copy to prevent external modification
  }

  /**
   * Get walking NPCs by behavior type
   */
  public getWalkingNPCsByType(type: string): WalkingNPC[] {
    return this.walkingNPCs.filter(npc => {
      const behavior = npc.getBehavior();
      return behavior && behavior.getType() === type;
    });
  }

  /**
   * Set pathfinding manager for all walking NPCs
   */
  public setPathfindingManager(pathfindingManager: PathfindingManager): void {
    this.walkingNPCs.forEach(npc => {
      npc.setPathfindingManager(pathfindingManager);
    });
  }

  /**
   * Clean up all resources
   */
  public destroy(): void {
    // Unregister all NPCs before clearing the array
    const npcsToUnregister = [...this.walkingNPCs];
    npcsToUnregister.forEach(npc => {
      try {
        // Clear the behavior to prevent further updates
        if (npc && typeof npc.setBehavior === 'function') {
          npc.setBehavior(undefined as any);
        }
      } catch (e) {
        // Error clearing behavior for NPC silently handled
      }
    });
    
    this.walkingNPCs = [];
    WalkingNPCManager.instance = null as any;
  }
}