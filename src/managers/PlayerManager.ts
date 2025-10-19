import Phaser from 'phaser';
import { getPlayerTitle } from '../utils/TitleUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { savePlayerStaminaData, loadPlayerStaminaData } from '../utils/Database';

interface PlayerConfig {
  selectedCharacter: string;
  startPosition: { x: number; y: number };
  speed: number;
  initialStamina?: number; // Add initial stamina parameter
  isSpeedBoostActive?: boolean; // Add speed boost state parameter
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
  
  // Reference to GameScene for checking system readiness
  private gameScene: any;
  
  // Speed boost system
  private isSpeedBoostActive: boolean = false;
  private baseSpeed: number = 160;
  
  // Stamina system
  private maxStamina: number = 100;
  private currentStamina: number = 100;
  private staminaRegenRate: number = 1; // 1 point per 3-second interval
  private staminaDrainRate: number = 2; // Points per second while walking
  private staminaRegenDelay: number = 3000; // Delay before regen starts (3 seconds)
  private staminaRegenTimer: Phaser.Time.TimerEvent | null = null;
  private staminaSaveTimer: Phaser.Time.TimerEvent | null = null; // Timer to save stamina to Firestore
  
  // UI Elements
  private playerTitle?: Phaser.GameObjects.Text;
  private titleAura?: Phaser.GameObjects.Group;
  private playerNameText?: Phaser.GameObjects.Text;
  private playerGlow?: Phaser.GameObjects.Sprite;
  private staminaBar?: Phaser.GameObjects.Graphics;
  private staminaText?: Phaser.GameObjects.Text;
  private staminaLowText?: Phaser.GameObjects.Text;

  private static instance: PlayerManager;

  private constructor(scene: Phaser.Scene, config: PlayerConfig) {
    this.scene = scene;
    this.config = config;
    this.baseSpeed = config.speed; // Initialize base speed from config
    // Store reference to GameScene
    this.gameScene = scene;
    
    // Set initial stamina if provided
    if (config.initialStamina !== undefined) {
      this.currentStamina = config.initialStamina;
    }
    
    // Set speed boost state if provided
    if (config.isSpeedBoostActive !== undefined) {
      this.isSpeedBoostActive = config.isSpeedBoostActive;
    }
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
  public async initializePlayer(): Promise<Phaser.Physics.Arcade.Sprite> {
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
    
    // Load stamina data from Firestore only if no initial stamina is provided
    if (this.config.initialStamina === undefined) {
      await this.loadStaminaData();
    } else {
      // Use the initial stamina value and update the display
      this.currentStamina = this.config.initialStamina;
      this.updateStaminaBar();
      console.log(`✅ PlayerManager: Using initial stamina value: ${this.currentStamina}`);
    }
    
    // Set speed boost state if provided
    if (this.config.isSpeedBoostActive !== undefined) {
      this.isSpeedBoostActive = this.config.isSpeedBoostActive;
      console.log(`✅ PlayerManager: Using initial speed boost state: ${this.isSpeedBoostActive}`);
    }
    
    // Create stamina bar UI
    this.createStaminaBar();
    
    // Start the stamina save timer
    this.startStaminaSaveTimer();
    
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
    
    // Check if all systems are ready before allowing movement
    if (this.gameScene && !this.gameScene.systemsReady) {
      // Systems not ready - prevent movement but keep player idle animation
      this.player.setVelocity(0, 0);
      this.player.play(`idle-${this.lastDirection}`, true);
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
      
      // Check if player can move based on stamina before calculating speed
      const canMove = this.canMove();
      
      // Calculate base speed with stamina reduction
      let currentSpeed = this.baseSpeed;
      
      // Apply stamina-based speed reduction based on exact specifications:
      // 50-100% stamina: Normal speed
      // 25-50% stamina: 50% speed (half speed)
      // 0-25% stamina: 25% speed (quarter speed)
      // 0% stamina: Player unable to move
      const staminaPercent = this.currentStamina / this.maxStamina;
      if (staminaPercent <= 0) {
        // Player cannot move when stamina is depleted
        currentSpeed = 0;
      } else if (staminaPercent <= 0.25) {
        // 25% speed when stamina is 0-25%
        currentSpeed *= 0.25;
      } else if (staminaPercent <= 0.5) {
        // 50% speed when stamina is 25-50%
        currentSpeed *= 0.5;
      }
      // Full speed when stamina is above 50%
      
      // Apply speed boost if active (doubles the current speed)
      if (this.isSpeedBoostActive) {
        currentSpeed *= 2;
      }

      // Handle arrow keys
      if (cursors) {
        if (cursors.left?.isDown) velocityX = -currentSpeed;
        if (cursors.right?.isDown) velocityX = currentSpeed;
        if (cursors.up?.isDown) velocityY = -currentSpeed;
        if (cursors.down?.isDown) velocityY = currentSpeed;
      }

      // Handle WASD keys (override arrow keys if both are pressed)
      if (wasd) {
        if (wasd.left?.isDown) velocityX = -currentSpeed;
        if (wasd.right?.isDown) velocityX = currentSpeed;
        if (wasd.up?.isDown) velocityY = -currentSpeed;
        if (wasd.down?.isDown) velocityY = currentSpeed;
      }

      // Apply velocity only if player can move
      if (canMove) {
        this.player.setVelocity(velocityX, velocityY);
      }

      // Handle stamina - drain if player is trying to move, regen if idle
      // Even if player can't move, we still need to handle the regeneration logic
      if (velocityX !== 0 || velocityY !== 0) {
        // Player is trying to move - drain stamina if they can move
        if (canMove) {
          this.drainStamina();
        }
        
        // Cancel regen timer if it exists
        if (this.staminaRegenTimer) {
          this.staminaRegenTimer.remove();
          this.staminaRegenTimer = null;
        }
      } else {
        // Player is idle - start regen timer if not already running
        if (!this.staminaRegenTimer) {
          this.staminaRegenTimer = this.scene.time.delayedCall(this.staminaRegenDelay, () => {
            this.startStaminaRegen();
            this.staminaRegenTimer = null;
          });
        }
      }

      // Determine direction and play appropriate animation
      if (canMove && (velocityX !== 0 || velocityY !== 0)) {
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

  // Add method to activate speed boost
  public activateSpeedBoost(): void {
    if (this.currentStamina > 10) { // Need minimum stamina to activate
      this.isSpeedBoostActive = true;
      console.log('PlayerManager: Speed boost activated');
    } else {
      console.log('PlayerManager: Not enough stamina for speed boost');
    }
  }

  // Add method to deactivate speed boost
  public deactivateSpeedBoost(): void {
    this.isSpeedBoostActive = false;
    console.log('PlayerManager: Speed boost deactivated');
  }

  // Add method to check if speed boost is active
  public isSpeedBoostActiveCheck(): boolean {
    return this.isSpeedBoostActive;
  }
  
  // Add method to check if speed boost should be active based on speed
  public shouldSpeedBoostBeActive(): boolean {
    // Speed boost is active when current speed is double the base speed
    return this.config.speed > this.baseSpeed * 1.5; // Using 1.5 as a threshold to account for floating point precision
  }
  
  // Add method to set player speed (for external control)
  public setPlayerSpeed(speed: number): void {
    this.config.speed = speed;
    // Update the speed boost active flag based on the new speed
    this.isSpeedBoostActive = this.shouldSpeedBoostBeActive();
  }

  // Add method to get current player speed
  public getPlayerSpeed(): number {
    return this.config.speed;
  }

  // Add method to get base speed
  public getBaseSpeed(): number {
    return this.baseSpeed;
  }

  // Add method to set base speed
  public setBaseSpeed(speed: number): void {
    this.baseSpeed = speed;
  }

  // === STAMINA SYSTEM METHODS ===

  /**
   * Update the visual stamina bar display
   */
  private updateStaminaBar(): void {
    if (!this.staminaBar || !this.staminaText) return;
    
    const width = 50;
    const height = 8;
    const x = -width / 2; // Center the bar horizontally
    const y = -height / 2; // Center the bar vertically
    
    // Clear previous fill
    this.staminaBar.clear();
    
    // Background
    this.staminaBar.fillStyle(0x333333, 0.8);
    this.staminaBar.fillRoundedRect(x, y, width, height, 3);
    
    // Stamina fill - change color based on stamina level
    let fillColor: number;
    const staminaPercent = this.currentStamina / this.maxStamina;
    
    if (staminaPercent > 0.5) {
      fillColor = 0x00ff00; // Green
    } else if (staminaPercent > 0.25) {
      fillColor = 0xffff00; // Yellow
    } else {
      fillColor = 0xff0000; // Red
    }
    
    const fillWidth = Math.max(0, (this.currentStamina / this.maxStamina) * (width - 2));
    this.staminaBar.fillStyle(fillColor, 0.8);
    this.staminaBar.fillRoundedRect(x + 1, y + 1, fillWidth, height - 2, 2);
    
    // Border
    this.staminaBar.lineStyle(1, 0xffffff, 1);
    this.staminaBar.strokeRoundedRect(x, y, width, height, 3);
    
    // Update text
    this.staminaText.setText(`${Math.floor(this.currentStamina)}/${this.maxStamina}`);
  }

  /**
   * Drain stamina while player is moving
   */
  private drainStamina(): void {
    // Higher drain rate when speed boost is active
    const drainRate = this.isSpeedBoostActive ? this.staminaDrainRate * 2 : this.staminaDrainRate;
    const drainAmount = drainRate * (1/60); // Assuming 60 FPS
    
    this.currentStamina = Math.max(0, this.currentStamina - drainAmount);
    this.updateStaminaBar();
    
    // Save stamina data when it changes significantly
    if (this.currentStamina % 10 === 0) { // Save every 10 points
      this.saveStaminaData();
    }
  }

  /**
   * Start regenerating stamina when player is idle
   */
  private startStaminaRegen(): void {
    if (this.currentStamina >= this.maxStamina) return;
    
    // Add 1 point every 3 seconds
    this.currentStamina = Math.min(this.maxStamina, this.currentStamina + this.staminaRegenRate);
    this.updateStaminaBar();
    
    // Save stamina data when it changes significantly
    if (this.currentStamina % 10 === 0) { // Save every 10 points
      this.saveStaminaData();
    }
  }

  /**
   * Deduct stamina for NPC interaction
   */
  public deductStaminaForInteraction(): void {
    this.currentStamina = Math.max(0, this.currentStamina - 10);
    this.updateStaminaBar();
    
    // Save stamina data after interaction
    this.saveStaminaData();
    
    // Cancel regen timer and restart
    if (this.staminaRegenTimer) {
      this.staminaRegenTimer.remove();
      this.staminaRegenTimer = null;
    }
    
    this.staminaRegenTimer = this.scene.time.delayedCall(this.staminaRegenDelay, () => {
      this.startStaminaRegen();
      this.staminaRegenTimer = null;
    });
  }

  /**
   * Get current stamina value
   */
  public getCurrentStamina(): number {
    return this.currentStamina;
  }

  /**
   * Get maximum stamina value
   */
  public getMaxStamina(): number {
    return this.maxStamina;
  }

  /**
   * Check if stamina is depleted
   */
  public isStaminaDepleted(): boolean {
    return this.currentStamina <= 0;
  }

  /**
   * Check if player can move (has enough stamina)
   */
  public canMove(): boolean {
    // Player cannot move when stamina is completely depleted (0%)
    // Player can only move again when stamina recovers to at least 25% (25 points)
    if (this.currentStamina <= 0) {
      return this.currentStamina >= 25;
    }
    return true;
  }

  /**
   * Create the stamina bar UI display
   */
  public createStaminaBar(): void {
    // Create stamina bar as a graphics object positioned under the player
    this.staminaBar = this.scene.add.graphics();
    this.staminaBar.setPosition(this.player.x, this.player.y + 45); // Position under the player
    this.staminaBar.setDepth(100); // Same depth as other player UI elements
    
    // Create stamina text with black outline like player name
    this.staminaText = this.scene.add.text(this.player.x, this.player.y + 49, 
      `${Math.floor(this.currentStamina)}/${this.maxStamina}`, {
        fontSize: '8px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(101);
      
    // Create stamina low text (initially hidden)
    this.staminaLowText = this.scene.add.text(this.player.x, this.player.y + 57,
      'Stamina Low to Interact', {
        fontSize: '10px', // Increased from 8px to 10px
        color: '#ff0000', // Red color
        fontStyle: 'bold',
        stroke: '#ffffff', // Changed from dark red to white
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setVisible(false); // Initially hidden
      
    this.updateStaminaBar();
  }

  /**
   * Create player title display for NFT holders
   */
  public async createPlayerTitle(retryCount: number = 0): Promise<void> {
    console.log('👑 PlayerManager: Creating player title...');
    
    // Check if player title already exists
    if (this.playerTitle) {
      console.log('ℹ️ PlayerManager: Player title already exists, skipping creation');
      return;
    }
    
    // Check for player-glow texture
    if (!this.scene.textures.exists('player-glow')) {
      // If texture doesn't exist, retry after a short delay (up to 3 times)
      if (retryCount < 3) {
        console.warn(`⚠️ PlayerManager: player-glow texture not found, retrying (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.createPlayerTitle(retryCount + 1);
      } else {
        console.error('❌ PlayerManager: player-glow texture not found after 3 retries!');
        return;
      }
    }

    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) {
      // If NFT data is not available, retry after a short delay (up to 3 times)
      if (retryCount < 3) {
        console.warn(`⚠️ PlayerManager: No NFTs found, retrying (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.createPlayerTitle(retryCount + 1);
      } else {
        console.log('ℹ️ PlayerManager: No NFTs found after 3 retries, skipping title creation');
        return;
      }
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
      // If parsing fails, retry after a short delay (up to 3 times)
      if (retryCount < 3) {
        console.warn(`⚠️ PlayerManager: Error parsing NFT data, retrying (${retryCount + 1}/3)...`, error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.createPlayerTitle(retryCount + 1);
      } else {
        console.error('❌ PlayerManager: Error creating player title after 3 retries:', error);
      }
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
    // Check if all systems are ready before updating UI
    if (this.gameScene && !this.gameScene.systemsReady) {
      return;
    }
    
    if (!this.player || !this.scene) return;

    // Update title and aura positions
    if (this.playerTitle && this.titleAura) {
      const baseY = this.player.y - 40 + Math.sin(this.scene.time.now / 1500) * 2;
      this.playerTitle.setPosition(this.player.x, baseY);
      
      // Add comprehensive safety check to ensure titleAura is still valid
      try {
        // Check if titleAura exists and is still active in the scene
        if (this.titleAura && typeof this.titleAura.getChildren === 'function') {
          // Additional check to ensure the group is still valid
          if (this.titleAura.scene && this.titleAura.scene.children) {
            const children = this.titleAura.getChildren();
            if (Array.isArray(children)) {
              children.forEach(aura => {
                if (aura && (aura as Phaser.GameObjects.Text).setPosition) {
                  (aura as Phaser.GameObjects.Text).setPosition(this.player.x, baseY);
                }
              });
            }
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

    // Update stamina bar position (positioned directly under the player, like the glow)
    if (this.staminaBar && this.player) {
      this.staminaBar.setPosition(this.player.x, this.player.y + 45);
    }
    if (this.staminaText && this.player) {
      this.staminaText.setPosition(this.player.x, this.player.y + 49);
    }
    // Update stamina low text position
    if (this.staminaLowText && this.player) {
      this.staminaLowText.setPosition(this.player.x, this.player.y + 57);
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
   * Load player stamina data from Firestore
   */
  public async loadStaminaData(): Promise<void> {
    const userStr = localStorage.getItem('quiztal-player');
    if (!userStr) {
      console.log('ℹ️ PlayerManager: No user data found for stamina loading');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (!user?.uid) {
        console.warn('⚠️ PlayerManager: No user UID found for stamina loading');
        return;
      }

      // Load stamina data from Firestore
      const staminaData = await loadPlayerStaminaData(user.uid);
      
      if (staminaData) {
        // Check if the saved stamina data is recent (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (staminaData.lastUpdated > oneHourAgo) {
          this.currentStamina = Math.max(0, Math.min(this.maxStamina, staminaData.currentStamina));
          console.log(`✅ PlayerManager: Loaded stamina data: ${this.currentStamina}`);
        } else {
          console.log('ℹ️ PlayerManager: Stamina data is too old, using default values');
        }
      } else {
        console.log('ℹ️ PlayerManager: No stamina data found, using default values');
      }
      
      // Update the stamina bar display
      this.updateStaminaBar();
    } catch (error) {
      console.error('❌ PlayerManager: Error loading stamina data:', error);
    }
  }

  /**
   * Save player stamina data to Firestore
   */
  public async saveStaminaData(): Promise<void> {
    // Don't save if stamina is at maximum (to reduce unnecessary writes)
    if (this.currentStamina >= this.maxStamina) {
      return;
    }

    const userStr = localStorage.getItem('quiztal-player');
    if (!userStr) {
      console.log('ℹ️ PlayerManager: No user data found for stamina saving');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (!user?.uid) {
        console.warn('⚠️ PlayerManager: No user UID found for stamina saving');
        return;
      }

      // Save stamina data to Firestore
      await savePlayerStaminaData(user.uid, {
        currentStamina: this.currentStamina,
        lastUpdated: Date.now()
      });
      
      console.log(`✅ PlayerManager: Saved stamina data: ${this.currentStamina}`);
    } catch (error) {
      console.error('❌ PlayerManager: Error saving stamina data:', error);
    }
  }

  /**
   * Start the stamina save timer
   */
  private startStaminaSaveTimer(): void {
    // Clear existing timer if it exists
    if (this.staminaSaveTimer) {
      this.staminaSaveTimer.remove();
      this.staminaSaveTimer = null;
    }
    
    // Save stamina every 30 seconds
    this.staminaSaveTimer = this.scene.time.delayedCall(30000, () => {
      this.saveStaminaData();
      // Restart the timer
      this.startStaminaSaveTimer();
    });
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
        // Additional check to ensure the group is still valid
        if (typeof this.titleAura.getChildren === 'function' && this.titleAura.scene && this.titleAura.scene.children) {
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
   * Manually refresh player title - useful for fixing title rendering issues during teleportation
   */
  public async refreshPlayerTitle(): Promise<void> {
    console.log('🔄 PlayerManager: Manually refreshing player title...');
    
    // Clean up existing title elements if they exist
    if (this.playerTitle) {
      try {
        this.playerTitle.destroy();
        this.playerTitle = undefined;
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying existing player title', e);
      }
    }
    
    if (this.playerGlow) {
      try {
        this.playerGlow.destroy();
        this.playerGlow = undefined;
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying existing player glow', e);
      }
    }
    
    if (this.titleAura) {
      try {
        this.titleAura.destroy();
        this.titleAura = undefined;
      } catch (e) {
        console.warn('⚠️ PlayerManager: Error destroying existing title aura', e);
      }
    }
    
    // Recreate player title
    await this.createPlayerTitle();
    
    console.log('✅ PlayerManager: Player title refreshed');
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
   * Set player velocity with stamina checks for mobile controls
   */
  public setPlayerVelocityWithStamina(velocityX: number, velocityY: number): void {
    if (!this.player) return;
    
    // Check if all systems are ready before allowing movement
    if (this.gameScene && !this.gameScene.systemsReady) {
      // Systems not ready - prevent movement but keep player idle
      this.player.setVelocity(0, 0);
      this.player.play(`idle-${this.lastDirection}`, true);
      return;
    }
    
    // Check if player can move based on stamina
    const canMove = this.canMove();
    
    // Calculate base speed with stamina reduction
    let currentSpeed = this.baseSpeed;
    
    // Apply stamina-based speed reduction based on exact specifications:
    // 50-100% stamina: Normal speed
    // 25-50% stamina: 50% speed (half speed)
    // 0-25% stamina: 25% speed (quarter speed)
    // 0% stamina: Player unable to move
    const staminaPercent = this.currentStamina / this.maxStamina;
    if (staminaPercent <= 0) {
      // Player cannot move when stamina is depleted
      currentSpeed = 0;
    } else if (staminaPercent <= 0.25) {
      // 25% speed when stamina is 0-25%
      currentSpeed *= 0.25;
    } else if (staminaPercent <= 0.5) {
      // 50% speed when stamina is 25-50%
      currentSpeed *= 0.5;
    }
    // Full speed when stamina is above 50%
    
    // Apply speed boost if active (doubles the current speed)
    if (this.isSpeedBoostActive) {
      currentSpeed *= 2;
    }
    
    // Normalize the velocity vector
    const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (velocityMagnitude > 0) {
      velocityX = (velocityX / velocityMagnitude) * currentSpeed;
      velocityY = (velocityY / velocityMagnitude) * currentSpeed;
    }
    
    // Handle stamina - drain if player is trying to move, regen if idle
    // Even if player can't move, we still need to handle the regeneration logic
    if (velocityX !== 0 || velocityY !== 0) {
      // Player is trying to move - drain stamina if they can move
      if (canMove) {
        this.player.setVelocity(velocityX, velocityY);
        this.drainStamina();
      }
      
      // Cancel regen timer if it exists
      if (this.staminaRegenTimer) {
        this.staminaRegenTimer.remove();
        this.staminaRegenTimer = null;
      }
      
      // Determine direction and play appropriate animation
      if (Math.abs(velocityX) > Math.abs(velocityY)) {
        // Horizontal movement
        this.lastDirection = velocityX > 0 ? 'right' : 'left';
      } else if (Math.abs(velocityY) > Math.abs(velocityX)) {
        // Vertical movement
        this.lastDirection = velocityY > 0 ? 'down' : 'up';
      }
      this.player.play(`walk-${this.lastDirection}`, true);
    } else {
      // Player is idle - set velocity to zero
      this.player.setVelocity(0, 0);
      this.player.play(`idle-${this.lastDirection}`, true);
      
      // Player is idle - start regen timer if not already running
      if (!this.staminaRegenTimer) {
        this.staminaRegenTimer = this.scene.time.delayedCall(this.staminaRegenDelay, () => {
          this.startStaminaRegen();
          this.staminaRegenTimer = null;
        });
      }
    }
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
    // Check if player glow already exists
    if (this.playerGlow) {
      console.log('ℹ️ PlayerManager: Player glow already exists, skipping creation');
      return;
    }
    
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
    // Check if player aura already exists
    if (this.titleAura) {
      console.log('ℹ️ PlayerManager: Player aura already exists, skipping creation');
      return;
    }
    
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
    // Check if player title text already exists
    if (this.playerTitle) {
      console.log('ℹ️ PlayerManager: Player title text already exists, skipping creation');
      return;
    }
    
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
   * Show "Stamina Low" visual feedback
   */
  public showStaminaLowFeedback(): void {
    if (!this.staminaLowText) return;
    
    // Show the text
    this.staminaLowText.setVisible(true);
    
    // Flash animation
    this.scene.tweens.add({
      targets: this.staminaLowText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // Hide after animation completes
        this.staminaLowText?.setVisible(false);
        // Reset alpha
        if (this.staminaLowText) {
          this.staminaLowText.alpha = 1;
        }
      }
    });
  }

  /**
   * Show "No Gift Box to Collect" visual feedback
   */
  public showNoGiftBoxFeedback(): void {
    if (!this.staminaLowText) return;
    
    // Temporarily change text properties for "No Gift Box to Collect" message
    this.staminaLowText.setText('No Gift Box to Collect');
    this.staminaLowText.setStyle({
      fontSize: '10px',
      color: '#0000ff', // Blue color
      fontStyle: 'bold',
      stroke: '#ffffff', // White border
      strokeThickness: 2
    });
    
    // Show the text
    this.staminaLowText.setVisible(true);
    
    // Flash animation
    this.scene.tweens.add({
      targets: this.staminaLowText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // Hide after animation completes
        this.staminaLowText?.setVisible(false);
        // Reset text and style for next "Stamina Low" message
        if (this.staminaLowText) {
          this.staminaLowText.setText('Stamina Low to Interact');
          this.staminaLowText.setStyle({
            fontSize: '10px',
            color: '#ff0000', // Red color
            fontStyle: 'bold',
            stroke: '#ffffff', // White border
            strokeThickness: 2
          });
          // Reset alpha
          this.staminaLowText.alpha = 1;
        }
      }
    });
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    const auraDepths = this.titleAura ? 
      (() => {
        try {
          // Additional check to ensure the group is still valid
          if (typeof this.titleAura.getChildren === 'function' && this.titleAura.scene && this.titleAura.scene.children) {
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
        this.titleAura = undefined; // Clear the reference after destruction
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