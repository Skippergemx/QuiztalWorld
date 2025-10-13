export interface NFTData {
  tokenId: string;
  image: string;
  name: string;
  description: string;
  collectionType: 'erc721' | 'erc1155';
  attributes?: NFTAttribute[];
  externalUrl?: string;
  backgroundColor?: string;
  timestamp?: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: NFTAttribute[];
  external_url?: string;
  background_color?: string;
  [key: string]: any;
}

export interface TokenBalance {
  tokenId: string;
  balance: bigint;
  collectionType: 'erc721' | 'erc1155';
}

export interface NFTCollectionConfig {
  address: string;
  abi: string[];
  type: 'erc721' | 'erc1155';
  name: string;
  tokenIds?: number[]; // For collections with specific token IDs
}

export interface NFTFetchOptions {
  maxRetries?: number;
  timeout?: number;
  cacheExpiry?: number; // in milliseconds
}

export interface NFTCacheEntry {
  data: NFTData;
  timestamp: number;
}