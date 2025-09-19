import Phaser from "phaser";
import WalkingNPC from "./WalkingNPC";
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";

export default class SamplePatrolNPC extends WalkingNPC {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(10);

    // Define patrol points (Point A and Point B)
    const pointA = { x: x - 100, y: y };  // 100 pixels to the left
    const pointB = { x: x + 100, y: y };  // 100 pixels to the right
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    // Set up animations (you'll need to adjust based on your sprite sheet)
    this.createAnimations(scene);
    this.play("samplepatrolnpc-walk-right"); // Start with a default animation

    // Set up interaction
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
  }

  private createAnimations(scene: Phaser.Scene) {
    // Create walk animations for each direction
    if (!scene.anims.exists("samplepatrolnpc-walk-right")) {
      scene.anims.create({
        key: "samplepatrolnpc-walk-right",
        frames: scene.anims.generateFrameNumbers("sample_patrol_npc", { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-walk-left")) {
      scene.anims.create({
        key: "samplepatrolnpc-walk-left",
        frames: scene.anims.generateFrameNumbers("sample_patrol_npc", { start: 4, end: 7 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-walk-up")) {
      scene.anims.create({
        key: "samplepatrolnpc-walk-up",
        frames: scene.anims.generateFrameNumbers("sample_patrol_npc", { start: 8, end: 11 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-walk-down")) {
      scene.anims.create({
        key: "samplepatrolnpc-walk-down",
        frames: scene.anims.generateFrameNumbers("sample_patrol_npc", { start: 12, end: 15 }),
        frameRate: 5,
        repeat: -1
      });
    }

    // Create idle animations for each direction
    if (!scene.anims.exists("samplepatrolnpc-idle-right")) {
      scene.anims.create({
        key: "samplepatrolnpc-idle-right",
        frames: [{ key: "sample_patrol_npc", frame: 0 }],
        frameRate: 1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-idle-left")) {
      scene.anims.create({
        key: "samplepatrolnpc-idle-left",
        frames: [{ key: "sample_patrol_npc", frame: 4 }],
        frameRate: 1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-idle-up")) {
      scene.anims.create({
        key: "samplepatrolnpc-idle-up",
        frames: [{ key: "sample_patrol_npc", frame: 8 }],
        frameRate: 1
      });
    }

    if (!scene.anims.exists("samplepatrolnpc-idle-down")) {
      scene.anims.create({
        key: "samplepatrolnpc-idle-down",
        frames: [{ key: "sample_patrol_npc", frame: 12 }],
        frameRate: 1
      });
    }
  }

  public interact() {
    // Handle interaction with the NPC
    console.log("Interacting with SamplePatrolNPC");
    
    // Stop movement during interaction
    this.onInteractionStart();
    
    // Add your interaction logic here (dialog, quiz, etc.)
    // For example:
    // showDialog(this.scene, [{
    //   text: "Hello! I'm patrolling this area.",
    //   isExitDialog: true
    // }]);
    
    // Resume movement after interaction
    this.scene.time.delayedCall(2000, () => {
      this.onInteractionEnd();
    });
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Additional update logic specific to this NPC can go here
  }
}