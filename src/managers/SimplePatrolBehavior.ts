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
    
    console.log(`🎯 SimplePatrolBehavior: Created with Point A (${pointA.x}, ${pointA.y}) and Point B (${pointB.x}, ${pointB.y})`);
    console.log(`🎯 SimplePatrolBehavior: Initial target is Point B (${pointB.x}, ${pointB.y})`);
    console.log(`⚙️ SimplePatrolBehavior: Initial idle duration: ${(this.currentIdleDuration / 1000).toFixed(1)} seconds (${this.currentIdleDuration}ms)`);
    console.log(`🔢 SimplePatrolBehavior: Idle range configured: ${this.minIdleDuration / 1000}-${this.maxIdleDuration / 1000} seconds`);
  }

  private generateRandomIdleDuration(): void {
    // Generate random idle duration between 5-20 seconds
    this.currentIdleDuration = Math.floor(
      Math.random() * (this.maxIdleDuration - this.minIdleDuration + 1) + this.minIdleDuration
    );
    console.log(`🎲 Random idle duration generated: ${(this.currentIdleDuration / 1000).toFixed(1)} seconds (${this.currentIdleDuration}ms)`);
  }

  update(npc: WalkingNPC, deltaTime: number): void {
    // Safety checks
    if (!npc || !npc.scene || !npc.body || !npc.anims) {
      return;
    }
    
    // CRITICAL: Normalize deltaTime to prevent timer issues
    // We now use real timestamps for idle timing, so deltaTime issues are less critical
    if (deltaTime > 1000) { // Only cap if deltaTime is more than 1 second (extreme case)
      console.warn(`⚠️ ${this.getNPCName(npc)}: Extremely large deltaTime detected: ${deltaTime}ms, capping to 1000ms`);
      deltaTime = 1000;
    }
    
    // CRITICAL: Check if NPC is stuck in interaction mode during patrol
    if (npc.isCurrentlyInteracting && npc.isCurrentlyInteracting()) {
      console.log(`⚠️ ${this.getNPCName(npc)}: NPC is in interaction mode, skipping patrol update`);
      return;
    }
    
    // Handle idle state using real-time timestamps (immune to deltaTime issues)
    if (this.isIdle) {
      const currentTime = Date.now();
      const elapsedIdleTime = currentTime - this.idleStartTime;
      
      // CRITICAL: Keep stopped during idle - force velocity to zero every frame
      if (npc && npc.body && typeof npc.setVelocity === 'function') {
        npc.setVelocity(0, 0);
      }
      
      // Enhanced idle progress logging with real-time calculation
      const idleSeconds = Math.floor(elapsedIdleTime / 1000);
      const maxIdleSeconds = Math.floor(this.currentIdleDuration / 1000);
      const prevIdleSeconds = Math.floor((elapsedIdleTime - 1000) / 1000); // Check previous second
      
      if (this.getNPCName(npc) === 'Mr Rug Pull') {
        if (idleSeconds !== prevIdleSeconds && idleSeconds <= maxIdleSeconds) {
          console.log(`💤 ${this.getNPCName(npc)} IDLING: ${idleSeconds}/${maxIdleSeconds} seconds | Elapsed: ${elapsedIdleTime.toFixed(0)}ms/${this.currentIdleDuration}ms`);
        }
        // Log progress every 3 seconds for debugging
        if (Math.floor(elapsedIdleTime / 3000) !== Math.floor((elapsedIdleTime - 1000) / 3000)) {
          console.log(`🕰️ ${this.getNPCName(npc)}: Idle progress - ${(elapsedIdleTime / 1000).toFixed(1)}s / ${(this.currentIdleDuration / 1000).toFixed(1)}s (${((elapsedIdleTime / this.currentIdleDuration) * 100).toFixed(1)}%)`);
        }
      }
      
      // Continue idle animation
      this.playAnimation(npc, 'idle', npc['lastDirection'] || 'down');
      
      // Check if idle period is complete using real-time calculation
      if (elapsedIdleTime >= this.currentIdleDuration) {
        console.log(`✅ ${this.getNPCName(npc)}: IDLE PERIOD COMPLETE! Elapsed: ${elapsedIdleTime.toFixed(0)}ms >= ${this.currentIdleDuration}ms`);
        this.isIdle = false;
        this.idleStartTime = 0;
        // Generate new random idle duration for next time
        this.generateRandomIdleDuration();
        // Switch target after idle period
        this.currentTarget = (this.currentTarget === this.pointA) ? this.pointB : this.pointA;
        console.log(`🔄 ${this.getNPCName(npc)}: IDLE COMPLETE! Switching target to (${this.currentTarget.x}, ${this.currentTarget.y})`);
      }
      
      return; // Skip movement during idle
    }
    
    // Calculate distance to current target
    const distanceToTarget = Phaser.Math.Distance.Between(
      npc.x, npc.y,
      this.currentTarget.x, this.currentTarget.y
    );
    
    // Check if we've reached the target patrol point
    if (distanceToTarget <= this.tolerance) {
      console.log(`🎯 ${this.getNPCName(npc)}: REACHED TARGET! Distance: ${distanceToTarget.toFixed(1)}px (tolerance: ${this.tolerance}px)`);
      console.log(`🕐 ${this.getNPCName(npc)}: ENTERING IDLE MODE at patrol point for ${(this.currentIdleDuration / 1000).toFixed(1)} seconds`);
      
      // CRITICAL: Stop movement immediately and completely
      if (npc && npc.body && typeof npc.setVelocity === 'function') {
        npc.setVelocity(0, 0);
        console.log(`🛑 ${this.getNPCName(npc)}: VELOCITY SET TO ZERO`);
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

    // Move towards target
    if (npc && typeof npc.setVelocity === 'function') {
      npc.setVelocity(
        Math.cos(angle) * this.moveSpeed,
        Math.sin(angle) * this.moveSpeed
      );
    }

    // Determine direction and play animation
    const direction = this.getDirectionFromAngle(angle);
    npc['lastDirection'] = direction;
    this.playAnimation(npc, 'walk', direction);
    
    // Debug logging for Mr Rug Pull every 60 frames (~1 second)
    if (this.getNPCName(npc) === 'Mr Rug Pull') {
      console.log(`🚶 ${this.getNPCName(npc)} MOVING: (${npc.x.toFixed(1)}, ${npc.y.toFixed(1)}) → (${this.currentTarget.x}, ${this.currentTarget.y}) | Distance: ${distanceToTarget.toFixed(1)}px | Target: ${this.currentTarget === this.pointA ? 'Point A' : 'Point B'}`);
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