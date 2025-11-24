import { BrowserProvider, Contract } from 'ethers';
import { 
  NFTData, 
  NFTMetadata, 
  TokenBalance, 
  NFTCollectionConfig, 
  NFTFetchOptions, 
  NFTCacheEntry 
} from '../types/nft';


// Use imported types

// Default configuration
const DEFAULT_OPTIONS: NFTFetchOptions = {
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

export class OptimizedNFTService {
  private provider: BrowserProvider | null = null;
  private cache: Map<string, NFTCacheEntry> = new Map();
  private static readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];

  private readonly IPFS_GATEWAYS = OptimizedNFTService.IPFS_GATEWAYS;

  constructor(provider: BrowserProvider | null = null) {
    this.provider = provider;
  }

  /**
   * Set the provider for the service
   */
  setProvider(provider: BrowserProvider): void {
    this.provider = provider;
  }

  /**
   * Fetch NFTs from all configured collections
   */
  async fetchNFTs(
    address: string,
    collections: NFTCollectionConfig[],
    options: NFTFetchOptions = {}
  ): Promise<NFTData[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const allNFTs: NFTData[] = [];

    // Fetch from all collections concurrently
    const collectionPromises = collections.map(collection =>
      this.fetchCollectionNFTs(address, collection, opts)
    );

    try {
      const collectionResults = await Promise.allSettled(collectionPromises);
      
      collectionResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allNFTs.push(...result.value);
        } else {
          console.warn(`Failed to fetch NFTs from collection ${collections[index].name}:`, result.reason);
        }
      });

      return allNFTs;
    } catch (error) {
      console.error('Error fetching NFTs from collections:', error);
      throw error;
    }
  }

  /**
   * Fetch NFTs from a specific collection
   */
  private async fetchCollectionNFTs(
    address: string,
    collection: NFTCollectionConfig,
    options: NFTFetchOptions
  ): Promise<NFTData[]> {
    try {
      if (collection.type === 'erc1155') {
        return await this.fetchERC1155NFTs(address, collection, options);
      } else {
        return await this.fetchERC721NFTs(address, collection, options);
      }
    } catch (error) {
      console.error(`Error fetching ${collection.type} NFTs from ${collection.address}:`, error);
      return [];
    }
  }

  /**
   * Fetch ERC1155 NFTs
   */
  private async fetchERC1155NFTs(
    address: string,
    collection: NFTCollectionConfig,
    options: NFTFetchOptions
  ): Promise<NFTData[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const contract = new Contract(
        collection.address,
        collection.abi,
        this.provider
      );

      // For collections with specific token IDs
      if (collection.tokenIds && collection.tokenIds.length > 0) {
        return await this.fetchSpecificERC1155Tokens(address, contract, collection, options);
      }

      // If no token IDs are specified, return empty array
      console.log(`No token IDs specified for ${collection.name}, returning empty array`);
      return [];
    } catch (error) {
      console.error('Error fetching ERC1155 NFTs:', error);
      return [];
    }
  }

  /**
   * Fetch specific ERC1155 tokens by ID
   */
  private async fetchSpecificERC1155Tokens(
    address: string,
    contract: Contract,
    collection: NFTCollectionConfig,
    options: NFTFetchOptions
  ): Promise<NFTData[]> {
    if (!collection.tokenIds) return [];

    try {
      // Prepare batch request for balances
      const accounts = Array(collection.tokenIds.length).fill(address);
      const balances = await contract.balanceOfBatch(accounts, collection.tokenIds);

      // Filter tokens with positive balance
      const ownedTokens: TokenBalance[] = [];
      for (let i = 0; i < collection.tokenIds.length; i++) {
        if (balances[i] > 0n) {
          ownedTokens.push({
            tokenId: collection.tokenIds[i].toString(),
            balance: balances[i],
            collectionType: 'erc1155'
          });
        }
      }

      // Fetch metadata for owned tokens concurrently
      const metadataPromises = ownedTokens.map(token =>
        this.fetchNFTMetadata(contract, token.tokenId, collection, options)
      );

      const metadataResults = await Promise.allSettled(metadataPromises);
      const nfts: NFTData[] = [];

      metadataResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const token = ownedTokens[index];
          nfts.push({
            tokenId: token.tokenId,
            image: result.value.image,
            name: result.value.name,
            description: result.value.description,
            collectionType: 'erc1155',
            contractAddress: collection.address
          });
        } else if (result.status === 'rejected') {
          console.warn(`Failed to fetch metadata for ERC1155 token ${ownedTokens[index].tokenId}:`, result.reason);
        }
      });

      return nfts;
    } catch (error) {
      console.error('Error fetching specific ERC1155 tokens:', error);
      return [];
    }
  }

  /**
   * Fetch ERC721 NFTs
   */
  private async fetchERC721NFTs(
    address: string,
    collection: NFTCollectionConfig,
    options: NFTFetchOptions
  ): Promise<NFTData[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const contract = new Contract(
        collection.address,
        collection.abi,
        this.provider
      );

      // Get balance
      const balance: bigint = await contract.balanceOf(address);
      const balanceNum = Number(balance);

      if (balanceNum === 0) {
        return [];
      }

      // Fetch all token IDs owned by the address
      const tokenIds: string[] = [];
      const tokenPromises: Promise<bigint>[] = [];

      for (let i = 0; i < Math.min(balanceNum, 100); i++) { // Limit to 100 for performance
        tokenPromises.push(contract.tokenOfOwnerByIndex(address, i));
      }

      try {
        const tokenIdResults = await Promise.allSettled(tokenPromises);
        tokenIdResults.forEach(result => {
          if (result.status === 'fulfilled') {
            tokenIds.push(result.value.toString());
          }
        });
      } catch (error) {
        console.warn('Error fetching token IDs:', error);
        return [];
      }

      // Fetch metadata for all tokens concurrently
      const metadataPromises = tokenIds.map(tokenId =>
        this.fetchNFTMetadata(contract, tokenId, collection, options)
      );

      const metadataResults = await Promise.allSettled(metadataPromises);
      const nfts: NFTData[] = [];

      metadataResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const tokenId = tokenIds[index];
          nfts.push({
            tokenId,
            image: result.value.image,
            name: result.value.name,
            description: result.value.description,
            collectionType: 'erc721',
            contractAddress: collection.address
          });
        } else if (result.status === 'rejected') {
          console.warn(`Failed to fetch metadata for ERC721 token ${tokenIds[index]}:`, result.reason);
        }
      });

      return nfts;
    } catch (error) {
      console.error('Error fetching ERC721 NFTs:', error);
      return [];
    }
  }

  /**
   * Fetch NFT metadata with retry logic and caching
   */
  private async fetchNFTMetadata(
    contract: Contract,
    tokenId: string,
    collection: NFTCollectionConfig,
    options: NFTFetchOptions
  ): Promise<NFTMetadata | null> {
    const cacheKey = `${collection.address}-${tokenId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < (options.cacheExpiry || DEFAULT_OPTIONS.cacheExpiry!)) {
        return cached.data as unknown as NFTMetadata;
      } else {
        // Expired cache entry, remove it
        this.cache.delete(cacheKey);
      }
    }

    // Try to fetch metadata with retries
    let lastError: any;
    
    for (let attempt = 0; attempt <= (options.maxRetries || DEFAULT_OPTIONS.maxRetries!); attempt++) {
      try {
        let tokenUri: string;
        
        if (collection.type === 'erc1155') {
          tokenUri = await contract.uri(tokenId);
        } else {
          tokenUri = await contract.tokenURI(tokenId);
        }

        // Handle IPFS URIs with fallback
        const httpUri = await this.convertIPFSToHTTPWithFallback(tokenUri);
        
        // Fetch metadata with timeout
        const metadata = await this.fetchWithTimeout(httpUri, options.timeout || DEFAULT_OPTIONS.timeout!);
        
        // Process and validate metadata
        const processedMetadata = await this.processMetadata(metadata, tokenId, collection);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: processedMetadata as unknown as NFTData,
          timestamp: Date.now()
        });
        
        return processedMetadata;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed for token ${tokenId}:`, error);
        
        // Wait before retry (exponential backoff)
        if (attempt < (options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    // All attempts failed
    console.error(`Failed to fetch metadata for token ${tokenId} after ${options.maxRetries || DEFAULT_OPTIONS.maxRetries} attempts:`, lastError);
    return null;
  }

  /**
   * Convert IPFS URI to HTTP URI using gateways
   */
  // private convertIPFSToHTTP(ipfsUri: string): string {
  //   if (ipfsUri.startsWith('ipfs://')) {
  //     // Use the first gateway as default
  //     return this.IPFS_GATEWAYS[0] + ipfsUri.slice(7);
  //   }
  //   return ipfsUri;
  // }

  /**
   * Convert IPFS URI to HTTP URI trying multiple gateways
   */
  private async convertIPFSToHTTPWithFallback(ipfsUri: string): Promise<string> {
    if (!ipfsUri.startsWith('ipfs://')) {
      return ipfsUri;
    }

    const hash = ipfsUri.slice(7);
    
    // Try each gateway in order
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const url = gateway + hash;
        // Test if the gateway is accessible
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          return url;
        }
      } catch (error: any) {
        // Continue to next gateway
        console.warn(`Gateway ${gateway} failed for ${ipfsUri}:`, error.message || error);
      }
    }
    
    // If all gateways fail, return the first one as fallback
    console.warn(`All gateways failed for ${ipfsUri}, using fallback`);
    return this.IPFS_GATEWAYS[0] + hash;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Process and validate metadata
   */
  private async processMetadata(metadata: any, tokenId: string, collection: NFTCollectionConfig): Promise<NFTMetadata> {
    // Ensure we have required fields
    const name = metadata.name || `${collection.name} #${tokenId}`;
    const description = metadata.description || `${collection.name} NFT`;
    
    // Process image URL with fallback
    let image = metadata.image || '';
    if (image) {
      image = await this.convertIPFSToHTTPWithFallback(image);
    }
    
    return {
      name,
      description,
      image,
      attributes: metadata.attributes || [],
      ...metadata
    };
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Convert IPFS URI to HTTP URI trying multiple gateways
   */
  public static async convertIPFSToHTTPWithFallback(ipfsUri: string): Promise<string> {
    if (!ipfsUri.startsWith('ipfs://')) {
      return ipfsUri;
    }

    const hash = ipfsUri.slice(7);
    const IPFS_GATEWAYS = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];
    
    // Try each gateway in order
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const url = gateway + hash;
        // Test if the gateway is accessible
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          return url;
        }
      } catch (error: any) {
        // Continue to next gateway
        console.warn(`Gateway ${gateway} failed for ${ipfsUri}:`, error.message || error);
      }
    }
    
    // If all gateways fail, return the first one as fallback
    console.warn(`All gateways failed for ${ipfsUri}, using fallback`);
    return IPFS_GATEWAYS[0] + hash;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
