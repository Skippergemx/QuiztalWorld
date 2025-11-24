import Phaser from 'phaser';
import BasePet from './BasePet';

export default class Spmech extends BasePet {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'spmech01_idle');
    }

    protected getPetType(): string {
        return 'spmech01';
    }

    protected getIdleTexture(): string {
        return 'spmech01_idle';
    }

    protected getWalkTexture(): string {
        return 'spmech01_walk';
    }

    protected createPetAnimations(): void {
        // Spmech doesn't need additional animations
    }

    protected getShoutMessages(): string[] {
        return [
            "I'm drawn to the new collection! 🌟",
            "This new NFT makes me feel special! 🔮",
            "Press 'O' to collect my gift boxes! 🎁",
            "I follow players with the new NFT! 👣",
            "My gift boxes contain Quiztals! 💰",
            "The new collection is my favorite! ✨",
            "Collect my gifts with 'O' key! ⌨️",
            "I love new collection holders! ❤️",
            "More new NFTs = More gifts! 🎁",
            "I'll come if you have the new NFT! 🔍"
        ];
    }

    protected getOfflineMessages(): string[] {
        return [
            "Network down, gifts not found! 🚫",
            "No internet, no gifts! 😢",
            "Connection lost, gift collection paused! ⏸️",
            "Offline mode: Gift collection disabled! 🔌",
            "Network error: Gifts unavailable! 📡"
        ];
    }
}