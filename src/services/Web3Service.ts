import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

export class Web3Service {
  private web3Modal: Web3Modal;
  private provider: any;
  private ethersProvider: ethers.providers.Web3Provider | null = null;
  private signer: any;
  private readonly BASE_MAINNET_ID = '0x2105';
  // Replace with your actual NFT contract address
  private readonly NFT_CONTRACT_ADDRESS = '0x927d34c13bfC41145763f7b12ceB6F93Ff3b3334';
  private NFT_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
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
      this.provider = await this.web3Modal.connect();
      this.ethersProvider = new ethers.providers.Web3Provider(this.provider);
      
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
        // Refresh provider after network switch
        this.ethersProvider = new ethers.providers.Web3Provider(this.provider);
      }

      this.signer = this.ethersProvider.getSigner();
      this.isConnected = true;
      
      return { 
        success: true, 
        message: 'Wallet connected successfully' 
      };
    } catch (error: any) {
      this.isConnected = false;
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
      if (!this.provider) return false;

      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.BASE_MAINNET_ID }],
      });

      // Refresh provider after switch
      this.ethersProvider = new ethers.providers.Web3Provider(this.provider);
      return true;

    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await this.provider.request({
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
}