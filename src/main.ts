//main.ts
import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import LoginCharacterScene from "./scenes/LoginCharacterScene"; // ✅ New Scene
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, LoginCharacterScene, GameScene, UIScene], // ✅ UIScene added
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