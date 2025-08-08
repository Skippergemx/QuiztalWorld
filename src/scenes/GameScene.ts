import Phaser from "phaser";
import HuntBoy from "../objects/HuntBoy";
import MintGirl from "../objects/MintGirl";
import BaseSage from "../objects/BaseSage"; // ✅ Base Sage instead of AlchemyProf
import MrGemx from "../objects/MrGemx";
import { showDialog } from "../utils/SimpleDialogBox";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private lastDirection: string = "down";
  private selectedCharacter: string = "lsxd";
  private huntboy!: HuntBoy;
  private mintGirl!: MintGirl;
  private baseSage!: BaseSage;
  private mrGemx!: MrGemx;
  private joyStick?: Phaser.GameObjects.Image;
  private joyStickBase?: Phaser.GameObjects.Image;
  private interactButton?: Phaser.GameObjects.Image;
  private isMobile: boolean = false;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { selectedCharacter?: string }) {
    if (data.selectedCharacter) {
      this.selectedCharacter = data.selectedCharacter;
    }
  }

  preload() {
    this.load.image("npc_huntboy_avatar", "assets/npc/npc_huntboy_avatar.png");
    this.load.spritesheet("npc_huntboy", "assets/npc/npc_huntboy_idle_1.png", {
      frameWidth: 32,
      frameHeight: 53,
    });

    this.load.image("npc_basesage_avatar", "assets/npc/npc_basesage_avatar.png");
    this.load.spritesheet("npc_basesage", "assets/npc/npc_basesage_idle_1.png", {
      frameWidth: 32,
      frameHeight: 64,
    });

    this.load.image("npc_mintgirl_avatar", "assets/npc/npc_mintgirl_avatar.png");
    this.load.spritesheet("mint_girl", "assets/npc/npc_mintgirl_idle_1.png", {
      frameWidth: 32,
      frameHeight: 53,
    });

    this.load.image("npc_mrgemx_avatar", "assets/npc/npc_mrgemx_avatar.png");
    this.load.spritesheet("mr_gemx", "assets/npc/npc_mrgemx_idle_1.png", {
      frameWidth: 32,
      frameHeight: 64,
    });

    const characters = ["lsxd", "penski", "sarah", "xander"];
    characters.forEach((char) => {
      this.load.spritesheet(`player_${char}_walk_1`, `assets/player/player_${char}_walk_1.png`, {
        frameWidth: 32,
        frameHeight: 53,
      });

      this.load.spritesheet(`player_${char}_idle_1`, `assets/player/player_${char}_idle_1.png`, {
        frameWidth: 32,
        frameHeight: 53,
      });
    });

    // Load virtual gamepad assets
    this.load.image('joystick', 'assets/ui/joystick.png');
    this.load.image('joystick-base', 'assets/ui/joystick-base.png');
    this.load.image('button-interact', 'assets/ui/button-interact.png');
  }

  create() {
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("tileset", "tiles");
    if (!tileset) throw new Error("Tileset failed to load!");
    this.scene.launch("UIScene");

    const layers = {
      ground: map.createLayer("Ground", tileset),
      furniture: map.createLayer("Furniture", tileset),
      decoFurniture: map.createLayer("Deco Furniture", tileset),
      bushes: map.createLayer("Bushes", tileset),
      houses: map.createLayer("Houses", tileset),
    };

    if (layers.ground) {
      layers.ground.setDepth(0);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    Object.values(layers).forEach((layer) => layer?.setCollisionByProperty({ collides: true }));

    const playerTexture = `player_${this.selectedCharacter}_walk_1`;
    this.player = this.physics.add.sprite(800, 750, playerTexture, 0);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player);

    // ✅ Assign player.name = UID from localStorage
  const userStr = localStorage.getItem("quiztal-player");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.uid) {
        this.player.name = user.uid;
        console.log("👤 Player UID assigned:", this.player.name);
      }
    } catch (e) {
      console.warn("⚠️ Could not parse user from localStorage", e);
    }
  }

    Object.values(layers).forEach((layer) => {
      if (layer) {
        this.physics.add.collider(this.player, layer);
      }
    });

    // Initialize keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // ✅ Instantiate all NPCs
    this.huntboy = new HuntBoy(this, 500, 1050);
    this.mintGirl = new MintGirl(this, 1050, 1100);
    this.baseSage = new BaseSage(this, 1100, 500); // BaseSage now lives here
    this.mrGemx = new MrGemx(this, 500, 480);

    // ✅ Colliders for all NPCs
    this.physics.add.collider(this.player, this.huntboy);
    this.physics.add.collider(this.player, this.mintGirl);
    this.physics.add.collider(this.player, this.baseSage);
    this.physics.add.collider(this.player, this.mrGemx);

    this.createAnimations();

    this.events.on("shutdown", () => {
      showDialog(this, []);
    });

    this.input.keyboard?.on("keydown-C", () => {
      const distanceToHuntBoy = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.huntboy.x, this.huntboy.y);
      const distanceToMintGirl = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mintGirl.x, this.mintGirl.y);
      const distanceToBaseSage = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.baseSage.x, this.baseSage.y);
      const distanceToMrGemx = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mrGemx.x, this.mrGemx.y);

      console.log(`Distances - HuntBoy: ${distanceToHuntBoy}, MintGirl: ${distanceToMintGirl}, BaseSage: ${distanceToBaseSage}, MrGemx: ${distanceToMrGemx}`);

      if (distanceToHuntBoy <= 100) {
        console.log("Triggering HuntBoy dialog");
        this.huntboy.interact();
      } else if (distanceToMintGirl <= 100) {
        console.log("Triggering MintGirl dialog");
        this.mintGirl.interact();
      } else if (distanceToBaseSage <= 100) {
        console.log("Triggering BaseSage dialog");
        this.baseSage.interact();
      } else if (distanceToMrGemx <= 100) {
        console.log("Triggering MrGemx dialog");
        this.mrGemx.interact();
      } else {
        console.log("Player not in range of any NPC");
      }
    });

    this.createMobileControls();
  }

  private createMobileControls() {
    // Check if we're on mobile or touch is enabled
    this.isMobile = this.game.device.os.android || 
                    this.game.device.os.iOS || 
                    this.game.device.input.touch;
    
    if (!this.isMobile) return;

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Create joystick (positioned bottom-left)
    const joystickX = screenWidth * 0.2; // 20% from left edge
    const joystickY = screenHeight * 0.8; // 80% from top (near bottom)

    this.joyStickBase = this.add.image(joystickX, joystickY, 'joystick-base')
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.7)
        .setScale(1.2) // Make it slightly larger
        .setInteractive();

    this.joyStick = this.add.image(joystickX, joystickY, 'joystick')
        .setScrollFactor(0)
        .setDepth(101)
        .setAlpha(0.7)
        .setScale(0.8); // Make the stick slightly smaller than base

    // Create interact button (positioned bottom-right)
    const buttonX = screenWidth - (screenWidth * 0.15); // 15% from right edge
    const buttonY = screenHeight * 0.8; // 80% from top

    this.interactButton = this.add.image(buttonX, buttonY, 'button-interact')
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.8)
        .setScale(1.3) // Make it easier to tap
        .setInteractive();

    // Add touch controls
    this.joyStickBase.on('pointerdown', this.handleJoystickStart, this);
    this.joyStickBase.on('pointermove', this.handleJoystickMove, this);
    this.joyStickBase.on('pointerup', this.handleJoystickEnd, this);
    this.joyStickBase.on('pointerout', this.handleJoystickEnd, this);

    this.interactButton.on('pointerdown', () => {
        const keyEvent = new KeyboardEvent('keydown', { key: 'c' });
        this.input.keyboard?.emit('keydown-C', keyEvent);
    });
  }

  private handleJoystickStart(pointer: Phaser.Input.Pointer) {
    if (!this.joyStick || !this.joyStickBase) return;
    this.handleJoystickMove(pointer);
  }

  private handleJoystickMove(pointer: Phaser.Input.Pointer) {
    if (!this.joyStick || !this.joyStickBase || !pointer.isDown) return;

    const baseX = this.joyStickBase.x;
    const baseY = this.joyStickBase.y;
    const angle = Phaser.Math.Angle.Between(baseX, baseY, pointer.x, pointer.y);
    const distance = Phaser.Math.Distance.Between(baseX, baseY, pointer.x, pointer.y);
    const maxDistance = 50;

    let moveX = Math.cos(angle) * Math.min(distance, maxDistance);
    let moveY = Math.sin(angle) * Math.min(distance, maxDistance);

    this.joyStick.x = baseX + moveX;
    this.joyStick.y = baseY + moveY;

    // Adjust the velocity multiplier (160 matches keyboard movement speed)
    const speedMultiplier = 200/50; // Convert joystick distance to match keyboard speed
    this.player.setVelocity(
        moveX * speedMultiplier, 
        moveY * speedMultiplier
    );

    // Update animation direction
    const direction = Math.abs(moveX) > Math.abs(moveY) 
        ? (moveX < 0 ? 'left' : 'right')
        : (moveY < 0 ? 'up' : 'down');
    
    this.player.play(`walk-${direction}`, true);
    this.lastDirection = direction;
  }

  private handleJoystickEnd() {
    if (!this.joyStick || !this.joyStickBase) return;
    this.joyStick.x = this.joyStickBase.x;
    this.joyStick.y = this.joyStickBase.y;
    this.player.setVelocity(0);
    this.player.play(`idle-${this.lastDirection}`, true);
  }

  createAnimations() {
    const directions = ["right", "up", "left", "down"];
    const playerWalkKey = `player_${this.selectedCharacter}_walk_1`;
    const playerIdleKey = `player_${this.selectedCharacter}_idle_1`;

    directions.forEach((dir, index) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers(playerWalkKey, {
          start: index * 6,
          end: index * 6 + 5,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `idle-${dir}`,
        frames: this.anims.generateFrameNumbers(playerIdleKey, {
          start: index * 6,
          end: index * 6 + 5,
        }),
        frameRate: 3,
        repeat: -1,
      });
    });
  }

  update() {
    const user = localStorage.getItem('quiztal-player');
    if (!user) return;
    if (!this.cursors || !this.wasd) return;
    this.handlePlayerMovement();
  }

  handlePlayerMovement() {
    if (this.isMobile) return; // Add missing parentheses
    
    const { left, right, up, down } = this.cursors;
    const wasd = this.wasd;

    const moveLeft = left?.isDown || wasd.left.isDown;
    const moveRight = right?.isDown || wasd.right.isDown;
    const moveUp = up?.isDown || wasd.up.isDown;
    const moveDown = down?.isDown || wasd.down.isDown;

    this.player.setVelocity(0);

    if (moveLeft) this.player.setVelocityX(-160);
    if (moveRight) this.player.setVelocityX(160);
    if (moveUp) this.player.setVelocityY(-160);
    if (moveDown) this.player.setVelocityY(160);

    const direction = moveLeft ? "left" : moveRight ? "right" : moveUp ? "up" : moveDown ? "down" : this.lastDirection;
    this.player.play(moveLeft || moveRight || moveUp || moveDown ? `walk-${direction}` : `idle-${direction}`, true);
    this.lastDirection = direction;
  }
}
