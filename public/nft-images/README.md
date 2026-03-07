# Local NFT Images

This directory contains local copies of NFT images to use as fallbacks when IPFS images fail to load.

## Naming Convention
- ERC721 NFTs: `erc721-{tokenId}.png`
- ERC1155 NFTs: `erc1155-{tokenId}.png`

## File Format
All images should be in PNG format for consistency.

## Usage
The NFTDisplayManager will automatically try to load images from this directory as a fallback when IPFS loading fails.