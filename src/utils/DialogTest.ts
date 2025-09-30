import Phaser from "phaser";
import { BaseDialog } from "./BaseDialog";
import { QuizResultDialog } from "./QuizResultDialog";
import { SimpleDialogBox } from "./SimpleDialogBox";
import { EnhancedQuizDialog } from "./EnhancedQuizDialog";

// Test class to verify dialog standardization
export class DialogTest {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public testAllDialogs(): void {
    console.log("Testing standardized dialog system...");
    
    // Test BaseDialog
    try {
      const baseDialog = new BaseDialog(this.scene);
      console.log("✅ BaseDialog created successfully");
      baseDialog.cleanup();
    } catch (error) {
      console.error("❌ BaseDialog test failed:", error);
    }
    
    // Test SimpleDialogBox
    try {
      const simpleDialog = SimpleDialogBox.getInstance(this.scene);
      console.log("✅ SimpleDialogBox created successfully");
      simpleDialog.cleanup();
    } catch (error) {
      console.error("❌ SimpleDialogBox test failed:", error);
    }
    
    // Test EnhancedQuizDialog
    try {
      const enhancedDialog = EnhancedQuizDialog.getInstance(this.scene);
      console.log("✅ EnhancedQuizDialog created successfully");
      enhancedDialog.cleanup();
    } catch (error) {
      console.error("❌ EnhancedQuizDialog test failed:", error);
    }
    
    // Test QuizResultDialog
    try {
      const resultDialog = new QuizResultDialog(this.scene);
      console.log("✅ QuizResultDialog created successfully");
      resultDialog.cleanup();
    } catch (error) {
      console.error("❌ QuizResultDialog test failed:", error);
    }
    
    console.log("Dialog standardization test completed!");
  }
}