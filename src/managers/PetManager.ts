import Phaser from 'phaser';
import Moblin from '../objects/Moblin';
import { getPlayerTitle } from '../utils/TitleUtils';
import { saveQuiztalsToDatabase } from '../utils/Database';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';

interface PetConfig {
  spawnOffset: { x: number; y: number };
  teleportDistance: number;
  giftBoxRewardRange: { min: number; max: number };
  interactionRange: number;
}

export default class PetManager {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private networkMonitor: any;
  private moblinGiftboxSound?: Phaser.Sound.BaseSound;
  
  // Pet instance
  private moblin?: Moblin;
  
  // Configuration
  private config: PetConfig = {
    spawnOffset: { x: 50, y: 50 },
    teleportDistance: 200,
    giftBoxRewardRange: { min: 0.1, max: 0.5 },
    interactionRange: 100
  };

  private static instance: PetManager;

  private constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, networkMonitor: any) {
    this.scene = scene;
    this.player = player;
    this.networkMonitor = networkMonitor;
  }

  public static getInstance(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, networkMonitor: any): PetManager {
    if (!PetManager.instance) {
      PetManager.instance = new PetManager(scene, player, networkMonitor);
    }
    PetManager.instance.scene = scene;
    PetManager.instance.player = player;
    PetManager.instance.networkMonitor = networkMonitor;
    return PetManager.instance;
  }

  /**
   * Initialize pet system and check if player is eligible for a pet
   */
  public initializePetSystem(): void {
    console.log('🐾 PetManager: Initializing pet system...');
    
    // Initialize audio
    this.initializeAudio();
    
    // Delay pet creation to ensure all textures are loaded
    this.scene.time.delayedCall(100, () => {
      this.createPetIfEligible();
    });
  }

  /**
   * Check if player is eligible for a pet and create it
   */
  public createPetIfEligible(): void {
    console.log('🐾 PetManager: Checking pet eligibility...');
    
    // Check if a moblin already exists
    if (this.moblin) {
      console.log('ℹ️ PetManager: Moblin already exists, skipping eligibility check');
      return;
    }
    
    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) {
      console.log('ℹ️ PetManager: No NFTs found in localStorage');
      return;
    }

    try {
      const nfts = JSON.parse(nftsStr);
      const titleConfig = getPlayerTitle(nfts);

      // Only create pet if player has a title (NFT holder)
      if (titleConfig.text) {
        console.log('🎯 PetManager: Player has NFT title:', titleConfig.text);
        this.createMoblinPet();
      } else {
        console.log('ℹ️ PetManager: Player does not have NFT title, no pet spawned');
      }
    } catch (error) {
      console.error('❌ PetManager: Error checking pet eligibility:', error);
    }
  }

  /**
   * Create Moblin pet for eligible players
   */
  private createMoblinPet(): void {
    // Check if a moblin already exists
    if (this.moblin) {
      console.log('ℹ️ PetManager: Moblin already exists, skipping creation');
      return;
    }
    
    // Double-check textures are loaded
    if (!this.scene.textures.exists('moblin_idle') || !this.scene.textures.exists('moblin_walk')) {
      console.warn('⚠️ PetManager: Moblin textures not loaded, retrying...');
      
      // Retry after another delay
      this.scene.time.delayedCall(500, () => {
        this.createPetIfEligible();
      });
      return;
    }

    try {
      console.log('🐾 PetManager: Creating Moblin pet...');
      
      const spawnX = this.player.x + this.config.spawnOffset.x;
      const spawnY = this.player.y + this.config.spawnOffset.y;
      
      this.moblin = new Moblin(this.scene, spawnX, spawnY);
      this.moblin.setTarget(this.player);
      
      // Set up pet collision with NPCs (will be handled by NPCManager)
      this.setupPetCollisions();
      
      // Set up gift box interaction events
      this.setupGiftBoxEvents();
      
      console.log('✅ PetManager: Moblin pet spawned successfully!');
    } catch (error) {
      console.error('❌ PetManager: Error creating Moblin pet:', error);
    }
  }

  /**
   * Set up collision detection for the pet (to be called by NPCManager)
   */
  public setupPetCollisions(): void {
    if (!this.moblin) return;
    
    console.log('⚡ PetManager: Setting up pet collisions (to be handled by managers)...');
    // Collision setup will be handled by PhysicsManager and NPCManager
  }

  /**
   * Set up gift box interaction events
   */
  private setupGiftBoxEvents(): void {
    if (!this.moblin) return;

    this.moblin.on('giftBoxClicked', (moblin: Moblin) => {
      const distanceToMoblin = Phaser.Math.Distance.Between(
        this.player.x, 
        this.player.y, 
        moblin.x, 
        moblin.y
      );
      
      if (distanceToMoblin <= this.config.interactionRange) {
        console.log('🎁 PetManager: Gift box clicked, triggering collection');
        this.interactWithMoblin();
      } else {
        console.log('❌ PetManager: Player not close enough to moblin to collect gift boxes');
      }
    });
  }

  /**
   * Handle Moblin interaction (gift box collection)
   */
  public async handleMoblinInteraction(interactionKey: string): Promise<boolean> {
    if (interactionKey !== 'O' || !this.moblin) {
      return false;
    }

    const distanceToMoblin = Phaser.Math.Distance.Between(
      this.player.x, 
      this.player.y, 
      this.moblin.x, 
      this.moblin.y
    );

    if (distanceToMoblin <= this.config.interactionRange) {
      // Check if there are gift boxes to collect first
      if (this.moblin && this.moblin.getGiftBoxCount() <= 0) {
        console.log('❌ PetManager: No gift boxes to collect');
        // Show UI feedback to player about no gift boxes
        const gameScene = this.scene.scene.get('GameScene') as any;
        if (gameScene && gameScene.playerManager) {
          const playerManager = gameScene.playerManager;
          if (typeof playerManager.showNoGiftBoxFeedback === 'function') {
            playerManager.showNoGiftBoxFeedback();
          }
        }
        return false;
      }
      
      // Check if player has enough stamina to interact (minimum 10 points)
      const gameScene = this.scene.scene.get('GameScene') as any;
      if (gameScene && gameScene.playerManager) {
        const playerManager = gameScene.playerManager;
        const currentStamina = playerManager.getCurrentStamina();
        if (currentStamina < 10) {
          console.log('❌ PetManager: Not enough stamina to collect gift boxes (minimum 10 required)');
          // Show UI feedback to player about insufficient stamina
          if (typeof playerManager.showStaminaLowFeedback === 'function') {
            playerManager.showStaminaLowFeedback();
          }
          return false;
        }
        
        // Deduct stamina for interaction
        playerManager.deductStaminaForInteraction();
      }

      console.log('🎁 PetManager: Triggering Moblin gift box collection');
      await this.interactWithMoblin();
      return true;
    } else {
      console.log('❌ PetManager: Player not in range of Moblin');
      return false;
    }
  }

  /**
   * Process gift box collection
   */
  private async interactWithMoblin(): Promise<void> {
    // Check network connectivity before allowing interactions
    if (this.networkMonitor && typeof this.networkMonitor.getIsOnline === 'function') {
      if (!this.networkMonitor.getIsOnline()) {
        console.log('📡 PetManager: Network offline - preventing Moblin interaction');
        return;
      }
    }
    
    if (!this.moblin) {
      console.log('❌ PetManager: No moblin found');
      return;
    }

    const giftBoxCount = this.moblin.getGiftBoxCount();
    if (giftBoxCount > 0) {
      try {
        // Collect all gift boxes
        const collected = await this.moblin.collectAllGiftBoxes();
        
        // Calculate rewards
        const totalReward = this.calculateGiftBoxRewards(collected);
        
        // Process rewards
        await this.processGiftBoxRewards(totalReward);
        
        // Show UI feedback
        this.showGiftBoxCollectionFeedback(totalReward);
        
        console.log(`🎁 PetManager: Collected ${collected} gift boxes and earned ${totalReward} Quiztals!`);
      } catch (error) {
        console.error('❌ PetManager: Error collecting gift boxes:', error);
      }
    } else {
      console.log('ℹ️ PetManager: No gift boxes to collect');
    }
  }

  /**
   * Calculate reward amount for collected gift boxes
   */
  private calculateGiftBoxRewards(collected: number): number {
    let totalReward = 0;
    
    for (let i = 0; i < collected; i++) {
      totalReward += Phaser.Math.FloatBetween(
        this.config.giftBoxRewardRange.min, 
        this.config.giftBoxRewardRange.max
      );
    }
    
    return parseFloat(totalReward.toFixed(2));
  }

  /**
   * Process and save gift box rewards
   */
  private async processGiftBoxRewards(totalReward: number): Promise<void> {
    const userStr = localStorage.getItem('quiztal-player');
    if (!userStr) {
      console.warn('⚠️ PetManager: No user data found for reward processing');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.uid) {
        const playerId = user.uid;
        
        // Save to database
        await saveQuiztalsToDatabase(playerId, totalReward, 'Moblin');
        
        // Log to local session tracker
        QuiztalRewardLog.logReward('Moblin', totalReward);
        
        console.log('✅ PetManager: Rewards processed successfully');
      }
    } catch (error) {
      // Handle Firebase permissions error gracefully
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ PetManager: Insufficient permissions to save rewards, logging locally only');
        // Still log to local session tracker
        QuiztalRewardLog.logReward('Moblin', totalReward);
      } else {
        console.error('❌ PetManager: Error processing gift box rewards:', error);
      }
    }
  }

  /**
   * Show visual feedback for gift box collection
   */
  private showGiftBoxCollectionFeedback(amount: number): void {
    if (!this.moblin) return;

    // Create floating text feedback
    const feedbackText = this.scene.add.text(
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
    this.scene.tweens.add({
      targets: feedbackText,
      y: feedbackText.y - 40,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        feedbackText.destroy();
      }
    });
    
    // Play sound effect
    this.playGiftBoxSound();
  }

  /**
   * Update pet system each frame
   */
  update(): void {
    // Add safety check for moblin
    if (!this.moblin) return;

    try {
      // Update pet behavior (now properly handling async)
      this.updatePetBehavior();
      
      // Check for teleport every few seconds
      if (this.scene.time.now % 3000 < 50) { // Roughly every 3 seconds
        this.checkPetTeleport();
      }
    } catch (error) {
      console.warn('PetManager: Error during update, likely due to scene shutdown', error);
    }
  }

  /**
   * Update pet behavior (separated from async handling)
   */
  private updatePetBehavior(): void {
    // Add safety check for moblin and scene
    if (!this.moblin || !this.scene) return;
    
    // Call moblin update without awaiting (to prevent blocking)
    // The async nature of moblin.update is handled internally
    this.moblin.update().catch(error => {
      // Catch any async errors without breaking the game loop
      console.warn('PetManager: Async error in moblin update', error);
    });
  }

  /**
   * Check if pet needs to teleport to player
   */
  private checkPetTeleport(): void {
    if (!this.moblin) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.moblin.x,
      this.moblin.y
    );

    if (distanceToPlayer > this.config.teleportDistance) {
      this.moblin.teleportToTarget();
    }
  }

  /**
   * Initialize audio resources
   */
  private initializeAudio(): void {
    try {
      this.moblinGiftboxSound = this.scene.sound.add('moblin-giftbox');
      console.log('🔊 PetManager: Audio initialized successfully');
    } catch (error) {
      console.error('❌ PetManager: Error initializing audio:', error);
    }
  }

  /**
   * Play gift box collection sound
   */
  private playGiftBoxSound(): void {
    try {
      if (this.moblinGiftboxSound) {
        this.moblinGiftboxSound.play();
      }
    } catch (error) {
      console.error('❌ PetManager: Error playing gift box sound:', error);
    }
  }

  /**
   * Get pet instance (for external access)
   */
  public getPet(): Moblin | undefined {
    return this.moblin;
  }

  /**
   * Check if player has a pet
   */
  public hasPet(): boolean {
    return !!this.moblin;
  }

  /**
   * Get pet status information
   */
  public getPetStatus(): any {
    if (!this.moblin) {
      return { hasPet: false };
    }

    return {
      hasPet: true,
      position: { x: this.moblin.x, y: this.moblin.y },
      giftBoxCount: this.moblin.getGiftBoxCount(),
      distanceFromPlayer: Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.moblin.x,
        this.moblin.y
      )
    };
  }

  /**
   * Update pet configuration
   */
  public updateConfig(newConfig: Partial<PetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ PetManager: Configuration updated', this.config);
  }

  /**
   * Force recreate pet (for debugging/testing)
   */
  public recreatePet(): void {
    console.log('🔄 PetManager: Recreating pet...');
    
    if (this.moblin) {
      this.moblin.destroy();
      this.moblin = undefined;
    }
    
    this.createPetIfEligible();
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      hasPet: this.hasPet(),
      petStatus: this.getPetStatus(),
      config: this.config,
      audioLoaded: !!this.moblinGiftboxSound,
      texturesAvailable: {
        moblinIdle: this.scene.textures.exists('moblin_idle'),
        moblinWalk: this.scene.textures.exists('moblin_walk')
      }
    };
  }

  /**
   * Clean up pet resources
   */
  public destroy(): void {
    console.log('🧹 PetManager: Cleaning up pet resources...');
    
    if (this.moblin) {
      this.moblin.destroy();
      this.moblin = undefined;
    }
    
    if (this.moblinGiftboxSound) {
      this.moblinGiftboxSound.destroy();
      this.moblinGiftboxSound = undefined;
    }
    
    PetManager.instance = null as any;
    console.log('✅ PetManager: Cleanup complete');
  }
}