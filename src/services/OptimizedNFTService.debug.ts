import { BrowserProvider, Contract } from 'ethers';
import { 
  NFTData, 
  NFTMetadata, 
  TokenBalance, 
  NFTCollectionConfig, 
  NFTFetchOptions, 
  NFTCacheEntry 
} from '../types/nft';

// Default configuration
const DEFAULT_OPTIONS: NFTFetchOptions = {
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

export class OptimizedNFTServiceDebug {
  private provider: BrowserProvider | null = null;
  private cache: Map<string, NFTCacheEntry> = new Map();
  private readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];
  private debugMode: boolean = true;

  constructor(provider: BrowserProvider | null = null, debugMode: boolean = true) {
    this.provider = provider;
    this.debugMode = debugMode;
    this.debugLog('OptimizedNFTServiceDebug initialized');
  }

  /**
   * Set the provider for the service
   */
  setProvider(provider: BrowserProvider): void {
    this.provider = provider;
    this.debugLog('Provider updated');
  }

  /**
   * Enable or disable debug logging
   */
  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
  }

  /**
   * Fetch NFTs from all configured collections
   */
  async fetchNFTs(
    address: string,
    collections: NFTCollectionConfig[],
    options: NFTFetchOptions = {}
  ): Promise<NFTData[]> {
    this.debugLog(`Fetching NFTs for address: ${address}`);
    this.debugLog(`Collections to check: ${collections.length}`);

    if (!this.provider) {
      this.debugLog('Error: Provider not initialized');
      throw new Error('Provider not initialized');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const allNFTs: NFTData[] = [];

    // Fetch from all collections concurrently
    const collectionPromises = collections.map(collection =>
      this.fetchCollectionNFTs(address, collection, opts)
    );

    try {
      this.debugLog('Starting concurrent collection fetches');
      const collectionResults = await Promise.allSettled(collectionPromises);
      
      collectionResults.forEach((result, index) => {
        const collection = collections[index];
        if (result.status === 'fulfilled') {
          this.debugLog(`Successfully fetched ${result.value.length} NFTs from ${collection.name}`);
          allNFTs.push(...result.value);
        } else {
          this.debugLog(`Failed to fetch NFTs from ${collection.name}:`, result.reason);
        }
      });

      this.debugLog(`Total NFTs fetched: ${allNFTs.length}`);
      return allNFTs;
    } catch (error) {
      this.debugLog('Error fetching NFTs from collections:', error);
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
    this.debugLog(`Fetching ${collection.type} NFTs from ${collection.name} (${collection.address}) for ${address}`);

    try {
      if (collection.type === 'erc1155') {
        return await this.fetchERC1155NFTs(address, collection, options);
      } else {
        return await this.fetchERC721NFTs(address, collection, options);
      }
    } catch (error) {
      this.debugLog(`Error fetching ${collection.type} NFTs from ${collection.address}:`, error);
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
    this.debugLog(`Fetching ERC1155 NFTs for ${address} from ${collection.address}`);

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
        this.debugLog(`Checking specific token IDs: ${collection.tokenIds.join(', ')}`);
        return await this.fetchSpecificERC1155Tokens(address, contract, collection, options);
      }

      // For collections where we need to discover token IDs
      this.debugLog('No specific token IDs provided for ERC1155 collection');
      return [];
    } catch (error) {
      this.debugLog('Error fetching ERC1155 NFTs:', error);
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

    this.debugLog(`Fetching specific ERC1155 tokens for ${address}`);

    try {
      // Prepare batch request for balances
      const accounts = Array(collection.tokenIds.length).fill(address);
      this.debugLog(`Checking balances for ${accounts.length} accounts with token IDs: ${collection.tokenIds.join(', ')}`);
      
      const balances = await contract.balanceOfBatch(accounts, collection.tokenIds);
      this.debugLog(`Received balances: ${balances.map((b: any) => b.toString()).join(', ')}`);

      // Filter tokens with positive balance
      const ownedTokens: TokenBalance[] = [];
      for (let i = 0; i < collection.tokenIds.length; i++) {
        if (balances[i] > 0n) {
          ownedTokens.push({
            tokenId: collection.tokenIds[i].toString(),
            balance: balances[i],
            collectionType: 'erc1155'
          });
          this.debugLog(`Found owned token: #${collection.tokenIds[i]} with balance ${balances[i].toString()}`);
        }
      }

      this.debugLog(`Found ${ownedTokens.length} owned ERC1155 tokens`);

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
            collectionType: 'erc1155'
          });
          this.debugLog(`Successfully processed metadata for token #${token.tokenId}`);
        } else if (result.status === 'rejected') {
          this.debugLog(`Failed to fetch metadata for ERC1155 token ${ownedTokens[index].tokenId}:`, result.reason);
        }
      });

      this.debugLog(`Returning ${nfts.length} ERC1155 NFTs`);
      return nfts;
    } catch (error) {
      this.debugLog('Error fetching specific ERC1155 tokens:', error);
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
    this.debugLog(`Fetching ERC721 NFTs for ${address} from ${collection.address}`);

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

      this.debugLog(`ERC721 balance for ${address}: ${balance.toString()}`);

      if (balanceNum === 0) {
        this.debugLog('No ERC721 tokens found');
        return [];
      }

      // Fetch all token IDs owned by the address
      const tokenIds: string[] = [];
      const tokenPromises: Promise<bigint>[] = [];

      const checkCount = Math.min(balanceNum, 100); // Limit to 100 for performance
      this.debugLog(`Checking ${checkCount} tokens`);

      for (let i = 0; i < checkCount; i++) {
        tokenPromises.push(contract.tokenOfOwnerByIndex(address, i));
      }

      try {
        const tokenIdResults = await Promise.allSettled(tokenPromises);
        tokenIdResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            tokenIds.push(result.value.toString());
            this.debugLog(`Found token ID: ${result.value.toString()}`);
          } else {
            this.debugLog(`Failed to get token ID at index ${index}:`, result.reason);
          }
        });
      } catch (error) {
        this.debugLog('Error fetching token IDs:', error);
        return [];
      }

      this.debugLog(`Found ${tokenIds.length} ERC721 token IDs: ${tokenIds.join(', ')}`);

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
            collectionType: 'erc721'
          });
          this.debugLog(`Successfully processed metadata for token #${tokenId}`);
        } else if (result.status === 'rejected') {
          this.debugLog(`Failed to fetch metadata for ERC721 token ${tokenIds[index]}:`, result.reason);
        }
      });

      this.debugLog(`Returning ${nfts.length} ERC721 NFTs`);
      return nfts;
    } catch (error) {
      this.debugLog('Error fetching ERC721 NFTs:', error);
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
    this.debugLog(`Fetching metadata for token ${tokenId}, cache key: ${cacheKey}`);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < (options.cacheExpiry || DEFAULT_OPTIONS.cacheExpiry!)) {
        this.debugLog(`Using cached metadata for token ${tokenId}`);
        return cached.data as unknown as NFTMetadata;
      } else {
        // Expired cache entry, remove it
        this.debugLog(`Cache expired for token ${tokenId}, removing entry`);
        this.cache.delete(cacheKey);
      }
    }

    // Try to fetch metadata with retries
    let lastError: any;
    
    for (let attempt = 0; attempt <= (options.maxRetries || DEFAULT_OPTIONS.maxRetries!); attempt++) {
      if (attempt > 0) {
        this.debugLog(`Retry attempt ${attempt} for token ${tokenId}`);
      }
      
      try {
        let tokenUri: string;
        
        if (collection.type === 'erc1155') {
          tokenUri = await contract.uri(tokenId);
        } else {
          tokenUri = await contract.tokenURI(tokenId);
        }

        this.debugLog(`Token URI for ${tokenId}: ${tokenUri}`);

        // Handle IPFS URIs
        const httpUri = this.convertIPFSToHTTP(tokenUri);
        this.debugLog(`Converted URI: ${httpUri}`);
        
        // Fetch metadata with timeout
        const metadata = await this.fetchWithTimeout(httpUri, options.timeout || DEFAULT_OPTIONS.timeout!);
        this.debugLog(`Successfully fetched metadata for token ${tokenId}`);
        
        // Process and validate metadata
        const processedMetadata = await this.processMetadata(metadata, tokenId, collection);
        this.debugLog(`Processed metadata for token ${tokenId}`);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: processedMetadata as unknown as NFTData,
          timestamp: Date.now()
        });
        this.debugLog(`Cached metadata for token ${tokenId}`);
        
        return processedMetadata;
      } catch (error) {
        lastError = error;
        this.debugLog(`Attempt ${attempt + 1} failed for token ${tokenId}:`, error);
        
        // Wait before retry (exponential backoff)
        if (attempt < (options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
          const waitTime = Math.pow(2, attempt) * 1000;
          this.debugLog(`Waiting ${waitTime}ms before retry`);
          await this.sleep(waitTime);
        }
      }
    }
    
    // All attempts failed
    this.debugLog(`Failed to fetch metadata for token ${tokenId} after ${options.maxRetries || DEFAULT_OPTIONS.maxRetries} attempts:`, lastError);
    return null;
  }

  /**
   * Convert IPFS URI to HTTP URI using gateways
   */
  private convertIPFSToHTTP(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      // Use the first gateway as default
      const converted = this.IPFS_GATEWAYS[0] + ipfsUri.slice(7);
      this.debugLog(`Converted IPFS URI: ${ipfsUri} -> ${converted}`);
      return converted;
    }
    this.debugLog(`URI is already HTTP: ${ipfsUri}`);
    return ipfsUri;
  }

  /**
   * Convert IPFS URI to HTTP URI trying multiple gateways
   */
  private async convertIPFSToHTTPWithFallback(ipfsUri: string): Promise<string> {
    if (!ipfsUri.startsWith('ipfs://')) {
      return ipfsUri;
    }

    const hashAndPath = ipfsUri.slice(7); // Remove 'ipfs://' prefix
    
    // Try each gateway in order
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const url = gateway + hashAndPath;
        // For image URLs, we don't need to test with HEAD request as it might not work
        // Just return the converted URL
        this.debugLog(`Converted IPFS URI: ${ipfsUri} -> ${url}`);
        return url;
      } catch (error: any) {
        // Continue to next gateway
        this.debugLog(`Gateway ${gateway} failed for ${ipfsUri}:`, error.message || error);
      }
    }
    
    // If all gateways fail, return the first one as fallback
    this.debugLog(`All gateways failed for ${ipfsUri}, using fallback`);
    return this.IPFS_GATEWAYS[0] + hashAndPath;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<any> {
    this.debugLog(`Fetching with timeout (${timeout}ms): ${url}`);
    
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
      
      const data = await response.json();
      this.debugLog(`Successfully fetched data from ${url}`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.debugLog(`Fetch failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Process and validate metadata
   */
  private async processMetadata(metadata: any, tokenId: string, collection: NFTCollectionConfig): Promise<NFTMetadata> {
    this.debugLog(`Processing metadata for token ${tokenId} in ${collection.name}`);
    
    // Ensure we have required fields
    const name = metadata.name || `${collection.name} #${tokenId}`;
    const description = metadata.description || `${collection.name} NFT`;
    
    // Process image URL with fallback
    let image = metadata.image || '';
    if (image) {
      image = await this.convertIPFSToHTTPWithFallback(image);
    }
    
    this.debugLog(`Processed metadata - Name: ${name}, Image: ${image.substring(0, 100)}...`);
    
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
    this.debugLog(`Sleeping for ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.debugLog(`Clearing cache (${this.cache.size} entries)`);
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Debug logging function
   */
  private debugLog(...messages: any[]): void {
    if (this.debugMode) {
      console.log('[OptimizedNFTServiceDebug]', ...messages);
    }
  }
}