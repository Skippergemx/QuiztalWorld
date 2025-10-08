import Phaser from "phaser";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC";
import NPCQuizManager from '../managers/NPCQuizManager';
import { showOptimizedEnhancedQuizDialog, OptimizedQuizDialogData, OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';


export default class DexpertGal extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'dexpertgal';
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dexpert_gal");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("dexpertgal-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Dexpert Gal", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ff6b9d",
      stroke: "#660033",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#ff6b9d",
      stroke: "#660033",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    this.startShouting(scene);
    
    // Register for network status change notifications
    this.networkMonitor.addNetworkStatusChangeListener(() => {
      // Trigger a shout when network status changes
      this.triggerNetworkStatusShout();
    });
  }

  private createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists("dexpertgal-idle")) {
      scene.anims.create({
        key: "dexpertgal-idle",
        frames: scene.anims.generateFrameNumbers("dexpert_gal", { start: 0, end: 23 }),
        frameRate: 1,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("DexpertGal: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("DexpertGal: Network offline - showing offline message");
      // Use optimized reward dialog for network offline message
      const offlineDialogData: OptimizedRewardDialogData = {
        npcName: "Dexpert Gal",
        npcAvatar: "npc_dexpertgal_avatar",
        rewardMessage: "🚫 Network connection lost! Please check your internet connection to continue playing.",
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, offlineDialogData);

      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
      return;
    }
    
    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if player is on cooldown
        const playerId = player.name || `anon_${Date.now()}`;
        if (this.checkCooldown(playerId)) {
          console.log("DexpertGal: Player is on cooldown or has reached max attempts");
          this.showCooldownDialog();
          return;
        }
        
        this.startQuiz(player);
      }
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log("DexpertGal: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("DexpertGal: Quiz manager not ready yet");
      return;
    }
    
    // Use enhanced quiz system if enabled
    if (this.useEnhancedDialog) {
      this.startEnhancedQuiz(player);
    } else {
      this.startSimpleQuiz(player);
    }
  }

  private async startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    try {
      // Get random question using the quiz manager
      const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
      
      if (!questionData) {
        console.error("DexpertGal: No questions available");
        return;
      }
      
      // Store the index of the current question
      this.lastQuestionIndex = questionData.index;
      const currentQuestion = questionData.question;
      
      // Notify QuizAntiSpamManager that a quiz has started
      this.notifyQuizStarted();
      
      // Create enhanced question from basic question
      const enhancedQuestion = {
        ...currentQuestion,
        difficulty: this.determineDifficulty(currentQuestion),
        explainer: currentQuestion.explainer || `This question relates to fundamental concepts about ${this.npcId} topic.`
      };
      
      // Shuffle options
      const shuffledOptions = Phaser.Utils.Array.Shuffle([...enhancedQuestion.options]);
      
      // Prepare optimized enhanced quiz dialog data
      const quizData: OptimizedQuizDialogData = {
        npcName: "Dexpert Gal",
        npcAvatar: "npc_dexpertgal_avatar",
        question: enhancedQuestion.question,
        options: shuffledOptions,
        theme: "Decentralized Exchanges & DeFi Trading",
        difficulty: enhancedQuestion.difficulty,
        questionNumber: 1, // Single question per interaction
        totalQuestions: 1, // Single question per interaction
        explainer: enhancedQuestion.explainer,
        onAnswer: (selectedOption: string) => {
          this.handleEnhancedAnswer(selectedOption, enhancedQuestion, player);
        },
        onClose: () => {
          // Quiz is already ended in handleEnhancedAnswer
        }
      };

      // Show optimized enhanced quiz dialog
      showOptimizedEnhancedQuizDialog(this.scene, quizData);

    } catch (error) {
      console.error("DexpertGal: Error starting enhanced quiz:", error);
      // Fallback to simple quiz
      this.startSimpleQuiz(player);
    }
  }
  
  // Helper method to determine difficulty
  private determineDifficulty(question: any): 'Easy' | 'Medium' | 'Hard' {
    const questionLength = question.question.length;
    const optionsLength = question.options.reduce((sum: number, opt: string) => sum + opt.length, 0);
    
    if (questionLength < 50 && optionsLength < 100) {
      return 'Easy';
    } else if (questionLength < 100 && optionsLength < 200) {
      return 'Medium';
    } else {
      return 'Hard';
    }
  }

  // Enhanced answer handler
  private handleEnhancedAnswer(selectedOption: string, enhancedQuestion: any, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === enhancedQuestion.answer;
    
    // Get player ID for tracking
    const playerId = player.name || `anon_${Date.now()}`;
    
    // Calculate reward using enhanced system by difficulty
    const reward = this.enhancedQuizManager.calculateEnhancedReward(isCorrect, enhancedQuestion.difficulty);
    
    // Check if this will be the 3rd attempt BEFORE recording
    const playerAttempts = this.quizAttempts.filter(attempt => attempt.playerId === playerId);
    const willTriggerCooldown = (playerAttempts.length + 1) >= this.maxAttempts;
    
    // Record quiz attempt - but delay cooldown activation if this is 3rd attempt
    if (willTriggerCooldown) {
      // For 3rd attempt: record without triggering cooldown immediately
      this.quizAttempts.push({
        playerId: playerId,
        timestamp: Date.now()
      });
      // Show remaining attempts
      this.showRemainingAttempts(playerId);
    } else {
      // For 1st and 2nd attempts: use normal recording
      this.recordQuizAttempt(playerId);
    }
    
    // Play sound using enhanced audio system
    this.enhancedQuizManager.playRewardAudio(isCorrect);
    
    // End the quiz immediately to unblock interactions for reward dialog
    this.notifyQuizEnded();
    
    // Delayed feedback (500ms delay):
    this.scene.time.delayedCall(500, () => {
      // Check if interactions blocked
      if (this.isInteractionBlocked()) {
        console.log("DexpertGal: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      if (isCorrect) {
        // Get themed reward dialog
        const themeData = this.getThemedRewardDialog();
        
        // Generate themed Did You Know and Tips content for DEX topics
        const didYouKnowContent = this.generateThemedDexDidYouKnow(themeData.title);
        const tipsContent = this.generateThemedDexTipsAndTricks(themeData.title);
        
        // Create enhanced reward message with theme
        const rewardMessage = `${themeData.emoji} ${themeData.title}! You earned ${reward.toFixed(2)} $Quiztals for your DEX knowledge!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Dexpert Gal",
          npcAvatar: "npc_dexpertgal_avatar",
          rewardMessage: rewardMessage,
          didYouKnow: didYouKnowContent,
          tipsAndTricks: tipsContent,
          rewardAmount: reward,
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedRewardDialog(this.scene, rewardDialogData);
        
        // Use enhanced reward saving method for consistency
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "DexpertGal");
      } else {
        // Incorrect answer - show optimized wrong answer dialog
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Dexpert Gal",
          npcAvatar: "npc_dexpertgal_avatar",
          wrongAnswerMessage: `❌ Trade failed! "${selectedOption}" is not correct.`,
          correctAnswer: enhancedQuestion.answer,
          explanation: enhancedQuestion.explainer || "This question tests your understanding of key DEX concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForDEX(),
          quickTips: this.generateQuickTipsForDEX(),
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
      }
      
      // If this was the 3rd attempt, activate cooldown AFTER reward dialog
      if (willTriggerCooldown) {
        // Activate cooldown after reward dialog is fully processed
        this.scene.time.delayedCall(3500, () => {
          const now = Date.now();
          this.isOnCooldown = true;
          this.cooldownEndTime = now + this.cooldownDuration;
          this.showCooldownIndicator();
        });
      }
    });
    
    // Cleanup
    this.scene.time.delayedCall(3500, () => {
      // Reset question index so player can get the same question again in future interactions
      this.lastQuestionIndex = -1;
    });
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    
    if (!questionData) {
      console.error("DexpertGal: No questions available");
      return;
    }
    
    // Store the index of the current question
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;
    
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();
    
    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    // Use optimized enhanced quiz dialog instead of simple dialog
    const dialog = new OptimizedEnhancedQuizDialog(this.scene);
    
    dialog.showQuizDialog({
      npcName: "Dexpert Gal",
      npcAvatar: "npc_dexpertgal_avatar",
      theme: "Decentralized Exchanges & DeFi Trading",
      question: currentQuestion.question,
      options: shuffledOptions,
      explainer: currentQuestion.explainer,
      onAnswer: (selectedOption: string) => {
        this.checkAnswer(selectedOption, currentQuestion.answer, player);
        // Notify QuizAntiSpamManager that the quiz has ended
        this.notifyQuizEnded();
      },
      onClose: () => {
        this.resetDialogState();
      }
    });
    
    this.currentDialog = dialog as any;
  }

  private checkAnswer(selectedOption: string, correctAnswer: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === correctAnswer;
    const reward = this.calculateReward(isCorrect);
    
    // Record quiz attempt regardless of whether correct or incorrect
    const playerId = player.name || `anon_${Date.now()}`;
    this.recordQuizAttempt(playerId);
    
    // Play sound based on answer
    const audioManager = AudioManager.getInstance();
    if (isCorrect) {
        audioManager.playCorrectSound();
    } else {
        audioManager.playWrongSound();
    }

    // Close the current dialog immediately
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    this.scene.time.delayedCall(500, () => {
        // Check if interactions are blocked before showing reward dialog
        if (this.isInteractionBlocked()) {
          console.log("DexpertGal: Cannot show reward dialog - interactions are blocked");
          return;
        }
        
        if (isCorrect) {
          // Get themed reward dialog
          const themeData = this.getThemedRewardDialog();
          
          // Generate themed Did You Know and Tips content for DEX topics
          const didYouKnowContent = this.generateThemedDexDidYouKnow(themeData.title);
          const tipsContent = this.generateThemedDexTipsAndTricks(themeData.title);
          
          // Create enhanced reward message with theme
          const rewardMessage = `${themeData.emoji} ${themeData.title}! You earned ${reward.toFixed(2)} $Quiztals for your DEX knowledge!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "Dexpert Gal",
            npcAvatar: "npc_dexpertgal_avatar",
            rewardMessage: rewardMessage,
            didYouKnow: didYouKnowContent,
            tipsAndTricks: tipsContent,
            rewardAmount: reward,
            onClose: () => {
              // Reset the dialog state when player closes the dialog
              this.resetDialogState();
            }
          };
          
          showOptimizedRewardDialog(this.scene, rewardDialogData);
        } else {
          // Incorrect answer - show optimized wrong answer dialog
          const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
            npcName: "Dexpert Gal",
            npcAvatar: "npc_dexpertgal_avatar",
            wrongAnswerMessage: `❌ Trade failed! "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key DEX concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakesForDEX(),
            quickTips: this.generateQuickTipsForDEX(),
            onClose: () => {
              // Reset the dialog state when player closes the dialog
              this.resetDialogState();
            }
          };
          
          showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
        }
    });
    
    // Reset last question index so player can get the same question again in future interactions
    this.lastQuestionIndex = -1;
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }
  
  private getThemedRewardDialog(): { title: string; emoji: string; color: string } {
    // 4 themed reward dialog frames
    const themes = [
      { title: "Trading Pro", emoji: "📈", color: "#4CAF50" },
      { title: "Liquidity Master", emoji: "💧", color: "#2196F3" },
      { title: "Arbitrage Expert", emoji: "🔄", color: "#FF9800" },
      { title: "DEX Champion", emoji: "🏆", color: "#9C27B0" }
    ];
    
    // Select theme randomly for truly random selection instead of deterministic pattern
    const themeIndex = Math.floor(Math.random() * themes.length);
    return themes[themeIndex];
  }
  
  private generateThemedDexDidYouKnow(theme: string): string {
    // Theme-specific "Did You Know" content
    const themedDyk: { [key: string]: string[] } = {
      "Trading Pro": [
        "Professional traders use DEXs to avoid KYC requirements and maintain privacy! Unlike centralized exchanges that require extensive identity verification, DEXs allow anonymous trading directly from your wallet.",
        "Algorithmic trading bots execute thousands of trades per second on DEXs! These bots use complex strategies like arbitrage, market making, and trend following to generate profits automatically.",
        "Market sentiment analysis tools can help predict price movements on DEXs! By monitoring social media, news, and on-chain data, traders can gain insights into market trends and potential opportunities."
      ],
      "Liquidity Master": [
        "The deepest liquidity pools often offer the best trading experience! Pools with higher liquidity have lower slippage and tighter spreads, making them ideal for large trades.",
        "Liquidity mining programs can significantly boost your returns! Many protocols offer additional token rewards for providing liquidity to specific pools during promotional periods.",
        "Impermanent loss insurance is now available on some platforms! Protocols like Nexus Mutual and Opyn offer protection against impermanent loss for liquidity providers."
      ],
      "Arbitrage Expert": [
        "Cross-chain arbitrage opportunities exist between different blockchain networks! Traders can profit from price differences of the same asset across networks like Ethereum, BSC, and Polygon.",
        "Flash loan arbitrage requires no capital but demands technical expertise! These complex strategies use smart contract programming to execute profitable trades within a single transaction.",
        "Statistical arbitrage uses mathematical models to identify trading opportunities! This quantitative approach analyzes price relationships between assets to find mispricings."
      ],
      "DEX Champion": [
        "The total value locked (TVL) in DEXs has grown over 100x since 2020! This explosive growth shows increasing trust in decentralized finance and the technology that powers it.",
        "Governance tokens give users a voice in DEX protocol development! Holders can vote on proposals that affect fee structures, new features, and the overall direction of the platform.",
        "DAO treasuries now hold billions in assets managed by community votes! These decentralized autonomous organizations represent a new form of organizational structure in finance."
      ]
    };
    
    const phrases = themedDyk[theme] || themedDyk["Trading Pro"];
    const selectedPhrase = Phaser.Utils.Array.GetRandom(phrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) { // Reduced from 200 to 150 for better mobile display
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateThemedDexTipsAndTricks(theme: string): string {
    // Theme-specific "Tips & Tricks" content
    const themedTips: { [key: string]: string[] } = {
      "Trading Pro": [
        "Use advanced charting tools and technical analysis to inform your DEX trades! Many platforms integrate with popular charting services to provide professional-grade analysis directly in the interface.",
        "Set up price alerts for your favorite trading pairs to never miss an opportunity! Most DEX interfaces allow you to create notifications for specific price levels or market movements.",
        "Dollar-cost averaging can reduce the impact of volatility on your investments! By investing a fixed amount regularly regardless of price, you can smooth out market fluctuations over time."
      ],
      "Liquidity Master": [
        "Diversify your liquidity provision across multiple pools to spread risk! Instead of putting all your funds in one pool, consider providing liquidity to several different token pairs to reduce the impact of impermanent loss.",
        "Rebalance your liquidity positions regularly to optimize returns! As token prices change, the composition of your LP position shifts, and periodic adjustments can help maintain your desired risk profile.",
        "Consider stablecoin pairs for lower impermanent loss risk! Pools with stablecoins like USDC/DAI typically experience less price volatility, making them safer for new liquidity providers."
      ],
      "Arbitrage Expert": [
        "Monitor multiple DEXs simultaneously to spot arbitrage opportunities! Price differences between exchanges can be fleeting, so having tools that track prices across platforms is essential.",
        "Consider gas costs when evaluating arbitrage opportunities! Ethereum gas fees can erode profits from small price differences, making some opportunities unprofitable despite appearing favorable.",
        "Use limit orders and range orders to optimize your arbitrage strategies! These advanced order types can help you capture profits while minimizing risk and gas costs."
      ],
      "DEX Champion": [
        "Stay informed about upcoming airdrops and governance proposals for the DEXs you use! Many protocols distribute tokens to active users, and participating in governance can give you a voice in the platform's development.",
        "Join DeFi communities and follow industry leaders to stay ahead of trends! The DEX space moves quickly, and being connected to the community can provide early insights into new opportunities.",
        "Keep track of your portfolio performance across multiple protocols! Use dashboard tools like Zerion or DeBank to monitor your investments and returns across the entire DeFi ecosystem."
      ]
    };
    
    const phrases = themedTips[theme] || themedTips["Trading Pro"];
    const selectedPhrase = Phaser.Utils.Array.GetRandom(phrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) { // Reduced from 200 to 150 for better mobile display
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer = null;
    let minDistance = Number.MAX_VALUE;

    this.scene.children.each((child) => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes('player')) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = child;
        }
      }
    });

    return closestPlayer;
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Ready to trade on DEXs? I'll teach you everything! 🔄",
      "Decentralized exchanges are the future of trading! 💱",
      "No KYC, just pure DeFi trading! Ask me how! 🚀",
      "Click me to earn $Quiztals while mastering DEX trading! 📈"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No DEX trading until connection restored! 🚫📡",
      "Internet connection lost! DEX knowledge on hold! 😢🔌",
      "Offline mode: DexpertGal's trading lessons disabled! ⏸️",
      "No network, no decentralized trading! 🔌",
      "Connection error: DEX quiz unavailable! 📡"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        let randomMessage;
        
        // Check network connectivity to determine which message to show
        if (!this.networkMonitor.getIsOnline()) {
          // Network is offline, show offline message
          randomMessage = Phaser.Utils.Array.GetRandom(networkOfflineMessages);
        } else {
          // Network is online, show regular message
          randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
        }
        
        this.showShout(randomMessage);
        this.startShouting(scene);
      },
      loop: false
    });
  }

  private showShout(message: string) {
    this.shoutOutText.setText(message).setAlpha(1);
    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }

  private triggerNetworkStatusShout(): void {
    let message: string;
    
    if (!this.networkMonitor.getIsOnline()) {
      // Network is offline
      message = "🚨 Network connection lost! DexpertGal's trading lessons disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! DexpertGal's trading lessons available! 🌐";
    }
    
    this.showShout(message);
  }

  protected showCooldownDialog() {
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      // Use personality-specific cooldown message template like MintGirl
      const cooldownMessages = [
        `🕒 Hey trader! I'm currently analyzing the latest market trends and DEX protocols. Please return in ${formattedTime}. In the meantime, why not check out other experts in the DeFi space? They might have trading insights to share! 📊`,
        `🔄 I'm rebalancing my liquidity pools and checking for arbitrage opportunities. Come back in ${formattedTime} to test your DEX knowledge again! 📈`,
        `🛡️ Security check in progress! I'm auditing smart contracts and checking for potential vulnerabilities. Return in ${formattedTime} for more DeFi education! 🔍`,
        `💡 Research time! I'm studying the latest DeFi innovations and yield farming strategies. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Dexpert Gal",
        npcAvatar: "npc_dexpertgal_avatar",
        rewardMessage: cooldownMessage,
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, cooldownDialogData);

      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
    });
  }

  private generateCommonMistakesForDEX(): string {
    const commonMistakes = [
      "Confusing DEXs with centralized exchanges - remember DEXs are trustless and non-custodial!",
      "Mixing up AMMs (Automated Market Makers) with traditional order books - they work completely differently!",
      "Forgetting about impermanent loss when providing liquidity - always calculate potential risks!",
      "Overlooking gas fees impact on small trades - sometimes CEXs are more cost-effective for small amounts!",
      "Misunderstanding slippage tolerance - setting it too high can result in unfavorable trade execution!"
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForDEX(): string {
    const quickTips = [
      "Always check liquidity depth before trading large amounts to avoid high slippage!",
      "Use limit orders when available to get better execution prices on DEXs!",
      "Compare gas fees across different chains - sometimes Polygon or BSC are cheaper than Ethereum!",
      "Read the token contract before investing - some tokens have hidden fees or restrictions!",
      "Start with small trades to get comfortable with the interface before going big!"
    ];
    
    const selectedTip = Phaser.Utils.Array.GetRandom(quickTips);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedTip.length > 150) {
      return selectedTip.substring(0, 147) + "...";
    }
    
    return selectedTip;
  }

}