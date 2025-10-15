import Phaser from "phaser";
import { WalkingBehavior } from "./WalkingBehavior";
import WalkingNPC from "../objects/WalkingNPC";

export class PathfindingPatrolBehavior implements WalkingBehavior {
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;
  private isMoving: boolean = false;
  private isPaused: boolean = false;
  private lastMoveTime: number = 0;
  private pauseStartTime: number = 0;
  private moveInterval: number = 3000; // Move every 3 seconds
  private pauseDuration: number = 2000; // Pause for 2 seconds
  private lastDirection: string = 'right';
  private path: { x: number; y: number }[] = [];
  private currentPathIndex: number = 0;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  update(npc: WalkingNPC): void {
    const currentTime = Date.now();
    
    // Handle pausing
    if (this.isPaused) {
      if (currentTime - this.pauseStartTime >= this.pauseDuration) {
        // Pause duration over, start moving again
        this.setNewTarget(npc);
      } else {
        // Continue pausing
        npc.setVelocity(0, 0);
        this.playAnimation(npc, 'idle', this.lastDirection);
        return;
      }
    }
    
    // Check if it's time to move (every 3 seconds)
    if (currentTime - this.lastMoveTime > this.moveInterval && !this.isMoving) {
      this.setNewTarget(npc);
      this.lastMoveTime = currentTime;
    }
    
    // Follow path if we have one
    if (this.path.length > 0) {
      this.followPath(npc);
    } else if (!this.isPaused) {
      // Not moving and not paused, play idle animation
      npc.setVelocity(0, 0);
      this.playAnimation(npc, 'idle', this.lastDirection);
    }
  }

  private followPath(npc: WalkingNPC): void {
    if (this.currentPathIndex >= this.path.length) {
      // Reached end of path, stop moving and start pause
      npc.setVelocity(0, 0);
      this.isMoving = false;
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      this.playAnimation(npc, 'idle', this.lastDirection);
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
      this.lastDirection = this.getDirectionFromAngle(angle);
      this.playAnimation(npc, 'walk', this.lastDirection);
    } else {
      // Reached current path point, move to next one
      this.currentPathIndex++;
      
      // If we've reached the end of the path
      if (this.currentPathIndex >= this.path.length) {
        // Reached end of path, stop moving and start pause
        npc.setVelocity(0, 0);
        this.isMoving = false;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        this.playAnimation(npc, 'idle', this.lastDirection);
      }
    }
  }

  private setNewTarget(npc: WalkingNPC) {
    // Generate a new random target within bounds
    const newTargetX = Phaser.Math.Between(this.minX, this.maxX);
    const newTargetY = Phaser.Math.Between(this.minY, this.maxY);
    
    // Use pathfinding to find a path to the target
    const pathfindingManager = npc.getPathfindingManager();
    if (pathfindingManager) {
      const path = pathfindingManager.findPath(npc.x, npc.y, newTargetX, newTargetY);
      if (path && path.length > 0) {
        this.path = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
        this.isPaused = false;
        return;
      }
    }
    
    // Fallback to direct movement if pathfinding fails
    // Move only along X-axis between minX and maxX for the fallback
    if (npc.x <= this.minX) {
      this.lastDirection = 'right';
    } else if (npc.x >= this.maxX) {
      this.lastDirection = 'left';
    } else {
      // Somewhere in between, continue in current direction
      if (this.lastDirection === 'right') {
      } else {
      }
    }
    
    this.isMoving = true;
    this.isPaused = false;
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
    // Stop movement when interaction starts
    npc.setVelocity(0, 0);
    this.isMoving = false;
    this.isPaused = false;
    this.playAnimation(npc, 'idle', this.lastDirection);
  }

  onInteractionEnd(_npc: WalkingNPC): void {
    // Resume normal behavior after interaction
    this.isMoving = false;
    this.isPaused = false;
  }

  getType(): string {
    return "pathfinding-patrol";
  }
}