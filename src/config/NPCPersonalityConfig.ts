// NPCPersonalityConfig.ts
export interface NPCPersonality {
  name: string;
  emoji: string;
  color: string;
  languageStyle: 'adventurous' | 'creative' | 'wise' | 'cautious' | 'technical' | 'philosophical' | 'playful';
  rewardThemes: string[];
  mistakeDescriptions: string[];
  tipDescriptions: string[];
  wrongAnswerPrefixes: string[];
  correctAnswerPrefixes: string[];
  shoutMessageTemplates: string[];
  cooldownMessageTemplates: string[];
}

// Mint Girl - Playful/Creative Personality
export const mintGirlPersonality: NPCPersonality = {
  name: "Mint Girl",
  emoji: "🎨",
  color: "#00ff00",
  languageStyle: "playful",
  rewardThemes: ["Digital Picasso", "NFT Virtuoso", "Pixel Perfect", "Artistic Genius", "Creative Masterpiece"],
  mistakeDescriptions: [
    "Even master artists have off days! 🎨",
    "Not every sketch becomes a masterpiece! Keep going! ✨",
    "Every artist experiments before creating their best work! 🖌️",
    "A blank canvas is just the beginning of something beautiful! 🌈",
    "Even the greatest artists had to learn the basics! You've got this! 💪"
  ],
  tipDescriptions: [
    "Keep experimenting with different artistic techniques! 🎨",
    "Study the masters to improve your own craft! 📚",
    "Every brushstroke brings you closer to your masterpiece! ✨",
    "Don't be afraid to try bold and creative ideas! 💥",
    "Practice makes perfect in the art world too! 🎯"
  ],
  wrongAnswerPrefixes: [
    "🖌️ Not quite the masterpiece we were looking for! Try again! 🎨",
    "🎨 Let's try a different brush stroke next time! ✨",
    "🌈 Almost, but not quite the rainbow we were hoping for! 🌈",
    "✨ That's not the magic touch we were looking for! Try again! ✨",
    "🖼️ Let's adjust the composition and try again! 🎯"
  ],
  correctAnswerPrefixes: [
    "🎨 Beautiful work! You've created pure art worth",
    "✨ Brilliant! Your answer is a masterpiece worth",
    "🖌️ Perfect brushwork! You've painted yourself",
    "🖼️ Gallery-worthy! Your knowledge earned you",
    "🌈 Colorful and correct! You've earned"
  ],
  shoutMessageTemplates: [
    "Ready to mint your first NFT? I'll guide you! 🎨✨",
    "Digital art is the future! Ask me how to create yours! 🌈🖼️",
    "Turn your creativity into blockchain art! 🖼️🔗",
    "Click me to earn $Niftdoods while creating digital art! ✨💰",
    "Feeling artsy today? Let's create something amazing! 🎨🎉"
  ],
  cooldownMessageTemplates: [
    "🎨 Hello there! I'm taking a short break to recharge my artistic inspiration! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍✨",
    "🖌️ I'm currently working on my next masterpiece! Please return in {time} to continue learning about NFTs. There are other creative NPCs in Niftdood World who might have inspiration for you! 🌈🎨",
    "🖼️ Time for a creative break! I'll be back in {time} with fresh artistic ideas. While you wait, explore the world and discover other knowledge sources! ✨🔍"
  ]
};

// Hunt Boy - Playful/Adventurous Personality
export const huntBoyPersonality: NPCPersonality = {
  name: "Hunt Boy",
  emoji: "🎯",
  color: "#FF5722",
  languageStyle: "playful",
  rewardThemes: ["Hunt Master", "Target Locked", "Bullseye Champion", "Prey Collector", "Tracking Expert"],
  mistakeDescriptions: [
    "Missing the target happens to the best hunters! 🎯",
    "Even expert hunters sometimes misfire! Keep aiming! 🏹",
    "A miss is as good as a mile in the hunting field! Try again! 🦊",
    "Every great hunter has had their misses! You're on the right track! 🐾",
    "Practice makes perfect in the hunting grounds! You've got this! 💪"
  ],
  tipDescriptions: [
    "Keep your hunting skills sharp with regular practice! 🎯",
    "Study your prey before taking the shot! 📚",
    "Patience is a hunter's greatest weapon! ⏳",
    "Aim carefully before you pull the trigger! 🎯",
    "Learn from every hunt, successful or not! 📖"
  ],
  wrongAnswerPrefixes: [
    "🎯 Missed the target! Let's aim better next time! 🏹",
    "🦊 Almost caught it! Review the material and try again! 📚",
    "🏹 Not quite bullseye! Let's recalibrate! 🎯",
    "🐾 Close, but no prey caught this time! Try again! 🎯",
    "🧭 Lost the trail! Let's retrace our steps! 🗺️"
  ],
  correctAnswerPrefixes: [
    "🗡️ Nice hunt! You bagged yourself",
    "🎯 Bullseye! Your knowledge earned you",
    "🦊 Clever hunter! You've caught",
    "🏹 Perfect aim! You've secured",
    "🐾 Track master! Your skills earned you"
  ],
  shoutMessageTemplates: [
    "Yo anon, have you bridged to Base yet? 😏✨",
    "Base gas fees? What gas fees? Almost free! 💨💰",
    "Web3 builders, join Hunt Town! 🏗️🔗",
    "Hunt Town = Web3 dev paradise! 🌍🎉",
    "Ready for the hunt? Let's find some Web3 treasures! 🔍💎"
  ],
  cooldownMessageTemplates: [
    "🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍🎯",
    "🏹 Time for a rest! I'll be back in {time} with fresh hunting challenges. While you wait, explore Hunt Town and see what other hunters are up to! 🦊🗺️",
    "🎯 I'm currently tracking new prey! Please return in {time} for your next hunting lesson. There are other skilled hunters in Niftdood World who might have challenges for you! 🏞️🔍"
  ]
};

// Base Sage - Playful/Wise Personality
export const baseSagePersonality: NPCPersonality = {
  name: "Base Sage",
  emoji: "🏛️",
  color: "#9C27B0",
  languageStyle: "playful",
  rewardThemes: ["Foundation Builder", "Wise Scholar", "Path Finder", "Knowledge Seeker", "Base Architect"],
  mistakeDescriptions: [
    "Detours are part of every wise journey! 🗺️",
    "Even sages make mistakes on their path to enlightenment! 🧘",
    "A stumble is not a fall if you learn from it! 📚",
    "Wisdom often comes from recognizing our errors! ✨",
    "The path to knowledge is paved with questions! ❓"
  ],
  tipDescriptions: [
    "Seek knowledge like a sage seeks truth! 🔍",
    "Build your foundation one lesson at a time! 🧱",
    "Patience and persistence are keys to wisdom! ⏳",
    "Question everything to find the truth! ❓",
    "Learn from the past to build a better future! 🚀"
  ],
  wrongAnswerPrefixes: [
    "🚧 Detour on your journey! Let's find the right path! 🗺️",
    "🧭 Lost your way? Let's retrace our steps! 🗺️",
    "📚 Not quite the wisdom we were seeking! Try again! 📖",
    "🏛️ The foundation needs more work! Keep building! 🧱",
    "🕯️ Let's shed more light on this topic! 💡"
  ],
  correctAnswerPrefixes: [
    "🏛️ Foundation built! You've earned",
    "🧭 Wise path chosen! Your knowledge has been rewarded",
    "📚 Scholar's wisdom! You've gained",
    "🕯️ Enlightenment achieved! You've earned",
    "🚧 Bridge constructed! Your understanding earned you"
  ],
  shoutMessageTemplates: [
    "Seek wisdom, young traveler! The foundation of Web3 awaits! 🏛️✨",
    "Knowledge is the strongest base you can build upon! 📚🧱",
    "Layer 2 solutions are the future of scalability! 🚀🔗",
    "Click me to earn $Niftdoods while building your knowledge base! 🧱💰",
    "Ready to build your Web3 foundation? I've got the blueprints! 🏗️📘"
  ],
  cooldownMessageTemplates: [
    "🏛️ Hello there! I'm taking a short break to contemplate the deeper truths of Layer 2! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍✨",
    "📚 Time for meditation! I'll return in {time} with profound insights about Base. While you wait, seek wisdom from other knowledgeable NPCs in Niftdood World! 🧘🧠",
    "🧭 I'm currently mapping the path to enlightenment! Please return in {time} for your next lesson in Base Layer 2 wisdom. There are other sages in Niftdood World who might share their knowledge! 🌟📖"
  ]
};

// MrRugPull - Playful/Cautious Personality
export const mrRugPullPersonality: NPCPersonality = {
  name: "MrRugPull",
  emoji: "🕵️",
  color: "#FF9800",
  languageStyle: "playful",
  rewardThemes: ["Security Expert", "Scam Detector", "Asset Guardian", "Risk Analyst", "Protection Pro"],
  mistakeDescriptions: [
    "Even security experts can be caught off guard! 🕵️",
    "Trust but verify - even when you think you know the answer! 🔍",
    "A moment of caution could save you from disaster! 🛡️",
    "Vigilance is a skill that requires constant practice! 💪",
    "Being skeptical is better than being sorry! ⚠️"
  ],
  tipDescriptions: [
    "Always double-check before making any investments! 🔍",
    "Research thoroughly before trusting any project! 📚",
    "Keep your private keys secure and never share them! 🔐",
    "Diversify your portfolio to minimize risk! 📊",
    "Stay updated on the latest security practices! 🛡️"
  ],
  wrongAnswerPrefixes: [
    "🚨 Scam alert! That's not the right answer! ⚠️",
    "⚠️ Red flag! Let's review what we know! 🔍",
    "🛡️ Not quite the secure solution we were looking for! Try again! 🔐",
    "🔍 Let's investigate this further! 🕵️",
    "🔐 That key doesn't unlock this knowledge! Try again! 🔓"
  ],
  correctAnswerPrefixes: [
    "🕵️ Dodged a scam! You earned",
    "🛡️ Protected your assets! Knowledge is the best armor worth",
    "🔐 Secure access granted! You've earned",
    "⚠️ Risk assessed correctly! Your vigilance earned you",
    "🔍 Investigation complete! You've discovered"
  ],
  shoutMessageTemplates: [
    "Trust but verify! I'll teach you to spot scams! 🕵️🔍",
    "Don't get rugged! Learn to protect your assets! 🛡️💰",
    "Security first, profits second! Ask me how! 🔐✨",
    "Click me to earn $Niftdoods while learning security! 🔍💰",
    "Suspicious of a project? Let's investigate together! 🕵️🔐"
  ],
  cooldownMessageTemplates: [
    "🕵️ Hello there! I'm taking a short break to investigate new scam techniques! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍🔍",
    "🔐 Time for a security audit! I'll return in {time} with fresh insights about protecting your assets. While you wait, see what other security experts in Niftdood World have to teach you! 🛡️🧠",
    "🔍 I'm currently researching the latest exploit methods! Please return in {time} for your next security lesson. There are other vigilant NPCs in Niftdood World who might share their protective knowledge! 🛡️📚"
  ]
};

// Export all personalities
export const npcPersonalities = {
  mintGirl: mintGirlPersonality,
  huntBoy: huntBoyPersonality,
  baseSage: baseSagePersonality,
  mrRugPull: mrRugPullPersonality
};

export const NPC_PERSONALITY_CONFIG: Record<string, NPCPersonality> = {
  "npc_mintgirl": {
    name: "Mint Girl",
    emoji: "🎨",
    color: "#00ff00",
    languageStyle: "playful",
    rewardThemes: ["Digital Picasso", "NFT Virtuoso", "Pixel Perfect", "Artistic Genius", "Creative Masterpiece"],
    mistakeDescriptions: [
      "Even master artists have off days! 🎨",
      "Not every sketch becomes a masterpiece! Keep going! ✨",
      "Every artist experiments before creating their best work! 🖌️",
      "A blank canvas is just the beginning of something beautiful! 🌈",
      "Even the greatest artists had to learn the basics! You've got this! 💪"
    ],
    tipDescriptions: [
      "Keep experimenting with different artistic techniques! 🎨",
      "Study the masters to improve your own craft! 📚",
      "Every brushstroke brings you closer to your masterpiece! ✨",
      "Don't be afraid to try bold and creative ideas! 💥",
      "Practice makes perfect in the art world too! 🎯"
    ],
    wrongAnswerPrefixes: [
      "🖌️ Not quite the masterpiece we were looking for! Try again! 🎨",
      "🎨 Let's try a different brush stroke next time! ✨",
      "🌈 Almost, but not quite the rainbow we were hoping for! 🌈",
      "✨ That's not the magic touch we were looking for! Try again! ✨",
      "🖼️ Let's adjust the composition and try again! 🎯"
    ],
    correctAnswerPrefixes: [
      "🎨 Beautiful work! You've created pure art worth",
      "✨ Brilliant! Your answer is a masterpiece worth",
      "🖌️ Perfect brushwork! You've painted yourself",
      "🖼️ Gallery-worthy! Your knowledge earned you",
      "🌈 Colorful and correct! You've earned"
    ],
    shoutMessageTemplates: [
      "Ready to mint your first NFT? I'll guide you! 🎨✨",
      "Digital art is the future! Ask me how to create yours! 🌈🖼️",
      "Turn your creativity into blockchain art! 🖼️🔗",
      "Click me to earn $Niftdoods while creating digital art! ✨💰",
      "Feeling artsy today? Let's create something amazing! 🎨🎉"
    ],
    cooldownMessageTemplates: [
      "🎨 Hello there! I'm taking a short break to recharge my artistic inspiration! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍✨",
      "🖌️ I'm currently working on my next masterpiece! Please return in {time} to continue learning about NFTs. There are other creative NPCs in Niftdood World who might have inspiration for you! 🌈🎨",
      "🖼️ Time for a creative break! I'll be back in {time} with fresh artistic ideas. While you wait, explore the world and discover other knowledge sources! ✨🔍"
    ]
  },
  "npc_huntboy": {
    name: "Hunt Boy",
    emoji: "🎯",
    color: "#FF5722",
    languageStyle: "playful",
    rewardThemes: ["Hunt Master", "Target Locked", "Bullseye Champion", "Prey Collector", "Tracking Expert"],
    mistakeDescriptions: [
      "Missing the target happens to the best hunters! 🎯",
      "Even expert hunters sometimes misfire! Keep aiming! 🏹",
      "A miss is as good as a mile in the hunting field! Try again! 🦊",
      "Every great hunter has had their misses! You're on the right track! 🐾",
      "Practice makes perfect in the hunting grounds! You've got this! 💪"
    ],
    tipDescriptions: [
      "Keep your hunting skills sharp with regular practice! 🎯",
      "Study your prey before taking the shot! 📚",
      "Patience is a hunter's greatest weapon! ⏳",
      "Aim carefully before you pull the trigger! 🎯",
      "Learn from every hunt, successful or not! 📖"
    ],
    wrongAnswerPrefixes: [
      "🎯 Missed the target! Let's aim better next time! 🏹",
      "🦊 Almost caught it! Review the material and try again! 📚",
      "🏹 Not quite bullseye! Let's recalibrate! 🎯",
      "🐾 Close, but no prey caught this time! Try again! 🎯",
      "🧭 Lost the trail! Let's retrace our steps! 🗺️"
    ],
    correctAnswerPrefixes: [
      "🗡️ Nice hunt! You bagged yourself",
      "🎯 Bullseye! Your knowledge earned you",
      "🦊 Clever hunter! You've caught",
      "🏹 Perfect aim! You've secured",
      "🐾 Track master! Your skills earned you"
    ],
    shoutMessageTemplates: [
      "Yo anon, have you bridged to Base yet? 😏✨",
      "Base gas fees? What gas fees? Almost free! 💨💰",
      "Web3 builders, join Hunt Town! 🏗️🔗",
      "Hunt Town = Web3 dev paradise! 🌍🎉",
      "Ready for the hunt? Let's find some Web3 treasures! 🔍💎"
    ],
    cooldownMessageTemplates: [
      "🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍🎯",
      "🏹 Time for a rest! I'll be back in {time} with fresh hunting challenges. While you wait, explore Hunt Town and see what other hunters are up to! 🦊🗺️",
      "🎯 I'm currently tracking new prey! Please return in {time} for your next hunting lesson. There are other skilled hunters in Niftdood World who might have challenges for you! 🏞️🔍"
    ]
  },
  "npc_basesage": {
    name: "Base Sage",
    emoji: "🏛️",
    color: "#9C27B0",
    languageStyle: "playful",
    rewardThemes: ["Foundation Builder", "Wise Scholar", "Path Finder", "Knowledge Seeker", "Base Architect"],
    mistakeDescriptions: [
      "Detours are part of every wise journey! 🗺️",
      "Even sages make mistakes on their path to enlightenment! 🧘",
      "A stumble is not a fall if you learn from it! 📚",
      "Wisdom often comes from recognizing our errors! ✨",
      "The path to knowledge is paved with questions! ❓"
    ],
    tipDescriptions: [
      "Seek knowledge like a sage seeks truth! 🔍",
      "Build your foundation one lesson at a time! 🧱",
      "Patience and persistence are keys to wisdom! ⏳",
      "Question everything to find the truth! ❓",
      "Learn from the past to build a better future! 🚀"
    ],
    wrongAnswerPrefixes: [
      "🚧 Detour on your journey! Let's find the right path! 🗺️",
      "🧭 Lost your way? Let's retrace our steps! 🗺️",
      "📚 Not quite the wisdom we were seeking! Try again! 📖",
      "🏛️ The foundation needs more work! Keep building! 🧱",
      "🕯️ Let's shed more light on this topic! 💡"
    ],
    correctAnswerPrefixes: [
      "🏛️ Foundation built! You've earned",
      "🧭 Wise path chosen! Your knowledge has been rewarded",
      "📚 Scholar's wisdom! You've gained",
      "🕯️ Enlightenment achieved! You've earned",
      "🚧 Bridge constructed! Your understanding earned you"
    ],
    shoutMessageTemplates: [
      "Seek wisdom, young traveler! The foundation of Web3 awaits! 🏛️✨",
      "Knowledge is the strongest base you can build upon! 📚🧱",
      "Layer 2 solutions are the future of scalability! 🚀🔗",
      "Click me to earn $Niftdoods while building your knowledge base! 🧱💰",
      "Ready to build your Web3 foundation? I've got the blueprints! 🏗️📘"
    ],
    cooldownMessageTemplates: [
      "🏛️ Hello there! I'm taking a short break to contemplate the deeper truths of Layer 2! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍✨",
      "📚 Time for meditation! I'll return in {time} with profound insights about Base. While you wait, seek wisdom from other knowledgeable NPCs in Niftdood World! 🧘🧠",
      "🧭 I'm currently mapping the path to enlightenment! Please return in {time} for your next lesson in Base Layer 2 wisdom. There are other sages in Niftdood World who might share their knowledge! 🌟📖"
    ]
  },
  "npc_securitykai": {
    name: "Security Kai",
    emoji: "🕵️",
    color: "#FF9800",
    languageStyle: "playful",
    rewardThemes: ["Security Expert", "Scam Detector", "Asset Guardian", "Risk Analyst", "Protection Pro"],
    mistakeDescriptions: [
      "Even security experts can be caught off guard! 🕵️",
      "Trust but verify - even when you think you know the answer! 🔍",
      "A moment of caution could save you from disaster! 🛡️",
      "Vigilance is a skill that requires constant practice! 💪",
      "Being skeptical is better than being sorry! ⚠️"
    ],
    tipDescriptions: [
      "Always double-check before making any investments! 🔍",
      "Research thoroughly before trusting any project! 📚",
      "Keep your private keys secure and never share them! 🔐",
      "Diversify your portfolio to minimize risk! 📊",
      "Stay updated on the latest security practices! 🛡️"
    ],
    wrongAnswerPrefixes: [
      "🚨 Scam alert! That's not the right answer! ⚠️",
      "⚠️ Red flag! Let's review what we know! 🔍",
      "🛡️ Not quite the secure solution we were looking for! Try again! 🔐",
      "🔍 Let's investigate this further! 🕵️",
      "🔐 That key doesn't unlock this knowledge! Try again! 🔓"
    ],
    correctAnswerPrefixes: [
      "🕵️ Dodged a scam! You earned",
      "🛡️ Protected your assets! Knowledge is the best armor worth",
      "🔐 Secure access granted! You've earned",
      "⚠️ Risk assessed correctly! Your vigilance earned you",
      "🔍 Investigation complete! You've discovered"
    ],
    shoutMessageTemplates: [
      "Trust but verify! I'll teach you to spot scams! 🕵️🔍",
      "Don't get rugged! Learn to protect your assets! 🛡️💰",
      "Security first, profits second! Ask me how! 🔐✨",
      "Click me to earn $Niftdoods while learning security! 🔍💰",
      "Suspicious of a project? Let's investigate together! 🕵️🔐"
    ],
    cooldownMessageTemplates: [
      "🕵️ Hello there! I'm taking a short break to investigate new scam techniques! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍🔍",
      "🔐 Time for a security audit! I'll return in {time} with fresh insights about protecting your assets. While you wait, see what other security experts in Niftdood World have to teach you! 🛡️🧠",
      "🔍 I'm currently researching the latest exploit methods! Please return in {time} for your next security lesson. There are other vigilant NPCs in Niftdood World who might share their protective knowledge! 🛡️📚"
    ]
  },
  "npc_basepal": {
    name: "BasePal",
    emoji: "🎓",
    color: "#2196F3",
    languageStyle: "wise",
    rewardThemes: ["Base Builder", "Layer 2 Legend", "Scaling Sage", "Ethereum Expert", "OP Stack Master"],
    mistakeDescriptions: [
      "Even experts were beginners once! Keep learning! 📚",
      "Mistakes are just learning opportunities in disguise! 🎯",
      "Every wrong answer brings you closer to the right one! 🧭",
      "Don't worry, even the best developers debug their code! 🐛",
      "Learning is a journey, not a destination! 🚀"
    ],
    tipDescriptions: [
      "Stay curious and keep exploring new technologies! 🔍",
      "Practice makes perfect in the world of blockchain too! 💪",
      "Connect with the Base community to learn from others! 🌐",
      "Build small projects to reinforce your learning! 🛠️",
      "Read the official documentation for the latest updates! 📖"
    ],
    wrongAnswerPrefixes: [
      "🤔 Not quite right! Let's explore this concept together! 📚",
      "🧩 Almost! But there's more to learn about this topic! 🔍",
      "🔄 Let's review the basics and try again! 📖",
      "🧭 You're on the right path, but not quite there yet! 🎯",
      "💡 That's not it, but I'm sure you'll get it with a bit more study! ✨"
    ],
    correctAnswerPrefixes: [
      "🎉 Excellent! You're mastering Base Chain concepts worth",
      "🚀 Impressive knowledge! Your understanding earned you",
      "🧠 Smart thinking! You've grasped the concept and earned",
      "🏆 Well done! Your Base expertise is worth",
      "✨ Perfect! You've unlocked Base Chain wisdom worth"
    ],
    shoutMessageTemplates: [
      "Ready to dive deep into Base Chain? I've got some cool insights! 🎓✨",
      "Want to learn about Layer 2 scaling? I make it fun and easy! 📚🚀",
      "Base Chain knowledge is power! Let me share some with you! ⚡🧠",
      "Click me to earn $Niftdoods while learning about Base! 💰🎓",
      "Feeling curious about Ethereum scaling? Let's explore together! 🔍⚡"
    ],
    cooldownMessageTemplates: [
      "🎓 Hey there! I'm taking a short break to research the latest Base Chain updates! Please come back in {time}. In the meantime, why not visit other NPCs around the map? They might have lessons for you too! 🌍✨",
      "📚 Time for more research! I'll return in {time} with fresh insights about Base. While you wait, explore what other knowledgeable NPCs in Niftdood World have to teach you! 🔍🧠",
      "🧭 I'm currently studying new Base Chain developments! Please return in {time} for your next lesson. There are other experts in Niftdood World who might share their knowledge! 🌟📖"
    ]
  }
};
