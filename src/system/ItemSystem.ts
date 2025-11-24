import { saveInventoryToDatabase, loadInventoryFromDatabase } from '../utils/Database';

// Define the inventory item structure
export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: 'consumable' | 'material' | 'key';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    icon: string;
}

// Define item templates
export const ITEM_TEMPLATES: { [key: string]: Omit<InventoryItem, 'quantity'> } = {
    'health_crystal': {
        id: 'health_crystal',
        name: 'Health Crystal',
        description: 'Restores 50 HP when used',
        type: 'consumable',
        rarity: 'common',
        icon: '💖'
    },
    'mana_crystal': {
        id: 'mana_crystal',
        name: 'Mana Crystal',
        description: 'Restores 30 MP when used',
        type: 'consumable',
        rarity: 'common',
        icon: '💎'
    },
    'stamina_potion': {
        id: 'stamina_potion',
        name: 'Stamina Potion',
        description: 'Restores 30 Stamina when used',
        type: 'consumable',
        rarity: 'common',
        icon: '🔋'
    },
    'golden_key': {
        id: 'golden_key',
        name: 'Golden Key',
        description: 'Opens special chests',
        type: 'key',
        rarity: 'rare',
        icon: '🔑'
    },
    'dragon_scale': {
        id: 'dragon_scale',
        name: 'Dragon Scale',
        description: 'A rare crafting material',
        type: 'material',
        rarity: 'epic',
        icon: '🐉'
    },
    'phoenix_feather': {
        id: 'phoenix_feather',
        name: 'Phoenix Feather',
        description: 'A legendary crafting material',
        type: 'material',
        rarity: 'legendary',
        icon: '🔥'
    },
    'speed_potion': {
        id: 'speed_potion',
        name: 'Speed Potion',
        description: 'Increases movement speed',
        type: 'consumable',
        rarity: 'rare',
        icon: '⚡'
    },
    'mystic_orb': {
        id: 'mystic_orb',
        name: 'Mystic Orb',
        description: 'Contains mysterious power',
        type: 'material',
        rarity: 'epic',
        icon: '🔮'
    },
    'dungeon_key': {
        id: 'dungeon_key',
        name: 'Dungeon Key',
        description: 'Opens dungeon doors',
        type: 'key',
        rarity: 'rare',
        icon: '🗝️'
    }
};

export class ItemSystem {
    private playerId: string = '';
    private inventoryItems: InventoryItem[] = [];
    
    constructor() {
        this.loadPlayerId();
    }
    
    // Load player ID from localStorage
    private loadPlayerId(): void {
        try {
            const userStr = localStorage.getItem('niftdood-player');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user?.uid) {
                    this.playerId = user.uid;
                    console.log('👤 ItemSystem: Player ID loaded:', this.playerId);
                }
            }
        } catch (e) {
            console.warn('⚠️ ItemSystem: Could not parse user from localStorage', e);
        }
    }
    
    // Load inventory from Firestore
    public async loadInventory(): Promise<void> {
        try {
            if (!this.playerId) {
                console.warn('⚠️ ItemSystem: No player ID available, no inventory loading possible');
                this.inventoryItems = [];
                return;
            }
            
            // Try to load from Firestore
            const inventoryData = await loadInventoryFromDatabase(this.playerId);
            if (inventoryData) {
                this.inventoryItems = inventoryData;
                console.log('Loaded inventory with', this.inventoryItems.length, 'items from Firestore');
            } else {
                // If no data in Firestore, initialize with empty inventory
                this.inventoryItems = [];
                // Try to save the empty inventory to Firestore
                await this.saveInventory();
            }
        } catch (error) {
            console.error('Error loading inventory from Firestore:', error);
            // If Firestore is unavailable, initialize with empty inventory
            // This prevents cheating by ensuring no items are available when offline
            this.inventoryItems = [];
        }
    }
    
    // Save inventory to Firestore
    public async saveInventory(): Promise<boolean> {
        try {
            if (!this.playerId) {
                console.warn('⚠️ ItemSystem: No player ID available, cannot save inventory');
                return false;
            }
            
            // Save to Firestore
            await saveInventoryToDatabase(this.playerId, this.inventoryItems);
            console.log('Saved inventory to Firestore');
            return true;
        } catch (error) {
            console.error('Error saving inventory to Firestore:', error);
            // If Firestore is unavailable, do not save and return false
            // This prevents loot collection when offline
            return false;
        }
    }
    
    // Add an item to the inventory
    public async addItem(itemId: string, quantity: number = 1): Promise<boolean> {
        console.log('Adding item to inventory:', itemId, quantity);
        
        // Check if item exists in templates
        const template = ITEM_TEMPLATES[itemId];
        if (!template) {
            console.warn('Unknown item ID:', itemId);
            return false;
        }
        
        // Check if item already exists in inventory
        const existingItem = this.inventoryItems.find(item => item.id === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('Updated existing item quantity:', existingItem.quantity);
        } else {
            // Add new item to inventory
            this.inventoryItems.push({
                ...template,
                quantity: quantity
            });
            console.log('Added new item to inventory');
        }
        
        // Save inventory - if this fails, the item won't be permanently added
        const saveSuccess = await this.saveInventory();
        if (!saveSuccess) {
            // If save failed, show a warning but still allow the item to be added temporarily
            console.warn('Failed to save inventory to Firestore - item added temporarily');
            // Don't revert changes to prevent blocking gameplay
        }
        
        console.log('Added', quantity, 'of', itemId, 'to inventory. New total:', this.getItemCount(itemId));
        return true;
    }
    
    // Remove an item from the inventory
    public async removeItem(itemId: string, quantity: number = 1): Promise<boolean> {
        const itemIndex = this.inventoryItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.inventoryItems[itemIndex];
        if (item.quantity <= quantity) {
            // Remove entire item
            this.inventoryItems.splice(itemIndex, 1);
        } else {
            // Reduce quantity
            item.quantity -= quantity;
        }
        
        // Save inventory
        const saveSuccess = await this.saveInventory();
        if (!saveSuccess) {
            // If save failed, show a warning but still allow the removal to proceed
            console.warn('Failed to save inventory to Firestore - item removal applied temporarily');
            // Don't revert changes to prevent blocking gameplay
        }
        
        console.log('Removed', quantity, 'of', itemId, 'from inventory');
        return true;
    }
    
    // Use an item (for consumables)
    public async useItem(itemId: string): Promise<boolean> {
        const item = this.inventoryItems.find(item => item.id === itemId);
        if (!item || item.type !== 'consumable' || item.quantity <= 0) {
            return false;
        }
        
        // Apply item effect based on item type
        let playerManager = null;
        
        // Try to get player manager through window object (most reliable when GameScene is paused)
        if (typeof window !== 'undefined') {
            // Try gameScene first (GameScene)
            if ((window as any).gameScene && (window as any).gameScene.playerManager) {
                playerManager = (window as any).gameScene.playerManager;
            } 
            // Try explorationScene (ExplorationScene)
            else if ((window as any).explorationScene && (window as any).explorationScene.playerManager) {
                playerManager = (window as any).explorationScene.playerManager;
            }
        }
        
        // Check if we have access to player manager
        if (!playerManager) {
            console.error('Could not access PlayerManager');
            return false;
        }
        
        // Apply effect based on item type
        switch (item.id) {
            case 'health_crystal':
                if (typeof playerManager.heal === 'function') {
                    playerManager.heal(50);
                    console.log('Player healed by 50 HP using Health Crystal');
                }
                break;
                
            case 'stamina_potion':
                if (typeof playerManager.restoreStamina === 'function') {
                    playerManager.restoreStamina(30);
                    console.log('Player stamina restored by 30 points using Stamina Potion');
                }
                break;
                
            case 'speed_potion':
                if (typeof playerManager.activateSpeedBoost === 'function') {
                    playerManager.activateSpeedBoost();
                    console.log('Speed boost activated using Speed Potion');
                }
                break;
                
            default:
                console.log('Unknown consumable item used:', item.id);
                break;
        }
        
        // Remove one from inventory
        const removeSuccess = await this.removeItem(itemId, 1);
        if (!removeSuccess) {
            // If removal failed, show a warning but still apply the item effect
            console.warn('Failed to remove item from inventory - item effect still applied');
        }
        
        return true;
    }
    
    // Get item count
    public getItemCount(itemId: string): number {
        const item = this.inventoryItems.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }
    
    // Get all inventory items
    public getInventoryItems(): InventoryItem[] {
        return [...this.inventoryItems];
    }
    
    // Get item template
    public getItemTemplate(itemId: string): Omit<InventoryItem, 'quantity'> | undefined {
        return ITEM_TEMPLATES[itemId];
    }
}