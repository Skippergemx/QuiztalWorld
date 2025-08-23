import Phaser from "phaser";
import HuntBoy from "../objects/HuntBoy";
import MintGirl from "../objects/MintGirl";
import BaseSage from "../objects/BaseSage";
import MrGemx from "../objects/MrGemx";
import Moblin from "../objects/Moblin";
import { showDialog } from "../utils/SimpleDialogBox";
import { getPlayerTitle } from '../utils/TitleUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { saveQuiztalsToDatabase } from '../utils/Database';
import { QuizAntiSpamManager } from '../managers/QuizAntiSpamManager';
import { NetworkMonitor } from '../utils/NetworkMonitor';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';

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
  private moblin?: Moblin; // Add moblin property
  private joyStick?: Phaser.GameObjects.Image;
  private joyStickBase?: Phaser.GameObjects.Image;
  private interactButton?: Phaser.GameObjects.Image;
  private isMobile: boolean = false;
  private playerTitle?: Phaser.GameObjects.Text;
  private titleAura?: Phaser.GameObjects.Group; // Reference to the aura effect group
  private playerNameText?: Phaser.GameObjects.Text; // Add new property for player name text
  private playerGlow?: Phaser.GameObjects.Sprite; // Add this to your class properties
  private moblinGiftboxSound?: Phaser.Sound.BaseSound; // Add this property for the moblin gift box sound
  private quizAntiSpamManager!: QuizAntiSpamManager; // Add this property for the anti-spam manager
  private networkMonitor!: NetworkMonitor; // Add this property for the network monitor

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

    // ADD MOBLIN TEXTURES HERE - Move from BootScene to GameScene
    this.load.spritesheet('moblin_walk', 'assets/pets/moblin_walk.png', {
      frameWidth: 32,
      frameHeight: 53
    });

    this.load.spritesheet('moblin_idle', 'assets/pets/moblin_idle.png', {
      frameWidth: 32,
      frameHeight: 53
    });
    
    // Load Moblin gift box sound
    this.load.audio('moblin-giftbox', 'assets/audio/Moblin_giftbox.wav');
  }

  async create() {
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("tileset", "tiles");
    if (!tileset) throw new Error("Tileset failed to load!");
    this.scene.launch("UIScene");

    // Initialize the NPCQuizManager
    const quizManager = NPCQuizManager.getInstance(this);
    await quizManager.initialize();

    // Initialize the QuizAntiSpamManager
    this.quizAntiSpamManager = QuizAntiSpamManager.getInstance(this);
    
    // Store reference in window object for global access
    if (typeof window !== 'undefined') {
      (window as any).quizAntiSpamManager = this.quizAntiSpamManager;
    }
    
    // Initialize the NetworkMonitor
    this.networkMonitor = NetworkMonitor.getInstance(this);

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
    this.baseSage = new BaseSage(this, 1100, 500);
    this.mrGemx = new MrGemx(this, 500, 480);

    // ✅ Colliders for all NPCs
    this.physics.add.collider(this.player, this.huntboy);
    this.physics.add.collider(this.player, this.mintGirl);
    this.physics.add.collider(this.player, this.baseSage);
    this.physics.add.collider(this.player, this.mrGemx);

    this.createAnimations();

    this.events.on("shutdown", () => {
      showDialog(this, []);
      if (this.networkMonitor) {
        this.networkMonitor.destroy();
      }
    });

    this.input.keyboard?.on("keydown-C", () => {
      // Check if interactions are blocked before triggering NPC interaction
      if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
        if (window.quizAntiSpamManager.isInteractionBlocked()) {
          console.log("GameScene: C key press blocked - interactions are currently blocked");
          return;
        }
      }
      this.handleNPCTrigger("C");
    });
    
    // Add O key handler for moblin gift box collection
    this.input.keyboard?.on("keydown-O", () => {
      // Check if interactions are blocked before triggering gift box collection
      if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
        if (window.quizAntiSpamManager.isInteractionBlocked()) {
          console.log("GameScene: O key press blocked - interactions are currently blocked");
          return;
        }
      }
      this.handleNPCTrigger("O");
    });
    
    // Add o key handler for moblin gift box collection (lowercase)
    this.input.keyboard?.on("keydown-o", () => {
      // Check if interactions are blocked before triggering gift box collection
      if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
        if (window.quizAntiSpamManager.isInteractionBlocked()) {
          console.log("GameScene: o key press blocked - interactions are currently blocked");
          return;
        }
      }
      this.handleNPCTrigger("O");
    });

    this.createMobileControls();
    this.createPlayerTitle();
    this.createPlayerName();

    // MOVE PET CREATION TO DELAYED CALL - Wait for all textures to be fully ready
    this.time.delayedCall(100, () => {
      this.createPetIfEligible();
    });
    
    // Initialize moblin gift box sound
    this.moblinGiftboxSound = this.sound.add('moblin-giftbox');
    
    // Make game scene accessible globally
    if (typeof window !== 'undefined') {
      (window as any).gameScene = this;
    }
  }

  private createPetIfEligible(): void {
    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) {
      console.log('No NFTs found in localStorage');
      return;
    }

    try {
      const nfts = JSON.parse(nftsStr);
      const titleConfig = getPlayerTitle(nfts);

      // Only create pet if player has a title (NFT holder)
      if (titleConfig.text) {
        console.log('Player has NFT title:', titleConfig.text);
        
        // Double-check textures are loaded
        if (!this.textures.exists('moblin_idle') || !this.textures.exists('moblin_walk')) {
          console.warn('Moblin textures still not loaded, retrying...');
          
          // Retry after another delay
          this.time.delayedCall(500, () => {
            this.createPetIfEligible();
          });
          return;
        }

        console.log('Creating Moblin pet...');
        this.moblin = new Moblin(this, this.player.x + 50, this.player.y + 50);
        this.moblin.setTarget(this.player);
        
        // Add physics collisions
        this.physics.add.collider(this.moblin, this.huntboy);
        this.physics.add.collider(this.moblin, this.mintGirl);
        this.physics.add.collider(this.moblin, this.baseSage);
        this.physics.add.collider(this.moblin, this.mrGemx);

        // Listen for gift box click events
        this.moblin.on('giftBoxClicked', (moblin: Moblin) => {
            // Check if player is close enough to the moblin
            const distanceToMoblin = Phaser.Math.Distance.Between(this.player.x, this.player.y, moblin.x, moblin.y);
            if (distanceToMoblin <= 100) {
                console.log("Gift box clicked, triggering collection");
                this.interactWithMoblin();
            } else {
                console.log("Player not close enough to moblin to collect gift boxes");
            }
        });

        console.log('🐾 Moblin pet spawned for NFT holder!');
      } else {
        console.log('Player does not have NFT title, no pet spawned');
      }
    } catch (error) {
      console.error('Error creating pet:', error);
    }
  }

  private createPlayerTitle(): void {
    // Add debug check at the start of the method
    if (!this.textures.exists('player-glow')) {
        console.error('player-glow texture not found!');
        return;
    }

    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) return;

    const nfts = JSON.parse(nftsStr);
    const titleConfig = getPlayerTitle(nfts);

    if (!titleConfig.text) return;

    // Create player glow with adjusted parameters
    this.playerGlow = this.add.sprite(this.player.x, this.player.y, 'player-glow')
        .setScale(2)           
        .setAlpha(0.5)        
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0)          // Set to lowest depth to ensure it's behind everything
        .setOrigin(0.5)       // Center the glow
        .setTint(parseInt(titleConfig.auraColor.replace('#', ''), 16));

    // Move the glow behind the player
    this.children.moveBelow(this.playerGlow, this.player);

    // Add debug visualization
    console.log('Glow created:', {
        exists: this.playerGlow !== undefined,
        visible: this.playerGlow?.visible,
        alpha: this.playerGlow?.alpha,
        scale: this.playerGlow?.scale,
        position: {x: this.playerGlow?.x, y: this.playerGlow?.y},
        depth: this.playerGlow?.depth,
        playerDepth: this.player.depth
    });

    // Adjust pulsing animation
    this.tweens.add({
        targets: this.playerGlow,
        alpha: { from: 0.5, to: 0.3 },    
        scale: { from: 2, to: 2.2 },      // Increased scale range
        duration: 1200,                    
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Create aura effect with increased font size
    const auraGroup = this.add.group();
    for (let i = 0; i < 3; i++) {
        const aura = this.add.text(
            this.player.x,
            this.player.y - 40,
            titleConfig.text,
            {
                fontSize: '11px',
                fontStyle: 'bold',
                color: titleConfig.auraColor,
                stroke: titleConfig.auraColor,
                strokeThickness: 1,
            }
        ).setOrigin(0.5).setAlpha(0.3 - (i * 0.1));
        auraGroup.add(aura);
    }

    // Assign the aura group to the class property
    this.titleAura = auraGroup;  // Add this line

    // Create main title text with increased font size
    this.playerTitle = this.add.text(
        this.player.x,
        this.player.y - 40,
        titleConfig.text,
        {
            fontSize: '11px',  // Increased from 7px by ~50%
            fontStyle: 'bold',
            color: titleConfig.color,
            stroke: titleConfig.glowColor,
            strokeThickness: 2,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 1,
                stroke: true,
                fill: true
            }
        }
    ).setOrigin(0.5);

    // Animate aura
    this.tweens.add({
        targets: auraGroup.getChildren(),
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: function(i: number) { return i * 150; }
    });

    // Fix the setPosition error by casting the aura GameObject to Text
    // Update title and aura positions
    if (this.playerTitle && this.titleAura) {
        const baseY = this.player.y - 40 + Math.sin(this.time.now / 1500) * 2;
        this.playerTitle.setPosition(this.player.x, baseY);
        
        this.titleAura.getChildren().forEach(aura => {
            (aura as Phaser.GameObjects.Text).setPosition(this.player.x, baseY);
        });
    }
}

  private async createPlayerName(): Promise<void> {
    const userStr = localStorage.getItem('quiztal-player');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        if (!user?.uid) {
            console.warn('No user UID found');
            return;
        }

        // Fetch player data from Firestore
        const playerRef = doc(db, "players", user.uid);
        const playerDoc = await getDoc(playerRef);

        if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            const displayName = playerData.displayName || 'Unknown Adventurer';

            this.playerNameText = this.add.text(
                this.player.x,
                this.player.y + 35,
                displayName,
                {
                    fontSize: '10px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    shadow: {
                        offsetX: 1,
                        offsetY: 1,
                        color: '#000000',
                        blur: 1,
                        stroke: true,
                        fill: true
                    }
                }
            ).setOrigin(0.5)
             .setDepth(100);

            console.log('Player name set:', displayName);
        } else {
            console.warn('No player document found in Firestore');
        }
    } catch (e) {
        console.error("Error fetching player name:", e);
    }
}

  private handleNPCTrigger(key: string) {
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("Network offline - preventing NPC interaction");
      showDialog(this, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);
      return;
    }
    
    const distanceToHuntBoy = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.huntboy.x, this.huntboy.y);
    const distanceToMintGirl = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mintGirl.x, this.mintGirl.y);
    const distanceToBaseSage = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.baseSage.x, this.baseSage.y);
    const distanceToMrGemx = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mrGemx.x, this.mrGemx.y);
    const distanceToMoblin = this.moblin ? Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moblin.x, this.moblin.y) : Infinity;

    console.log(`Distances - HuntBoy: ${distanceToHuntBoy}, MintGirl: ${distanceToMintGirl}, BaseSage: ${distanceToBaseSage}, MrGemx: ${distanceToMrGemx}, Moblin: ${distanceToMoblin}`);

    if (key === "C") {
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
    } else if (key === "O") {
      if (distanceToMoblin <= 100) {
        console.log("Triggering Moblin gift box collection");
        this.interactWithMoblin();
      } else {
        console.log("Player not in range of Moblin");
      }
    }
  }

  private async interactWithMoblin() {
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("Network offline - preventing Moblin interaction");
      showDialog(this, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);
      return;
    }
    
    if (!this.moblin) {
      console.log("No moblin found");
      return;
    }

    const giftBoxCount = this.moblin.getGiftBoxCount();
    if (giftBoxCount > 0) {
      // Collect all gift boxes
      const collected = await this.moblin.collectAllGiftBoxes();
      
      // Calculate rewards (0.1 - 0.5 Quiztals per gift box)
      let totalReward = 0;
      for (let i = 0; i < collected; i++) {
        totalReward += Phaser.Math.FloatBetween(0.1, 0.5);
      }
      totalReward = parseFloat(totalReward.toFixed(2));
      
      // Add to player's Quiztals
      const userStr = localStorage.getItem('quiztal-player');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.uid) {
            const playerId = user.uid;
            await saveQuiztalsToDatabase(playerId, totalReward, "Moblin");
            
            // Also log to local session tracker
            QuiztalRewardLog.logReward("Moblin", totalReward);
            
            console.log(`🎁 Collected ${collected} gift boxes and earned ${totalReward} Quiztals!`);
            
            // Show UI feedback
            this.showGiftBoxCollectionFeedback(totalReward);
          }
        } catch (error) {
          console.error("Error collecting gift boxes:", error);
        }
      }
    } else {
      console.log("No gift boxes to collect");
    }
  }
  
  // Show UI feedback for gift box collection
  private showGiftBoxCollectionFeedback(amount: number) {
    if (this.moblin) {
      // Create text that floats above the moblin
      const feedbackText = this.add.text(
        this.moblin.x,
        this.moblin.y - 50,
        `+${amount} Quiztals!`,
        {
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#FFD700', // Gold color
          stroke: '#000000',
          strokeThickness: 3,
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 2,
            stroke: true,
            fill: true
          }
        }
      ).setOrigin(0.5)
       .setDepth(20);
      
      // Animate the feedback text
      this.tweens.add({
        targets: feedbackText,
        y: feedbackText.y - 40,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          feedbackText.destroy();
        }
      });
    }
    
    // Play moblin gift box sound
    if (this.moblinGiftboxSound) {
      this.moblinGiftboxSound.play();
    }
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
    // Check network connectivity before triggering NPC interaction
    if (!this.networkMonitor.getIsOnline()) {
        console.log("Network offline - preventing NPC interaction");
        showDialog(this, [
            {
                text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
                isExitDialog: true
            }
        ]);
        return;
    }
    
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
        const walkKey = `walk-${dir}`;
        const idleKey = `idle-${dir}`;

        // Only create animation if it doesn't exist
        if (!this.anims.exists(walkKey)) {
            this.anims.create({
                key: walkKey,
                frames: this.anims.generateFrameNumbers(playerWalkKey, {
                    start: index * 6,
                    end: index * 6 + 5,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }

        if (!this.anims.exists(idleKey)) {
            this.anims.create({
                key: idleKey,
                frames: this.anims.generateFrameNumbers(playerIdleKey, {
                    start: index * 6,
                    end: index * 6 + 5,
                }),
                frameRate: 3,
                repeat: -1,
            });
        }
    });
  }

  update() {
    const user = localStorage.getItem('quiztal-player');
    if (!user) return;
    if (!this.cursors || !this.wasd) return;
    this.handlePlayerMovement();

    // Update title and aura positions
    if (this.playerTitle && this.titleAura) {
        const baseY = this.player.y - 40 + Math.sin(this.time.now / 1500) * 2;
        this.playerTitle.setPosition(this.player.x, baseY);
        
        this.titleAura.getChildren().forEach(aura => {
            (aura as Phaser.GameObjects.Text).setPosition(this.player.x, baseY);
        });
    }

    // Update player name position
    if (this.playerNameText) {
        this.playerNameText.setPosition(this.player.x, this.player.y + 35);
    }

    // Update glow position and depth
    if (this.playerGlow) {
        this.playerGlow
            .setPosition(this.player.x, this.player.y)
            .setDepth(0)      // Keep it at lowest depth
            .setVisible(true);
            
        // Move below player each frame to ensure it stays behind
        this.children.moveBelow(this.playerGlow, this.player);
    }

    // Update pet
    if (this.moblin) {
      this.moblin.update();
      
      // Teleport check every few seconds
      if (this.time.now % 3000 < 50) { // Roughly every 3 seconds
        this.moblin.teleportToTarget();
      }
    }
    
    // Check player proximity to NPCs and hide/show head timers accordingly
    this.checkNPCProximity();
  }
  
  private checkNPCProximity() {
    // Check HuntBoy proximity
    if (this.huntboy.getIsOnCooldown()) {
      if (this.huntboy.isPlayerInRange(this.player)) {
        this.huntboy.showHeadTimer();
      } else {
        this.huntboy.hideHeadTimer();
      }
    }
    
    // Check MintGirl proximity
    if (this.mintGirl.getIsOnCooldown()) {
      if (this.mintGirl.isPlayerInRange(this.player)) {
        this.mintGirl.showHeadTimer();
      } else {
        this.mintGirl.hideHeadTimer();
      }
    }
    
    // Check BaseSage proximity
    if (this.baseSage.getIsOnCooldown()) {
      if (this.baseSage.isPlayerInRange(this.player)) {
        this.baseSage.showHeadTimer();
      } else {
        this.baseSage.hideHeadTimer();
      }
    }
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
