import Phaser from "phaser";
import QuizNPC from "./QuizNPC";
import { WalkingBehavior } from "../managers/WalkingBehavior";
import PathfindingManager from "../managers/PathfindingManager";

export default class WalkingNPC extends QuizNPC {
  protected behavior: WalkingBehavior | null = null;
  protected isInteracting: boolean = false;
  protected moveSpeed: number = 160;
  protected lastDirection: string = 'down';
  protected pathfindingManager: PathfindingManager | null = null; // Add this property
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  public setBehavior(behavior: WalkingBehavior): void {
    this.behavior = behavior;
  }

  public getBehavior(): WalkingBehavior | null {
    return this.behavior;
  }

  public update(deltaTime: number): void {
    // Additional safety checks
    if (!this.scene || !this.scene.game) {
      return;
    }
    
    // Update UI element positions
    if (this.nameLabel) {
      this.nameLabel.setPosition(this.x, this.y - 40);
    }
    
    if (this.shoutOutText) {
      this.shoutOutText.setPosition(this.x, this.y - 60);
    }
    
    // Update behavior if set
    if (this.behavior && !this.isInteracting) {
      this.behavior.update(this, deltaTime);
    }
  }

  public onInteractionStart(): void {
    this.isInteracting = true;
    if (this.behavior) {
      this.behavior.onInteractionStart(this);
    }
  }

  public onInteractionEnd(): void {
    this.isInteracting = false;
    if (this.behavior) {
      this.behavior.onInteractionEnd(this);
    }
  }

  public isCurrentlyInteracting(): boolean {
    return this.isInteracting;
  }

  protected playAnimation(key: string, ignoreIfPlaying: boolean = true): void {
    if (this.scene.anims.exists(key)) {
      this.play(key, ignoreIfPlaying);
    }
  }

  // Make this method public so behaviors can access it
  public getAnimationKey(type: string, direction: string): string {
    // Get the texture key and remove any suffixes to get the base name
    const textureKey = this.texture.key;
    
    // Special case for Mr. Rug Pull's animations
    if (textureKey === 'npc_mrrugpull' || textureKey === 'npc_mrrugpull_walk') {
      const key = `mrrugpull-${type}-${direction}`;
      return key;
    }
    
    // Special case for Artizen Gent's animations
    if (textureKey === 'npc_artizengent' || textureKey === 'npc_artizengent_walk') {
      const key = `artizengent-${type}-${direction}`;
      return key;
    }
    
    // Special case for ThirdWeb Guy's animations
    if (textureKey === 'npc_thirdwebguy' || textureKey === 'npc_thirdwebguy_walk') {
      const key = `thirdwebguy-${type}-${direction}`;
      return key;
    }
    
    // Special case for Alchemy Man's animations
    if (textureKey === 'npc_alchemyman' || textureKey === 'npc_alchemyman_walk') {
      const key = `alchemyman-${type}-${direction}`;
      return key;
    }
    
    // Special case for BasePal's animations
    if (textureKey === 'npc_basepal' || textureKey === 'npc_basepal_walk') {
      const key = `basepal-${type}-${direction}`;
      return key;
    }
    
    // Handle different texture naming conventions
    if (textureKey.includes('_idle')) {
      // For textures like 'moblin_idle', use 'moblin'
      const baseName = textureKey.split('_idle')[0];
      const key = `${baseName}-${type}-${direction}`;
      return key;
    } else if (textureKey.includes('_walk')) {
      // For textures like 'moblin_walk', use 'moblin'
      const baseName = textureKey.split('_walk')[0];
      const key = `${baseName}-${type}-${direction}`;
      return key;
    } else {
      // For textures like 'npc_huntboy', use 'huntboy'
      const baseName = textureKey.replace('npc_', '');
      const key = `${baseName}-${type}-${direction}`;
      return key;
    }
  }

  // Add this method to set the pathfinding manager
  public setPathfindingManager(pathfindingManager: PathfindingManager): void {
    this.pathfindingManager = pathfindingManager;
  }

  // Add this method to get the pathfinding manager
  public getPathfindingManager(): PathfindingManager | null {
    return this.pathfindingManager;
  }
}