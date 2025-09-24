import Phaser from 'phaser';
import { showDialog } from '../utils/SimpleDialogBox';
import { QuizAntiSpamManager } from '../managers/QuizAntiSpamManager';
import { NetworkMonitor } from '../utils/NetworkMonitor';
import NPCQuizManager from '../managers/NPCQuizManager';

// Import modular managers
import AssetManager from '../managers/AssetManager';
import NPCManager from '../managers/NPCManager';
import PlayerManager from '../managers/PlayerManager';
import MobileControlsManager from '../managers/MobileControlsManager';
import PhysicsManager from '../managers/PhysicsManager';
import PetManager from '../managers/PetManager';

// Import walking NPC system
import WalkingNPCManager from '../managers/WalkingNPCManager';
// Removed unused import SamplePatrolNPC

export default class GameScene extends Phaser.Scene {
  // Core game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private selectedCharacter: string = 'lsxd';

  // Manager instances
  private assetManager!: AssetManager;
  private npcManager!: NPCManager;
  private playerManager!: PlayerManager;
  private mobileControlsManager!: MobileControlsManager;
  private physicsManager!: PhysicsManager;
  private petManager!: PetManager;
  private walkingNPCManager!: WalkingNPCManager;

  // System managers
  private quizAntiSpamManager!: QuizAntiSpamManager;
  private networkMonitor!: NetworkMonitor;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { selectedCharacter?: string }) {
    if (data?.selectedCharacter) {
      this.selectedCharacter = data.selectedCharacter;
    } else {
      // Try to get character from localStorage if not passed in data
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
  }

  preload() {
    console.log('🚀 GameScene: Starting asset loading...');
    
    // Initialize and use AssetManager for centralized asset loading
    this.assetManager = AssetManager.getInstance(this);
    this.assetManager.loadAllAssets();
    
    console.log('✅ GameScene: Asset loading delegated to AssetManager');
  }

  async create() {
    console.log('🎮 GameScene: Creating game world...');

    // 1. Set up basic scene
    await this.initializeScene();

    // 2. Initialize core systems
    await this.initializeCoreSystem();

    // 3. Create tilemap and physics world
    this.setupWorldAndPhysics();

    // 4. Initialize player
    this.initializePlayer();

    // 5. Initialize NPCs
    this.initializeNPCs();

    // 6. Initialize walking NPCs (new)
    this.initializeWalkingNPCs();

    // 7. Set up input handling
    this.setupInputHandling();

    // 8. Initialize mobile controls
    this.initializeMobileControls();

    // 9. Initialize pet system
    this.initializePetSystem();

    // 10. Create player UI (title, name, etc.)
    await this.initializePlayerUI();

    // 11. Final setup
    this.finalizeSetup();

    console.log('✅ GameScene: Game world created successfully!');
  }

  update() {
    // Delegate updates to managers
    this.playerManager?.handleMovement(this.mobileControlsManager?.getIsMobile());
    this.playerManager?.updatePlayerUI();
    this.npcManager?.updateNPCProximity();
    this.petManager?.update();
    this.walkingNPCManager?.updateWalkingNPCs();
    
    // Update mobile controls for smooth movement
    this.mobileControlsManager?.update();
  }

  // === INITIALIZATION METHODS ===

  private async initializeScene(): Promise<void> {
    console.log('🏗️ GameScene: Initializing basic scene...');
    this.scene.launch('UIScene');
    
    // Set up mobile-specific resize handling
    this.scale.on('resize', this.handleResize, this);
  }

  private async initializeCoreSystem(): Promise<void> {
    console.log('⚙️ GameScene: Initializing core systems...');

    // Initialize quiz and network systems
    const quizManager = NPCQuizManager.getInstance(this);
    await quizManager.initialize();

    this.quizAntiSpamManager = QuizAntiSpamManager.getInstance(this);
    this.networkMonitor = NetworkMonitor.getInstance(this);

    // Make managers globally accessible
    if (typeof window !== 'undefined') {
      (window as any).quizAntiSpamManager = this.quizAntiSpamManager;
      (window as any).gameScene = this;
    }
  }

  private setupWorldAndPhysics(): void {
    console.log('🌍 GameScene: Setting up world and physics...');

    // Create tilemap
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('tileset', 'tiles');
    if (!tileset) throw new Error('Tileset failed to load!');

    // Initialize PhysicsManager and set up world
    this.physicsManager = PhysicsManager.getInstance(this);
    this.physicsManager.initializePhysicsWorld(map, tileset);
  }

  private initializePlayer(): void {
    console.log('👤 GameScene: Initializing player...');

    const playerConfig = {
      selectedCharacter: this.selectedCharacter,
      startPosition: { x: 800, y: 750 },
      speed: 160
    };

    this.playerManager = PlayerManager.getInstance(this, playerConfig);
    this.player = this.playerManager.initializePlayer();

    // Set up player controls and animations
    this.playerManager.setupMovementControls();
    this.playerManager.createPlayerAnimations();

    // Set up player physics collisions
    this.physicsManager.setupPlayerCollisions(this.player);
  }

  private initializeNPCs(): void {
    console.log('🤖 GameScene: Initializing NPCs...');

    this.npcManager = NPCManager.getInstance(this, this.player);
    this.npcManager.initializeAllNPCs();
    this.npcManager.setupPhysicsColliders();
    this.npcManager.registerWithAntiSpamManager(this.quizAntiSpamManager);

    // Validate NPC setup
    const validation = this.npcManager.validateNPCs();
    if (!validation.valid) {
      console.warn('⚠️ GameScene: NPC validation issues:', validation.issues);
    }
  }

  private initializePetSystem(): void {
    console.log('🐾 GameScene: Initializing pet system...');

    this.petManager = PetManager.getInstance(this, this.player, this.networkMonitor);
    
    // Initialize the pet if the player is eligible
    this.petManager.initializePetSystem();
  }

  // Add this new method for walking NPC initialization
  private initializeWalkingNPCs(): void {
    console.log('🚶 GameScene: Initializing walking NPCs...');

    // Initialize the WalkingNPCManager
    this.walkingNPCManager = WalkingNPCManager.getInstance(this);

    // Get the MrRugPull instance from the NPCManager and register it with the WalkingNPCManager
    const mrRugPull = this.npcManager.getNPC('mrrugpull');
    if (mrRugPull) {
      this.walkingNPCManager.registerWalkingNPC(mrRugPull);
      console.log('✅ GameScene: MrRugPull registered with WalkingNPCManager');
    } else {
      console.warn('⚠️ GameScene: MrRugPull not found in NPCManager, cannot register with WalkingNPCManager');
    }

    // Get the ArtizenGent instance from the NPCManager and register it with the WalkingNPCManager
    const artizenGent = this.npcManager.getNPC('artizengent');
    if (artizenGent) {
      this.walkingNPCManager.registerWalkingNPC(artizenGent);
      console.log('✅ GameScene: ArtizenGent registered with WalkingNPCManager');
    } else {
      console.warn('⚠️ GameScene: ArtizenGent not found in NPCManager, cannot register with WalkingNPCManager');
    }

    // Get the ThirdWebGuy instance from the NPCManager and register it with the WalkingNPCManager
    const thirdWebGuy = this.npcManager.getNPC('thirdwebguy');
    if (thirdWebGuy) {
      this.walkingNPCManager.registerWalkingNPC(thirdWebGuy);
      console.log('✅ GameScene: ThirdWebGuy registered with WalkingNPCManager');
    } else {
      console.warn('⚠️ GameScene: ThirdWebGuy not found in NPCManager, cannot register with WalkingNPCManager');
    }

    // Get the AlchemyMan instance from the NPCManager and register it with the WalkingNPCManager
    const alchemyMan = this.npcManager.getNPC('alchemyman');
    if (alchemyMan) {
      this.walkingNPCManager.registerWalkingNPC(alchemyMan);
      console.log('✅ GameScene: AlchemyMan registered with WalkingNPCManager');
    } else {
      console.warn('⚠️ GameScene: AlchemyMan not found in NPCManager, cannot register with WalkingNPCManager');
    }

    console.log('✅ GameScene: Walking NPC system initialized');
  }

  private setupInputHandling(): void {
    console.log('🎮 GameScene: Setting up input handling...');

    // Set up keyboard event handlers
    this.input.keyboard?.on('keydown-C', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-c', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-O', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-o', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-G', () => this.toggleGuideBook());
    this.input.keyboard?.on('keydown-g', () => this.toggleGuideBook());

    // Set up cleanup event
    this.events.on('shutdown', this.handleSceneShutdown, this);
  }

  private initializeMobileControls(): void {
    console.log('📱 GameScene: Initializing mobile controls...');

    this.mobileControlsManager = MobileControlsManager.getInstance(
      this,
      this.playerManager,
      this.networkMonitor
    );
    this.mobileControlsManager.initializeMobileControls();
  }

  private async initializePlayerUI(): Promise<void> {
    console.log('👑 GameScene: Initializing player UI...');

    await this.playerManager.createPlayerTitle();
    await this.playerManager.createPlayerName();
  }

  private finalizeSetup(): void {
    console.log('🎯 GameScene: Finalizing setup...');

    // Validate asset loading
    const assetValidation = this.assetManager.validateAssets();
    if (!assetValidation.success) {
      console.warn('⚠️ GameScene: Asset validation issues:', assetValidation.missingAssets);
    }

    // Validate physics setup
    const physicsValidation = this.physicsManager.validatePhysicsSetup();
    if (!physicsValidation.valid) {
      console.warn('⚠️ GameScene: Physics validation issues:', physicsValidation.issues);
    }
  }

  // === INTERACTION HANDLING ===

  private handleInteraction(key: string): void {
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log(`GameScene: ${key} key press blocked - interactions are currently blocked`);
      return;
    }

    // Check network connectivity
    if (!this.checkNetworkConnectivity()) {
      return;
    }

    // Handle different interaction types
    switch (key) {
      case 'C':
        this.handleNPCInteraction();
        break;
      case 'O':
        this.handlePetInteraction();
        break;
      default:
        console.log(`GameScene: Unknown interaction key: ${key}`);
    }
  }

  private handleNPCInteraction(): void {
    const success = this.npcManager.handleNPCInteraction('C');
    if (!success) {
      console.log('GameScene: No NPC interaction available');
    }
  }

  private async handlePetInteraction(): Promise<void> {
    const success = await this.petManager.handleMoblinInteraction('O');
    if (!success) {
      console.log('GameScene: No pet interaction available');
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
      console.log('GameScene: Network offline - preventing interaction');
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
    console.log('🛑 GameScene: Shutting down...');
    
    // Clear any existing dialogs
    try {
      if (typeof showDialog === 'function') {
        // Don't call with empty array as it will cause an error
        // Instead, we just want to close any existing dialog
        // showDialog(this, []); // This was causing the error
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error clearing dialogs during shutdown', e);
    }
    
    // Clean up network monitor
    if (this.networkMonitor) {
      try {
        this.networkMonitor.destroy();
      } catch (e) {
        console.warn('⚠️ GameScene: Error destroying network monitor', e);
      }
    }
  }

  /**
   * Clean up mobile-specific resources
   */
  shutdown(): void {
    console.log('🛑 GameScene: Starting shutdown...');
    
    // Flag to prevent multiple shutdown calls
    if ((this as any)._isShuttingDown) {
      console.log('⚠️ GameScene: Shutdown already in progress, skipping...');
      return;
    }
    (this as any)._isShuttingDown = true;
    
    try {
      // Remove resize listener
      this.scale.off('resize', this.handleResize, this);
    } catch (e) {
      console.warn('⚠️ GameScene: Error removing resize listener', e);
    }
    
    try {
      // Clean up event listeners
      this.events.off('shutdown', this.handleSceneShutdown, this);
      
      // Clean up keyboard listeners
      if (this.input && this.input.keyboard) {
        this.input.keyboard.removeAllListeners();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error cleaning up event listeners', e);
    }
    
    // Stop UIScene if it's running
    try {
      if (this.scene.get('UIScene')) {
        if (this.scene.isActive('UIScene')) {
          this.scene.stop('UIScene');
        }
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error stopping UIScene', e);
    }
    
    // Clean up managers in reverse order of initialization
    try {
      if (this.mobileControlsManager) {
        this.mobileControlsManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying mobile controls manager', e);
    }
    
    try {
      if (this.petManager) {
        this.petManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying pet manager', e);
    }
    
    try {
      if (this.walkingNPCManager) {
        this.walkingNPCManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying walking NPC manager', e);
    }
    
    try {
      if (this.npcManager) {
        this.npcManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying NPC manager', e);
    }
    
    try {
      if (this.playerManager) {
        this.playerManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying player manager', e);
    }
    
    try {
      if (this.physicsManager) {
        this.physicsManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying physics manager', e);
    }
    
    try {
      if (this.assetManager) {
        this.assetManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying asset manager', e);
    }
    
    // Clean up system managers
    try {
      if (this.networkMonitor) {
        this.networkMonitor.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying network monitor', e);
    }
    
    try {
      if (this.quizAntiSpamManager) {
        this.quizAntiSpamManager.destroy();
      }
    } catch (e) {
      console.warn('⚠️ GameScene: Error destroying quiz anti-spam manager', e);
    }
    
    // Remove global references
    if (typeof window !== 'undefined') {
      try {
        delete (window as any).quizAntiSpamManager;
        delete (window as any).gameScene;
      } catch (e) {
        console.warn('⚠️ GameScene: Error removing global references', e);
      }
    }
    
    // Clear the shutdown flag
    (this as any)._isShuttingDown = false;
    
    console.log('✅ GameScene: Shutdown complete');
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
      this.scene.resume('GameScene');
    } else {
      // Open guide book if it's closed
      this.scene.launch('GuideBookScene');
      this.scene.pause('GameScene');
    }
  }

  // === PUBLIC API METHODS ===

  /**
   * Refresh NPC depths to fix rendering issues (for debugging)
   */
  public refreshNPCDepths(): void {
    if (this.npcManager) {
      this.npcManager.refreshNPCDepths();
      console.log('🔄 GameScene: NPC depths refreshed manually');
    } else {
      console.warn('⚠️ GameScene: NPCManager not initialized');
    }
  }

  /**
   * Refresh player depth to fix rendering issues (for debugging)
   */
  public refreshPlayerDepth(): void {
    if (this.playerManager) {
      this.playerManager.refreshPlayerDepth();
      console.log('🔄 GameScene: Player depth refreshed manually');
    } else {
      console.warn('⚠️ GameScene: PlayerManager not initialized');
    }
  }

  /**
   * Refresh player title depths to fix rendering issues (for debugging)
   */
  public refreshTitleDepths(): void {
    if (this.playerManager) {
      this.playerManager.refreshTitleDepths();
      console.log('🔄 GameScene: Title depths refreshed manually');
    } else {
      console.warn('⚠️ GameScene: PlayerManager not initialized');
    }
  }

  /**
   * Refresh all character depths (NPCs + Player + Titles) for debugging
   */
  public refreshAllDepths(): void {
    console.log('🔄 GameScene: Refreshing all rendering depths...');
    this.refreshPlayerDepth();
    this.refreshTitleDepths();
    this.refreshNPCDepths();
    console.log('✅ GameScene: All rendering depths refreshed');
  }

  /**
   * Get debug information about all managers
   */
  public getDebugInfo(): any {
    return {
      scene: 'GameScene',
      selectedCharacter: this.selectedCharacter,
      managers: {
        asset: this.assetManager?.areAssetsLoaded() || false,
        npc: this.npcManager?.getDebugInfo() || null,
        player: this.playerManager?.getDebugInfo() || null,
        mobileControls: this.mobileControlsManager?.getDebugInfo() || null,
        physics: this.physicsManager?.getDebugInfo() || null,
        pet: this.petManager?.getDebugInfo() || null
      },
      systems: {
        quizAntiSpam: !!this.quizAntiSpamManager,
        networkMonitor: !!this.networkMonitor
      }
    };
  }

  /**
   * Get specific manager instance (for external access)
   */
  public getManager(managerType: string): any {
    switch (managerType.toLowerCase()) {
      case 'npc': return this.npcManager;
      case 'player': return this.playerManager;
      case 'mobile': return this.mobileControlsManager;
      case 'physics': return this.physicsManager;
      case 'pet': return this.petManager;
      case 'asset': return this.assetManager;
      default: return null;
    }
  }

  /**
   * Validate all systems are working correctly
   */
  public validateSystems(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check managers exist
    if (!this.assetManager) issues.push('AssetManager not initialized');
    if (!this.npcManager) issues.push('NPCManager not initialized');
    if (!this.playerManager) issues.push('PlayerManager not initialized');
    if (!this.physicsManager) issues.push('PhysicsManager not initialized');
    if (!this.petManager) issues.push('PetManager not initialized');

    // Check core systems
    if (!this.quizAntiSpamManager) issues.push('QuizAntiSpamManager not initialized');
    if (!this.networkMonitor) issues.push('NetworkMonitor not initialized');

    // Validate individual systems
    if (this.npcManager) {
      const npcValidation = this.npcManager.validateNPCs();
      if (!npcValidation.valid) {
        issues.push(...npcValidation.issues.map(issue => `NPC: ${issue}`));
      }
    }

    if (this.physicsManager) {
      const physicsValidation = this.physicsManager.validatePhysicsSetup();
      if (!physicsValidation.valid) {
        issues.push(...physicsValidation.issues.map(issue => `Physics: ${issue}`));
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // === MOBILE SUPPORT METHODS ===

  /**
   * Handle window resize events for mobile devices
   */
  private handleResize(): void {
    console.log('📱 GameScene: Handling resize event...');
    
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
    
    // Notify other systems of resize
    // Note: PlayerManager and NPCManager don't have handleResize methods
    // but we could add them in the future if needed
    
    console.log(`📱 GameScene: Resized to ${this.scale.width}x${this.scale.height}`);
  }
}