export interface MonsterDrop {
    itemId: string;        // Reference to item ID
    chance: number;        // Drop chance percentage (0-100)
    minQuantity: number;   // Minimum quantity
    maxQuantity: number;   // Maximum quantity
  }
  
  export interface MonsterDropConfig {
    monsterType: string;   // 'mobster' or 'mobster02'
    drops: MonsterDrop[];
  }