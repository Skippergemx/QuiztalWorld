//main.ts
import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import LoginCharacterScene from "./scenes/LoginCharacterScene";
import WalletVerificationScene from "./scenes/WalletVerificationScene";
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";
import GoogleLoginScene from "./scenes/GoogleLoginScene";
import InventoryScene from "./scenes/InventoryScene";
import TokenClaimScene from "./scenes/TokenClaimScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [
    BootScene,
    GoogleLoginScene,
    WalletVerificationScene,
    LoginCharacterScene,
    GameScene,
    UIScene,
    InventoryScene,
    TokenClaimScene
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

const game = new Phaser.Game(config);

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export default game;