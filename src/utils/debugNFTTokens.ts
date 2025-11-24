/**
 * Debug script to find actual token IDs in the Niftdood ERC-1155 collection
 * 
 * To use this script:
 * 1. Make sure you have a wallet connected to the Base network
 * 2. Run this script from the browser console or as part of the app
 * 3. Check the console output for found token IDs
 */

import { NFTDebugHelper } from './NFTDebugHelper';
import { Web3Service } from '../services/Web3Service';

async function debugNFTTokens() {
  try {
    console.log('Starting Niftdood NFT token ID discovery...');
    
    // Initialize Web3 service
    const web3Service = new Web3Service();
    
    // Check if wallet is connected
    if (!web3Service.isWalletConnected()) {
      console.log('Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    // Get provider and signer
    // Note: This is a simplified approach. In practice, you'd get these from the existing web3Service instance
    const provider = (web3Service as any).provider;
    const signer = (web3Service as any).signer;
    
    if (!provider || !signer) {
      console.log('Provider or signer not available');
      return;
    }
    
    // Get user's address
    const address = await signer.getAddress();
    console.log('Checking NFTs for address:', address);
    
    // Niftdood contract address
    const contractAddress = '0xAf09f5FD0eff57cF560e680dbf25dA85E8a5795C';
    
    // Find token IDs
    const tokenIds = await NFTDebugHelper.findTokenIds(
      provider,
      contractAddress,
      address,
      50 // Check token IDs 0-50
    );
    
    console.log('Discovered token IDs:', tokenIds);
    
    if (tokenIds.length > 0) {
      console.log('Found the following token IDs in your Niftdood collection:');
      tokenIds.forEach(id => console.log(`  - Token ID: ${id}`));
    } else {
      console.log('No Niftdood tokens found in token IDs 0-50');
      console.log('Try checking a larger range or specific token IDs');
    }
  } catch (error) {
    console.error('Error during NFT token discovery:', error);
  }
}

// Run the debug function
// debugNFTTokens();

export { debugNFTTokens };