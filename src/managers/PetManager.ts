import Phaser from 'phaser';
import Moblin from '../objects/Moblin';
import Spmech from '../objects/Spmech';
import BasePet from '../objects/BasePet';
import { getPlayerTitle } from '../utils/TitleUtils';
import { saveQuiztalsToDatabase } from '../utils/Database';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';

interface PetConfig {
  spawnOffset: { x: number; y: number };
  teleportDistance: number;
  giftBoxRewardRange: { min: number; max: number };
  interactionRange: number;
}

// Pet types
type PetType = 'moblin' | 'spmech01';

export default class PetManager {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;

  private moblinGiftboxSound?: Phaser.Sound.BaseSound;
  
  // Pet instance
  private pet?: BasePet;
  
  // Current pet type
  private currentPetType: PetType = 'moblin';
  
  // Configuration
  private config: PetConfig = {
    spawnOffset: { x: 50, y: 50 },
    teleportDistance: 200,
    giftBoxRewardRange: { min: 0.1, max: 0.5 },
    interactionRange: 100
  };

  private static instance: PetManager;

  private constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    
    // Load the current pet preference from localStorage
    this.loadPetPreference();
  }

  public static getInstance(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite): PetManager {
    if (!PetManager.instance) {
      PetManager.instance = new PetManager(scene, player);
    }
    return PetManager.instance;
  }

  /**
   * Load pet preference from localStorage
   */
  private loadPetPreference(): void {
    try {
      const petPref = localStorage.getItem('niftdood-pet-preference');
      if (petPref) {
        const petType = petPref as PetType;
        if (petType === 'moblin' || petType === 'spmech01') {
          this.currentPetType = petType;
        }
      }
    } catch (e) {
      console.warn('Could not load pet preference from localStorage', e);
    }
  }

  /**
   * Save pet preference to localStorage
   */
  private savePetPreference(): void {
    try {
      localStorage.setItem('niftdood-pet-preference', this.currentPetType);
    } catch (e) {
      console.warn('Could not save pet preference to localStorage', e);
    }
  }

  /**
   * Wait for textures to load and then create pet
   */
  private waitForTexturesAndCreatePet(retryCount: number = 0): void {
    // Check if required textures are loaded
    const texturesLoaded = this.arePetTexturesLoaded();
    
    if (!texturesLoaded) {
      if (retryCount < 5) { // Max 5 retries
        console.warn(`⚠️ PetManager: Textures not loaded, retrying (${retryCount + 1}/5)...`);
        this.scene.time.delayedCall(200, () => {
          this.waitForTexturesAndCreatePet(retryCount + 1);
        });
      } else {
        console.error('❌ PetManager: Textures not loaded after 5 retries, skipping pet creation');
        // Try one more time with a longer delay
        this.scene.time.delayedCall(1000, () => {
          this.createPetIfEligible();
        });
      }
    } else {
      this.createPetIfEligible();
    }
  }

  /**
   * Check if pet textures are loaded
   */
  private arePetTexturesLoaded(): boolean {
    // Check textures based on current pet type
    if (this.currentPetType === 'moblin') {
      return this.scene.textures.exists('moblin_idle') && this.scene.textures.exists('moblin_walk');
    } else if (this.currentPetType === 'spmech01') {
      return this.scene.textures.exists('spmech01_idle') && this.scene.textures.exists('spmech01_walk');
    }
    return false;
  }

  /**
   * Check if player is eligible for a pet and create it
   */
  public createPetIfEligible(): void {
    console.log('🐾 PetManager: Checking pet eligibility...');
    
    // Check if a pet already exists
    if (this.pet) {
      console.log('ℹ️ PetManager: Pet already exists, skipping eligibility check');
      return;
    }
    
    const nftsStr = localStorage.getItem('niftdood-nfts');
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
        this.createPet();
      } else {
        console.log('ℹ️ PetManager: Player does not have NFT title, no pet spawned');
      }
    } catch (error) {
      console.error('❌ PetManager: Error checking pet eligibility:', error);
    }
  }

  /**
   * Create pet based on current preference
   */
  private createPet(retryCount: number = 0): void {
    // Check if a pet already exists
    if (this.pet) {
      console.log('ℹ️ PetManager: Pet already exists, skipping creation');
      return;
    }
    
    // Double-check textures are loaded
    if (!this.arePetTexturesLoaded()) {
      // If textures are not loaded, retry with exponential backoff
      if (retryCount < 5) { // Max 5 retries
        const delay = Math.pow(2, retryCount) * 200; // Exponential backoff: 200, 400, 800, 1600, 3200 ms
        console.warn(`⚠️ PetManager: Pet textures not loaded, retrying in ${delay}ms (${retryCount + 1}/5)...`);
        
        this.scene.time.delayedCall(delay, () => {
          this.createPet(retryCount + 1);
        });
      } else {
        console.error('❌ PetManager: Pet textures not loaded after 5 retries, skipping pet creation');
      }
      return;
    }

    try {
      console.log(`🐾 PetManager: Creating ${this.currentPetType} pet...`);
      
      const spawnX = this.player.x + this.config.spawnOffset.x;
      const spawnY = this.player.y + this.config.spawnOffset.y;
      
      // Create pet based on current preference
      if (this.currentPetType === 'moblin') {
        this.pet = new Moblin(this.scene, spawnX, spawnY);
      } else if (this.currentPetType === 'spmech01') {
        this.pet = new Spmech(this.scene, spawnX, spawnY);
      }
      
      if (this.pet) {
        this.pet.setTarget(this.player);
        
        // Set up pet collision with NPCs (will be handled by NPCManager)
        this.setupPetCollisions();
        
        // Set up gift box interaction events
        this.setupGiftBoxEvents();
        
        console.log(`✅ PetManager: ${this.currentPetType} pet spawned successfully!`);
      }
    } catch (error) {
      // If there's an error creating the pet, retry with exponential backoff
      if (retryCount < 3) { // Max 3 retries for errors
        const delay = Math.pow(2, retryCount) * 300; // Exponential backoff: 300, 600, 1200 ms
        console.warn(`⚠️ PetManager: Error creating ${this.currentPetType} pet, retrying in ${delay}ms (${retryCount + 1}/3)...`, error);
        
        this.scene.time.delayedCall(delay, () => {
          this.createPet(retryCount + 1);
        });
      } else {
        console.error(`❌ PetManager: Error creating ${this.currentPetType} pet after 3 retries:`, error);
      }
    }
  }

  /**
   * Set up collision detection for the pet (to be called by NPCManager)
   */
  public setupPetCollisions(): void {
    if (!this.pet) return;
    
    console.log('⚡ PetManager: Setting up pet collisions (to be handled by managers)...');
    // Collision setup will be handled by PhysicsManager and NPCManager
  }

  /**
   * Set up gift box interaction events
   */
  private setupGiftBoxEvents(): void {
    if (!this.pet) return;

    // Listen for gift box click events
    (this.pet as any).on('giftBoxClicked', (pet: BasePet) => {
      const distanceToPet = Phaser.Math.Distance.Between(
        this.player.x, 
        this.player.y, 
        pet.x, 
        pet.y
      );
      
      if (distanceToPet <= this.config.interactionRange) {
        console.log('🎁 PetManager: Gift box clicked, triggering collection');
        this.interactWithPet();
      } else {
        console.log('❌ PetManager: Player not close enough to pet to collect gift boxes');
      }
    });
  }

  /**
   * Handle pet interaction (gift box collection)
   */
  public async handlePetInteraction(interactionKey: string): Promise<boolean> {
    if (interactionKey !== 'O' || !this.pet) {
      return false;
    }

    const distanceToPet = Phaser.Math.Distance.Between(
      this.player.x, 
      this.player.y, 
      this.pet.x, 
      this.pet.y
    );

    if (distanceToPet <= this.config.interactionRange) {
      // Check if there are gift boxes to collect first
      if (this.pet && this.pet.getGiftBoxCount() <= 0) {
        console.log('❌ PetManager: No gift boxes to collect');
        // Show UI feedback to player about no gift boxes
        // Fix: Safely access the playerManager from the scene
        let playerManager = null;
        if (this.scene && (this.scene as any).playerManager) {
          playerManager = (this.scene as any).playerManager;
        }
        
        if (playerManager && typeof playerManager.showNoGiftBoxFeedback === 'function') {
          playerManager.showNoGiftBoxFeedback();
        }
        return false;
      }
      
      // Check if player has enough stamina to interact (minimum 10 points)
      // Fix: Safely access the playerManager from the scene
      let playerManager = null;
      if (this.scene && (this.scene as any).playerManager) {
        playerManager = (this.scene as any).playerManager;
      }
      
      if (playerManager) {
        const currentStamina = playerManager.getCurrentStamina();
        if (currentStamina < 10) {
          console.log('❌ PetManager: Not enough stamina to interact with pet');
          // Show UI feedback to player about insufficient stamina
          if (typeof playerManager.showInsufficientStaminaFeedback === 'function') {
            playerManager.showInsufficientStaminaFeedback(10);
          }
          return false;
        }
      }

      try {
        // Collect all gift boxes
        const collected = await this.pet.collectAllGiftBoxes();
        
        // Calculate rewards
        const totalReward = this.calculateGiftBoxRewards(collected);
        
        // Process rewards
        await this.processGiftBoxRewards(totalReward);
        
        // Show UI feedback
        this.showGiftBoxCollectionFeedback(totalReward);
        
        console.log(`🎁 PetManager: Collected ${collected} gift boxes and earned ${totalReward} Niftdoods!`);
        return true;
      } catch (error) {
        console.error('❌ PetManager: Error collecting gift boxes:', error);
        return false;
      }
    } else {
      console.log('❌ PetManager: Player not close enough to pet');
      return false;
    }
  }

  /**
   * Interact with pet (called from gift box click)
   */
  private async interactWithPet(): Promise<void> {
    // This is now handled by handlePetInteraction
    await this.handlePetInteraction('O');
  }

  /**
   * Calculate reward amount for collected gift boxes
   */
  private calculateGiftBoxRewards(collected: number): number {
    let totalReward = 0;
    
    for (let i = 0; i < collected; i++) {
      const reward = Phaser.Math.FloatBetween(
        this.config.giftBoxRewardRange.min,
        this.config.giftBoxRewardRange.max
      );
      totalReward += reward;
    }
    
    // Round to 2 decimal places
    return Math.round(totalReward * 100) / 100;
  }

  /**
   * Process gift box rewards
   */
  private async processGiftBoxRewards(amount: number): Promise<void> {
    if (amount <= 0) return;
    
    try {
      // Get player ID
      let playerId = '';
      try {
        const userDataStr = localStorage.getItem('niftdood-player');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          playerId = user.uid || '';
        }
      } catch (e) {
        console.warn('Could not parse user from localStorage', e);
      }
      
      if (playerId) {
        // Save reward to database
        await saveQuiztalsToDatabase(playerId, amount, 'MoblinPet');
        
        // Log reward
        QuiztalRewardLog.logReward('PetGiftBox', amount);
        
        // Update player balance (if playerManager is available)
        let playerManager = null;
        if (this.scene && (this.scene as any).playerManager) {
          playerManager = (this.scene as any).playerManager;
        }
        
        if (playerManager && typeof playerManager.addQuiztals === 'function') {
          playerManager.addQuiztals(amount);
        }
      }
    } catch (error) {
      console.error('❌ PetManager: Error processing gift box rewards:', error);
    }
  }

  /**
   * Show gift box collection feedback
   */
  private showGiftBoxCollectionFeedback(amount: number): void {
    if (!this.pet) return;
    
    // Create floating text feedback
    const feedbackText = this.scene.add.text(
      this.pet.x,
      this.pet.y - 50,
      `+${amount} Niftdoods!`,
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
    // Add safety check for pet
    if (!this.pet) return;

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
    // Add safety check for pet and scene
    if (!this.pet || !this.scene) return;
    
    // Call pet update without awaiting (to prevent blocking)
    // The async nature of pet.update is handled internally
    this.pet.update().catch(error => {
      // Catch any async errors without breaking the game loop
      console.warn('PetManager: Async error in pet update', error);
    });
  }

  /**
   * Check if pet needs to teleport to player
   */
  private checkPetTeleport(): void {
    if (!this.pet) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.pet.x,
      this.pet.y
    );

    if (distanceToPlayer > this.config.teleportDistance) {
      this.pet.teleportToTarget();
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
  public getPet(): BasePet | undefined {
    return this.pet;
  }

  /**
   * Check if player has a pet
   */
  public hasPet(): boolean {
    return !!this.pet;
  }

  /**
   * Get pet status information
   */
  public getPetStatus(): any {
    if (!this.pet) {
      return { hasPet: false };
    }

    return {
      hasPet: true,
      type: this.currentPetType,
      position: { x: this.pet.x, y: this.pet.y },
      giftBoxCount: this.pet.getGiftBoxCount(),
      distanceFromPlayer: Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.pet.x,
        this.pet.y
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
    
    if (this.pet) {
      this.pet.destroy();
      this.pet = undefined;
    }
    
    this.createPetIfEligible();
  }

  /**
   * Refresh pet after teleportation
   */
  public refreshPet(): void {
    console.log('🔄 PetManager: Refreshing pet after teleportation...');
    
    // Destroy existing pet if it exists
    if (this.pet) {
      try {
        this.pet.destroy();
        this.pet = undefined;
      } catch (e) {
        console.warn('⚠️ PetManager: Error destroying existing pet', e);
      }
    }
    
    // Wait a bit for scene to stabilize, then recreate pet
    this.scene.time.delayedCall(300, () => {
      this.waitForTexturesAndCreatePet();
    });
  }

  /**
   * Switch to a different pet type
   */
  public switchPet(petType: PetType): void {
    console.log(`🔄 PetManager: Switching pet to ${petType}...`);
    
    // Update current pet type
    this.currentPetType = petType;
    
    // Save preference
    this.savePetPreference();
    
    // Recreate pet with new type
    if (this.pet) {
      this.pet.destroy();
      this.pet = undefined;
    }
    
    this.createPetIfEligible();
  }

  /**
   * Get available pet types
   */
  public getAvailablePetTypes(): PetType[] {
    return ['moblin', 'spmech01'];
  }

  /**
   * Get current pet type
   */
  public getCurrentPetType(): PetType {
    return this.currentPetType;
  }

  /**
   * Show pet selection UI
   */
  public showPetSelectionUI(): void {
    console.log('🎨 PetManager: Showing pet selection UI...');
    
    // Get available pet types
    const petTypes = this.getAvailablePetTypes();
    console.log('🐾 PetManager: Available pet types:', petTypes);
    
    // Check if there are any pet types available
    if (petTypes.length === 0) {
      console.warn('⚠️ PetManager: No pet types available for selection');
      return;
    }
    
    // Create a modal dialog for pet selection
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    // Create background overlay
    const overlay = this.scene.add.rectangle(
      0, 0,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.7
    ).setOrigin(0.5);
    
    // Create dialog container
    const dialog = this.scene.add.container(centerX, centerY);
    
    // Create dialog background
    const windowWidth = 600;
    const windowHeight = 400;
    
    const windowBorder = this.scene.add.rectangle(
      0, 0,
      windowWidth, windowHeight,
      0x34495e
    ).setStrokeStyle(3, 0x3498db);
    
    const windowInner = this.scene.add.rectangle(
      0, 0,
      windowWidth - 10, windowHeight - 10,
      0x2c3e50
    );
    
    // Create header
    const headerY = -170;
    const headerBg = this.scene.add.rectangle(
      0, headerY,
      windowWidth - 10, 50,
      0x3498db,
      0.2
    );
    
    const title = this.scene.add.text(
      0, headerY,
      'Choose Your Pet',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Create close button
    const closeBtn = this.scene.add.container(270, headerY);
    const closeBtnBg = this.scene.add.circle(0, 0, 15, 0xe74c3c);
    const closeBtnText = this.scene.add.text(
      0, 0,
      '✖',
      {
        fontSize: '12px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    closeBtn.add([closeBtnBg, closeBtnText]);
    closeBtn.setInteractive(
      new Phaser.Geom.Circle(0, 0, 15),
      Phaser.Geom.Circle.Contains
    );
    
    closeBtn
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        closeBtnBg.setFillStyle(0xc0392b);
      })
      .on('pointerout', () => {
        closeBtnBg.setFillStyle(0xe74c3c);
      })
      .on('pointerdown', () => this.closePetSelectionUI(overlay, dialog));
    
    // Create pet options
    const startY = -80; // Position buttons in the visible area
    const spacing = 120;
    
    petTypes.forEach((petType, index) => {
      const y = startY + index * spacing;
      
      // Create pet container
      const petContainer = this.scene.add.container(0, y);
      
      // Create background for pet option
      const petBg = this.scene.add.rectangle(
        0, 0,
        400, 100,
        this.currentPetType === petType ? 0xf1c40f : 0x34495e
      ).setStrokeStyle(2, 0x3498db);
      
      // Create pet preview using idle animation sprite
      let petSprite: Phaser.GameObjects.Sprite | null = null;
      let petTextureKey = '';
      
      if (petType === 'moblin') {
        petTextureKey = 'moblin_idle';
      } else if (petType === 'spmech01') {
        petTextureKey = 'spmech01_idle';
      }
      
      if (petTextureKey && this.scene.textures.exists(petTextureKey)) {
        petSprite = this.scene.add.sprite(-150, 0, petTextureKey);
        petSprite.setFrame(0); // Show first frame
        petSprite.setScale(1.5); // Scale up for better visibility
      }
      
      // Pet name
      const petName = this.scene.add.text(
        0, 0,
        petType.charAt(0).toUpperCase() + petType.slice(1),
        {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      
      // Add visual indicator for current pet
      let currentIndicator: Phaser.GameObjects.Text | null = null;
      if (this.currentPetType === petType) {
        currentIndicator = this.scene.add.text(150, 0, '✓ Selected', {
          fontSize: '14px',
          color: '#f1c40f',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }
      
      // Add elements to container
      const elements: Phaser.GameObjects.GameObject[] = [petBg, petName];
      if (petSprite) {
        elements.push(petSprite);
      }
      if (currentIndicator) {
        elements.push(currentIndicator);
      }
      petContainer.add(elements);
      
      // Make container interactive
      petBg.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          console.log(`🐾 PetManager: Selected pet type: ${petType}`);
          this.switchPet(petType);
          
          // Close the dialog
          this.closePetSelectionUI(overlay, dialog);
        })
        .on('pointerover', () => {
          petBg.setFillStyle(0xf1c40f);
        })
        .on('pointerout', () => {
          petBg.setFillStyle(this.currentPetType === petType ? 0xf1c40f : 0x34495e);
        });
      
      dialog.add(petContainer);
    });
    
    dialog.add([
      overlay,
      windowBorder,
      windowInner,
      headerBg,
      title,
      closeBtn
    ]);
    
    // Set depth to ensure it's on top
    dialog.setDepth(1000);
    overlay.setDepth(999);
    
    // Add subtle entrance animation
    dialog.setScale(0.8);
    dialog.setAlpha(0);
    this.scene.tweens.add({
      targets: dialog,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Add click handler to overlay to close dialog
    overlay.setInteractive()
      .on('pointerdown', () => {
        this.closePetSelectionUI(overlay, dialog);
      });
  }

  /**
   * Close pet selection UI
   */
  private closePetSelectionUI(overlay: Phaser.GameObjects.Rectangle, dialog: Phaser.GameObjects.Container): void {
    overlay.destroy();
    dialog.destroy();
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
        moblinWalk: this.scene.textures.exists('moblin_walk'),
        spmech01Idle: this.scene.textures.exists('spmech01_idle'),
        spmech01Walk: this.scene.textures.exists('spmech01_walk')
      }
    };
  }

  /**
   * Clean up pet resources
   */
  public destroy(): void {
    console.log('🧹 PetManager: Cleaning up pet resources...');
    
    if (this.pet) {
      this.pet.destroy();
      this.pet = undefined;
    }
    
    if (this.moblinGiftboxSound) {
      this.moblinGiftboxSound.destroy();
      this.moblinGiftboxSound = undefined;
    }
    
    PetManager.instance = null as any;
    console.log('✅ PetManager: Cleanup complete');
  }
}