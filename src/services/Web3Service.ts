import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
    collectionType: 'erc721' | 'erc1155';  // Add this field
}

interface TokenClaimResponse {
    success: boolean;
    message: string;
    txHash?: string;
}

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private web3Modal: Web3Modal;
  private ethersProvider: ethers.providers.Web3Provider | null = null;
  
  private readonly BASE_MAINNET_ID = '0x2105';
  // Replace with your actual NFT contract address
  private readonly NFT_CONTRACT_ADDRESS = '0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334';
  private NFT_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)"
  ];
  // Add ERC1155 contract info
  private readonly GEMANTE_NFT_ADDRESS = '0xcb12994BCFeCdfa014e26C0b001FC4C2c29E2178';
  private readonly GEMANTE_NFT_ABI = [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
      "function uri(uint256 tokenId) view returns (string)"
  ];
  private isConnected: boolean = false;
  private readonly BASE_NETWORK_CONFIG = {
    chainId: this.BASE_MAINNET_ID,
    chainName: 'Base',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  };
  private readonly NETWORK_NAMES: { [key: string]: string } = {
    '0x2105': 'Base Mainnet',
    '0x14A33': 'Base Goerli',
  };

  // Update these properties to use environment variables
  private readonly QUIZTAL_TOKEN_ADDRESS = import.meta.env.VITE_QUIZTAL_TOKEN_ADDRESS;
  private readonly QUIZTAL_TOKEN_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function decimals() view returns (uint8)"
  ];
  private treasurySigner: ethers.Signer | null = null;

  constructor() {
    this.web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
      providerOptions: {
        walletconnect: {
          package: true
        }
      }
    });
  }

  async connectWallet(): Promise<{ success: boolean; message: string }> {
    try {
      const web3Provider = await this.web3Modal.connect();
      this.ethersProvider = new ethers.providers.Web3Provider(web3Provider);
      this.provider = this.ethersProvider;
      
      // Check network
      const network = await this.ethersProvider.getNetwork();
      const currentChainId = '0x' + network.chainId.toString(16);
      
      if (currentChainId !== this.BASE_MAINNET_ID) {
        const switched = await this.switchToBaseNetwork();
        if (!switched) {
          return { 
            success: false, 
            message: 'Please switch to Base network to continue' 
          };
        }
      }

      this.signer = this.ethersProvider.getSigner();
      this.isConnected = true;
      
      return { 
        success: true, 
        message: 'Wallet connected successfully' 
      };
    } catch (error: any) {
      this.isConnected = false;
      this.provider = null;
      this.ethersProvider = null;
      return { 
        success: false, 
        message: error.message || 'Failed to connect wallet' 
      };
    }
  }

  async checkNFTOwnership(): Promise<{ hasNFT: boolean; error?: string }> {
    try {
      if (!this.ethersProvider || !this.signer) {
        return { 
          hasNFT: false, 
          error: 'Wallet not connected' 
        };
      }

      // Verify we're on Base network
      const network = await this.ethersProvider.getNetwork();
      if (network.chainId !== parseInt(this.BASE_MAINNET_ID, 16)) {
        return { 
          hasNFT: false, 
          error: 'Please switch to Base network' 
        };
      }

      // Get user's address
      const address = await this.signer.getAddress();
      
      // Create contract instance
      const contract = new ethers.Contract(
        this.NFT_CONTRACT_ADDRESS,
        this.NFT_ABI,
        this.ethersProvider
      );

      // Check NFT balance
      const balance = await contract.balanceOf(address);
      console.log('NFT Balance:', balance.toString()); // Debug log

      return { 
        hasNFT: balance.toNumber() > 0 
      };

    } catch (error: any) {
      console.error("NFT check error:", error);
      return { 
        hasNFT: false, 
        error: error.message || 'Failed to verify NFT ownership' 
      };
    }
  }

  private async switchToBaseNetwork(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.BASE_MAINNET_ID }],
      });

      if (this.ethersProvider) {
        const web3Provider = await this.web3Modal.connect();
        this.ethersProvider = new ethers.providers.Web3Provider(web3Provider);
        this.provider = this.ethersProvider;
      }
      return true;

    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          if (!window.ethereum) return false;
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [this.BASE_NETWORK_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Base network:', addError);
          return false;
        }
      }
      console.error('Error switching to Base network:', switchError);
      return false;
    }
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }

  async getWalletAddress(): Promise<string> {
    if (!this.signer) return '';
    return await this.signer.getAddress();
  }

  async disconnect() {
    await this.web3Modal.clearCachedProvider();
    this.provider = null;
    this.ethersProvider = null;
    this.signer = null;
    this.isConnected = false;
  }

  async getNetwork(): Promise<{ chainId: string; name: string }> {
    try {
      if (!this.provider || !this.ethersProvider) {
        return { chainId: '', name: '' };
      }
      
      const network = await this.ethersProvider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      
      // Use our custom network names instead of ethers default
      return {
        chainId,
        name: this.NETWORK_NAMES[chainId] || network.name
      };
    } catch (error) {
      console.error('Error getting network:', error);
      return { chainId: '', name: '' };
    }
  }

  public isWalletInstalled(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined';
  }

  public getWalletInstallLink(): string {
    // Return MetaMask install link as default
    return 'https://metamask.io/download/';
  }

  public async getNFTsData(): Promise<NFTData[]> {
    try {
      if (!this.ethersProvider || !this.signer) {
        console.log('Provider or signer not initialized');
        return [];
      }

      const address = await this.getWalletAddress();
      if (!address) {
        console.log('No wallet address available');
        return [];
      }

      // Get NFTs from both collections
      const [erc721NFTs, erc1155NFTs] = await Promise.all([
        this.getERC721NFTs(address),
        this.getERC1155NFTs(address)
      ]);

      return [...erc721NFTs, ...erc1155NFTs];
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      return [];
    }
  }

  private async getERC1155NFTs(address: string): Promise<NFTData[]> {
    try {
        if (!this.ethersProvider) {
            throw new Error('Provider not initialized');
        }
        
        // Use provider instead of signer for read operations
        const contract = new ethers.Contract(
            this.GEMANTE_NFT_ADDRESS,
            this.GEMANTE_NFT_ABI,
            this.ethersProvider
        );

        // For Gemante collection, we need to check specific token IDs
        // These are the actual token IDs that exist in the collection
        const tokenIds = [1, 2, 3, 4, 5, 6, 7, 8]; // Update with actual Gemante token IDs
        const accounts = Array(tokenIds.length).fill(address);
        
        const balances = await contract.balanceOfBatch(accounts, tokenIds);
        const nfts: NFTData[] = [];

        for (let i = 0; i < tokenIds.length; i++) {
            if (balances[i].gt(0)) {
                try {
                    const tokenId = tokenIds[i];
                    const baseUri = await contract.uri(tokenId);
                    
                    // Use direct gateway URL for better GIF support
                    const tokenUri = baseUri.replace('{id}', tokenId.toString());
                    const formattedUri = tokenUri.startsWith('ipfs://')
                        ? `https://nftstorage.link/ipfs/${tokenUri.slice(7)}`  // Changed gateway
                        : tokenUri;

                    console.log('Fetching Gemante metadata from:', formattedUri);

                    const response = await fetch(formattedUri);
                    const metadata = await response.json();

                    // Use better IPFS gateway for GIFs
                    const imageUrl = metadata.image?.startsWith('ipfs://')
                        ? `https://nftstorage.link/ipfs/${metadata.image.slice(7)}`  // Changed gateway
                        : metadata.image;

                    console.log('Gemante image URL:', imageUrl); // Debug log

                    nfts.push({
                        tokenId: tokenId.toString(),
                        image: imageUrl || '',
                        name: metadata.name || `Gemante #${tokenId}`,
                        description: metadata.description || 'Gemante NFT Collection',
                        collectionType: 'erc1155'
                    });
                } catch (error) {
                    console.warn(`Error fetching Gemante NFT metadata for token ${tokenIds[i]}:`, error);
                    continue;
                }
            }
        }

        return nfts;
    } catch (error) {
        console.error("Error fetching Gemante NFTs:", error);
        return [];
    }
  }

  private async getERC721NFTs(address: string): Promise<NFTData[]> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }
      const contract = new ethers.Contract(
        this.NFT_CONTRACT_ADDRESS,
        this.NFT_ABI,
        this.signer
      );

      // Get the balance of NFTs owned by the address
      const balance: ethers.BigNumber = await contract.balanceOf(address);
      const nfts: NFTData[] = [];

      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          const tokenId: ethers.BigNumber = await contract.tokenOfOwnerByIndex(address, i);
          const tokenUri: string = await contract.tokenURI(tokenId);
          // Handle IPFS URLs
          const formattedUri = tokenUri.startsWith('ipfs://')
            ? `https://ipfs.io/ipfs/${tokenUri.slice(7)}`
            : tokenUri;

          const response = await fetch(formattedUri);
          const metadata = await response.json();

          // Handle IPFS images
          const imageUrl = metadata.image?.startsWith('ipfs://')
            ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
            : metadata.image;

          nfts.push({
            tokenId: tokenId.toString(),
            image: imageUrl || '',
            name: metadata.name || `NFT #${tokenId}`,
            description: metadata.description || 'An ERC721 NFT',
            collectionType: 'erc721'
          });
        } catch (error) {
          console.warn(`Error fetching ERC721 NFT at index ${i}:`, error);
          continue;
        }
      }

      return nfts;
    } catch (error) {
      console.error("Error fetching ERC721 NFTs:", error);
      return [];
    }
  }

  // Update the initTreasurySigner method to use environment variable
  async initTreasurySigner() {
    try {
        // Create a read-only provider for treasury operations
        const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');

        const privateKey = import.meta.env.VITE_TREASURY_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Treasury private key not configured');
        }

        this.treasurySigner = new ethers.Wallet(privateKey, provider);
        console.log('Treasury wallet initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize treasury signer:', error);
        return false;
    }
}

  async getTokenBalance(address: string): Promise<string> {
    try {
        if (!this.ethersProvider) return '0';
        
        const contract = new ethers.Contract(
            this.QUIZTAL_TOKEN_ADDRESS,
            this.QUIZTAL_TOKEN_ABI,
            this.ethersProvider
        );

        const decimals = await contract.decimals();
        const balance = await contract.balanceOf(address);
        
        return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        return '0';
    }
  }

  async claimTokens(amount: number): Promise<TokenClaimResponse> {
    try {
        if (!this.treasurySigner || !this.ethersProvider) {
            return {
                success: false,
                message: 'Treasury wallet not initialized'
            };
        }

        const contract = new ethers.Contract(
            this.QUIZTAL_TOKEN_ADDRESS,
            this.QUIZTAL_TOKEN_ABI,
            this.treasurySigner
        );

        const decimals = await contract.decimals();
        const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);

        const userAddress = await this.getWalletAddress();
        if (!userAddress) {
            return {
                success: false,
                message: 'No wallet connected'
            };
        }

        const tx = await contract.transfer(userAddress, tokenAmount);
        await tx.wait();

        return {
            success: true,
            message: `Successfully claimed ${amount} Quiztal tokens`,
            txHash: tx.hash
        };
    } catch (error: any) {
        console.error('Error claiming tokens:', error);
        return {
            success: false,
            message: error.message || 'Failed to claim tokens'
        };
    }
  }
}