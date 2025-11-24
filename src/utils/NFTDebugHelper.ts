import { ethers, Contract } from 'ethers';
import { NFT_COLLECTIONS } from '../config/nftCollections';

/**
 * Debug helper to find actual token IDs in an ERC-1155 collection
 * This function can be used to determine what token IDs actually exist
 * in the Niftdood collection
 */
export class NFTDebugHelper {
  static async findTokenIds(
    provider: ethers.BrowserProvider,
    contractAddress: string,
    ownerAddress: string,
    maxTokenId: number = 100
  ): Promise<number[]> {
    try {
      // Find the Niftdood collection config
      const niftdoodCollection = NFT_COLLECTIONS.find(
        collection => collection.address.toLowerCase() === contractAddress.toLowerCase()
      );
      
      if (!niftdoodCollection) {
        console.error('Niftdood collection not found in config');
        return [];
      }
      
      // Create contract instance
      const contract = new Contract(
        contractAddress,
        niftdoodCollection.abi,
        provider
      );
      
      const foundTokenIds: number[] = [];
      
      // Check token IDs from 0 to maxTokenId
      console.log(`Checking token IDs from 0 to ${maxTokenId}...`);
      
      // Use batch requests for efficiency
      const batchSize = 10;
      for (let i = 0; i <= maxTokenId; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, maxTokenId);
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
        } catch (error) {
          console.warn(`Error checking batch starting at ${i}:`, error);
          
          // Fallback to individual checks for this batch
          for (const tokenId of tokenIds) {
            try {
              const balance = await contract.balanceOf(ownerAddress, tokenId);
              if (balance > 0n) {
                foundTokenIds.push(tokenId);
                console.log(`Found token ID ${tokenId} with balance ${balance}`);
              }
            } catch (tokenError) {
              console.warn(`Error checking token ID ${tokenId}:`, tokenError);
            }
          }
        }
      }
      
      console.log('Found token IDs:', foundTokenIds);
      return foundTokenIds;
    } catch (error) {
      console.error('Error finding token IDs:', error);
      return [];
    }
  }
  
  /**
   * Simple function to check if a specific token ID exists and has balance
   */
  static async checkTokenId(
    provider: ethers.BrowserProvider,
    contractAddress: string,
    ownerAddress: string,
    tokenId: number
  ): Promise<boolean> {
    try {
      // Find the Niftdood collection config
      const niftdoodCollection = NFT_COLLECTIONS.find(
        collection => collection.address.toLowerCase() === contractAddress.toLowerCase()
      );
      
      if (!niftdoodCollection) {
        console.error('Niftdood collection not found in config');
        return false;
      }
      
      // Create contract instance
      const contract = new Contract(
        contractAddress,
        niftdoodCollection.abi,
        provider
      );
      
      const balance = await contract.balanceOf(ownerAddress, tokenId);
      console.log(`Token ID ${tokenId} balance: ${balance}`);
      
      return balance > 0n;
    } catch (error) {
      console.error(`Error checking token ID ${tokenId}:`, error);
      return false;
    }
  }
}