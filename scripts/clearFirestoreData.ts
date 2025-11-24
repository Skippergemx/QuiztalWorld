#!/usr/bin/env node

/**
 * Firestore Data Clearing Script
 * 
 * This script can be used to clear Firestore data from the command line.
 * 
 * Usage:
 *   npm run clear-db -- --playerId=PLAYER_ID [--action=ACTION]
 * 
 * Actions:
 *   - inventory: Clear only inventory data (default)
 *   - all: Clear all player data
 * 
 * Examples:
 *   npm run clear-db -- --playerId=abc123
 *   npm run clear-db -- --playerId=abc123 --action=all
 */

import { clearPlayerInventory, clearAllPlayerData } from '../src/utils/DatabaseCleanup';
import { program } from 'commander';

// Initialize commander
program
  .name('clear-firestore-data')
  .description('CLI to clear Firestore data for development')
  .version('1.0.0');

program
  .requiredOption('-p, --playerId <id>', 'Player ID to clear data for')
  .option('-a, --action <type>', 'Action to perform: inventory or all', 'inventory')
  .parse();

const options = program.opts();

async function main() {
  const { playerId, action } = options;
  
  console.log(`Clearing ${action} data for player: ${playerId}`);
  
  try {
    switch (action) {
      case 'inventory':
        await clearPlayerInventory(playerId);
        console.log('✅ Inventory data cleared successfully');
        break;
        
      case 'all':
        // Confirm before clearing all data
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question(`Are you sure you want to clear ALL data for player ${playerId}? Type 'yes' to confirm: `, async (answer: string) => {
          if (answer.toLowerCase() === 'yes') {
            await clearAllPlayerData(playerId);
            console.log('✅ All player data cleared successfully');
          } else {
            console.log('Operation cancelled');
          }
          readline.close();
        });
        break;
        
      default:
        console.error('Invalid action. Use "inventory" or "all"');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);