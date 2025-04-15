export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    console.log("🔄 Loading Assets...");

    // ✅ Load Tileset & Map
    this.load.image("tiles", "assets/tilesets/tileset.png");
    this.load.tilemapTiledJSON("map", "assets/maps/map.json");

    // ✅ Load NPC Huntboy as a spritesheet (REMOVED duplicate image load)
    this.load.spritesheet("npc_huntboy", "assets/npc/npc_huntboy_idle_1.png", {
      frameWidth: 32,
      frameHeight: 53,
    });

    // ✅ Load Player Spritesheets (Idle & Walk)
    const characters = ["lsxd", "penski", "sarah", "xander"];
    characters.forEach((char) => {
      this.load.spritesheet(
        `player_${char}_walk_1`, 
        `assets/characters/player_${char}_walk_1.png`, 
        { frameWidth: 32, frameHeight: 53 }
      );
      this.load.spritesheet(
        `player_${char}_idle_1`, 
        `assets/characters/player_${char}_idle_1.png`, 
        { frameWidth: 32, frameHeight: 53 }
      );
    });

    this.load.once("complete", () => {
      console.log("✅ All assets loaded!");
      this.scene.start("LoginCharacterScene");
    });

    this.load.start();
  }
}