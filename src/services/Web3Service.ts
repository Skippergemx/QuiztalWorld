import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
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
      
      const contract = new ethers.Contract(
        this.NFT_CONTRACT_ADDRESS,
        this.NFT_ABI,
        this.signer
      );
      
      const address = await this.getWalletAddress();
      if (!address) {
        console.log('No wallet address available');
        return [];
      }

      const balance = await contract.balanceOf(address);
      console.log('NFT Balance:', balance.toString());
      
      const nfts: NFTData[] = [];
      
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          console.log(`Fetching NFT ${i + 1}/${balance}, TokenID: ${tokenId}`);
          
          const uri = await contract.tokenURI(tokenId);
          console.log(`Token URI: ${uri}`);
          
          // Handle IPFS URLs
          const formattedUri = uri.startsWith('ipfs://')
            ? `https://ipfs.io/ipfs/${uri.slice(7)}`
            : uri;

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
            description: metadata.description || 'No description available'
          });
        } catch (error) {
          console.warn(`Error fetching NFT at index ${i}:`, error);
          continue;
        }
      }
      
      console.log(`Successfully fetched ${nfts.length} NFTs`);
      return nfts;
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      return [];
    }
  }
}