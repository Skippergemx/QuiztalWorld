// Debug script to test NFT image URL generation and loading

// Mock the OptimizedNFTService for testing
class MockOptimizedNFTService {
  constructor() {
    this.IPFS_GATEWAYS = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];
  }

  async convertIPFSToHTTPWithFallback(ipfsUri) {
    if (!ipfsUri.startsWith('ipfs://')) {
      return ipfsUri;
    }

    const hashAndPath = ipfsUri.slice(7);
    
    // Try each gateway in order
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const url = gateway + hashAndPath;
        console.log(`Converted: ${ipfsUri} -> ${url}`);
        return url;
      } catch (error) {
        console.log(`Gateway ${gateway} failed for ${ipfsUri}:`, error.message || error);
      }
    }
    
    // If all gateways fail, return the first one as fallback
    console.log(`All gateways failed for ${ipfsUri}, using fallback`);
    return this.IPFS_GATEWAYS[0] + hashAndPath;
  }
}

// Test NFT data that might be causing issues
const testNFTs = [
  {
    tokenId: "0",
    image: "ipfs://QmZXWepdLNnYDZSGmb1dcXJqvPpZpvNfoFddjSPYLeBjNV/CG07.png",
    name: "Test NFT #0",
    description: "Test NFT",
    collectionType: "erc721"
  },
  {
    tokenId: "2",
    image: "ipfs://QmSomeOtherHash/image.gif",
    name: "Gemante #2",
    description: "Gemante NFT",
    collectionType: "erc1155"
  }
];

async function debugNFTImages() {
  console.log('=== Debugging NFT Image URLs ===\n');
  
  const service = new MockOptimizedNFTService();
  
  for (const nft of testNFTs) {
    console.log(`NFT Token ID: ${nft.tokenId}`);
    console.log(`Original Image URL: ${nft.image}`);
    
    try {
      const convertedUrl = await service.convertIPFSToHTTPWithFallback(nft.image);
      console.log(`Converted Image URL: ${convertedUrl}`);
      
      // Test if the URL is accessible
      console.log('Testing URL accessibility...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(convertedUrl, { 
        method: 'HEAD', 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Accessible: ${response.ok ? '✅ Yes' : '❌ No'}`);
    } catch (error) {
      console.log(`  Error: ❌ ${error.message}`);
    }
    
    console.log('---\n');
  }
  
  console.log('=== Debug Complete ===');
}

// Run the debug
debugNFTImages().catch(console.error);