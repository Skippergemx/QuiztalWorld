import { Contract } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';

/**
 * Utility class to help discover token IDs in the Niftdood ERC-1155 collection
 */
export class NiftdoodTokenDiscovery {
  /**
   * Discover token IDs by checking a range of IDs
   * @param contract The Niftdood contract instance
   * @param ownerAddress The address to check for token ownership
   * @param startId The starting token ID to check
   * @param endId The ending token ID to check
   * @returns Array of token IDs that the owner has a balance for
   */
  static async discoverTokenIdsByRange(
    contract: Contract,
    ownerAddress: string,
    startId: number = 0,
    endId: number = 100
  ): Promise<number[]> {
    const foundTokenIds: number[] = [];
    
    console.log(`Discovering token IDs in range ${startId}-${endId}...`);
    
    // Use batch requests for efficiency
    const batchSize = 10;
    for (let i = startId; i <= endId; i += batchSize) {
      const batchEnd = Math.min(i + batchSize - 1, endId);
      const tokenIds = Array.from(
        { length: batchEnd - i + 1 }, 
        (_, index) => i + index
      );
      const accounts = Array(tokenIds.length).fill(ownerAddress);
      
      try {
        const balances = await contract.balanceOfBatch(accounts, tokenIds);
        
        // Check which token IDs have positive balances
        for (let j = 0; j < balances.length; j++) {
          if (balances[j] > 0n) {
            const tokenId = tokenIds[j];
            foundTokenIds.push(tokenId);
            console.log(`Found token ID ${tokenId} with balance ${balances[j]}`);
          }
        }
      } catch (error: any) {
        console.warn(`Error checking batch starting at ${i}:`, error.message || error);
        
        // Fallback to individual checks for this batch
        for (const tokenId of tokenIds) {
          try {
            const balance = await contract.balanceOf(ownerAddress, tokenId);
            if (balance > 0n) {
              foundTokenIds.push(tokenId);
              console.log(`Found token ID ${tokenId} with balance ${balance}`);
            }
          } catch (tokenError: any) {
            // Only log non-common errors
            if (tokenError.message && 
                !tokenError.message.includes('missing revert data') && 
                !tokenError.message.includes('RPC endpoint returned too many errors')) {
              console.warn(`Error checking token ID ${tokenId}:`, tokenError.message || tokenError);
            }
          }
        }
      }
    }
    
    console.log('Discovery complete. Found token IDs:', foundTokenIds);
    return foundTokenIds;
  }
  
  /**
   * Get the discovery configuration for the Niftdood collection
   * @returns The discovery configuration or null if not found
   */
  static getDiscoveryConfig() {
    const niftdoodCollection = NFT_COLLECTIONS.find(
      collection => collection.name === 'Niftdood NFT Collection'
    );
    
    if (!niftdoodCollection) {
      console.error('Niftdood collection not found in config');
      return null;
    }
    
    return {
      discoveryMethod: niftdoodCollection.discoveryMethod || 'range-check',
      discoveryRange: niftdoodCollection.discoveryRange || [0, 1, 2]
    };
  }
  
  /**
   * Discover token IDs using the configured discovery method
   * @param contract The Niftdood contract instance
   * @param ownerAddress The address to check for token ownership
   * @returns Array of token IDs that the owner has a balance for
   */
  static async discoverTokenIds(
    contract: Contract,
    ownerAddress: string
  ): Promise<number[]> {
    const config = this.getDiscoveryConfig();
    
    if (!config) {
      console.error('Could not get discovery configuration');
      return [];
    }
    
    switch (config.discoveryMethod) {
      case 'range-check':
        // Use the configured range or default to 0-10
        const [start, end] = config.discoveryRange?.length === 2 
          ? [config.discoveryRange[0], config.discoveryRange[1]] 
          : [0, 10];
        return this.discoverTokenIdsByRange(contract, ownerAddress, start, end);
      
      case 'event-scan':
        console.log('Event scanning not yet implemented');
        return [];
      
      case 'api-lookup':
        console.log('API lookup not yet implemented');
        return [];
      
      default:
        console.log(`Unknown discovery method: ${config.discoveryMethod}`);
        return [];
    }
  }
}