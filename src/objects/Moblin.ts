import Phaser from 'phaser';
import BasePet from './BasePet';

export default class Moblin extends BasePet {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'moblin_idle');
    }

    protected getPetType(): string {
        return 'moblin';
    }

    protected getIdleTexture(): string {
        return 'moblin_idle';
    }

    protected getWalkTexture(): string {
        return 'moblin_walk';
    }

    protected createPetAnimations(): void {
        // Moblin doesn't need additional animations
    }

    protected getShoutMessages(): string[] {
        return [
            "I'm drawn to Niftdood NFTs! 🌟",
            "Niftdood makes me feel special! 🔮",
            "Press 'O' to collect my gift boxes! 🎁",
            "I follow players with Niftdood NFTs! 👣",
            "My gift boxes contain Quiztals! 💰",
            "Niftdood is my favorite! ✨",
            "Collect my gifts with 'O' key! ⌨️",
            "I love Niftdood holders! ❤️",
            "More Niftdood = More gifts! 🎁",
            "I'll come if you have Niftdood! 🔍"
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