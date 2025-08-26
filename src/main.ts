//main.ts
import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import CharacterSelectionScene from "./scenes/CharacterSelectionScene";
import WalletVerificationScene from "./scenes/WalletVerificationScene";
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";
import GoogleLoginScene from "./scenes/GoogleLoginScene";
import InventoryScene from "./scenes/InventoryScene";
import TokenClaimScene from "./scenes/TokenClaimScene";

// Mobile detection utility
const isMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         ('ontouchstart' in window) || 
         (window.innerWidth < 768);
};

// Get optimal game dimensions for mobile
const getGameDimensions = () => {
  const mobile = isMobile();
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (mobile) {
    // For mobile, ensure minimum playable area
    return {
      width: Math.max(width, 320), // Minimum width for mobile
      height: Math.max(height, 568) // Minimum height for mobile
    };
  }
  
  return { width, height };
};

const { width, height } = getGameDimensions();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: width,
  height: height,
  physics: {
    default: "arcade",
    arcade: { 
      debug: false,
      // Mobile performance optimizations
      tileBias: 16,
      gravity: { x: 0, y: 0 },
      checkCollision: {
        up: true,
        down: true,
        left: true,
        right: true
      }
    },
  },
  scene: [
    BootScene,
    GoogleLoginScene,
    WalletVerificationScene,
    CharacterSelectionScene,
    GameScene,
    UIScene,
    InventoryScene,
    TokenClaimScene,
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Mobile-specific scale configuration
    min: {
      width: 320,
      height: 568
    },
    max: {
      width: 2048,
      height: 2048
    }
  },
  render: {
    pixelArt: true,
    antialias: false,
    // Mobile rendering optimizations
    powerPreference: isMobile() ? 'low-power' : 'high-performance',
    batchSize: isMobile() ? 2000 : 4096,
    maxTextures: isMobile() ? 8 : 16
  },
  // Mobile input configuration
  input: {
    mouse: {
      target: null
    },
    touch: {
      target: null
    },
    gamepad: false // Disable gamepad support for performance
  },
  // Audio configuration for mobile
  audio: {
    disableWebAudio: false,
    noAudio: false
  },
  // Performance optimizations
  fps: {
    target: isMobile() ? 30 : 60, // Lower FPS target for mobile
    forceSetTimeOut: isMobile() // Use setTimeout instead of RAF on mobile
  },
  // Disable right-click context menu
  disableContextMenu: true
};

const game = new Phaser.Game(config);

// Enhanced resize handler with throttling for better mobile performance
let resizeTimeout: number;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    const { width, height } = getGameDimensions();
    game.scale.resize(width, height);
    
    // Hide loading indicator when game is ready
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }, 100); // Throttle resize events
};

window.addEventListener("resize", handleResize);

// Handle orientation changes on mobile
if (isMobile()) {
  window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 100); // Delay to ensure proper dimensions
  });
  
  // Prevent iOS Safari bounce effect
  document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
}

// Initial loading cleanup
window.addEventListener('load', () => {
  setTimeout(() => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }, 2000);
});

export default game;