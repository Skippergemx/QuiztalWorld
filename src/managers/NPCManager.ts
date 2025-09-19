import Phaser from 'phaser';
import HuntBoy from '../objects/HuntBoy';
import MintGirl from '../objects/MintGirl';
import BaseSage from '../objects/BaseSage';
import MrGemx from '../objects/MrGemx';
import SecurityKai from '../objects/SecurityKai';
import WalletSafetyFriend from '../objects/WalletSafetyFriend';
import DexpertGal from '../objects/DexpertGal';
import NftCyn from '../objects/NftCyn';
import ProfChain from '../objects/ProfChain';
import SmartContractGuy from '../objects/SmartContractGuy';
import MrRugPull from '../objects/MrRugPull'; // Add MrRugPull import

interface NPCConfig {
  id: string;
  name: string;
  class: new (scene: Phaser.Scene, x: number, y: number) => any;
  position: { x: number; y: number };
  interactionRange: number;
}

interface NPCInstance {
  id: string;
  npc: any;
  config: NPCConfig;
}

export default class NPCManager {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private npcs: Map<string, NPCInstance> = new Map();
  private static instance: NPCManager;

  private npcConfigs: NPCConfig[] = [
    {
      id: 'huntboy',
      name: 'Hunt Boy', 
      class: HuntBoy,
      position: { x: 500, y: 1100 },
      interactionRange: 100
    },
    {
      id: 'mintgirl',
      name: 'Mint Girl',
      class: MintGirl, 
      position: { x: 1050, y: 1100 },
      interactionRange: 100
    },
    {
      id: 'basesage',
      name: 'Base Sage',
      class: BaseSage,
      position: { x: 1100, y: 500 },
      interactionRange: 100
    },
    {
      id: 'mrgemx',
      name: 'Mr. Gemx',
      class: MrGemx,
      position: { x: 500, y: 480 },
      interactionRange: 100
    },
    {
      id: 'securitykai',
      name: 'Security Kai',
      class: SecurityKai,
      position: { x: 700, y: 200 },
      interactionRange: 100
    },
    {
      id: 'walletsafetyfriend',
      name: 'Wallet Safety Friend',
      class: WalletSafetyFriend,
      position: { x: 1050, y: 1250 },
      interactionRange: 100
    },
    {
      id: 'dexpertgal',
      name: 'Dexpert Gal',
      class: DexpertGal,
      position: { x: 500, y: 1250 },
      interactionRange: 100
    },
    {
      id: 'nftcyn',
      name: 'NFT Cyn',
      class: NftCyn,
      position: { x: 900, y: 200 },
      interactionRange: 100
    },
    {
      id: 'profchain',
      name: 'Prof Chain',
      class: ProfChain,
      position: { x: 150, y: 1100 },
      interactionRange: 100
    },
    {
      id: 'smartcontractguy',
      name: 'Smart Contract Guy',
      class: SmartContractGuy,
      position: { x: 1450, y: 1100 },
      interactionRange: 100
    },
    {
      id: 'mrrugpull',
      name: 'Mr. Rug Pull',
      class: MrRugPull,
      position: { x: 500, y: 200 }, // Updated position as requested
      interactionRange: 100
    }
  ];

  private constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
  }

  public static getInstance(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite): NPCManager {
    if (!NPCManager.instance) {
      NPCManager.instance = new NPCManager(scene, player);
    }
    NPCManager.instance.scene = scene;
    NPCManager.instance.player = player;
    return NPCManager.instance;
  }

  /**
   * Initialize and instantiate all NPCs
   */
  public initializeAllNPCs(): void {
    console.log('🤖 NPCManager: Initializing all NPCs...');
    
    this.npcConfigs.forEach(config => {
      try {
        // Instantiate the NPC using its class constructor
        const npcInstance = new config.class(this.scene, config.position.x, config.position.y);
        
        // Store the NPC instance
        this.npcs.set(config.id, {
          id: config.id,
          npc: npcInstance,
          config: config
        });

        console.log(`✅ NPCManager: Created ${config.name} at (${config.position.x}, ${config.position.y})`);
      } catch (error) {
        console.error(`❌ NPCManager: Failed to create ${config.name}:`, error);
      }
    });

    // Set proper depths for NPCs to render above map elements
    this.setNPCDepths();
    
    // Add a delayed call to ensure depth setting takes effect after NPC initialization
    this.scene.time.delayedCall(100, () => {
      this.setNPCDepths();
      console.log('🎨 NPCManager: Applied delayed depth setting for reliable rendering');
    });

    console.log(`🤖 NPCManager: Successfully initialized ${this.npcs.size} NPCs`);
  }

  /**
   * Set proper depth values for all NPCs to ensure they render above map elements
   */
  public setNPCDepths(): void {
    console.log('🎨 NPCManager: Setting NPC depths for proper rendering...');
    
    // Map layers use depths 0-4, so NPCs should be at depth 10+ to be above everything
    const NPC_DEPTH = 10;
    let successCount = 0;
    let errorCount = 0;
    
    this.npcs.forEach((npcInstance) => {
      try {
        if (npcInstance.npc && typeof npcInstance.npc.setDepth === 'function') {
          // Get current depth before setting
          const currentDepth = npcInstance.npc.depth || 0;
          
          // Set the new depth
          npcInstance.npc.setDepth(NPC_DEPTH);
          
          // Verify the depth was set correctly
          const newDepth = npcInstance.npc.depth || 0;
          
          if (newDepth === NPC_DEPTH) {
            console.log(`✅ NPCManager: ${npcInstance.config.name} depth: ${currentDepth} → ${newDepth}`);
            successCount++;
          } else {
            console.warn(`⚠️ NPCManager: ${npcInstance.config.name} depth setting failed: expected ${NPC_DEPTH}, got ${newDepth}`);
            errorCount++;
          }
        } else {
          console.warn(`⚠️ NPCManager: ${npcInstance.config.name} does not have setDepth method`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ NPCManager: Error setting depth for ${npcInstance.config.name}:`, error);
        errorCount++;
      }
    });
    
    console.log(`✅ NPCManager: NPC depths configured - ${successCount} successful, ${errorCount} errors`);
    
    // Also ensure name labels and shout text have proper depth
    this.setNPCUIDepths();
  }

  /**
   * Set proper depth values for NPC UI elements (name labels, shout text, cooldown timers)
   */
  private setNPCUIDepths(): void {
    const NPC_UI_DEPTH = 15; // Higher than NPCs to ensure UI is always visible
    const COOLDOWN_TIMER_DEPTH = 20; // Higher than UI for maximum visibility
    
    this.npcs.forEach((npcInstance) => {
      try {
        // Set depth for name label if it exists
        if (npcInstance.npc.nameLabel && typeof npcInstance.npc.nameLabel.setDepth === 'function') {
          npcInstance.npc.nameLabel.setDepth(NPC_UI_DEPTH);
        }
        
        // Set depth for shout text if it exists
        if (npcInstance.npc.shoutOutText && typeof npcInstance.npc.shoutOutText.setDepth === 'function') {
          npcInstance.npc.shoutOutText.setDepth(NPC_UI_DEPTH);
        }
        
        // Set depth for cooldown indicator if it exists
        if (npcInstance.npc.cooldownIndicator && typeof npcInstance.npc.cooldownIndicator.setDepth === 'function') {
          npcInstance.npc.cooldownIndicator.setDepth(COOLDOWN_TIMER_DEPTH);
          console.log(`✅ NPCManager: Set cooldown timer depth ${COOLDOWN_TIMER_DEPTH} for ${npcInstance.config.name}`);
        }
      } catch (error) {
        console.error(`❌ NPCManager: Error setting UI depth for ${npcInstance.config.name}:`, error);
      }
    });
    
    console.log('✅ NPCManager: NPC UI depths configured (names, shouts, cooldown timers)');
  }

  /**
   * Set up physics colliders for all NPCs with the player
   */
  public setupPhysicsColliders(): void {
    console.log('⚡ NPCManager: Setting up physics colliders...');
    
    this.npcs.forEach((npcInstance) => {
      try {
        this.scene.physics.add.collider(this.player, npcInstance.npc);
        console.log(`✅ NPCManager: Added collider for ${npcInstance.config.name}`);
      } catch (error) {
        console.error(`❌ NPCManager: Failed to add collider for ${npcInstance.config.name}:`, error);
      }
    });
  }

  /**
   * Handle NPC interactions based on player proximity
   */
  public handleNPCInteraction(interactionKey: string): boolean {
    if (interactionKey !== 'C') {
      return false; // Only handle 'C' key interactions for NPCs
    }

    // Find the closest NPC within interaction range
    let closestNPC: NPCInstance | undefined;
    let closestDistance = Infinity;

    this.npcs.forEach((npcInstance) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, 
        this.player.y, 
        npcInstance.npc.x, 
        npcInstance.npc.y
      );

      if (distance <= npcInstance.config.interactionRange && distance < closestDistance) {
        closestDistance = distance;
        closestNPC = npcInstance;
      }
    });

    if (closestNPC) {
      console.log(`🎯 NPCManager: Triggering interaction with ${closestNPC.config.name}`);
      
      // Call the NPC's interact method
      if (closestNPC.npc && typeof closestNPC.npc.interact === 'function') {
        closestNPC.npc.interact();
        return true;
      } else {
        console.error(`❌ NPCManager: ${closestNPC.config.name} does not have interact method`);
      }
    } else {
      console.log('❌ NPCManager: Player not in range of any NPC');
    }

    return false;
  }

  /**
   * Update NPC proximity checks (for cooldown timers, etc.)
   */
  public updateNPCProximity(): void {
    this.npcs.forEach((npcInstance) => {
      try {
        // Check if NPC has cooldown functionality
        if (typeof npcInstance.npc.getIsOnCooldown === 'function' && 
            typeof npcInstance.npc.isPlayerInRange === 'function' &&
            typeof npcInstance.npc.showHeadTimer === 'function' &&
            typeof npcInstance.npc.hideHeadTimer === 'function') {
          
          if (npcInstance.npc.getIsOnCooldown()) {
            if (npcInstance.npc.isPlayerInRange(this.player)) {
              npcInstance.npc.showHeadTimer();
            } else {
              npcInstance.npc.hideHeadTimer();
            }
          }
        }
      } catch (error) {
        console.error(`❌ NPCManager: Error updating proximity for ${npcInstance.config.name}:`, error);
      }
    });
  }

  /**
   * Manually refresh NPC depths - useful for fixing rendering issues
   */
  public refreshNPCDepths(): void {
    console.log('🔄 NPCManager: Manually refreshing NPC depths...');
    this.setNPCDepths();
  }

  /**
   * Get NPC instance by ID
   */
  public getNPC(npcId: string): any | null {
    const npcInstance = this.npcs.get(npcId);
    return npcInstance ? npcInstance.npc : null;
  }

  /**
   * Get all NPC instances
   */
  public getAllNPCs(): Map<string, any> {
    const npcMap = new Map();
    this.npcs.forEach((npcInstance, id) => {
      npcMap.set(id, npcInstance.npc);
    });
    return npcMap;
  }

  /**
   * Get NPC positions for debugging or other purposes
   */
  public getNPCPositions(): { [key: string]: { x: number; y: number } } {
    const positions: { [key: string]: { x: number; y: number } } = {};
    
    this.npcs.forEach((npcInstance, id) => {
      positions[id] = {
        x: npcInstance.npc.x,
        y: npcInstance.npc.y
      };
    });

    return positions;
  }

  /**
   * Calculate distances from player to all NPCs
   */
  public getPlayerDistancesToNPCs(): { [key: string]: number } {
    const distances: { [key: string]: number } = {};

    this.npcs.forEach((npcInstance, id) => {
      distances[id] = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npcInstance.npc.x,
        npcInstance.npc.y
      );
    });

    return distances;
  }

  /**
   * Get NPCs within interaction range
   */
  public getNPCsInRange(): NPCInstance[] {
    const npcsInRange: NPCInstance[] = [];

    this.npcs.forEach((npcInstance) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npcInstance.npc.x,
        npcInstance.npc.y
      );

      if (distance <= npcInstance.config.interactionRange) {
        npcsInRange.push(npcInstance);
      }
    });

    return npcsInRange;
  }

  /**
   * Register all NPCs with anti-spam manager
   */
  public registerWithAntiSpamManager(antiSpamManager: any): void {
    if (!antiSpamManager) {
      console.warn('⚠️ NPCManager: No anti-spam manager provided');
      return;
    }

    console.log('🛡️ NPCManager: Registering NPCs with anti-spam manager...');
    
    this.npcs.forEach((npcInstance) => {
      try {
        if (typeof antiSpamManager.registerNPC === 'function') {
          antiSpamManager.registerNPC(npcInstance.npc);
          console.log(`✅ NPCManager: Registered ${npcInstance.config.name} with anti-spam manager`);
        }
      } catch (error) {
        console.error(`❌ NPCManager: Failed to register ${npcInstance.config.name} with anti-spam manager:`, error);
      }
    });
  }

  /**
   * Validate all NPCs are properly initialized
   */
  public validateNPCs(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    this.npcConfigs.forEach(config => {
      const npcInstance = this.npcs.get(config.id);
      
      if (!npcInstance) {
        issues.push(`Missing NPC: ${config.name}`);
        return;
      }

      // Check if NPC has required methods
      if (!npcInstance.npc.interact) {
        issues.push(`${config.name}: Missing interact method`);
      }

      // Check if NPC has proper depth for rendering above map elements
      if (npcInstance.npc.depth < 10) {
        issues.push(`${config.name}: Incorrect NPC depth (${npcInstance.npc.depth}) - should be 10+ to render above map`);
      }
      
      // Check cooldown timer depth if it exists
      if (npcInstance.npc.cooldownIndicator) {
        const timerDepth = npcInstance.npc.cooldownIndicator.depth || 0;
        if (timerDepth < 20) {
          issues.push(`${config.name}: Incorrect cooldown timer depth (${timerDepth}) - should be 20+ for visibility`);
        }
      }

      // Check if NPC is positioned correctly
      const distance = Phaser.Math.Distance.Between(
        npcInstance.npc.x,
        npcInstance.npc.y,
        config.position.x,
        config.position.y
      );

      if (distance > 10) { // Allow small positioning tolerance
        issues.push(`${config.name}: Position mismatch - expected (${config.position.x}, ${config.position.y}), got (${npcInstance.npc.x}, ${npcInstance.npc.y})`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Clean up all NPCs
   */
  public destroy(): void {
    console.log('🧹 NPCManager: Cleaning up NPCs...');
    
    this.npcs.forEach((npcInstance) => {
      try {
        if (npcInstance.npc && typeof npcInstance.npc.destroy === 'function') {
          npcInstance.npc.destroy();
        }
      } catch (error) {
        console.error(`❌ NPCManager: Error destroying ${npcInstance.config.name}:`, error);
      }
    });

    this.npcs.clear();
    NPCManager.instance = null as any;
    console.log('✅ NPCManager: Cleanup complete');
  }

  /**
   * Get debug information about all NPCs
   */
  public getDebugInfo(): any {
    return {
      totalNPCs: this.npcs.size,
      expectedNPCs: this.npcConfigs.length,
      npcStatus: Array.from(this.npcs.entries()).map(([id, npcInstance]) => ({
        id,
        name: npcInstance.config.name,
        position: { x: npcInstance.npc.x, y: npcInstance.npc.y },
        expectedPosition: npcInstance.config.position,
        depth: npcInstance.npc.depth || 0,
        cooldownTimerDepth: npcInstance.npc.cooldownIndicator ? (npcInstance.npc.cooldownIndicator.depth || 0) : null,
        isOnCooldown: typeof npcInstance.npc.getIsOnCooldown === 'function' ? npcInstance.npc.getIsOnCooldown() : false,
        distanceFromPlayer: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          npcInstance.npc.x,
          npcInstance.npc.y
        ),
        inRange: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          npcInstance.npc.x,
          npcInstance.npc.y
        ) <= npcInstance.config.interactionRange
      }))
    };
  }
}