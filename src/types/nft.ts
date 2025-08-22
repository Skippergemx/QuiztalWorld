export interface NFTData {
  tokenId: string;
  image: string;
  name: string;
  description: string;
  collectionType: 'erc721' | 'erc1155';
}