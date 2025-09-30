import Phaser from 'phaser';
import UIScene from './UIScene';

// Test class to validate UIScene mobile layout improvements
export class UISceneTest {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public testMobileLayout(): void {
    console.log("Testing UIScene mobile layout improvements...");
    
    // Test 1: Check if mobile menu is created
    try {
      const isMobile = this.scene.scale.width < 768;
      if (isMobile) {
        console.log("📱 Mobile device detected");
        
        // Check for mobile menu button
        const uiScene = this.scene as UIScene;
        if ((uiScene as any).mobileMenuButton) {
          console.log("✅ Mobile menu button created successfully");
        } else {
          console.warn("⚠️ Mobile menu button not found");
        }
        
        // Check for mobile menu panel
        if ((uiScene as any).mobileMenuPanel) {
          console.log("✅ Mobile menu panel created successfully");
        } else {
          console.warn("⚠️ Mobile menu panel not found");
        }
      } else {
        console.log("💻 Desktop device detected");
        
        // Check for desktop buttons
        const uiScene = this.scene as UIScene;
        if ((uiScene as any).headerButtons && (uiScene as any).headerButtons.length > 0) {
          console.log("✅ Desktop header buttons created successfully");
        } else {
          console.warn("⚠️ Desktop header buttons not found");
        }
      }
    } catch (error) {
      console.error("❌ Mobile layout test failed:", error);
    }
    
    // Test 2: Check balance display
    try {
      const uiScene = this.scene as UIScene;
      if ((uiScene as any).balanceText) {
        console.log("✅ Balance display created successfully");
      } else {
        console.warn("⚠️ Balance display not found");
      }
    } catch (error) {
      console.error("❌ Balance display test failed:", error);
    }
    
    // Test 3: Check footer
    try {
      const uiScene = this.scene as UIScene;
      if ((uiScene as any).footerText) {
        console.log("✅ Footer created successfully");
      } else {
        console.warn("⚠️ Footer not found");
      }
    } catch (error) {
      console.error("❌ Footer test failed:", error);
    }
    
    console.log("UIScene mobile layout test completed!");
  }
}