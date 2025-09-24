import Phaser from "phaser";
import { WalkingBehavior } from "./WalkingBehavior";
import WalkingNPC from "../objects/WalkingNPC";

export class SimplePatrolBehavior implements WalkingBehavior {
  private pointA: { x: number; y: number };
  private pointB: { x: number; y: number };
  private currentTarget: { x: number; y: number };
  private moveSpeed: number = 100;
  private tolerance: number = 15; // Increased tolerance to ensure NPCs can reach their targets
  private isIdle: boolean = false;
  private idleTimer: number = 0;
  private readonly idleDuration: number = 3000; // 3 seconds in milliseconds

  constructor(pointA: { x: number; y: number }, pointB: { x: number; y: number }) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.currentTarget = this.pointB; // Start by moving to point B
  }

  update(npc: WalkingNPC, deltaTime: number): void {
    // Add comprehensive safety checks for NPC object and its dependencies
    if (!npc) {
      console.warn('WalkingNPC: NPC object is null or undefined');
      return;
    }
    
    // Check if NPC has been destroyed or scene is invalid
    if (!npc.scene || !npc.body || !npc.anims) {
      console.warn('WalkingNPC: NPC has been destroyed or is no longer valid');
      return;
    }
    
    // Additional check for scene validity
    if (!npc.scene.game || !npc.scene.anims) {
      console.warn('WalkingNPC: Scene has been destroyed or is no longer valid');
      return;
    }
    
    // Additional check to ensure NPC is still part of the scene
    if (!npc.scene.children || !npc.scene.children.exists(npc)) {
      console.warn('WalkingNPC: NPC is no longer part of the scene');
      return;
    }
    
    // Check if scene is shutting down
    if (npc.scene.sys.isSleeping()) {
      // Check if we're in a valid transition state
      if (npc.scene.sys.settings.status !== Phaser.Scenes.RUNNING) {
        console.warn('WalkingNPC: Scene is not running, skipping update');
        return;
      }
    }
    
    if (this.isIdle) {
      this.idleTimer += deltaTime;
      
      // If idle period is complete, start moving again
      if (this.idleTimer >= this.idleDuration) {
        this.isIdle = false;
        this.idleTimer = 0;
        // Switch target after idle period
        this.currentTarget = (this.currentTarget === this.pointA) ? this.pointB : this.pointA;
        console.log(`${this.getNPCName(npc)}: Completed idle, switching target to x:${this.currentTarget.x}, y:${this.currentTarget.y}`);
      } else {
        // Continue idle animation
        this.playAnimation(npc, 'idle', npc['lastDirection']);
        return; // Skip movement during idle
      }
    } else {
      // Check if we've reached the current target
      const distanceToTarget = Phaser.Math.Distance.Between(
        npc.x, npc.y,
        this.currentTarget.x, this.currentTarget.y
      );

      if (distanceToTarget <= this.tolerance) {
        // Start idle period
        this.isIdle = true;
        this.idleTimer = 0;
        this.playAnimation(npc, 'idle', npc['lastDirection']);
        console.log(`${this.getNPCName(npc)}: Reached target, starting idle animation for 3 seconds`);
        return; // Skip movement during first frame of idle
      }

      // Move towards current target
      const angle = Phaser.Math.Angle.Between(
        npc.x, npc.y,
        this.currentTarget.x, this.currentTarget.y
      );

      // Check if npc has setVelocity method before calling it
      if (npc && typeof npc.setVelocity === 'function') {
        npc.setVelocity(
          Math.cos(angle) * this.moveSpeed,
          Math.sin(angle) * this.moveSpeed
        );
      } else {
        console.warn('WalkingNPC: setVelocity method not available on npc object');
      }

      // Determine direction based on movement
      const direction = this.getDirectionFromAngle(angle);
      
      // Debug logging to see what's happening
      console.log(`${this.getNPCName(npc)}: Moving at angle ${Phaser.Math.RadToDeg(angle)}, direction: ${direction}`);
      
      npc['lastDirection'] = direction;
      
      // Play the correct animation based on direction
      this.playAnimation(npc, 'walk', direction);
    }
  }

  private getNPCName(npc: WalkingNPC): string {
    if (npc.texture && npc.texture.key) {
      const key = npc.texture.key;
      if (key.includes('mrrugpull')) return 'Mr Rug Pull';
      if (key.includes('artizengent')) return 'Artizen Gent';
      if (key.includes('thirdwebguy')) return 'ThirdWeb Guy';
      if (key.includes('alchemyman')) return 'Alchemy Man';
      return key;
    }
    return 'Unknown NPC';
  }

  private getDirectionFromAngle(angle: number): string {
    // Convert angle to degrees and normalize
    const degrees = Phaser.Math.RadToDeg(angle);
    const normalizedDegrees = (degrees + 360) % 360;

    // Determine direction based on angle
    // Right: 315-45 degrees, Down: 45-135 degrees, Left: 135-225 degrees, Up: 225-315 degrees
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

  private playAnimation(npc: WalkingNPC, type: string, direction: string): void {
    // Add safety checks
    if (!npc || !npc.scene || !npc.scene.anims) {
      console.warn('WalkingNPC: Cannot play animation - NPC or scene not available');
      return;
    }
    
    const npcName = this.getNPCName(npc);
    
    try {
      // Special handling for Mr. Rug Pull to ensure correct animations
      if (npc.texture && npc.texture.key === 'npc_mrrugpull') {
        const key = `mrrugpull-${type}-${direction}`;
        console.log(`${npcName}: Trying to play animation ${key}`);
        
        // Check if the animation exists before trying to play it
        if (npc.scene.anims.exists(key)) {
          // Get the current animation to check if we're already playing it
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          console.log(`${npcName}: Current animation: ${currentAnim ? currentAnim.key : 'none'}, Target: ${key}`);
          
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
            console.log(`${npcName}: Successfully playing animation ${key}`);
          } else {
            console.log(`${npcName}: Already playing animation ${key}`);
          }
        } else {
          console.log(`${npcName}: Animation ${key} does not exist`);
          
          // Fallback to idle if walk animation doesn't exist
          const idleKey = `mrrugpull-idle-${direction}`;
          if (npc.scene.anims.exists(idleKey)) {
            const currentAnim = npc.anims ? npc.anims.currentAnim : null;
            if (!currentAnim || currentAnim.key !== idleKey) {
              npc.play(idleKey, true);
              console.log(`${npcName}: Falling back to idle animation ${idleKey}`);
            } else {
              console.log(`${npcName}: Already playing idle animation ${idleKey}`);
            }
          } else {
            console.log(`${npcName}: Even fallback animation ${idleKey} does not exist`);
          }
        }
      } 
      // Special handling for Artizen Gent to ensure correct animations
      else if (npc.texture && npc.texture.key === 'npc_artizengent') {
        const key = `artizengent-${type}-${direction}`;
        console.log(`${npcName}: Trying to play animation ${key}`);
        
        // Check if the animation exists before trying to play it
        if (npc.scene.anims.exists(key)) {
          // Get the current animation to check if we're already playing it
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          console.log(`${npcName}: Current animation: ${currentAnim ? currentAnim.key : 'none'}, Target: ${key}`);
          
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
            console.log(`${npcName}: Successfully playing animation ${key}`);
          } else {
            console.log(`${npcName}: Already playing animation ${key}`);
          }
        } else {
          console.log(`${npcName}: Animation ${key} does not exist`);
          
          // Fallback to idle if walk animation doesn't exist
          const idleKey = `artizengent-idle-${direction}`;
          if (npc.scene.anims.exists(idleKey)) {
            const currentAnim = npc.anims ? npc.anims.currentAnim : null;
            if (!currentAnim || currentAnim.key !== idleKey) {
              npc.play(idleKey, true);
              console.log(`${npcName}: Falling back to idle animation ${idleKey}`);
            } else {
              console.log(`${npcName}: Already playing idle animation ${idleKey}`);
            }
          } else {
            console.log(`${npcName}: Even fallback animation ${idleKey} does not exist`);
          }
        }
      }
      // Special handling for ThirdWeb Guy to ensure correct animations
      else if (npc.texture && npc.texture.key === 'npc_thirdwebguy') {
        const key = `thirdwebguy-${type}-${direction}`;
        console.log(`${npcName}: Trying to play animation ${key}`);
        
        // Check if the animation exists before trying to play it
        if (npc.scene.anims.exists(key)) {
          // Get the current animation to check if we're already playing it
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          console.log(`${npcName}: Current animation: ${currentAnim ? currentAnim.key : 'none'}, Target: ${key}`);
          
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
            console.log(`${npcName}: Successfully playing animation ${key}`);
          } else {
            console.log(`${npcName}: Already playing animation ${key}`);
          }
        } else {
          console.log(`${npcName}: Animation ${key} does not exist`);
          
          // Fallback to idle if walk animation doesn't exist
          const idleKey = `thirdwebguy-idle-${direction}`;
          if (npc.scene.anims.exists(idleKey)) {
            const currentAnim = npc.anims ? npc.anims.currentAnim : null;
            if (!currentAnim || currentAnim.key !== idleKey) {
              npc.play(idleKey, true);
              console.log(`${npcName}: Falling back to idle animation ${idleKey}`);
            } else {
              console.log(`${npcName}: Already playing idle animation ${idleKey}`);
            }
          } else {
            console.log(`${npcName}: Even fallback animation ${idleKey} does not exist`);
          }
        }
      }
      // Special handling for Alchemy Man to ensure correct animations
      else if (npc.texture && npc.texture.key === 'npc_alchemyman') {
        const key = `alchemyman-${type}-${direction}`;
        console.log(`${npcName}: Trying to play animation ${key}`);
        
        // Check if the animation exists before trying to play it
        if (npc.scene.anims.exists(key)) {
          // Get the current animation to check if we're already playing it
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          console.log(`${npcName}: Current animation: ${currentAnim ? currentAnim.key : 'none'}, Target: ${key}`);
          
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
            console.log(`${npcName}: Successfully playing animation ${key}`);
          } else {
            console.log(`${npcName}: Already playing animation ${key}`);
          }
        } else {
          console.log(`${npcName}: Animation ${key} does not exist`);
          
          // Fallback to idle if walk animation doesn't exist
          const idleKey = `alchemyman-idle-${direction}`;
          if (npc.scene.anims.exists(idleKey)) {
            const currentAnim = npc.anims ? npc.anims.currentAnim : null;
            if (!currentAnim || currentAnim.key !== idleKey) {
              npc.play(idleKey, true);
              console.log(`${npcName}: Falling back to idle animation ${idleKey}`);
            } else {
              console.log(`${npcName}: Already playing idle animation ${idleKey}`);
            }
          } else {
            console.log(`${npcName}: Even fallback animation ${idleKey} does not exist`);
          }
        }
      } else if (npc.texture) {
        // For other NPCs, use the standard approach
        const key = npc.getAnimationKey(type, direction);
        console.log(`${npcName}: Trying to play animation ${key}`);
        
        if (npc.scene.anims.exists(key)) {
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
            console.log(`${npcName}: Successfully playing animation ${key}`);
          } else {
            console.log(`${npcName}: Already playing animation ${key}`);
          }
        } else {
          console.log(`${npcName}: Animation ${key} does not exist`);
          // Fallback to idle if walk animation doesn't exist
          const idleKey = npc.getAnimationKey('idle', direction);
          if (npc.scene.anims.exists(idleKey)) {
            const currentAnim = npc.anims ? npc.anims.currentAnim : null;
            if (!currentAnim || currentAnim.key !== idleKey) {
              npc.play(idleKey, true);
              console.log(`${npcName}: Falling back to idle animation ${idleKey}`);
            } else {
              console.log(`${npcName}: Already playing idle animation ${idleKey}`);
            }
          } else {
            console.log(`${npcName}: Even fallback animation ${idleKey} does not exist`);
          }
        }
      } else {
        console.warn('WalkingNPC: NPC texture not available');
      }
    } catch (error) {
      console.warn(`${npcName}: Error playing animation`, error);
    }
  }

  onInteractionStart(npc: WalkingNPC): void {
    // Add safety checks
    if (!npc) {
      console.warn('WalkingNPC: Cannot handle interaction start - NPC not available');
      return;
    }
    
    // Stop movement during interaction
    if (typeof npc.setVelocity === 'function') {
      npc.setVelocity(0, 0);
    } else {
      console.warn('WalkingNPC: setVelocity method not available on npc object');
    }
    
    // Play idle animation in the last movement direction
    if (npc.texture && npc.texture.key === 'npc_mrrugpull') {
      const key = `mrrugpull-idle-${npc['lastDirection'] || 'down'}`;
      if (npc.scene && npc.scene.anims && npc.scene.anims.exists(key)) {
        npc.play(key, true);
      }
    } 
    // Special handling for Artizen Gent to ensure correct animations
    else if (npc.texture && npc.texture.key === 'npc_artizengent') {
      const key = `artizengent-idle-${npc['lastDirection'] || 'down'}`;
      if (npc.scene && npc.scene.anims && npc.scene.anims.exists(key)) {
        npc.play(key, true);
      }
    }
    // Special handling for ThirdWeb Guy to ensure correct animations
    else if (npc.texture && npc.texture.key === 'npc_thirdwebguy') {
      const key = `thirdwebguy-idle-${npc['lastDirection'] || 'down'}`;
      if (npc.scene && npc.scene.anims && npc.scene.anims.exists(key)) {
        npc.play(key, true);
      }
    }
    // Special handling for Alchemy Man to ensure correct animations
    else if (npc.texture && npc.texture.key === 'npc_alchemyman') {
      const key = `alchemyman-idle-${npc['lastDirection'] || 'down'}`;
      if (npc.scene && npc.scene.anims && npc.scene.anims.exists(key)) {
        npc.play(key, true);
      }
    } else if (npc.texture) {
      const key = npc.getAnimationKey('idle', npc['lastDirection'] || 'down');
      if (npc.scene && npc.scene.anims && npc.scene.anims.exists(key)) {
        npc.play(key, true);
      }
    }
  }

  onInteractionEnd(_npc: WalkingNPC): void {
    // Resume patrol after interaction
  }

  getType(): string {
    return "simplePatrol";
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    // Reset all properties to prevent memory leaks
    (this as any).pointA = null;
    (this as any).pointB = null;
    (this as any).currentTarget = null;
    this.moveSpeed = 0;
    this.tolerance = 0;
    this.isIdle = false;
    this.idleTimer = 0;
    // Note: idleDuration is readonly, so we don't modify it
  }
}