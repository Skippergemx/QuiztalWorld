//main.ts
import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import CharacterSelectionScene from "./scenes/CharacterSelectionScene";
// WalletVerificationScene removed from game flow
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";
import GoogleLoginScene from "./scenes/GoogleLoginScene";
import InventoryScene from "./scenes/InventoryScene";
import TokenClaimScene from "./scenes/TokenClaimScene";
import GuideBookScene from "./scenes/GuideBookScene"; // Added GuideBookScene import
import WalletWindowScene from "./scenes/WalletWindowScene";
// NFTWindowScene import removed as it's been integrated into WalletWindowScene

// Enhanced mobile detection that differentiates between actual mobile devices and desktop simulators
function isMobile(): boolean {
  // Use the more accurate detection for actual mobile devices
  return isActualMobileDevice();
}

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
    // WalletVerificationScene removed from game flow
    CharacterSelectionScene,
    GameScene,
    UIScene,
    InventoryScene,
    TokenClaimScene,
    GuideBookScene, // Added GuideBookScene to scene list
    WalletWindowScene,
    // NFTWindowScene removed as it's been integrated into WalletWindowScene
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
if (isActualMobileDevice()) {
  // Request landscape orientation for mobile devices
  requestLandscapeOrientation();
  
  // Enhanced orientation change handling with better timing
  window.addEventListener("orientationchange", () => {
    // Add visual feedback during orientation change
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
      loadingElement.textContent = 'Adjusting layout...';
    }
    
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setTimeout(() => {
        handleResize();
        
        // Hide loading indicator after a short delay
        setTimeout(() => {
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
        }, 300);
      }, 50); // Reduced delay for faster response
    });
  });
  
  // Prevent iOS Safari bounce effect
  document.body.addEventListener('touchmove', (e) => {
    // Only prevent default on touchmove events that are not scrollable
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Additional handling for screen size changes that might not trigger orientationchange
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    // Check if this is likely an orientation change
    if (Math.abs(currentWidth - lastWidth) > 100 || Math.abs(currentHeight - lastHeight) > 100) {
      // Add visual feedback
      const loadingElement = document.getElementById('loading');
      if (loadingElement) {
        loadingElement.style.display = 'block';
        loadingElement.textContent = 'Adjusting layout...';
      }
      
      setTimeout(() => {
        handleResize();
        
        // Hide loading indicator
        setTimeout(() => {
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
        }, 300);
      }, 50);
    }
    
    lastWidth = currentWidth;
    lastHeight = currentHeight;
  });
}

// Function to request landscape orientation for mobile devices
async function requestLandscapeOrientation() {
  try {
    // Check if screen.orientation is available (modern browsers)
    const orientation = screen.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      // Try to lock to landscape mode
      await orientation.lock('landscape');
      console.log('Screen orientation locked to landscape');
    } else if ((window as any).OrientationLock) {
      // Fallback for older iOS versions that support OrientationLock API
      await (window as any).OrientationLock.lock('landscape');
      console.log('Screen orientation locked to landscape (fallback)');
    } else {
      console.log('Screen orientation locking not supported');
    }
  } catch (error) {
    console.log('Failed to lock screen orientation:', error);
  }
}

// Function to detect if this is an actual mobile device (not a desktop simulator)
function isActualMobileDevice(): boolean {
  // Check for touch support and mobile user agent
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Additional checks to differentiate from desktop simulators
  const isPortrait = window.innerWidth < window.innerHeight;
  const isSmallScreen = window.innerWidth < 1024;
  
  // Return true only if it's a touch device with mobile UA OR a small touch device
  return (hasTouch && isMobileUA) || (hasTouch && isSmallScreen && isPortrait);
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