import Phaser from "phaser";
import QuiztalRewardLog from "../utils/QuiztalRewardLog";

class QuiztalRewardExplorerScene extends Phaser.Scene {
    constructor() {
        super({ key: "QuiztalRewardExplorerScene" });
    }

    preload() {
        // Load any assets needed for the scene here
    }

    create() {
        const log = QuiztalRewardLog.getLog();

        // Display the log data
        let yOffset = 50;
        log.forEach((reward, index) => {
            this.add.text(
                50,
                yOffset + index * 20,
                `Timestamp: ${new Date(reward.timestamp).toLocaleString()}, Source: ${reward.source}, Amount: ${reward.amount}`,
                { font: "16px Arial", color: "#ffffff" }
            );
        });

        // Add a button to clear the log
        const clearButton = this.add.text(50, yOffset + log.length * 20 + 20, "Clear Log", {
            font: "16px Arial",
            color: "#ff0000",
            backgroundColor: "#ffffff"
        }).setInteractive();

        clearButton.on("pointerdown", () => {
            QuiztalRewardLog.clearLog();
            this.scene.restart();
        });
    }
}

export default QuiztalRewardExplorerScene;