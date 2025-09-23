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
   * Handle player movement based on input
   */
  handleMovement(isMobile: boolean = false): void {
    // Add safety check for player existence
    if (!this.player || !this.player.body) {
      return;
    }
    
    // Add safety check for scene and game state
    if (!this.scene || !this.scene.game || !this.scene.game.loop) {
      return;
    }

    try {
      // Reset velocity
      this.player.setVelocity(0, 0);

      // Handle mobile vs desktop movement differently
      if (isMobile) {
        // For mobile, movement is handled by MobileControlsManager
        // We just need to ensure the player object is valid
        return;
      }

      // Desktop keyboard controls
      const cursors = this.scene.input.keyboard?.createCursorKeys();
      const wasd = {
        up: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        left: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        down: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        right: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };

      let velocityX = 0;
      let velocityY = 0;
      const speed = this.config.speed;

      // Handle arrow keys
      if (cursors) {
        if (cursors.left?.isDown) velocityX = -speed;
        if (cursors.right?.isDown) velocityX = speed;
        if (cursors.up?.isDown) velocityY = -speed;
        if (cursors.down?.isDown) velocityY = speed;
      }

      // Handle WASD keys (override arrow keys if both are pressed)
      if (wasd) {
        if (wasd.left?.isDown) velocityX = -speed;
        if (wasd.right?.isDown) velocityX = speed;
        if (wasd.up?.isDown) velocityY = -speed;
        if (wasd.down?.isDown) velocityY = speed;
      }

      // Apply velocity
      this.player.setVelocity(velocityX, velocityY);

      // Determine direction and play appropriate animation
      if (velocityX !== 0 || velocityY !== 0) {
        // Moving - determine direction
        if (Math.abs(velocityX) > Math.abs(velocityY)) {
          // Horizontal movement
          this.lastDirection = velocityX > 0 ? 'right' : 'left';
        } else {
          // Vertical movement
          this.lastDirection = velocityY > 0 ? 'down' : 'up';
        }
        this.player.play(`walk-${this.lastDirection}`, true);
      } else {
        // Idle - play idle animation
        this.player.play(`idle-${this.lastDirection}`, true);
      }


    } catch (error) {
      console.warn('PlayerManager: Error handling movement, likely due to scene shutdown', error);
    }
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
      // Handle Firebase permissions error gracefully
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ PlayerManager: Insufficient permissions to fetch player name, using default');
        // Create a default name display
        if (this.player) {
          this.playerNameText = this.scene.add.text(
            this.player.x,
            this.player.y + 35,
            'Unknown Adventurer',
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
        }
      } else {
        console.error('❌ PlayerManager: Error fetching player name:', error);
      }
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
    if (!this.player || !this.scene) return;

    // Update title and aura positions
    if (this.playerTitle && this.titleAura) {
      const baseY = this.player.y - 40 + Math.sin(this.scene.time.now / 1500) * 2;
      this.playerTitle.setPosition(this.player.x, baseY);
      
      // Add comprehensive safety check to ensure titleAura is still valid
      try {
        if (this.titleAura && typeof this.titleAura.getChildren === 'function') {
          const children = this.titleAura.getChildren();
          if (Array.isArray(children)) {
            children.forEach(aura => {
              if (aura && (aura as Phaser.GameObjects.Text).setPosition) {
                (aura as Phaser.GameObjects.Text).setPosition(this.player.x, baseY);
              }
            });
          }
        }
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error updating title aura positions', e);
      }
    }

    // Update player name position
    if (this.playerNameText) {
      this.playerNameText.setPosition(this.player.x, this.player.y + 35);
    }

    // Update glow position and depth
    if (this.playerGlow && this.player) {
      this.playerGlow
        .setPosition(this.player.x, this.player.y)
        .setDepth(0)
        .setVisible(true);
        
      // Add safety check for moveBelow operation
      try {
        if (this.scene.children && typeof this.scene.children.moveBelow === 'function') {
          // Ensure both objects exist in the display list before moving
          if (this.playerGlow.scene && this.player.scene) {
            this.scene.children.moveBelow(this.playerGlow, this.player);
          }
        }
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error positioning player glow', e);
      }
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
      try {
        if (typeof this.titleAura.getChildren === 'function') {
          const children = this.titleAura.getChildren();
          if (Array.isArray(children)) {
            children.forEach((child) => {
              if (child && (child as Phaser.GameObjects.Text).setDepth) {
                (child as Phaser.GameObjects.Text).setDepth(AURA_DEPTH);
              }
            });
            console.log(`✅ PlayerManager: Aura depths refreshed to ${AURA_DEPTH}`);
          }
        }
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error refreshing aura depths', e);
      }
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
   * Get debug information
   */
  public getDebugInfo(): any {
    const auraDepths = this.titleAura ? 
      (() => {
        try {
          if (typeof this.titleAura.getChildren === 'function') {
            const children = this.titleAura.getChildren();
            if (Array.isArray(children)) {
              return children.map((child, index) => {
                if (child && (child as Phaser.GameObjects.Text).depth !== undefined) {
                  return {
                    index,
                    depth: (child as Phaser.GameObjects.Text).depth
                  };
                }
                return { index, depth: null };
              });
            }
          }
        } catch (e) {
          console.warn('⚠️ PlayerManager: Error getting aura depths for debug info', e);
        }
        return [];
      })() : [];
      
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

  /**
   * Clean up player resources
   */
  public destroy(): void {
    console.log('🧹 PlayerManager: Cleaning up player resources...');
    
    // Clean up UI elements
    if (this.playerTitle) {
      try {
        this.playerTitle.destroy();
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying player title', e);
      }
    }
    
    if (this.playerNameText) {
      try {
        this.playerNameText.destroy();
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying player name', e);
      }
    }
    
    if (this.playerGlow) {
      try {
        this.playerGlow.destroy();
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying player glow', e);
      }
    }
    
    if (this.titleAura) {
      try {
        this.titleAura.destroy();
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying title aura', e);
      }
    }
    
    // Clean up controls
    if (this.controls) {
      try {
        // Clean up keyboard listeners
        if (this.controls.wasd) {
          Object.values(this.controls.wasd).forEach(key => {
            if (key) {
              key.removeAllListeners();
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error cleaning up controls', e);
      }
    }
    
    PlayerManager.instance = null as any;
    console.log('✅ PlayerManager: Cleanup complete');
  }
}