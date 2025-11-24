import { NFTData } from "../types/nft";

export interface TitleConfig {
    text: string;
    color: string;
    glowColor: string;
    auraColor: string;  // Add aura color for animation
}

export function getPlayerTitle(nfts: NFTData[]): TitleConfig {
    const hasCrystGuard = nfts.some(nft => nft.collectionType === 'erc721');
    const hasNiftdood = nfts.some(nft => nft.collectionType === 'erc1155' && 
        nft.contractAddress === '0xAf09f5FD0eff57cF560e680dbf25dA85E8a5795C');
    const hasNewCollection = nfts.some(nft => nft.collectionType === 'erc1155' && 
        nft.contractAddress === '0x9C72E49d9E2DfdFE2224E8a2530F0D30174b7758');

    if (hasCrystGuard && hasNiftdood && hasNewCollection) {
        return {
            text: 'Ultimate NFT Master',
            color: '#ffd700',
            glowColor: '#ff8c00',
            auraColor: '#ffa500'  // Orange aura
        };
    } else if (hasCrystGuard && (hasNiftdood || hasNewCollection)) {
        return {
            text: 'NFT Collector',
            color: '#9b59b6',
            glowColor: '#8e44ad',
            auraColor: '#9b59b6'  // Purple aura
        };
    } else if (hasNiftdood && hasNewCollection) {
        return {
            text: 'Dual NFT Holder',
            color: '#3498db',
            glowColor: '#2980b9',
            auraColor: '#3498db'  // Blue aura
        };
    } else if (hasCrystGuard) {
        return {
            text: 'Quiztal Master',
            color: '#4169e1',
            glowColor: '#1e90ff',
            auraColor: '#00bfff'  // Deep sky blue aura
        };
    } else if (hasNiftdood) {
        return {
            text: 'Niftdood Holder',
            color: '#3498db',
            glowColor: '#2980b9',
            auraColor: '#2c3e50'  // Blue aura
        };
    } else if (hasNewCollection) {
        return {
            text: 'New Collection Holder',
            color: '#9b59b6',
            glowColor: '#8e44ad',
            auraColor: '#9b59b6'  // Purple aura
        };
    }

    return {
        text: '',
        color: '#ffffff',
        glowColor: '#000000',
        auraColor: '#ffffff'
    };
}