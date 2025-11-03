import Phaser from 'phaser';

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
  private scene: Phaser.Scene;
  private slots: HotkeySlot[] = [];
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private storageKey: string = 'quiztal-hotkey-slots';
  private onSlotUpdateCallback: (() => void) | null = null;
  private slotsVisible: boolean = true; // Track visibility state
  private slotsContainer: Phaser.GameObjects.Container | null = null; // Reference to the main container

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeSlots();
    this.loadConfig();
    this.setupInputHandlers();
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
  public createUI(): void {
    const isMobile = this.scene.scale.width < 768;
    const slotSize = isMobile ? 40 : 50;
    const slotSpacing = isMobile ? 5 : 10;
    const startY = this.scene.scale.height - (isMobile ? 120 : 150);
    
    // Create a container for all slots
    this.slotsContainer = this.scene.add.container(0, startY);
    
    // Create 10 slots
    for (let i = 0; i < 10; i++) {
      const slotX = (this.scene.scale.width / 2) - (5 * slotSize) - (4.5 * slotSpacing) + (i * (slotSize + slotSpacing));
      const slot = this.createSlot(i + 1, slotX, 0, slotSize);
      this.slotsContainer.add(slot);
      this.slotContainers.push(slot);
    }
    
    // Set depth to ensure slots appear above other UI elements
    this.slotsContainer.setDepth(1001);
  }

  private createSlot(slotId: number, x: number, y: number, size: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Background
    const bg = this.scene.add.rectangle(0, 0, size, size, 0x34495e)
      .setStrokeStyle(2, 0x3498db)
      .setOrigin(0.5);

    // Slot number
    const displayNumber = slotId === 10 ? '0' : slotId.toString();
    const numberText = this.scene.add.text(0, -size/3, displayNumber, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Item icon (initially empty)
    const iconText = this.scene.add.text(0, size/6, '', {
      fontSize: '20px'
    }).setOrigin(0.5);

    // Quantity text
    const quantityText = this.scene.add.text(size/3, size/3, '', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000'
    }).setOrigin(0.5);

    // Make container interactive for drag and drop
    container.setInteractive(new Phaser.Geom.Rectangle(-size/2, -size/2, size, size), Phaser.Geom.Rectangle.Contains);

    // Add hover effects
    container.on('pointerover', () => {
      bg.setStrokeStyle(2, 0xf1c40f); // Yellow border on hover
    });

    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x3498db); // Blue border normally
    });

    // Store references for updates
    (container as any).bg = bg;
    (container as any).iconText = iconText;
    (container as any).quantityText = quantityText;

    container.add([bg, numberText, iconText, quantityText]);

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

    if (slot.itemId && slot.quantity > 0) {
      // Get item icon from inventory
      const icon = this.getItemIcon(slot.itemId);
      iconText.setText(icon);
      quantityText.setText(slot.quantity.toString());
      quantityText.setVisible(true);
    } else {
      iconText.setText('');
      quantityText.setText('');
      quantityText.setVisible(false);
    }
  }

  // Get item icon from inventory system
  private getItemIcon(itemId: string): string {
    // This would ideally access the actual inventory system
    // For now, we'll use a mapping based on known items
    const itemIcons: { [key: string]: string } = {
      'health_crystal': '💖',
      'mana_crystal': '💎',
      'stamina_potion': '🔋',
      'speed_potion': '⚡',
      'golden_key': '🔑',
      'dragon_scale': '🐉',
      'phoenix_feather': '🔥',
      'mystic_orb': '🔮',
      'dungeon_key': '🗝️'
    };

    return itemIcons[itemId] || '❓';
  }

  // Public method to assign an item to a specific slot
  public assignItemToSlot(slotId: number, itemId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) {
      console.warn(`Invalid slot ID: ${slotId}`);
      return false;
    }

    // Get current quantity from inventory
    const inventoryScene = this.scene.scene.get('InventoryScene') as any;
    const quantity = inventoryScene ? inventoryScene.getItemCount(itemId) : 0;

    if (quantity <= 0) {
      console.warn(`Item ${itemId} not found in inventory or quantity is 0`);
      return false;
    }

    slot.itemId = itemId;
    slot.quantity = quantity;

    this.updateSlotDisplay(slotId);
    this.saveConfig();

    if (this.onSlotUpdateCallback) {
      this.onSlotUpdateCallback();
    }

    return true;
  }

  // Check if an item should be auto-reassigned to any slot
  public checkAutoReassignItem(itemId: string): void {
    console.log('Checking auto-reassign for item:', itemId);

    // Check all slots that have this item type assigned
    let updated = false;
    for (const slot of this.slots) {
      if (slot.itemId === itemId) {
        console.log('Found matching slot:', slot.id);

        // Get current quantity from inventory
        const inventoryScene = this.scene.scene.get('InventoryScene') as any;
        const quantity = inventoryScene ? inventoryScene.getItemCount(itemId) : 0;

        console.log('Current inventory quantity:', quantity, 'slot quantity was:', slot.quantity);

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
      console.log('Updated all matching slots for item', itemId);
    } else {
      console.log('No slots found for item:', itemId);
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
        const inventoryScene = this.scene.scene.get('InventoryScene') as any;
        const quantity = inventoryScene ? inventoryScene.getItemCount(itemId) : 0;

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

    this.updateSlotDisplay(slotId);
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
    const inventoryScene = this.scene.scene.get('InventoryScene') as any;
    const quantity = inventoryScene ? inventoryScene.getItemCount(slot.itemId) : 0;

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
    const inventoryScene = this.scene.scene.get('InventoryScene') as any;
    if (inventoryScene && inventoryScene.getItemCount(slot.itemId) > 0) {
      // Use the item
      inventoryScene.useItem(slot.itemId);
      // Update slot quantity after a short delay to ensure inventory is updated
      this.scene.time.delayedCall(100, () => {
        this.updateSlotQuantity(slotId);
      });
    }
  }

  // Setup input handlers for hotkeys
  private setupInputHandlers(): void {
    if (!this.scene.input.keyboard) return;

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
      const key = this.scene.input.keyboard!.addKey(keyCode);
      const slotId = index === 9 ? 10 : index + 1; // 0 key is slot 10
      key.on('down', () => this.activateSlot(slotId));
    });
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
    if (this.slotsContainer) {
      this.slotsVisible = !this.slotsVisible;
      this.slotsContainer.setVisible(this.slotsVisible);
      console.log('Hotkey slots visibility toggled:', this.slotsVisible);
    }
  }
  
  // Show hotkey slots
  public showSlots(): void {
    if (this.slotsContainer && !this.slotsVisible) {
      this.slotsVisible = true;
      this.slotsContainer.setVisible(true);
      console.log('Hotkey slots shown');
    }
  }
  
  // Hide hotkey slots
  public hideSlots(): void {
    if (this.slotsContainer && this.slotsVisible) {
      this.slotsVisible = false;
      this.slotsContainer.setVisible(false);
      console.log('Hotkey slots hidden');
    }
  }
  
  // Check if slots are currently visible
  public areSlotsVisible(): boolean {
    return this.slotsVisible;
  }

  // Clean up resources
  public destroy(): void {
    // Remove input handlers
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.removeAllKeys();
    }
    
    // Destroy slot containers
    this.slotContainers.forEach(container => {
      container.destroy();
    });
    this.slotContainers = [];
    
    // Destroy main container
    if (this.slotsContainer) {
      this.slotsContainer.destroy();
      this.slotsContainer = null;
    }
  }
}