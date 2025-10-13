// Script to verify NFT holdings for a specific wallet address
// This script checks if a wallet has NFTs from our collections on Base network

const walletAddress = '0x97Ec3CC66fB5689D56d6B9DD8c17f9d8a7a4f7FB';

console.log('=== NFT Wallet Verification ===');
console.log(`Checking wallet: ${walletAddress}`);
console.log('Network: Base Mainnet\n');

// NFT Collection Information
const collections = [
  {
    name: 'Quiztal NFT Collection',
    address: '0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334',
    type: 'ERC721',
    explorerUrl: 'https://basescan.org/token/0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334'
  },
  {
    name: 'Gemante NFT Collection',
    address: '0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178',
    type: 'ERC1155',
    explorerUrl: 'https://basescan.org/token/0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178',
    tokenIds: [2, 3, 4]
  }
];

console.log('NFT Collections to check:');
collections.forEach((collection, index) => {
  console.log(`${index + 1}. ${collection.name} (${collection.type})`);
  console.log(`   Contract: ${collection.address}`);
  console.log(`   Explorer: ${collection.explorerUrl}`);
  if (collection.tokenIds) {
    console.log(`   Token IDs: ${collection.tokenIds.join(', ')}`);
  }
  console.log('');
});

console.log('=== Verification Instructions ===');
console.log('To manually verify NFT holdings:');
console.log('');
console.log('1. Quiztal NFT Collection (ERC721):');
console.log(`   - Visit: https://basescan.org/token/0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334`);
console.log(`   - Click on the "Read Contract" tab`);
console.log(`   - Find the "balanceOf" function`);
console.log(`   - Enter wallet address: ${walletAddress}`);
console.log(`   - Click "Query" to see balance`);
console.log(`   - If balance > 0, find "tokenOfOwnerByIndex" function`);
console.log(`   - Query token IDs with index 0, 1, 2, etc. up to (balance-1)`);
console.log('');
console.log('2. Gemante NFT Collection (ERC1155):');
console.log(`   - Visit: https://basescan.org/token/0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178`);
console.log(`   - Click on the "Read Contract" tab`);
console.log(`   - Find the "balanceOf" function`);
console.log(`   - Enter wallet address: ${walletAddress}`);
console.log(`   - Enter token ID: 2 (repeat for 3 and 4)`);
console.log(`   - Click "Query" to see balance for each token ID`);
console.log('');
console.log('=== Expected Results ===');
console.log('Based on our memory information:');
console.log('- Only token IDs [2, 3, 4] have been minted for Gemante collection');
console.log('- If the wallet has no NFTs from either collection, it will show balance 0');
console.log('');
console.log('=== Alternative Verification ===');
console.log('You can also check using a blockchain explorer that supports NFTs:');
console.log('- Open https://basescan.org/address/0x97Ec3CC66fB5689D56d6B9DD8c17f9d8a7a4f7FB');
console.log('- Look for "ERC-721 Token Transfers" and "ERC-1155 Token Transfers" sections');
console.log('- This will show all NFT transactions for this wallet');