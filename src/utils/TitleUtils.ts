import { NFTData } from "../types/nft";

export interface TitleConfig {
    text: string;
    color: string;
    glowColor: string;
    auraColor: string;  // Add aura color for animation
}

export function getPlayerTitle(nfts: NFTData[]): TitleConfig {
    const hasCrystGuard = nfts.some(nft => nft.collectionType === 'erc721');
    const hasGemante = nfts.some(nft => nft.collectionType === 'erc1155');

    if (hasCrystGuard && hasGemante) {
        return {
            text: 'Quiztal Master',
            color: '#ffd700',
            glowColor: '#ff8c00',
            auraColor: '#ffa500'  // Orange aura
        };
    } else if (hasCrystGuard) {
        return {
            text: 'Quiztal Master',
            color: '#4169e1',
            glowColor: '#1e90ff',
            auraColor: '#00bfff'  // Deep sky blue aura
        };
    } else if (hasGemante) {
        return {
            text: 'Gemante Wielder',
            color: '#9932cc',
            glowColor: '#8a2be2',
            auraColor: '#9400d3'  // Violet aura
        };
    }

    return {
        text: '',
        color: '#ffffff',
        glowColor: '#000000',
        auraColor: '#ffffff'
    };
}