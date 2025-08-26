// src/utils/UITheme.ts
export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: {
      primary: string;
      secondary: string;
      overlay: string;
      card: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  gradients: {
    primary: string[];
    secondary: string[];
    accent: string[];
    dark: string[];
    glass: string[];
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      bold: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      bounce: string;
    };
  };
}

export const modernUITheme: UITheme = {
  colors: {
    primary: '#3498db',     // Modern blue
    secondary: '#2c3e50',   // Dark slate
    accent: '#f1c40f',      // Gold/yellow
    success: '#2ecc71',     // Green
    warning: '#f39c12',     // Orange
    error: '#e74c3c',       // Red
    info: '#9b59b6',        // Purple
    background: {
      primary: '#1a1a1a',   // Very dark
      secondary: '#2c2c2c',  // Dark gray
      overlay: '#000000',    // Black with opacity
      card: '#2c3e50',      // Card background
    },
    text: {
      primary: '#ffffff',    // White
      secondary: '#bdc3c7',  // Light gray
      muted: '#7f8c8d',     // Muted gray
      inverse: '#2c3e50',   // Dark for light backgrounds
    },
    border: {
      primary: '#34495e',    // Border gray
      secondary: '#7f8c8d',  // Lighter border
      accent: '#3498db',     // Accent border
    },
  },
  gradients: {
    primary: ['#3498db', '#2980b9'],     // Blue gradient
    secondary: ['#2c3e50', '#34495e'],   // Dark gradient
    accent: ['#f1c40f', '#f39c12'],      // Gold gradient
    dark: ['#1a1a1a', '#2c2c2c'],        // Dark gradient
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'], // Glass effect
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Arial, sans-serif',
      mono: '"Fira Code", "SF Mono", Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '600',
    },
  },
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.1)',
    md: '0 4px 8px rgba(0,0,0,0.15)',
    lg: '0 8px 16px rgba(0,0,0,0.2)',
    glow: '0 0 20px rgba(52, 152, 219, 0.3)',
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'Power2.easeIn',
      easeOut: 'Power2.easeOut',
      easeInOut: 'Power2.easeInOut',
      bounce: 'Bounce.easeOut',
    },
  },
};

export class UIHelpers {
  /**
   * Convert hex color to number for Phaser
   */
  static hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', '0x'));
  }

  /**
   * Get responsive spacing based on device type
   */
  static getResponsiveSpacing(isMobile: boolean, desktop: number, mobile?: number): number {
    return isMobile ? (mobile || desktop * 0.75) : desktop;
  }

  /**
   * Get responsive font size
   */
  static getResponsiveFontSize(isMobile: boolean, desktopSize: string): string {
    const size = parseInt(desktopSize);
    return isMobile ? `${Math.max(size - 2, 12)}px` : desktopSize;
  }

  /**
   * Create gradient fill for graphics object
   */
  static createGradientFill(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    colors: string[],
    vertical: boolean = true
  ): void {
    const color1 = UIHelpers.hexToNumber(colors[0]);
    const color2 = UIHelpers.hexToNumber(colors[1]);
    
    if (vertical) {
      graphics.fillGradientStyle(color1, color1, color2, color2, 1);
    } else {
      graphics.fillGradientStyle(color1, color2, color1, color2, 1);
    }
    graphics.fillRoundedRect(x, y, width, height, modernUITheme.borderRadius.md);
  }

  /**
   * Create glass morphism effect
   */
  static createGlassMorphism(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha: number = 0.1
  ): Phaser.GameObjects.Graphics {
    const glass = scene.add.graphics();
    glass.fillStyle(0xffffff, alpha);
    glass.fillRoundedRect(x, y, width, height, modernUITheme.borderRadius.lg);
    glass.lineStyle(1, 0xffffff, 0.2);
    glass.strokeRoundedRect(x, y, width, height, modernUITheme.borderRadius.lg);
    return glass;
  }

  /**
   * Add glow effect to game object
   */
  static addGlow(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    color: string = modernUITheme.colors.accent,
    intensity: number = 0.3
  ): void {
    // This would typically require a shader or post-processing pipeline
    // For now, we'll simulate with a scaled shadow effect
    if (target instanceof Phaser.GameObjects.Container) {
      const glow = scene.add.graphics();
      glow.fillStyle(UIHelpers.hexToNumber(color), intensity);
      glow.fillCircle(0, 0, 10);
      glow.setBlendMode(Phaser.BlendModes.SCREEN);
      target.add(glow);
      target.sendToBack(glow);
    }
  }
}

export default modernUITheme;