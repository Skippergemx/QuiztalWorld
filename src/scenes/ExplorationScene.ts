import Phaser from 'phaser';
import { showDialog } from '../utils/SimpleDialogBox';
import { QuizAntiSpamManager } from '../managers/QuizAntiSpamManager';
import { NetworkMonitor } from '../utils/NetworkMonitor';
import NPCQuizManager from '../managers/NPCQuizManager';

// Import modular managers (same as GameScene)
import AssetManager from '../managers/AssetManager';
import PlayerManager from '../managers/PlayerManager';
import MobileControlsManager from '../managers/MobileControlsManager';
import PhysicsManager from '../managers/PhysicsManager';
import PetManager from '../managers/PetManager';
import WalkingNPCManager from '../managers/WalkingNPCManager';
import AudioManager from '../managers/AudioManager';
import MonsterManager from '../managers/MonsterManager';

// Import monster classes
// @ts-ignore: Used in MonsterManager
import { FieldMonster } from '../entities/FieldMonster';

export default class ExplorationScene extends Phaser.Scene {
  // Core game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private selectedCharacter: string = 'lsxd';
  private initialStamina: number = 100; // Store initial stamina value
  private initialSpeedBoostActive: boolean = false; // Store initial speed boost state
  
  // System readiness flag
  // @ts-ignore: Used in PlayerManager
  private systemsReady: boolean = false;

  // Manager instances (note: no npcManager)
  private assetManager!: AssetManager;
  private playerManager!: PlayerManager;
  private mobileControlsManager!: MobileControlsManager;
  private physicsManager!: PhysicsManager;
  private petManager!: PetManager;
  private walkingNPCManager!: WalkingNPCManager;
  private monsterManager!: MonsterManager;

  // System managers
  private quizAntiSpamManager!: QuizAntiSpamManager;
  private networkMonitor!: NetworkMonitor;
  
  // Speed boost system
  private isSpeedBoostActive: boolean = false;
  private speedBoostEndTime: number = 0;
  private speedBoostText!: Phaser.GameObjects.Text;
  private speedBoostTimerText!: Phaser.GameObjects.Text;
  


  constructor() {
    super({ key: 'ExplorationScene' });
  }

  init(data: { selectedCharacter?: string, currentStamina?: number, isSpeedBoostActive?: boolean }) {
    // Same as GameScene
    if (data?.selectedCharacter) {
      this.selectedCharacter = data.selectedCharacter;
    } else {
      const playerDataStr = localStorage.getItem("quiztal-player");
      if (playerDataStr) {
        try {
          const playerData = JSON.parse(playerDataStr);
          if (playerData.character) {
            this.selectedCharacter = playerData.character;
          }
        } catch (e) {
          console.warn("Failed to parse player data from localStorage", e);
        }
      }
    }
    
    // Store initial stamina if provided
    if (data?.currentStamina !== undefined) {
      this.initialStamina = data.currentStamina;
    }
    
    // Store initial speed boost state if provided
    if (data?.isSpeedBoostActive !== undefined) {
      this.initialSpeedBoostActive = data.isSpeedBoostActive;
    }
  }

  preload() {
    console.log('🚀 ExplorationScene: Starting asset loading...');
    
    // Initialize and use AssetManager for centralized asset loading
    this.assetManager = AssetManager.getInstance(this);
    this.assetManager.loadAllAssets();
    
    console.log('✅ ExplorationScene: Asset loading delegated to AssetManager');
  }

  async create() {
    console.log('🎮 ExplorationScene: Creating exploration world...');

    // 1. Set up basic scene
    await this.initializeScene();

    // 2. Initialize core systems
    await this.initializeCoreSystem();

    // 3. Create tilemap and physics world
    this.setupWorldAndPhysics();

    // 4. Initialize player
    await this.initializePlayer();

    // NOTE: Skipping NPC initialization

    // 5. Initialize walking NPCs (but with empty initialization)
    this.initializeWalkingNPCs();

    // 6. Set up input handling
    this.setupInputHandling();

    // 7. Initialize mobile controls
    this.initializeMobileControls();

    // 8. Initialize pet system
    this.initializePetSystem();

    // 9. Create player UI (title, name, etc.)
    await this.initializePlayerUI();

    // 10. Initialize audio system
    this.initializeAudio();

    // 11. Initialize monster system
    this.initializeMonsters();

    // 12. Final setup
    this.finalizeSetup();

    // Mark all systems as ready
    this.systemsReady = true;
    console.log('✅ ExplorationScene: All systems ready!');

    console.log('✅ ExplorationScene: Exploration world created successfully!');
  }

  update() {
    // Delegate updates to managers (note: no npcManager.updateNPCProximity())
    this.playerManager?.handleMovement(this.mobileControlsManager?.getIsMobile());
    this.playerManager?.updatePlayerUI();
    this.petManager?.update();
    this.walkingNPCManager?.updateWalkingNPCs();
    
    // Update mobile controls for smooth movement
    this.mobileControlsManager?.update();
    
    // Check if speed boost has expired
    this.checkSpeedBoostExpiration();
    
    // Update monsters
    if (this.player && this.monsterManager) {
      // Update the monster manager
      this.monsterManager.update();
      
      // In a future update, individual monster updates will be handled by the MonsterManager
      // For now, we need to access the monsters directly
      // This will be improved in a later iteration
    }
  }

  // === INITIALIZATION METHODS ===

  private async initializeScene(): Promise<void> {
    console.log('🏗️ ExplorationScene: Initializing basic scene...');
    this.scene.launch('UIScene');
    
    // Set up mobile-specific resize handling
    this.scale.on('resize', this.handleResize, this);
  }

  private async initializeCoreSystem(): Promise<void> {
    console.log('⚙️ ExplorationScene: Initializing core systems...');

    // Initialize quiz and network systems
    const quizManager = NPCQuizManager.getInstance(this);
    await quizManager.initialize();

    this.quizAntiSpamManager = QuizAntiSpamManager.getInstance(this);
    this.networkMonitor = NetworkMonitor.getInstance(this);

    // Make managers globally accessible
    if (typeof window !== 'undefined') {
      (window as any).quizAntiSpamManager = this.quizAntiSpamManager;
      (window as any).explorationScene = this;
    }
  }

  private setupWorldAndPhysics(): void {
    console.log('🌍 ExplorationScene: Setting up world and physics...');

    // Create tilemap (using field01 map and tileset)
    const map = this.make.tilemap({ key: 'map_field01' });
    const tileset = map.addTilesetImage('tileset', 'tiles_field01');
    if (!tileset) throw new Error('Field 01 tileset failed to load!');

    // Initialize PhysicsManager and set up world
    this.physicsManager = PhysicsManager.getInstance(this);
    this.physicsManager.initializePhysicsWorld(map, tileset);
  }

  private async initializePlayer(): Promise<void> {
    console.log('👤 ExplorationScene: Initializing player...');

    const playerConfig = {
      selectedCharacter: this.selectedCharacter,
      startPosition: { x: 800, y: 750 },
      speed: 160,
      initialStamina: this.initialStamina, // Pass initial stamina value
      isSpeedBoostActive: this.initialSpeedBoostActive // Pass initial speed boost state
    };

    this.playerManager = PlayerManager.getInstance(this, playerConfig);
    this.player = await this.playerManager.initializePlayer();

    // Set up player controls and animations
    this.playerManager.setupMovementControls();
    this.playerManager.createPlayerAnimations();

    // Set up player physics collisions
    this.physicsManager.setupPlayerCollisions(this.player);
    
    // Update the scene's speed boost state to match the player's state
    if (this.playerManager) {
      this.isSpeedBoostActive = this.playerManager.isSpeedBoostActiveCheck();
    }
  }

  // Empty NPC initialization (no NPCs in this world)
  /*private initializeNPCs(): void {
    console.log('🤖 ExplorationScene: Skipping NPC initialization...');
    // Intentionally left empty
  }*/

  // Empty walking NPC initialization
  private initializeWalkingNPCs(): void {
    console.log('🚶 ExplorationScene: Initializing empty walking NPC system...');
    
    // Initialize the WalkingNPCManager but don't register any NPCs
    this.walkingNPCManager = WalkingNPCManager.getInstance(this);
    
    console.log('✅ ExplorationScene: Empty walking NPC system initialized');
  }

  private initializePetSystem(): void {
    console.log('🐾 ExplorationScene: Initializing pet system...');

    this.petManager = PetManager.getInstance(this, this.player, this.networkMonitor);
    
    // Initialize the pet if the player is eligible
    this.petManager.initializePetSystem();
    
    // Add a delayed refresh to ensure pet is properly created after teleportation
    this.time.delayedCall(1500, () => {
      if (this.petManager) {
        this.petManager.refreshPet();
      }
    });
  }

  private setupInputHandling(): void {
    console.log('🎮 ExplorationScene: Setting up input handling...');

    // Set up keyboard event handlers (same as GameScene)
    this.input.keyboard?.on('keydown-C', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-c', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-O', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-o', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-G', () => this.toggleGuideBook());
    this.input.keyboard?.on('keydown-g', () => this.toggleGuideBook());
    this.input.keyboard?.on('keydown-Q', () => this.toggleSkillWindow());
    this.input.keyboard?.on('keydown-q', () => this.toggleSkillWindow());
    
    // Add N key binding for speed boost
    this.input.keyboard?.on('keydown-N', () => this.activateSpeedBoost());
    this.input.keyboard?.on('keydown-n', () => this.activateSpeedBoost());
    
    // Add T key binding for teleport back to main game
    this.input.keyboard?.on('keydown-T', () => this.teleportToMainGame());
    this.input.keyboard?.on('keydown-t', () => this.teleportToMainGame());

    // Set up cleanup event
    this.events.on('shutdown', this.handleSceneShutdown, this);
  }

  private initializeMobileControls(): void {
    console.log('📱 ExplorationScene: Initializing mobile controls...');

    this.mobileControlsManager = MobileControlsManager.getInstance(
      this,
      this.playerManager,
      this.networkMonitor
    );
    this.mobileControlsManager.initializeMobileControls();
  }

  private async initializePlayerUI(): Promise<void> {
    console.log('👑 ExplorationScene: Initializing player UI...');

    await this.playerManager.createPlayerTitle();
    await this.playerManager.createPlayerName();
    
    // Add a delayed refresh to ensure title is properly created
    this.time.delayedCall(1000, async () => {
      if (this.playerManager) {
        await this.playerManager.refreshPlayerTitle();
      }
    });
  }

  private initializeAudio(): void {
    console.log('🔊 ExplorationScene: Initializing audio system...');

    // Get the AudioManager instance
    const audioManager = AudioManager.getInstance();

    // Initialize sound effects
    audioManager.initSounds(this);

    // Set up background music
    console.log('🎵 ExplorationScene: Checking for bgm in cache...');
    if (this.cache.audio.exists('bgm')) {
        console.log('🎵 ExplorationScene: BGM found in cache, adding to sound manager');
        const bgm = this.sound.add('bgm', {
            volume: 0.5,
            loop: true
        });
        console.log('🎵 ExplorationScene: BGM loaded successfully');
        audioManager.setMusic(bgm);
        console.log('🎵 ExplorationScene: BGM set in AudioManager');
    } else {
        console.warn('⚠️ ExplorationScene: Background music not found in cache');
        // Set up to play on first interaction
        this.setupFirstInteractionAudio();
    }

    console.log('✅ ExplorationScene: Audio system initialized');
  }

  private initializeMonsters(): void {
    console.log('👾 ExplorationScene: Initializing monsters...');
    
    // Initialize MonsterManager with a maximum of 10 monsters
    this.monsterManager = MonsterManager.getInstance(this);
    this.monsterManager.initialize(10);
    
    // Set up monster collisions (this will be handled by the MonsterManager in future updates)
    // For now, we'll set up a single collision handler
    this.setupMonsterCollisions();
  }

  private setupMonsterCollisions(): void {
    // Note: In a more advanced implementation, collision handling would be done per monster
    // For now, we're keeping the existing structure but it will be updated
    console.log('👾 ExplorationScene: Setting up monster collision system');
  }

  /*private handlePlayerMonsterCollision(player: any, monster: any): void {
    console.log('💥 Player collided with monster!');
    // Handle collision effect (damage to player, knockback, etc.)
    // This would integrate with your existing player damage system
    
    // In a future update, we'll handle monster damage and removal through the MonsterManager
    // For now, we're keeping the basic structure
  }*/

  private setupFirstInteractionAudio(): void {
    console.log('🎵 ExplorationScene: Setting up first interaction audio');
    
    const playAudioOnFirstInteraction = () => {
        console.log('🎵 ExplorationScene: First interaction detected, playing audio');
        // Remove event listeners to prevent multiple triggers
        this.input.keyboard?.off('keydown');
        this.input.off('pointerdown');
    };
    
    // Set up listeners for first interaction
    this.input.keyboard?.once('keydown', playAudioOnFirstInteraction);
    this.input.once('pointerdown', playAudioOnFirstInteraction);
  }

  private finalizeSetup(): void {
    console.log('🎯 ExplorationScene: Finalizing setup...');

    // Validate asset loading
    const assetValidation = this.assetManager.validateAssets();
    if (!assetValidation.success) {
      console.warn('⚠️ ExplorationScene: Asset validation issues:', assetValidation.missingAssets);
    }

    // Validate physics setup
    const physicsValidation = this.physicsManager.validatePhysicsSetup();
    if (!physicsValidation.valid) {
      console.warn('⚠️ ExplorationScene: Physics validation issues:', physicsValidation.issues);
    }
  }

  // === INTERACTION HANDLING ===

  private handleInteraction(key: string): void {
    console.log(`🎮 ExplorationScene: Handling interaction for key: ${key}`);
    
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log(`ExplorationScene: ${key} key press blocked - interactions are currently blocked`);
      return;
    }

    // Check network connectivity
    if (!this.checkNetworkConnectivity()) {
      return;
    }

    // Handle different interaction types
    switch (key) {
      case 'C':
        console.log('🎮 ExplorationScene: Handling interaction (C key)');
        // In exploration mode, C key might trigger different actions
        this.handleExplorationInteraction();
        break;
      case 'O':
        console.log('🎮 ExplorationScene: Handling Pet interaction (O key)');
        this.handlePetInteraction();
        break;
      default:
        console.log(`ExplorationScene: Unknown interaction key: ${key}`);
    }
  }

  private handleExplorationInteraction(): void {
    // Custom interaction logic for exploration mode
    console.log('ExplorationScene: Exploration interaction triggered');
    // Add your custom exploration interaction logic here
  }

  private async handlePetInteraction(): Promise<void> {
    const success = await this.petManager.handleMoblinInteraction('O');
    if (!success) {
      console.log('ExplorationScene: No pet interaction available');
    }
  }

  // === UTILITY METHODS ===

  private isInteractionBlocked(): boolean {
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      return window.quizAntiSpamManager.isInteractionBlocked() === true;
    }
    return false;
  }

  private checkNetworkConnectivity(): boolean {
    if (!this.networkMonitor.getIsOnline()) {
      console.log('ExplorationScene: Network offline - preventing interaction');
      showDialog(this, [
        {
          text: '🚫 Network connection lost! Please check your internet connection to continue playing.',
          isExitDialog: true
        }
      ]);
      return false;
    }
    return true;
  }

  private handleSceneShutdown(): void {
    console.log('🛑 ExplorationScene: Shutting down...');
    
    // Stop all audio
    try {
      const audioManager = AudioManager.getInstance();
      audioManager.stopAllAudio();
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error stopping audio during shutdown', e);
    }
    
    // Clear any existing dialogs
    try {
      // Don't call with empty array as it will cause an error
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error clearing dialogs during shutdown', e);
    }
    
    // Clean up network monitor
    if (this.networkMonitor) {
      try {
        this.networkMonitor.destroy();
      } catch (e) {
        console.warn('⚠️ ExplorationScene: Error destroying network monitor', e);
      }
    }
  }

  /**
   * Clean up mobile-specific resources
   */
  shutdown(): void {
    console.log('🛑 ExplorationScene: Starting shutdown...');
    
    // Flag to prevent multiple shutdown calls
    if ((this as any)._isShuttingDown) {
      console.log('⚠️ ExplorationScene: Shutdown already in progress, skipping...');
      return;
    }
    (this as any)._isShuttingDown = true;
    
    try {
      // Remove resize listener
      this.scale.off('resize', this.handleResize, this);
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error removing resize listener', e);
    }
    
    try {
      // Clean up event listeners
      this.events.off('shutdown', this.handleSceneShutdown, this);
      
      // Clean up keyboard listeners
      if (this.input && this.input.keyboard) {
        this.input.keyboard.removeAllListeners();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error cleaning up event listeners', e);
    }
    
    // Stop UIScene if it's running
    try {
      if (this.scene.get('UIScene')) {
        if (this.scene.isActive('UIScene')) {
          this.scene.stop('UIScene');
        }
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error stopping UIScene', e);
    }
    
    // Clean up managers in reverse order of initialization
    try {
      if (this.mobileControlsManager) {
        this.mobileControlsManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying mobile controls manager', e);
    }
    
    try {
      if (this.petManager) {
        this.petManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying pet manager', e);
    }
    
    try {
      if (this.walkingNPCManager) {
        this.walkingNPCManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying walking NPC manager', e);
    }
    
    try {
      if (this.playerManager) {
        this.playerManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying player manager', e);
    }
    
    try {
      if (this.physicsManager) {
        this.physicsManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying physics manager', e);
    }
    
    try {
      if (this.assetManager) {
        this.assetManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying asset manager', e);
    }
    
    // Clean up monsters
    try {
      if (this.monsterManager) {
        this.monsterManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying monster manager', e);
    }
    
    // Clean up audio
    try {
      const audioManager = AudioManager.getInstance();
      audioManager.destroy();
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying audio manager', e);
    }
    
    // Clean up system managers
    try {
      if (this.networkMonitor) {
        this.networkMonitor.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying network monitor', e);
    }
    
    try {
      if (this.quizAntiSpamManager) {
        this.quizAntiSpamManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error destroying quiz anti-spam manager', e);
    }
    
    // Remove global references
    if (typeof window !== 'undefined') {
      try {
        delete (window as any).quizAntiSpamManager;
        delete (window as any).explorationScene;
      } catch (e) {
        console.warn('⚠️ ExplorationScene: Error removing global references', e);
      }
    }
    
    // Clear the shutdown flag
    (this as any)._isShuttingDown = false;
    
    console.log('✅ ExplorationScene: Shutdown complete');
  }

  /**
   * Toggle the guide book scene
   */
  private toggleGuideBook(): void {
    // Check if GuideBookScene is active
    const isGuideBookOpen = this.scene.isActive('GuideBookScene');

    if (isGuideBookOpen) {
      // Close guide book if it's open
      this.scene.stop('GuideBookScene');
      this.scene.resume('ExplorationScene');
    } else {
      // Open guide book if it's closed
      this.scene.launch('GuideBookScene');
      this.scene.pause('ExplorationScene');
    }
  }

  /**
   * Open or close the skill window
   */
  private toggleSkillWindow(): void {
    // Check if SkillWindowScene is active
    const isSkillWindowOpen = this.scene.isActive('SkillWindowScene');

    if (isSkillWindowOpen) {
      // Close skill window if it's open
      this.scene.stop('SkillWindowScene');
      this.scene.resume('ExplorationScene');
    } else {
      // Open skill window if it's closed
      this.scene.launch('SkillWindowScene', {
        onClose: () => this.scene.resume('ExplorationScene')
      });
      this.scene.pause('ExplorationScene');
    }
  }

  // === MOBILE SUPPORT METHODS ===

  /**
   * Handle window resize events for mobile devices
   */
  private handleResize(): void {
    console.log('📱 ExplorationScene: Handling resize event...');
    
    // Update mobile controls layout
    if (this.mobileControlsManager) {
      this.mobileControlsManager.handleResize();
    }
    
    // Update camera bounds if needed
    if (this.cameras.main) {
      this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
      
      // Adjust camera zoom for better fit on different screen sizes
      const aspectRatio = this.scale.width / this.scale.height;
      if (aspectRatio > 1.5) {
        // Landscape mode - zoom out slightly
        this.cameras.main.setZoom(0.9);
      } else {
        // Portrait mode - normal zoom
        this.cameras.main.setZoom(1);
      }
    }
    
    console.log(`📱 ExplorationScene: Resized to ${this.scale.width}x${this.scale.height}`);
  }

  // Add speed boost activation method
  private activateSpeedBoost(): void {
    console.log('N key pressed - activating speed boost');
    
    // Check if player has enough stamina for speed boost (minimum 10 stamina)
    if (this.playerManager && this.playerManager.getCurrentStamina() < 10) {
      console.log('Not enough stamina for speed boost');
      return;
    }
    
    // If speed boost is already active, do nothing
    if (this.isSpeedBoostActive) {
      console.log('Speed boost already active');
      return;
    }
    
    // Activate speed boost for 30 seconds
    this.isSpeedBoostActive = true;
    this.speedBoostEndTime = this.time.now + 30000; // 30 seconds
    
    // Activate speed boost in PlayerManager
    if (this.playerManager) {
      this.playerManager.activateSpeedBoost();
    }
    
    // Show visual feedback
    this.showSpeedBoostFeedback();
    
    console.log('Speed boost activated for 30 seconds');
  }

  // Check if speed boost has expired
  private checkSpeedBoostExpiration(): void {
    if (this.isSpeedBoostActive && this.time.now > this.speedBoostEndTime) {
      this.deactivateSpeedBoost();
    }
  }

  // Deactivate speed boost
  private deactivateSpeedBoost(): void {
    this.isSpeedBoostActive = false;
    this.speedBoostEndTime = 0;
    
    // Deactivate speed boost in PlayerManager
    if (this.playerManager) {
      this.playerManager.deactivateSpeedBoost();
    }
    
    // Hide visual feedback
    if (this.speedBoostText) {
      this.speedBoostText.setVisible(false);
    }
    if (this.speedBoostTimerText) {
      this.speedBoostTimerText.setVisible(false);
    }
    
    console.log('Speed boost deactivated');
  }

  // Show visual feedback for speed boost
  private showSpeedBoostFeedback(): void {
    // Create or update speed boost text
    if (!this.speedBoostText) {
      this.speedBoostText = this.add.text(
        this.scale.width / 2,
        50,
        '⚡ SPEED BOOST ACTIVATED! 2x Speed ⚡',
        {
          fontSize: '24px',
          color: '#FFD700',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: { x: 15, y: 10 },
          align: 'center',
          stroke: '#000000',
          strokeThickness: 3
        }
      ).setOrigin(0.5)
       .setDepth(1000);
    } else {
      this.speedBoostText.setVisible(true);
    }
    
    // Create or update timer text
    if (!this.speedBoostTimerText) {
      this.speedBoostTimerText = this.add.text(
        this.scale.width / 2,
        90,
        '30s remaining',
        {
          fontSize: '20px',
          color: '#00FF00',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: { x: 10, y: 5 },
          align: 'center'
        }
      ).setOrigin(0.5)
       .setDepth(1000);
    } else {
      this.speedBoostTimerText.setVisible(true);
    }
    
    // Update timer every second
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isSpeedBoostActive) {
          const remainingTime = Math.ceil((this.speedBoostEndTime - this.time.now) / 1000);
          if (this.speedBoostTimerText) {
            this.speedBoostTimerText.setText(`${remainingTime}s remaining`);
            
            // Change color as time runs out
            if (remainingTime <= 10) {
              this.speedBoostTimerText.setColor('#FF0000');
            } else if (remainingTime <= 20) {
              this.speedBoostTimerText.setColor('#FFFF00');
            }
          }
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Add animation to main text
    this.tweens.add({
      targets: this.speedBoostText,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add a visual effect to the player
    if (this.playerManager) {
      const player = this.playerManager.getPlayer();
      if (player) {
        // Create a glowing effect
        const glow = this.add.graphics();
        glow.fillStyle(0xFFD700, 0.3);
        glow.fillCircle(0, 0, 30);
        glow.setPosition(player.x, player.y);
        glow.setDepth(player.depth - 1);
        
        // Animate the glow
        this.tweens.add({
          targets: glow,
          alpha: 0,
          scale: 2,
          duration: 1000,
          repeat: -1,
          yoyo: true
        });
        
        // Update glow position with player
        this.events.on('postupdate', () => {
          if (player.active && this.isSpeedBoostActive) {
            glow.setPosition(player.x, player.y);
          } else {
            glow.destroy();
          }
        });
      }
    }
    
    // Auto-hide after 30 seconds
    this.time.delayedCall(30000, () => {
      if (this.speedBoostText) {
        this.speedBoostText.setVisible(false);
      }
      if (this.speedBoostTimerText) {
        this.speedBoostTimerText.setVisible(false);
      }
    });
  }

  // Add method to teleport back to main game
  private teleportToMainGame(): void {
    console.log('🎮 ExplorationScene: Teleporting back to main game...');
    
    // Stop all audio before teleporting to prevent duplication
    try {
      const audioManager = AudioManager.getInstance();
      audioManager.stopAllAudio();
    } catch (e) {
      console.warn('⚠️ ExplorationScene: Error stopping audio before teleport', e);
    }
    
    // Get current stamina and speed boost state to pass to the new scene
    let currentStamina = 100; // Default value
    let isSpeedBoostActive = false; // Default value
    if (this.playerManager) {
      currentStamina = this.playerManager.getCurrentStamina();
      isSpeedBoostActive = this.playerManager.isSpeedBoostActiveCheck();
      // Save current stamina before teleporting
      this.playerManager.saveStaminaData();
    }
    
    // Transition to GameScene with current stamina and speed boost state
    this.scene.start('GameScene', {
      selectedCharacter: this.selectedCharacter,
      currentStamina: currentStamina,
      isSpeedBoostActive: isSpeedBoostActive
    });
  }

  // Add method to teleport to different field maps (for future expansion)
  /*private teleportToFieldMap(mapId: string = 'field01'): void {
    console.log(`🎮 ExplorationScene: Teleporting to ${mapId}...`);
    
    // Get current stamina and speed boost state to pass to the new scene
    let currentStamina = 100; // Default value
    let isSpeedBoostActive = false; // Default value
    if (this.playerManager) {
      currentStamina = this.playerManager.getCurrentStamina();
      isSpeedBoostActive = this.playerManager.isSpeedBoostActiveCheck();
      // Save current stamina before teleporting
      this.playerManager.saveStaminaData();
    }
    
    // For now, we only have field01, so we'll just reload the current scene
    // In the future, we could load different field maps based on the mapId
    this.scene.restart({
      selectedCharacter: this.selectedCharacter,
      currentStamina: currentStamina,
      isSpeedBoostActive: isSpeedBoostActive
    });
  }*/
}