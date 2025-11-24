/**
 * Database Cleanup Utility
 * 
 * This utility provides functions to clear Firestore data for development and testing purposes.
 * 
 * WARNING: These functions will permanently delete data from Firestore.
 * Only use in development environments or when you really need to reset player data.
 */

import { 
  clearInventoryFromDatabase, 
  clearAllPlayerDataFromDatabase 
} from './Database';

/**
 * Clear inventory data for a specific player
 * @param playerId The player's unique ID
 */
export async function clearPlayerInventory(playerId: string): Promise<void> {
  if (!playerId) {
    throw new Error('Player ID is required');
  }
  
  try {
    await clearInventoryFromDatabase(playerId);
    console.log(`✅ Inventory cleared for player: ${playerId}`);
  } catch (error) {
    console.error(`❌ Failed to clear inventory for player ${playerId}:`, error);
    throw error;
  }
}

/**
 * Clear all data for a specific player
 * @param playerId The player's unique ID
 */
export async function clearAllPlayerData(playerId: string): Promise<void> {
  if (!playerId) {
    throw new Error('Player ID is required');
  }
  
  try {
    await clearAllPlayerDataFromDatabase(playerId);
    console.log(`✅ All data cleared for player: ${playerId}`);
  } catch (error) {
    console.error(`❌ Failed to clear all data for player ${playerId}:`, error);
    throw error;
  }
}

/**
 * Clear data for multiple players
 * @param playerIds Array of player IDs to clear data for
 * @param clearAllData Whether to clear all data (true) or just inventory (false)
 */
export async function clearMultiplePlayersData(
  playerIds: string[], 
  clearAllData: boolean = false
): Promise<void> {
  if (!playerIds || playerIds.length === 0) {
    throw new Error('At least one player ID is required');
  }
  
  console.log(`Starting to clear data for ${playerIds.length} players...`);
  
  for (const playerId of playerIds) {
    try {
      if (clearAllData) {
        await clearAllPlayerData(playerId);
      } else {
        await clearPlayerInventory(playerId);
      }
    } catch (error) {
      console.error(`❌ Failed to clear data for player ${playerId}:`, error);
      // Continue with other players even if one fails
    }
  }
  
  console.log('Finished clearing data for all players');
}

// Example usage (commented out):
/*
// To clear inventory for a specific player:
// clearPlayerInventory('player-uid-here');

// To clear all data for a specific player:
// clearAllPlayerData('player-uid-here');

// To clear inventory for multiple players:
// clearMultiplePlayersData(['player1-uid', 'player2-uid', 'player3-uid']);

// To clear all data for multiple players:
// clearMultiplePlayersData(['player1-uid', 'player2-uid'], true);
*/