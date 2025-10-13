// Robust script to check wallet NFT holdings using ethers.js
// This version includes better error handling and clearer output

import { ethers } from 'ethers';

// Wallet address to check
const walletAddress = '0x97Ec3CC66fB5689D56d6B9DD8c17f9d8a7a4f7FB';

// NFT Collection Information
const collections = [
  {
    name: 'Quiztal NFT Collection',
    address: '0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334',
    type: 'ERC721',
    abi: [
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
      "function tokenURI(uint256 tokenId) view returns (string)"
    ]
  },
  {
    name: 'Gemante NFT Collection',
    address: '0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178',
    type: 'ERC1155',
    abi: [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
      "function uri(uint256 tokenId) view returns (string)"
    ],
    tokenIds: [2, 3, 4]
  }
];

async function checkWalletNFTs() {
  console.log('=== Checking Wallet NFT Holdings ===');
  console.log(`Wallet Address: ${walletAddress}`);
  console.log('Network: Base Mainnet\n');

  // Connect to Base network
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

  try {
    // Check each collection
    for (const collection of collections) {
      console.log(`\n--- ${collection.name} (${collection.type}) ---`);
      console.log(`Contract: ${collection.address}`);

      try {
        const contract = new ethers.Contract(collection.address, collection.abi, provider);

        if (collection.type === 'ERC721') {
          // Check ERC721 balance
          const balance = await contract.balanceOf(walletAddress);
          console.log(`Balance: ${balance.toString()}`);

          if (balance > 0n) {
            console.log('Token IDs:');
            const tokenIds = [];
            for (let i = 0; i < Number(balance); i++) {
              try {
                const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
                tokenIds.push(tokenId.toString());
                console.log(`  #${tokenId.toString()}`);
              } catch (error) {
                console.log(`  Error getting token at index ${i}:`, error.message.substring(0, 50) + '...');
              }
            }
            console.log(`Found ${tokenIds.length} tokens: ${tokenIds.join(', ')}`);
          } else {
            console.log('No tokens found in this collection.');
          }
        } else if (collection.type === 'ERC1155') {
          // Check ERC1155 balances
          try {
            const accounts = Array(collection.tokenIds.length).fill(walletAddress);
            const balances = await contract.balanceOfBatch(accounts, collection.tokenIds);
            
            console.log('Token Balances:');
            let totalBalance = 0n;
            for (let i = 0; i < collection.tokenIds.length; i++) {
              const tokenId = collection.tokenIds[i];
              const balance = balances[i];
              totalBalance += BigInt(balance);
              console.log(`  #${tokenId}: ${balance.toString()}`);
            }
            console.log(`Total balance: ${totalBalance.toString()}`);
          } catch (batchError) {
            console.log('Error checking batch balances:', batchError.message.substring(0, 100) + '...');
            console.log('Trying individual token checks...');
            
            // Fallback to individual checks
            let totalBalance = 0n;
            for (const tokenId of collection.tokenIds) {
              try {
                const balance = await contract.balanceOf(walletAddress, tokenId);
                totalBalance += BigInt(balance);
                console.log(`  #${tokenId}: ${balance.toString()}`);
              } catch (individualError) {
                console.log(`  Error checking token #${tokenId}:`, individualError.message.substring(0, 50) + '...');
              }
            }
            console.log(`Total balance (individual checks): ${totalBalance.toString()}`);
          }
        }
      } catch (contractError) {
        console.log('Error creating contract or checking balances:', contractError.message.substring(0, 100) + '...');
      }
    }

    console.log('\n=== Verification Complete ===');
    console.log('\nIf you are not seeing these NFTs in the game:');
    console.log('1. Make sure you are connected to the Base Mainnet network');
    console.log('2. Verify that the game is using the correct wallet address');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Clear browser cache and try again');
    console.log('5. Ensure the NFT detection system is properly integrated');
    
  } catch (error) {
    console.error('Error checking wallet NFTs:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the Base network RPC endpoint is accessible');
    console.log('3. Ensure the contract addresses are correct');
  }
}

// Run the check
checkWalletNFTs().catch(console.error);