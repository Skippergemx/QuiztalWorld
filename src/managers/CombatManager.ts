import Phaser from 'phaser';
import { FieldMonster } from '../entities/FieldMonster';
import { EnergyBall } from '../entities/EnergyBall';
import { monsterDropConfigs } from '../config/monsterDrops';
import { MonsterDropConfig, MonsterDrop } from '../types/drops';
import { ItemSystem } from '../systems/ItemSystem';

export default class CombatManager {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private monsters: FieldMonster[] = [];
  private isCombatActive: boolean = false;
  private isCheckingCollection: boolean = false;
  
  // Combat state
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private combatCooldown: number = 0;
  
  // UI elements (removed healthBar since we're using PlayerManager's)
  private damageTexts: Phaser.GameObjects.Text[] = [];
  private combatEffects: Phaser.GameObjects.Graphics[] = [];
  
  // Loot system
  private dropItems: Array<{ item: Phaser.GameObjects.Text; glow: Phaser.GameObjects.Graphics }> = [];
  
  // Item system
  private itemSystem: ItemSystem;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    
    // Try to get the ItemSystem from the InventoryScene to ensure we're using the same instance
    try {
      const inventoryScene = scene.scene.get('InventoryScene') as any;
      if (inventoryScene && inventoryScene.itemSystem) {
        this.itemSystem = inventoryScene.itemSystem;
        console.log('✅ CombatManager using ItemSystem from InventoryScene');
      } else {
        // Fallback: Create a new ItemSystem instance
        this.itemSystem = new ItemSystem();
        console.log('⚠️ CombatManager using fallback ItemSystem instance');
      }
    } catch (error) {
      console.error('Error getting ItemSystem from InventoryScene:', error);
      // Fallback: Create a new ItemSystem instance
      this.itemSystem = new ItemSystem();
    }
  }

  /**
   * Initialize the combat manager
   */
  public initialize(): void {
    console.log('⚔️ CombatManager: Initializing combat system...');
    // Remove health bar creation since PlayerManager handles it
  }

  /**
   * Update combat logic
   */
  public update(time: number, delta: number): void {
    // Use time parameter to avoid unused variable warning (but don't actually use it)
    void time;
    
    // Update cooldowns
    if (this.combatCooldown > 0) {
      this.combatCooldown -= delta;
    }
    
    // Update damage texts
    this.updateDamageTexts();
    
    // Update combat effects
    this.updateCombatEffects();
    
    // Check for item collection (now async)
    this.checkItemCollection().catch(error => {
      console.error('Error checking for item collection:', error);
    });
    
    // Check if combat is active
    this.isCombatActive = this.monsters.some(monster => monster && monster.active && monster.isAlive());
  }

  /**
   * Register monsters with the combat system
   */
  public registerMonsters(monsters: FieldMonster[]): void {
    this.monsters = monsters;
  }

  /**
   * Handle player taking damage
   */
  public playerTakeDamage(amount: number): void {
    if (this.combatCooldown > 0) return;
    
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    
    // Update PlayerManager's health (since it manages the health bar)
    const playerManager = (this.scene as any).playerManager;
    if (playerManager && typeof playerManager.takeDamage === 'function') {
      playerManager.takeDamage(amount);
    }
    
    // Visual feedback
    this.player.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (this.player) {
        this.player.clearTint();
      }
    });
    
    // Screen shake effect
    this.scene.cameras.main.shake(200, 0.01);
    
    // Combat cooldown to prevent damage spam
    this.combatCooldown = 800; // Reduced from 1000ms for more responsive combat
    
    // Show damage text
    this.showDamageText(amount, this.player.x, this.player.y - 30);
    
    // Play damage sound
    const audioManager = (window as any).audioManager || { playPlayerDamageSound: () => {} };
    audioManager.playPlayerDamageSound();
    
    // Create hit effect
    this.createHitEffect(this.player.x, this.player.y);
    
    if (this.playerHealth <= 0) {
      this.handlePlayerDeath();
    }
  }

  /**
   * Handle player healing
   */
  public playerHeal(amount: number): void {
    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
    
    // Update PlayerManager's health (since it manages the health bar)
    const playerManager = (this.scene as any).playerManager;
    if (playerManager && typeof playerManager.heal === 'function') {
      playerManager.heal(amount);
    }
    
    // Show healing text
    this.showDamageText(-amount, this.player.x, this.player.y - 30, '#00ff00');
    
    // Create healing effect
    this.createHealingEffect(this.player.x, this.player.y);
  }

  /**
   * Handle player energy attack (new mouse-targeted attack)
   */
  public playerEnergyAttack(playerX: number, playerY: number, targetX: number, targetY: number): void {
    // Debug information
    console.log('playerEnergyAttack called:', {
      playerX: playerX,
      playerY: playerY,
      targetX: targetX,
      targetY: targetY
    });
    
    // Use the updated playerAttack method for energy balls
    this.playerAttack(playerX, playerY, targetX, targetY);
  }

  /**
   * Handle player attack with energy balls
   */
  public playerAttack(playerX: number, playerY: number, targetX: number, targetY: number): void {
    // Check if player can attack (not on cooldown)
    const attackCooldown = 500; // Slightly longer cooldown for energy attacks
    const currentTime = this.scene.time.now;
    
    // Simple cooldown check using a property
    if (!(this as any).lastPlayerAttackTime) {
      (this as any).lastPlayerAttackTime = 0;
    }
    
    if (currentTime - (this as any).lastPlayerAttackTime < attackCooldown) {
      return;
    }
    
    // Set last attack time
    (this as any).lastPlayerAttackTime = currentTime;
    
    // Play attack sound
    const audioManager = (window as any).audioManager || { playPlayerAttackSound: () => {} };
    audioManager.playPlayerAttackSound();
    
    // Create energy ball
    const energyBall = new EnergyBall(this.scene, playerX, playerY, targetX, targetY);
    
    // Check for collisions with monsters using a more robust approach
    // Instead of setting up overlap for specific monsters, we'll check all current monsters
    // in the update loop of the energy ball
    energyBall.setMonsterCheckCallback((ball: any) => {
      // Get current monsters directly from the MonsterManager to ensure we have the latest references
      const monsterManager = (this.scene as any).monsterManager;
      let currentMonsters: any[] = [];
      
      if (monsterManager) {
        // Get the current monsters array directly from MonsterManager
        currentMonsters = monsterManager['monsters'] || [];
      } else {
        // Fallback to cached monsters if MonsterManager is not available
        currentMonsters = this.monsters || [];
      }
      
      for (const monster of currentMonsters) {
        if (monster && monster.active && monster.isAlive()) {
          // Check if the energy ball is overlapping with this monster
          if (this.scene.physics.overlap(ball, monster)) {
            // Apply damage to monster
            monster.takeDamage(ball.getDamage());
            
            // Show damage text
            this.showDamageText(ball.getDamage(), monster.x, monster.y - 20, '#00ffff');
            
            // Play monster damage sound
            const monsterAudioManager = (window as any).audioManager || { playMonsterDamageSound: () => {} };
            monsterAudioManager.playMonsterDamageSound();
            
            // Notify energy ball that it hit a target
            ball.hitTarget();
            
            // Check if monster is dead
            if (!monster.isAlive()) {
              // Monster is defeated
              console.log('👹 Monster defeated!');
              
              // Play monster death sound
              const deathAudioManager = (window as any).audioManager || { playMonsterDeathSound: () => {} };
              deathAudioManager.playMonsterDeathSound();
              
              // Create death effect
              this.createMonsterDeathEffect(monster.x, monster.y);
              
              // Trigger monster drops
              const monsterType = monster.getMonsterType ? monster.getMonsterType() : 'mobster';
              this.createMonsterDrops(monsterType, monster.x, monster.y);
              
              // Instead of directly modifying the array, let the MonsterManager handle it
              // const monsterIndex = currentMonsters.indexOf(monster);
              // if (monsterIndex !== -1) {
              //   currentMonsters.splice(monsterIndex, 1);
              // }
              
              // Notify MonsterManager to handle respawn
              if (monsterManager && typeof monsterManager.handleMonsterDefeated === 'function') {
                monsterManager.handleMonsterDefeated(monster);
              }
              
              // Destroy monster
              monster.destroy();
            }
            
            // Break after hitting the first monster
            break;
          }
        }
      }
    });
  }

  /**
   * Show damage/healing text
   */
  private showDamageText(amount: number, x: number, y: number, color: string = '#ff0000'): void {
    const text = this.scene.add.text(x, y, amount > 0 ? `-${amount}` : `+${Math.abs(amount)}`, {
      fontSize: '16px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    text.setDepth(101);
    
    // Add to damage texts array
    this.damageTexts.push(text);
    
    // Tween to move upward and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
        // Remove from array
        const index = this.damageTexts.indexOf(text);
        if (index > -1) {
          this.damageTexts.splice(index, 1);
        }
      }
    });
  }

  /**
   * Create hit effect
   */
  private createHitEffect(x: number, y: number): void {
    const effect = this.scene.add.graphics();
    effect.fillStyle(0xff0000, 0.5);
    effect.fillCircle(0, 0, 20);
    effect.setPosition(x, y);
    effect.setDepth(100);
    
    this.combatEffects.push(effect);
    
    // Animate the effect
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        effect.destroy();
        // Remove from array
        const index = this.combatEffects.indexOf(effect);
        if (index > -1) {
          this.combatEffects.splice(index, 1);
        }
      }
    });
  }

  /**
   * Create healing effect
   */
  private createHealingEffect(x: number, y: number): void {
    const effect = this.scene.add.graphics();
    effect.fillStyle(0x00ff00, 0.5);
    effect.fillCircle(0, 0, 20);
    effect.setPosition(x, y);
    effect.setDepth(100);
    
    this.combatEffects.push(effect);
    
    // Animate the effect
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        effect.destroy();
        // Remove from array
        const index = this.combatEffects.indexOf(effect);
        if (index > -1) {
          this.combatEffects.splice(index, 1);
        }
      }
    });
  }

  /**
   * Create monster death effect
   */
  private createMonsterDeathEffect(x: number, y: number): void {
    // Create explosion effect
    const explosion = this.scene.add.graphics();
    explosion.fillStyle(0xff4500, 0.8);
    explosion.fillCircle(0, 0, 30);
    explosion.setPosition(x, y);
    explosion.setDepth(100);
    
    this.combatEffects.push(explosion);
    
    // Animate the explosion
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 3,
      duration: 500,
      onComplete: () => {
        explosion.destroy();
        // Remove from array
        const index = this.combatEffects.indexOf(explosion);
        if (index > -1) {
          this.combatEffects.splice(index, 1);
        }
      }
    });
    
    // Create particle effects
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xff6347, 0.7);
      particle.fillCircle(0, 0, 5);
      particle.setPosition(x, y);
      particle.setDepth(100);
      
      this.combatEffects.push(particle);
      
      // Animate particles flying outward
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      
      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          particle.destroy();
          // Remove from array
          const index = this.combatEffects.indexOf(particle);
          if (index > -1) {
            this.combatEffects.splice(index, 1);
          }
        }
      });
    }
  }

  /**
   * Create monster drops
   */
  private createMonsterDrops(monsterType: string, x: number, y: number): void {
    console.log('Creating drops for', monsterType, 'at', x, y);
    const config = monsterDropConfigs.find((c: MonsterDropConfig) => c.monsterType === monsterType);
    if (!config) {
      console.log('No drop config found for monster type:', monsterType);
      return;
    }
    
    console.log('Found drop config:', config);
    
    // Track which items we've already created to prevent duplicates
    const createdItems = new Set<string>();
    
    config.drops.forEach((drop: MonsterDrop) => {
      const roll = Math.random() * 100;
      console.log('Rolling for drop:', drop.itemId, 'chance:', drop.chance, 'roll:', roll);
      if (roll < drop.chance) {
        // Check if we've already created this item type to prevent duplicates
        if (!createdItems.has(drop.itemId)) {
          const quantity = Phaser.Math.Between(drop.minQuantity, drop.maxQuantity);
          console.log('Drop succeeded:', drop.itemId, 'quantity:', quantity);
          this.createDropItem(drop.itemId, quantity, x, y);
          createdItems.add(drop.itemId);
        } else {
          console.log('Item already created, skipping duplicate:', drop.itemId);
        }
      } else {
        console.log('Drop failed:', drop.itemId);
      }
    });
  }

  /**
   * Create a visual drop item in the world
   */
  private createDropItem(itemId: string, quantity: number, x: number, y: number): void {
    console.log('Creating drop item:', { itemId, quantity, x, y });
    
    // Get item info from existing inventory system
    // For now, we'll use the mock items from InventoryScene
    const mockItems = [
      { id: 'health_crystal', icon: '💖', name: 'Health Crystal' },
      { id: 'mana_crystal', icon: '💎', name: 'Mana Crystal' },
      { id: 'stamina_potion', icon: '🔋', name: 'Stamina Potion' },
      { id: 'golden_key', icon: '🔑', name: 'Golden Key' },
      { id: 'dragon_scale', icon: '🐉', name: 'Dragon Scale' },
      { id: 'phoenix_feather', icon: '🔥', name: 'Phoenix Feather' },
      { id: 'speed_potion', icon: '⚡', name: 'Speed Potion' },
      { id: 'mystic_orb', icon: '🔮', name: 'Mystic Orb' },
      { id: 'dungeon_key', icon: '🗝️', name: 'Dungeon Key' }
    ];
    
    const itemInfo = mockItems.find(item => item.id === itemId);
    if (!itemInfo) {
      console.log('Item not found in mock items:', itemId);
      return;
    }
    
    console.log('Creating drop with emoji:', itemInfo.icon);
    
    // Create visual representation using emoji with better sizing
    const dropItem = this.scene.add.text(x, y, itemInfo.icon, {
      fontSize: '28px', // Reduced from 32px to prevent cropping
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3 // Reduced from 4 to match the smaller size
    }).setOrigin(0.5);
    
    // Set depth to ensure items appear above other elements
    dropItem.setDepth(100);
    
    // Add physics body for collection (adjusted for smaller size)
    this.scene.physics.world.enable(dropItem);
    if (dropItem.body) {
      (dropItem.body as Phaser.Physics.Arcade.Body).setCircle(18); // Adjusted from 20
      (dropItem.body as Phaser.Physics.Arcade.Body).setOffset(-18, -18); // Adjusted from -20
    }
    
    // Store item data
    (dropItem as any).itemData = {
      itemId: itemId,
      quantity: quantity,
      name: itemInfo.name
    };
    
    // Add bobbing animation
    this.scene.tweens.add({
      targets: dropItem,
      y: y - 12, // Adjusted from 15 to match the smaller size
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add a subtle glow effect (adjusted for smaller size)
    const glow = this.scene.add.graphics();
    glow.fillStyle(0xffffff, 0.3);
    glow.fillCircle(0, 0, 20); // Adjusted from 25
    glow.setPosition(x, y);
    glow.setDepth(99);
    
    // Animate the glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Auto-collect after 30 seconds
    this.scene.time.delayedCall(30000, () => {
      if (dropItem.active) {
        dropItem.destroy();
        glow.destroy();
      }
    });
    
    // Store reference for collection checking
    if (!(this as any).dropItems) {
      (this as any).dropItems = [];
    }
    (this as any).dropItems.push({ item: dropItem, glow: glow });
    
    console.log('Drop item created successfully:', dropItem);
  }

  /**
   * Update combat effects
   */
  private updateCombatEffects(): void {
    // Combat effects are handled by tweens, so this is just a placeholder
    // for any additional effect updates that might be needed
  }

  /**
   * Update damage texts
   */
  private updateDamageTexts(): void {
    // Position health bar above player (removed since PlayerManager handles this)
    
    // Update all damage texts to follow their targets if needed
    // (Currently static, but could be extended for following targets)
  }
  
  /**
   * Check for item collection based on player proximity
   */
  public async checkItemCollection(): Promise<void> {
    // Add a guard to prevent multiple simultaneous executions
    if (this.isCheckingCollection) {
      return;
    }
    
    this.isCheckingCollection = true;
    
    try {
      // Use a local copy of the array to avoid issues with concurrent modifications
      const currentDropItems = [...this.dropItems];
      
      // Check each drop item for proximity to player
      for (let i = currentDropItems.length - 1; i >= 0; i--) {
        const dropItemObj = currentDropItems[i];
        const dropItem = dropItemObj.item;
        
        // Check if item still exists and is active
        if (!dropItem.active) {
          // Remove inactive items from the main array
          const index = this.dropItems.indexOf(dropItemObj);
          if (index > -1) {
            this.dropItems.splice(index, 1);
          }
          continue;
        }
        
        // Calculate distance between player and item
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          dropItem.x, dropItem.y
        );
        
        // If player is close enough, collect the item
        if (distance < 30) {
          // Get item data
          const itemData = (dropItem as any).itemData;
          console.log('Collected item:', itemData);
          
          // Show collection effect with positive number
          this.showCollectionText(itemData.quantity, dropItem.x, dropItem.y - 20);
          
          // Play collection sound (if available)
          const audioManager = (window as any).audioManager || { playCollectItemSound: () => {} };
          audioManager.playCollectItemSound && audioManager.playCollectItemSound();
          
          // Add item to inventory - if this fails, don't collect the item
          const itemAdded = await this.addItemToInventory(itemData.itemId, itemData.quantity);
          
          if (itemAdded) {
            // Destroy the item and its glow effect
            dropItem.destroy();
            dropItemObj.glow.destroy();
            
            // Remove from drop items array
            const index = this.dropItems.indexOf(dropItemObj);
            if (index > -1) {
              this.dropItems.splice(index, 1);
            }
          } else {
            // If item couldn't be added to inventory, show an error message
            this.showCollectionText(0, dropItem.x, dropItem.y - 20);
            console.warn('Failed to add item to inventory - loot not collected');
          }
        }
      }
    } finally {
      this.isCheckingCollection = false;
    }
  }
  
  /**
   * Add collected item to inventory
   */
  private async addItemToInventory(itemId: string, quantity: number): Promise<boolean> {
    try {
      // Use the new ItemSystem
      const result = await this.itemSystem.addItem(itemId, quantity);
      if (result) {
        console.log('Item added to inventory:', itemId, quantity);
      }
      return result;
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      return false;
    }
  }

  /**
   * Show item collection text
   */
  private showCollectionText(quantity: number, x: number, y: number): void {
    let textContent = '';
    let textColor = '#00ff00'; // Green for successful collection
    
    if (quantity > 0) {
      textContent = `+${quantity}`;
    } else if (quantity === 0) {
      // Special case for failed collection
      textContent = 'Network Error';
      textColor = '#ff0000'; // Red for error
    }
    
    const text = this.scene.add.text(x, y, textContent, {
      fontSize: '16px',
      color: textColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    text.setDepth(101);
    
    // Add to damage texts array for consistency
    this.damageTexts.push(text);
    
    // Tween to move upward and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
        // Remove from array
        const index = this.damageTexts.indexOf(text);
        if (index > -1) {
          this.damageTexts.splice(index, 1);
        }
      }
    });
  }

  /**
   * Handle player death
   */
  private handlePlayerDeath(): void {
    console.log('💀 CombatManager: Player has been defeated!');
    // In a full implementation, this would trigger game over or respawn logic
    
    // Screen flash effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xff0000, 0.5);
    flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    flash.setDepth(1000);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove healthBar destroy since PlayerManager handles it
    
    // Destroy all damage texts
    this.damageTexts.forEach(text => {
      text.destroy();
    });
    this.damageTexts = [];
    
    // Destroy all combat effects
    this.combatEffects.forEach(effect => {
      effect.destroy();
    });
    this.combatEffects = [];
  }

  // Getters
  public getPlayerHealth(): number {
    return this.playerHealth;
  }

  public getPlayerMaxHealth(): number {
    return this.playerMaxHealth;
  }

  public isPlayerAlive(): boolean {
    return this.playerHealth > 0;
  }
  
  public getMonsters(): FieldMonster[] {
    return this.monsters;
  }
  
  public isCombatInProgress(): boolean {
    return this.isCombatActive;
  }
}