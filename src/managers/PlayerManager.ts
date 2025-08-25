import Phaser from 'phaser';
import { getPlayerTitle } from '../utils/TitleUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface PlayerConfig {
  selectedCharacter: string;
  startPosition: { x: number; y: number };
  speed: number;
}

interface MovementControls {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: Record<string, Phaser.Input.Keyboard.Key>;
}

export default class PlayerManager {
  private scene: Phaser.Scene;
  private player!: Phaser.Physics.Arcade.Sprite;
  private config: PlayerConfig;
  private controls!: MovementControls;
  private lastDirection: string = 'down';
  
  // UI Elements
  private playerTitle?: Phaser.GameObjects.Text;
  private titleAura?: Phaser.GameObjects.Group;
  private playerNameText?: Phaser.GameObjects.Text;
  private playerGlow?: Phaser.GameObjects.Sprite;
  
  private static instance: PlayerManager;

  private constructor(scene: Phaser.Scene, config: PlayerConfig) {
    this.scene = scene;
    this.config = config;
  }

  public static getInstance(scene: Phaser.Scene, config: PlayerConfig): PlayerManager {
    if (!PlayerManager.instance) {
      PlayerManager.instance = new PlayerManager(scene, config);
    }
    PlayerManager.instance.scene = scene;
    PlayerManager.instance.config = config;
    return PlayerManager.instance;
  }

  /**
   * Initialize the player sprite and set up basic properties
   */
  public initializePlayer(): Phaser.Physics.Arcade.Sprite {
    console.log('👤 PlayerManager: Initializing player...');
    
    const playerTexture = `player_${this.config.selectedCharacter}_walk_1`;
    
    this.player = this.scene.physics.add.sprite(
      this.config.startPosition.x,
      this.config.startPosition.y,
      playerTexture,
      0
    );

    this.player.setCollideWorldBounds(true);
    
    // Assign player UID from localStorage
    this.assignPlayerUID();
    
    // Set proper depth for rendering above map elements
    this.setPlayerDepth();
    
    // Set up camera to follow player
    this.scene.cameras.main.startFollow(this.player);
    
    console.log('✅ PlayerManager: Player initialized successfully');
    return this.player;
  }

  /**
   * Set up player movement controls
   */
  public setupMovementControls(): void {
    console.log('🎮 PlayerManager: Setting up movement controls...');
    
    if (!this.scene.input.keyboard) {
      console.error('❌ PlayerManager: Keyboard input not available');
      return;
    }

    this.controls = {
      cursors: this.scene.input.keyboard.createCursorKeys(),
      wasd: {
        up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      }
    };

    console.log('✅ PlayerManager: Movement controls set up successfully');
  }

  /**
   * Create player animations for all directions
   */
  public createPlayerAnimations(): void {
    console.log('🎬 PlayerManager: Creating player animations...');
    
    const directions = ['right', 'up', 'left', 'down'];
    const playerWalkKey = `player_${this.config.selectedCharacter}_walk_1`;
    const playerIdleKey = `player_${this.config.selectedCharacter}_idle_1`;

    directions.forEach((dir, index) => {
      const walkKey = `walk-${dir}`;
      const idleKey = `idle-${dir}`;

      // Only create animation if it doesn't exist
      if (!this.scene.anims.exists(walkKey)) {
        this.scene.anims.create({
          key: walkKey,
          frames: this.scene.anims.generateFrameNumbers(playerWalkKey, {
            start: index * 6,
            end: index * 6 + 5,
          }),
          frameRate: 10,
          repeat: -1,
        });
      }

      if (!this.scene.anims.exists(idleKey)) {
        this.scene.anims.create({
          key: idleKey,
          frames: this.scene.anims.generateFrameNumbers(playerIdleKey, {
            start: index * 6,
            end: index * 6 + 5,
          }),
          frameRate: 3,
          repeat: -1,
        });
      }
    });

    console.log('✅ PlayerManager: Player animations created successfully');
  }

  /**
   * Handle player movement and animations
   */
  public handleMovement(isMobile: boolean = false): void {
    if (isMobile || !this.controls) return;

    if (!this.player) {
      console.error('❌ PlayerManager: Player not initialized');
      return;
    }

    const { cursors, wasd } = this.controls;

    const moveLeft = cursors.left?.isDown || wasd.left.isDown;
    const moveRight = cursors.right?.isDown || wasd.right.isDown;
    const moveUp = cursors.up?.isDown || wasd.up.isDown;
    const moveDown = cursors.down?.isDown || wasd.down.isDown;

    this.player.setVelocity(0);

    if (moveLeft) this.player.setVelocityX(-this.config.speed);
    if (moveRight) this.player.setVelocityX(this.config.speed);
    if (moveUp) this.player.setVelocityY(-this.config.speed);
    if (moveDown) this.player.setVelocityY(this.config.speed);

    // Determine direction and animation
    const direction = moveLeft ? 'left' : 
                     moveRight ? 'right' : 
                     moveUp ? 'up' : 
                     moveDown ? 'down' : 
                     this.lastDirection;

    const isMoving = moveLeft || moveRight || moveUp || moveDown;
    const animationKey = isMoving ? `walk-${direction}` : `idle-${direction}`;
    
    this.player.play(animationKey, true);
    this.lastDirection = direction;
  }

  /**
   * Create player title display for NFT holders
   */
  public async createPlayerTitle(): Promise<void> {
    console.log('👑 PlayerManager: Creating player title...');
    
    // Check for player-glow texture
    if (!this.scene.textures.exists('player-glow')) {
      console.error('❌ PlayerManager: player-glow texture not found!');
      return;
    }

    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) {
      console.log('ℹ️ PlayerManager: No NFTs found, skipping title creation');
      return;
    }

    try {
      const nfts = JSON.parse(nftsStr);
      const titleConfig = getPlayerTitle(nfts);

      if (!titleConfig.text) {
        console.log('ℹ️ PlayerManager: No title configuration, skipping title creation');
        return;
      }

      // Create player glow effect
      this.createPlayerGlow(titleConfig);
      
      // Create aura effect
      this.createPlayerAura(titleConfig);
      
      // Create main title text
      this.createTitleText(titleConfig);

      console.log('✅ PlayerManager: Player title created successfully');
    } catch (error) {
      console.error('❌ PlayerManager: Error creating player title:', error);
    }
  }

  /**
   * Create player name display from Firestore
   */
  public async createPlayerName(): Promise<void> {
    console.log('📝 PlayerManager: Creating player name...');
    
    const userStr = localStorage.getItem('quiztal-player');
    if (!userStr) {
      console.log('ℹ️ PlayerManager: No user data found');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (!user?.uid) {
        console.warn('⚠️ PlayerManager: No user UID found');
        return;
      }

      // Fetch player data from Firestore
      const playerRef = doc(db, 'players', user.uid);
      const playerDoc = await getDoc(playerRef);

      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        const displayName = playerData.displayName || 'Unknown Adventurer';

        this.playerNameText = this.scene.add.text(
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

        console.log('✅ PlayerManager: Player name set:', displayName);
      } else {
        console.warn('⚠️ PlayerManager: No player document found in Firestore');
      }
    } catch (error) {
      console.error('❌ PlayerManager: Error fetching player name:', error);
    }
  }

  /**
   * Set proper depth for player to ensure it renders above map elements
   */
  public setPlayerDepth(): void {
    if (!this.player) {
      console.warn('⚠️ PlayerManager: Cannot set depth - player not initialized');
      return;
    }

    // Map layers use depths 0-4, NPCs use depth 10, so player should be at depth 8
    // This ensures player renders above map elements but allows flexibility for NPCs
    const PLAYER_DEPTH = 8;
    
    const currentDepth = this.player.depth || 0;
    this.player.setDepth(PLAYER_DEPTH);
    const newDepth = this.player.depth || 0;
    
    if (newDepth === PLAYER_DEPTH) {
      console.log(`✅ PlayerManager: Player depth set: ${currentDepth} → ${newDepth}`);
    } else {
      console.warn(`⚠️ PlayerManager: Player depth setting failed: expected ${PLAYER_DEPTH}, got ${newDepth}`);
    }
  }

  /**
   * Update player UI elements positions
   */
  public updatePlayerUI(): void {
    if (!this.player) return;

    // Update title and aura positions
    if (this.playerTitle && this.titleAura) {
      const baseY = this.player.y - 40 + Math.sin(this.scene.time.now / 1500) * 2;
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
        .setDepth(0)
        .setVisible(true);
        
      // Move below player to ensure it stays behind
      this.scene.children.moveBelow(this.playerGlow, this.player);
    }
  }

  /**
   * Manually refresh player depth - useful for fixing rendering issues
   */
  public refreshPlayerDepth(): void {
    console.log('🔄 PlayerManager: Manually refreshing player depth...');
    this.setPlayerDepth();
  }

  /**
   * Manually refresh player title depths - useful for fixing title rendering issues
   */
  public refreshTitleDepths(): void {
    console.log('🔄 PlayerManager: Manually refreshing title depths...');
    
    const TITLE_DEPTH = 15;
    const AURA_DEPTH = 12;
    
    // Refresh title depth
    if (this.playerTitle) {
      this.playerTitle.setDepth(TITLE_DEPTH);
      console.log(`✅ PlayerManager: Title depth refreshed to ${TITLE_DEPTH}`);
    }
    
    // Refresh aura depths
    if (this.titleAura) {
      this.titleAura.getChildren().forEach((child, index) => {
        (child as Phaser.GameObjects.Text).setDepth(AURA_DEPTH);
      });
      console.log(`✅ PlayerManager: Aura depths refreshed to ${AURA_DEPTH}`);
    }
    
    console.log('✅ PlayerManager: All title depths refreshed');
  }

  /**
   * Get the player sprite
   */
  public getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  /**
   * Get player position
   */
  public getPlayerPosition(): { x: number; y: number } {
    return this.player ? { x: this.player.x, y: this.player.y } : { x: 0, y: 0 };
  }

  /**
   * Set player velocity (for mobile controls)
   */
  public setPlayerVelocity(x: number, y: number): void {
    if (this.player) {
      this.player.setVelocity(x, y);
    }
  }

  /**
   * Play player animation
   */
  public playPlayerAnimation(animationKey: string): void {
    if (this.player) {
      this.player.play(animationKey, true);
    }
  }

  /**
   * Set last direction for idle animations
   */
  public setLastDirection(direction: string): void {
    this.lastDirection = direction;
  }

  /**
   * Get last direction
   */
  public getLastDirection(): string {
    return this.lastDirection;
  }

  // Private helper methods
  private assignPlayerUID(): void {
    const userStr = localStorage.getItem('quiztal-player');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.uid) {
          this.player.name = user.uid;
          console.log('👤 PlayerManager: Player UID assigned:', this.player.name);
        }
      } catch (e) {
        console.warn('⚠️ PlayerManager: Could not parse user from localStorage', e);
      }
    }
  }

  private createPlayerGlow(titleConfig: any): void {
    this.playerGlow = this.scene.add.sprite(this.player.x, this.player.y, 'player-glow')
      .setScale(2)           
      .setAlpha(0.5)        
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0)
      .setOrigin(0.5)
      .setTint(parseInt(titleConfig.auraColor.replace('#', ''), 16));

    // Move the glow behind the player
    this.scene.children.moveBelow(this.playerGlow, this.player);

    // Create pulsing animation
    this.scene.tweens.add({
      targets: this.playerGlow,
      alpha: { from: 0.5, to: 0.3 },    
      scale: { from: 2, to: 2.2 },
      duration: 1200,                    
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createPlayerAura(titleConfig: any): void {
    const auraGroup = this.scene.add.group();
    const AURA_DEPTH = 12; // Above NPCs (10) to ensure title visibility
    
    for (let i = 0; i < 3; i++) {
      const aura = this.scene.add.text(
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
      ).setOrigin(0.5).setAlpha(0.3 - (i * 0.1)).setDepth(AURA_DEPTH);
      auraGroup.add(aura);
    }

    this.titleAura = auraGroup;

    // Animate aura
    this.scene.tweens.add({
      targets: auraGroup.getChildren(),
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: function(i: number) { return i * 150; }
    });
    
    console.log(`✅ PlayerManager: Player aura created with depth ${AURA_DEPTH}`);
  }

  private createTitleText(titleConfig: any): void {
    const TITLE_DEPTH = 15; // Above aura (12) and NPCs (10) for maximum visibility
    
    this.playerTitle = this.scene.add.text(
      this.player.x,
      this.player.y - 40,
      titleConfig.text,
      {
        fontSize: '11px',
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
    ).setOrigin(0.5).setDepth(TITLE_DEPTH);
    
    console.log(`✅ PlayerManager: Player title created with depth ${TITLE_DEPTH}`);
  }

  /**
   * Clean up player resources
   */
  public destroy(): void {
    console.log('🧹 PlayerManager: Cleaning up player resources...');
    
    if (this.playerTitle) {
      this.playerTitle.destroy();
    }
    
    if (this.titleAura) {
      this.titleAura.destroy();
    }
    
    if (this.playerNameText) {
      this.playerNameText.destroy();
    }
    
    if (this.playerGlow) {
      this.playerGlow.destroy();
    }

    PlayerManager.instance = null as any;
    console.log('✅ PlayerManager: Cleanup complete');
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    const auraDepths = this.titleAura ? 
      this.titleAura.getChildren().map((child, index) => ({
        index,
        depth: (child as Phaser.GameObjects.Text).depth
      })) : [];
      
    return {
      playerExists: !!this.player,
      position: this.getPlayerPosition(),
      depth: this.player ? this.player.depth : null,
      selectedCharacter: this.config.selectedCharacter,
      lastDirection: this.lastDirection,
      hasTitle: !!this.playerTitle,
      titleDepth: this.playerTitle ? this.playerTitle.depth : null,
      hasName: !!this.playerNameText,
      nameDepth: this.playerNameText ? this.playerNameText.depth : null,
      hasGlow: !!this.playerGlow,
      glowDepth: this.playerGlow ? this.playerGlow.depth : null,
      hasAura: !!this.titleAura,
      auraDepths: auraDepths,
      controlsSetup: !!this.controls
    };
  }
}