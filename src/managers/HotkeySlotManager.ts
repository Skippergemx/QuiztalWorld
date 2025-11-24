import { ItemSystem } from '../systems/ItemSystem';

// Define the hotkey slot interface
export interface HotkeySlot {
  id: number;           // 1-10
  itemId: string | null;// Item ID or null if empty
  quantity: number;     // Current quantity
}

export interface HotkeySlotConfig {
  slots: HotkeySlot[];
}

export default class HotkeySlotManager {
  private slots: HotkeySlot[] = [];
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private storageKey: string = 'niftdood-hotkey-slots';
  private onSlotUpdateCallback: (() => void) | null = null;
  private slotsVisible: boolean = true; // Track visibility state
  private slotsContainer: Phaser.GameObjects.Container | null = null; // Reference to the main container
  private itemSystem: ItemSystem | null = null; // Reference to ItemSystem

  constructor() {
    this.initializeSlots();
    this.loadConfig();
  }

  // Set the item system reference
  public setItemSystem(itemSystem: ItemSystem): void {
    this.itemSystem = itemSystem;
  }

  // Setup input handlers for hotkeys (called by UIScene)
  public setupInputHandlers(scene: Phaser.Scene): void {
    if (!scene.input.keyboard) return;

    // Keys 1-9 and 0
    const keys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
      Phaser.Input.Keyboard.KeyCodes.EIGHT,
      Phaser.Input.Keyboard.KeyCodes.NINE,
      Phaser.Input.Keyboard.KeyCodes.ZERO
    ];

    keys.forEach((keyCode, index) => {
      const key = scene.input.keyboard!.addKey(keyCode);
      const slotId = index === 9 ? 10 : index + 1; // 0 key is slot 10
      key.on('down', () => this.activateSlot(slotId)); // Remove scene parameter
    });
  }

  private initializeSlots(): void {
    // Initialize 10 empty slots
    for (let i = 1; i <= 10; i++) {
      this.slots.push({
        id: i,
        itemId: null,
        quantity: 0
      });
    }
  }

  // Set callback for slot updates
  public setOnSlotUpdateCallback(callback: () => void): void {
    this.onSlotUpdateCallback = callback;
  }

  // Create the UI for hotkey slots
  public createUI(scene: Phaser.Scene): void {
    const isMobile = scene.scale.width < 768;
    const slotSize = isMobile ? 45 : 55;
    const slotSpacing = isMobile ? 8 : 12;
    const startY = scene.scale.height - (isMobile ? 130 : 160);
    
    // Create a container for all slots
    this.slotsContainer = scene.add.container(0, startY);
    
    // Create 10 slots with improved positioning
    const slots = [];
    for (let i = 0; i < 10; i++) {
      const slotX = (scene.scale.width / 2) - (5 * slotSize) - (4.5 * slotSpacing) + (i * (slotSize + slotSpacing));
      const slot = this.createSlot(i + 1, slotX, 0, slotSize, scene);
      this.slotsContainer.add(slot);
      slots.push(slot);
      this.slotContainers.push(slot);
    }
    
    // Calculate the bounds of all slots to create a proper background panel
    if (slots.length > 0) {
      const firstSlotX = slots[0].x;
      const lastSlotX = slots[slots.length - 1].x;
      const panelWidth = (lastSlotX - firstSlotX) + slotSize + 20;
      const panelHeight = slotSize + 20;
      const panelX = (firstSlotX + lastSlotX) / 2;
      const panelY = 0;
      
      const panelBg = scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a1a)
        .setAlpha(0.7)
        .setStrokeStyle(1, 0x3498db)
        .setOrigin(0.5);
      
      // Add the panel to the container behind the slots
      this.slotsContainer.addAt(panelBg, 0);
    }
    
    // Set depth to ensure slots appear above other UI elements
    this.slotsContainer.setDepth(1001);
  }

  private createSlot(slotId: number, x: number, y: number, size: number, scene: Phaser.Scene): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Enhanced background with gradient and rounded corners
    const bg = scene.add.rectangle(0, 0, size, size, 0x2c3e50)
      .setStrokeStyle(2, 0x3498db)
      .setOrigin(0.5)
      .setAlpha(0.9);

    // Add a subtle inner highlight for depth
    const highlight = scene.add.rectangle(0, -size/4, size - 4, size/3, 0xffffff)
      .setOrigin(0.5)
      .setAlpha(0.1);

    // Slot number with improved styling
    const displayNumber = slotId === 10 ? '0' : slotId.toString();
    const numberText = scene.add.text(0, -size/3, displayNumber, {
      fontSize: '16px',
      color: '#3498db',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Item icon with improved styling
    const iconText = scene.add.text(0, size/6, '', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Quantity text with improved styling
    const quantityText = scene.add.text(size/3, size/3, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Make container interactive for drag and drop
    container.setInteractive(new Phaser.Geom.Rectangle(-size/2, -size/2, size, size), Phaser.Geom.Rectangle.Contains);

    // Add hover effects with smooth transitions
    container.on('pointerover', () => {
      scene.tweens.add({
        targets: bg,
        strokeColor: 0xf1c40f,
        duration: 200
      });
      
      // Scale up slightly on hover
      scene.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      });
    });

    container.on('pointerout', () => {
      scene.tweens.add({
        targets: bg,
        strokeColor: 0x3498db,
        duration: 200
      });
      
      // Scale back to normal
      scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
    });

    // Add click effect
    container.on('pointerdown', () => {
      scene.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 100,
        yoyo: true
      });
    });

    // Store references for updates
    (container as any).bg = bg;
    (container as any).iconText = iconText;
    (container as any).quantityText = quantityText;

    container.add([bg, highlight, numberText, iconText, quantityText]);

    return container;
  }

  // Update a specific slot's display
  public updateSlotDisplay(slotId: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || slotId < 1 || slotId > 10) return;

    const container = this.slotContainers[slotId - 1];
    if (!container) return;

    const iconText = (container as any).iconText;
    const quantityText = (container as any).quantityText;
    const bg = (container as any).bg;

    if (slot.itemId && slot.quantity > 0) {
      // Get item icon from inventory
      const icon = this.getItemIcon(slot.itemId);
      iconText.setText(icon);
      quantityText.setText(slot.quantity.toString());
      quantityText.setVisible(true);
      
      // Set background color based on rarity
      const rarityColors: { [key: string]: number } = {
        'common': 0x2c3e50,
        'rare': 0x3498db,
        'epic': 0x9b59b6,
        'legendary': 0xf1c40f
      };
      
      const itemTemplate = this.itemSystem?.getItemTemplate(slot.itemId);
      const rarity = itemTemplate?.rarity || 'common';
      bg.setFillStyle(rarityColors[rarity] || rarityColors['common']);
    } else {
      // Empty slot
      iconText.setText('');
      quantityText.setVisible(false);
      bg.setFillStyle(0x2c3e50);
    }
  }

  // Get item icon from inventory
  private getItemIcon(itemId: string): string {
    if (this.itemSystem) {
      const template = this.itemSystem.getItemTemplate(itemId);
      return template ? template.icon : '❓';
    }
    
    // Fallback to hardcoded icons if ItemSystem is not available
    const itemIcons: { [key: string]: string } = {
      'health_crystal': '💖',
      'mana_crystal': '💎',
      'stamina_potion': '🔋',
      'golden_key': '🔑',
      'dragon_scale': '🐉',
      'phoenix_feather': '🔥',
      'speed_potion': '⚡',
      'mystic_orb': '🔮',
      'dungeon_key': '🗝️'
    };
    
    return itemIcons[itemId] || '❓';
  }

  // Assign an item to a slot
  public assignItemToSlot(slotId: number, itemId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return false;

    slot.itemId = itemId;
    
    // Get current quantity from inventory
    let quantity = 0;
    if (this.itemSystem) {
      quantity = this.itemSystem.getItemCount(itemId);
    }
    
    slot.quantity = quantity;

    // Save config
    this.saveConfig();

    if (this.onSlotUpdateCallback) {
      this.onSlotUpdateCallback();
    }

    return true;
  }

  // Check if an item should be auto-reassigned to any slot
  public checkAutoReassignItem(itemId: string): void {
    console.log('Checking auto-reassign for item:', itemId);
    
    // Get current quantity from inventory
    let quantity = 0;
    if (this.itemSystem) {
      quantity = this.itemSystem.getItemCount(itemId);
    }
    
    console.log('Inventory quantity for', itemId, ':', quantity);
    
    // If we have the item and no slot is assigned to it, auto-assign to first empty slot
    if (quantity > 0) {
      const existingSlot = this.slots.find(s => s.itemId === itemId);
      if (!existingSlot) {
        // Find first empty slot
        const emptySlot = this.slots.find(s => !s.itemId);
        if (emptySlot) {
          console.log('Auto-assigning', itemId, 'to slot', emptySlot.id);
          this.assignItemToSlot(emptySlot.id, itemId);
        }
      } else {
        // Update quantity for existing slot
        console.log('Updating quantity for existing slot', existingSlot.id);
        this.updateSlotQuantity(existingSlot.id);
      }
    }
  }

  // Force update all slots that match an item ID
  public forceUpdateSlotsForItem(itemId: string): void {
    console.log('Force updating slots for item:', itemId);

    // Check all slots that have this item type assigned
    let updated = false;
    for (const slot of this.slots) {
      if (slot.itemId === itemId) {
        console.log('Force updating slot:', slot.id);

        // Get current quantity from inventory
        let quantity = 0;
        if (this.itemSystem) {
          quantity = this.itemSystem.getItemCount(itemId);
        }

        console.log('Force update - inventory quantity:', quantity);

        // Always update the slot with the current quantity
        slot.quantity = quantity;
        this.updateSlotDisplay(slot.id);
        updated = true;
      }
    }

    // Save config if any slots were updated
    if (updated) {
      this.saveConfig();
      if (this.onSlotUpdateCallback) {
        this.onSlotUpdateCallback();
      }
      console.log('Force updated all matching slots for item', itemId);
    }
  }

  // Public method to get available slot IDs
  public getAvailableSlotIds(): number[] {
    return this.slots.map(slot => slot.id);
  }

  // Public method to get slot info
  public getSlotInfo(slotId: number): HotkeySlot | undefined {
    return this.slots.find(s => s.id === slotId);
  }

  // Remove item from slot
  public clearSlot(slotId: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return;

    slot.itemId = null;
    slot.quantity = 0;

    // Note: We need the scene to update the display, so this will be handled by the caller
    // this.updateSlotDisplay(slotId, scene);

    this.saveConfig();

    if (this.onSlotUpdateCallback) {
      this.onSlotUpdateCallback();
    }
  }

  // Update slot quantity
  public updateSlotQuantity(slotId: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || !slot.itemId) return;

    console.log('Updating slot quantity for slot:', slotId, 'item:', slot.itemId);

    // Get current quantity from inventory
    let quantity = 0;
    if (this.itemSystem) {
      quantity = this.itemSystem.getItemCount(slot.itemId);
    }

    console.log('Inventory quantity for', slot.itemId, ':', quantity, 'previous slot quantity:', slot.quantity);

    // Update the quantity but keep the itemId
    slot.quantity = quantity;

    this.updateSlotDisplay(slotId);
    this.saveConfig();

    console.log('Slot', slotId, 'updated with quantity:', quantity);
  }

  // Update all slot quantities
  public updateAllSlotQuantities(): void {
    console.log('Updating all slot quantities');
    this.slots.forEach(slot => {
      if (slot.itemId) {
        this.updateSlotQuantity(slot.id);
      }
    });
  }

  // Activate a slot (use the item)
  public activateSlot(slotId: number): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || !slot.itemId) return;

    // Check if player has the item in inventory
    let hasItem = false;
    let currentQuantity = 0;
    if (this.itemSystem) {
      currentQuantity = this.itemSystem.getItemCount(slot.itemId);
      hasItem = currentQuantity > 0;
    }

    if (hasItem) {
      // Use the item
      if (this.itemSystem) {
        this.itemSystem.useItem(slot.itemId);
      }
      
      // Update slot quantity after a short delay to ensure inventory is updated
      // Use a more reliable way to access the scene
      if (typeof window !== 'undefined') {
        // Try to get the active scene
        const gameScene = (window as any).gameScene;
        const explorationScene = (window as any).explorationScene;
        
        if (gameScene && gameScene.scene && gameScene.scene.time) {
          gameScene.scene.time.delayedCall(100, () => {
            this.updateSlotQuantity(slotId);
          });
        } else if (explorationScene && explorationScene.scene && explorationScene.scene.time) {
          explorationScene.scene.time.delayedCall(100, () => {
            this.updateSlotQuantity(slotId);
          });
        } else {
          // Fallback: update immediately
          setTimeout(() => {
            this.updateSlotQuantity(slotId);
          }, 100);
        }
      }
    }
  }

  // Save configuration to localStorage
  private saveConfig(): void {
    try {
      const config: HotkeySlotConfig = { slots: this.slots };
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving hotkey config:', error);
    }
  }

  // Load configuration from localStorage
  private loadConfig(): void {
    try {
      const configString = localStorage.getItem(this.storageKey);
      if (configString) {
        const config: HotkeySlotConfig = JSON.parse(configString);
        // Merge loaded slots with existing structure
        config.slots.forEach(loadedSlot => {
          const existingSlot = this.slots.find(s => s.id === loadedSlot.id);
          if (existingSlot) {
            existingSlot.itemId = loadedSlot.itemId;
            existingSlot.quantity = loadedSlot.quantity || 0;
          }
        });
      }
    } catch (error) {
      console.error('Error loading hotkey config:', error);
      // Initialize with default empty slots
      this.initializeSlots();
    }
  }

  // Get slot data
  public getSlots(): HotkeySlot[] {
    return [...this.slots];
  }
  
  // Toggle visibility of hotkey slots
  public toggleSlotsVisibility(): void {
    if (this.slotsVisible) {
      this.hideSlots();
    } else {
      this.showSlots();
    }
  }
  
  // Show hotkey slots with animation
  public showSlots(): void {
    if (this.slotsContainer && !this.slotsVisible) {
      this.slotsVisible = true;
      this.slotsContainer.setVisible(true);
      
      // Add slide-up animation
      const originalY = this.slotsContainer.y;
      this.slotsContainer.setY(originalY + 50); // Start below
      this.slotsContainer.setAlpha(0);
      
      // Animate to final position
      if (this.slotsContainer.scene && this.slotsContainer.scene.tweens) {
        this.slotsContainer.scene.tweens.add({
          targets: this.slotsContainer,
          y: originalY,
          alpha: 1,
          duration: 300,
          ease: 'Power2'
        });
      }
    }
  }
  
  // Hide hotkey slots with animation
  public hideSlots(): void {
    if (this.slotsContainer && this.slotsVisible) {
      this.slotsVisible = false;
      
      // Add slide-down animation
      const originalY = this.slotsContainer.y;
      
      // Animate to hidden position
      if (this.slotsContainer.scene && this.slotsContainer.scene.tweens) {
        this.slotsContainer.scene.tweens.add({
          targets: this.slotsContainer,
          y: originalY + 50,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (this.slotsContainer) {
              this.slotsContainer.setVisible(false);
            }
          }
        });
      } else {
        // Fallback if tweens are not available
        this.slotsContainer.setVisible(false);
      }
    }
  }
}