import Phaser from "phaser";
import { WalkingBehavior } from "./WalkingBehavior";
import WalkingNPC from "../objects/WalkingNPC";

export class FollowBehavior implements WalkingBehavior {
  private target: Phaser.Physics.Arcade.Sprite;
  private followDistance: number = 50;
  private path: { x: number; y: number }[] = []; // Add path support
  private currentPathIndex: number = 0; // Add path index
  private lastPathUpdate: number = 0; // Add path update timer
  private pathUpdateInterval: number = 1000; // Update path every second

  constructor(target: Phaser.Physics.Arcade.Sprite) {
    this.target = target;
  }

  update(npc: WalkingNPC, _deltaTime: number): void {
    if (!this.target) return;

    const currentTime = Date.now();
    
    // Update path periodically for better following
    if (currentTime - this.lastPathUpdate > this.pathUpdateInterval) {
      this.updatePath(npc);
      this.lastPathUpdate = currentTime;
    }

    // Follow path if we have one
    if (this.path.length > 0) {
      this.followPath(npc);
    } else {
      // Fallback to direct following behavior
      this.followDirectly(npc);
    }
  }

  private updatePath(npc: WalkingNPC): void {
    const distance = Phaser.Math.Distance.Between(
      npc.x, npc.y,
      this.target.x, this.target.y
    );

    // Only use pathfinding if the target is far enough away
    if (distance > this.followDistance + 30) {
      const pathfindingManager = npc.getPathfindingManager();
      if (pathfindingManager) {
        const path = pathfindingManager.findPath(npc.x, npc.y, this.target.x, this.target.y);
        if (path && path.length > 0) {
          this.path = path;
          this.currentPathIndex = 0;
          return;
        }
      }
    }
    
    // Clear path if target is close or pathfinding failed
    this.path = [];
    this.currentPathIndex = 0;
  }

  private followPath(npc: WalkingNPC): void {
    if (this.currentPathIndex >= this.path.length) {
      // Reached end of path, clear it and use direct following
      this.path = [];
      this.currentPathIndex = 0;
      this.followDirectly(npc);
      return;
    }

    const target = this.path[this.currentPathIndex];
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      // Move towards target
      const angle = Math.atan2(dy, dx);
      const vx = Math.cos(angle) * npc['moveSpeed'];
      const vy = Math.sin(angle) * npc['moveSpeed'];
      npc.setVelocity(vx, vy);
      
      // Determine direction based on angle
      const direction = this.getDirectionFromAngle(angle);
      npc['lastDirection'] = direction;
      this.playAnimation(npc, 'walk', direction);
    } else {
      // Reached current path point, move to next one
      this.currentPathIndex++;
      
      // If we've reached the end of the path
      if (this.currentPathIndex >= this.path.length) {
        // Reached end of path, clear it and use direct following
        this.path = [];
        this.currentPathIndex = 0;
        this.followDirectly(npc);
      }
    }
  }

  private followDirectly(npc: WalkingNPC): void {
    const distance = Phaser.Math.Distance.Between(
      npc.x, npc.y,
      this.target.x, this.target.y
    );

    // Follow if too far away
    if (distance > this.followDistance + 20) {
      const angle = Phaser.Math.Angle.Between(
        npc.x, npc.y,
        this.target.x, this.target.y
      );

      npc.setVelocity(
        Math.cos(angle) * npc['moveSpeed'],
        Math.sin(angle) * npc['moveSpeed']
      );

      // Determine direction based on angle
      const direction = this.getDirectionFromAngle(angle);
      npc['lastDirection'] = direction;
      this.playAnimation(npc, 'walk', direction);
      
    } else if (distance < this.followDistance - 10) {
      // Too close, move away slightly
      const angle = Phaser.Math.Angle.Between(
        this.target.x, this.target.y,
        npc.x, npc.y
      );

      npc.setVelocity(
        Math.cos(angle) * (npc['moveSpeed'] * 0.5),
        Math.sin(angle) * (npc['moveSpeed'] * 0.5)
      );

      const direction = this.getDirectionFromAngle(angle);
      npc['lastDirection'] = direction;
      this.playAnimation(npc, 'walk', direction);
      
    } else {
      // Perfect distance, idle
      npc.setVelocity(0, 0);
      this.playAnimation(npc, 'idle', npc['lastDirection']);
    }
  }

  private getDirectionFromAngle(angle: number): string {
    // Convert angle to degrees and normalize
    const degrees = Phaser.Math.RadToDeg(angle);
    const normalizedDegrees = (degrees + 360) % 360;

    // Determine direction based on angle
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
    const key = npc.getAnimationKey(type, direction);
    if (npc.scene.anims.exists(key)) {
      npc.play(key, true);
    }
  }

  onInteractionStart(npc: WalkingNPC): void {
    // For follow behavior, we might want to do something special during interaction
    // For now, just stop movement
    npc.setVelocity(0, 0);
    this.path = [];
    this.currentPathIndex = 0;
    this.playAnimation(npc, 'idle', npc['lastDirection']);
  }

  onInteractionEnd(_npc: WalkingNPC): void {
    // Resume normal behavior
    this.path = [];
    this.currentPathIndex = 0;
  }

  getType(): string {
    return "follow";
  }

  public setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
  }
}