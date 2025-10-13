import { NFTCollectionConfig } from '../types/nft';

// NFT Collection Configuration
// This file defines all the NFT collections that the game recognizes

export const NFT_COLLECTIONS: NFTCollectionConfig[] = [
  {
    address: '0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334',
    abi: [
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)"
    ],
    type: 'erc721',
    name: 'Quiztal NFT Collection'
  },
  {
    address: '0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178',
    abi: [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
      "function uri(uint256 tokenId) view returns (string)"
    ],
    type: 'erc1155',
    name: 'Gemante NFT Collection',
    tokenIds: [2, 3, 4] // Based on memory, only these token IDs have been minted
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