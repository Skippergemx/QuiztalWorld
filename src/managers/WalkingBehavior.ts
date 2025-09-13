import WalkingNPC from "../objects/WalkingNPC";

export interface WalkingBehavior {
  update(npc: WalkingNPC, deltaTime: number): void;
  onInteractionStart(npc: WalkingNPC): void;
  onInteractionEnd(npc: WalkingNPC): void;
  getType(): string;
  setTarget?(target: Phaser.Physics.Arcade.Sprite): void;
}