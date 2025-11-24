import { NFTCollectionConfig } from '../types/nft';

// NFT Collection Configuration
// This file defines all the NFT collections that the game recognizes

export const NFT_COLLECTIONS: NFTCollectionConfig[] = [
  {
    address: '0xAf09f5FD0eff57cF560e680dbf25dA85E8a5795C',
    abi: [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
      "function uri(uint256 tokenId) view returns (string)",
      "function totalSupply() view returns (uint256)"
    ],
    type: 'erc1155',
    name: 'Niftdood NFT Collection',
    // Based on the Mint.Club contract, all Niftdood tokens use tokenId = 0
    tokenIds: [0]
  },
  {
    address: '0x9C72E49d9E2DfdFE2224E8a2530F0D30174b7758',
    abi: [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
      "function uri(uint256 tokenId) view returns (string)",
      "function totalSupply() view returns (uint256)"
    ],
    type: 'erc1155',
    name: 'New NFT Collection',
    // Assuming this follows the same pattern as Niftdood with tokenId = 0
    tokenIds: [0]
  }
];

// Network configuration
export const NFT_NETWORK_CONFIG = {
  chainId: '0x2105', // Base Mainnet
  chainName: 'Base',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
};