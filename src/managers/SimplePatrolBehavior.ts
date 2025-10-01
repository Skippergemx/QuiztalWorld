import Phaser from "phaser";
import { WalkingBehavior } from "./WalkingBehavior";
import WalkingNPC from "../objects/WalkingNPC";

export class SimplePatrolBehavior implements WalkingBehavior {
  private pointA: { x: number; y: number };
  private pointB: { x: number; y: number };
  private currentTarget: { x: number; y: number };
  private moveSpeed: number = 80;
  private isIdle: boolean = false;
  private idleStartTime: number = 0; // Real timestamp when idle started
  private currentIdleDuration: number = 0; // Will be set randomly each time
  private readonly minIdleDuration: number = 5000; // 5 seconds minimum
  private readonly maxIdleDuration: number = 20000; // 20 seconds maximum
  private readonly tolerance: number = 25; // Distance tolerance for reaching target

  constructor(pointA: { x: number; y: number }, pointB: { x: number; y: number }) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.currentTarget = this.pointB; // Start by moving to point B
    this.generateRandomIdleDuration(); // Set initial random idle duration
  }

  private generateRandomIdleDuration(): void {
    // Generate random idle duration between 5-20 seconds
    this.currentIdleDuration = Math.floor(
      Math.random() * (this.maxIdleDuration - this.minIdleDuration + 1) + this.minIdleDuration
    );
  }

  update(npc: WalkingNPC, deltaTime: number): void {
    // Safety checks
    if (!npc || !npc.scene || !npc.body || !npc.anims) {
      return;
    }
    
    // Enhanced debug logging for BasePal
    const npcName = this.getNPCName(npc);
    if (npcName === 'BasePal') {
      console.log(`🔍 SimplePatrolBehavior Update - NPC: ${npcName}, Position: (${npc.x.toFixed(2)}, ${npc.y.toFixed(2)})`);
      console.log(`🔍 SimplePatrolBehavior Update - Target: (${this.currentTarget.x.toFixed(2)}, ${this.currentTarget.y.toFixed(2)})`);
      console.log(`🔍 SimplePatrolBehavior Update - IsIdle: ${this.isIdle}, IdleStart: ${this.idleStartTime}`);
    }
    
    // CRITICAL: Normalize deltaTime to prevent timer issues
    // We now use real timestamps for idle timing, so deltaTime issues are less critical
    if (deltaTime > 1000) { // Only cap if deltaTime is more than 1 second (extreme case)
      // Cap extremely large deltaTime values
      deltaTime = 1000;
    }
    
    // CRITICAL: Check if NPC is stuck in interaction mode during patrol
    if (npc.isCurrentlyInteracting && npc.isCurrentlyInteracting()) {
      // NPC is in interaction mode, skip patrol update
      if (npcName === 'BasePal') {
        console.log(`🔍 SimplePatrolBehavior Update - ${npcName} is currently interacting, skipping patrol update`);
      }
      return;
    }
    
    // Handle idle state using real-time timestamps (immune to deltaTime issues)
    if (this.isIdle) {
      const currentTime = Date.now();
      const elapsedIdleTime = currentTime - this.idleStartTime;
      
      // Enhanced debug logging for BasePal
      if (npcName === 'BasePal') {
        console.log(`🔍 SimplePatrolBehavior Update - ${npcName} is idle, Elapsed: ${elapsedIdleTime}ms, Duration: ${this.currentIdleDuration}ms`);
      }
      
      // CRITICAL: Keep stopped during idle - force velocity to zero every frame
      if (npc && npc.body && typeof npc.setVelocity === 'function') {
        npc.setVelocity(0, 0);
      }
      
      // Enhanced idle progress logging with real-time calculation
      // Continue idle animation
      this.playAnimation(npc, 'idle', npc['lastDirection'] || 'down');
      
      // Check if idle period is complete using real-time calculation
      if (elapsedIdleTime >= this.currentIdleDuration) {
        if (npcName === 'BasePal') {
          console.log(`🔍 SimplePatrolBehavior Update - ${npcName} idle period complete, switching target`);
        }
        this.isIdle = false;
        this.idleStartTime = 0;
        // Generate new random idle duration for next time
        this.generateRandomIdleDuration();
        // Switch target after idle period
        this.currentTarget = (this.currentTarget === this.pointA) ? this.pointB : this.pointA;
        if (npcName === 'BasePal') {
          console.log(`🔍 SimplePatrolBehavior Update - ${npcName} new target: (${this.currentTarget.x.toFixed(2)}, ${this.currentTarget.y.toFixed(2)})`);
        }
      }
      
      return; // Skip movement during idle
    }
    
    // Calculate distance to current target
    const distanceToTarget = Phaser.Math.Distance.Between(
      npc.x, npc.y,
      this.currentTarget.x, this.currentTarget.y
    );
    
    // Enhanced debug logging for BasePal
    if (npcName === 'BasePal') {
      console.log(`🔍 SimplePatrolBehavior Update - ${npcName} distance to target: ${distanceToTarget.toFixed(2)}, Tolerance: ${this.tolerance}`);
    }
    
    // Check if we've reached the target patrol point
    if (distanceToTarget <= this.tolerance) {
      // Enhanced debug logging for BasePal
      if (npcName === 'BasePal') {
        console.log(`🔍 SimplePatrolBehavior Update - ${npcName} reached target, entering idle mode`);
      }
      
      // CRITICAL: Stop movement immediately and completely
      if (npc && npc.body && typeof npc.setVelocity === 'function') {
        npc.setVelocity(0, 0);
      }
      
      this.isIdle = true;
      this.idleStartTime = Date.now(); // Use real timestamp instead of accumulated timer
      this.playAnimation(npc, 'idle', npc['lastDirection'] || 'down');
      return;
    }
    
    // MOVEMENT: Move towards current target
    const angle = Phaser.Math.Angle.Between(
      npc.x, npc.y,
      this.currentTarget.x, this.currentTarget.y
    );

    // Enhanced debug logging for BasePal
    if (npcName === 'BasePal') {
      console.log(`🔍 SimplePatrolBehavior Update - ${npcName} moving towards target, Angle: ${angle.toFixed(2)}`);
    }

    // Move towards target
    if (npc && typeof npc.setVelocity === 'function') {
      const vx = Math.cos(angle) * this.moveSpeed;
      const vy = Math.sin(angle) * this.moveSpeed;
      
      // Enhanced debug logging for BasePal
      if (npcName === 'BasePal') {
        console.log(`🔍 SimplePatrolBehavior Update - ${npcName} setting velocity: (${vx.toFixed(2)}, ${vy.toFixed(2)})`);
      }
      
      npc.setVelocity(vx, vy);
    }

    // Determine direction and play animation
    const direction = this.getDirectionFromAngle(angle);
    npc['lastDirection'] = direction;
    this.playAnimation(npc, 'walk', direction);
  }

  private getNPCName(npc: WalkingNPC): string {
    if (npc.texture && npc.texture.key) {
      const key = npc.texture.key;
      if (key.includes('mrrugpull')) return 'Mr Rug Pull';
      if (key.includes('artizengent')) return 'Artizen Gent';
      if (key.includes('thirdwebguy')) return 'ThirdWeb Guy';
      if (key.includes('alchemyman')) return 'Alchemy Man';
      if (key.includes('basepal')) return 'BasePal';
      return key;
    }
    return 'Unknown NPC';
  }

  private getDirectionFromAngle(angle: number): string {
    const degrees = Phaser.Math.RadToDeg(angle);
    const normalizedDegrees = (degrees + 360) % 360;

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
    if (!npc || !npc.scene || !npc.scene.anims) {
      return;
    }
    
    const npcName = this.getNPCName(npc);
    
    try {
      // Handle Mr. Rug Pull animations
      if (npc.texture && npc.texture.key.includes('mrrugpull')) {
        const key = `mrrugpull-${type}-${direction}`;
        
        if (npc.scene.anims.exists(key)) {
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
          }
        }
      } 
      // Handle other NPCs
      else if (npc.texture) {
        const key = npc.getAnimationKey(type, direction);
        if (npc.scene.anims.exists(key)) {
          const currentAnim = npc.anims ? npc.anims.currentAnim : null;
          if (!currentAnim || currentAnim.key !== key) {
            npc.play(key, true);
          }
        }
      }
    } catch (error) {
      console.warn(`${npcName}: Error playing animation`, error);
    }
  }

  onInteractionStart(npc: WalkingNPC): void {
    if (!npc) return;
    
    // Stop movement during interaction
    if (typeof npc.setVelocity === 'function') {
      npc.setVelocity(0, 0);
    }
    
    // Play idle animation
    if (npc.texture && npc.texture.key.includes('mrrugpull')) {
      const key = `mrrugpull-idle-${npc['lastDirection'] || 'down'}`;
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
  
  destroy(): void {
    (this as any).pointA = null;
    (this as any).pointB = null;
    (this as any).currentTarget = null;
    this.moveSpeed = 0;
    this.isIdle = false;
    this.idleStartTime = 0;
  }
}