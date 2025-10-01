# Quiz Question Template Guide

This document provides templates and guidelines for creating consistent, educational quiz questions for new NPCs in QuiztalWorld.

## Question Structure Template

### Basic Format
```json
{
  "question": "{Clear, concise question focusing on a single concept}",
  "options": [
    "{Correct answer - specific and accurate}",
    "{Plausible incorrect option 1}",
    "{Plausible incorrect option 2}"
  ],
  "answer": "{Exact copy of correct answer}",
  "explainer": "{Educational explanation (120-200 characters)}"
}
```

## Question Writing Guidelines

### 1. Question Creation
- **Focus**: One clear concept per question
- **Clarity**: Use simple, direct language
- **Relevance**: Connect to NPC's theme/role
- **Educational Value**: Teach something useful
- **Length**: Keep questions concise (under 100 words)

### 2. Answer Options
- **Correct Answer**: Specific, unambiguous, and factual
- **Incorrect Options**: Plausible but wrong - avoid obviously silly answers
- **Balance**: Similar length and complexity when possible
- **Distractors**: Related to the topic but incorrect
- **Order**: Mix correct answer position (don't always put it first)

### 3. Explainer Requirements
- **Length**: 120-200 characters
- **Purpose**: Educational, not just repeating the answer
- **Tone**: Informative but engaging
- **Content**: Key concepts, why it matters, or broader context

## Theme-Specific Templates

### Blockchain Fundamentals
```json
{
  "question": "What is a blockchain?",
  "options": [
    "A distributed ledger technology that records transactions across multiple computers",
    "A type of cryptocurrency wallet",
    "A centralized database system"
  ],
  "answer": "A distributed ledger technology that records transactions across multiple computers",
  "explainer": "Blockchain is a decentralized digital ledger that records transactions across multiple computers, making it extremely difficult to alter or hack."
}
```

### NFT & Digital Art
```json
{
  "question": "What does NFT stand for?",
  "options": [
    "Non-Fungible Token",
    "Non-Financial Transaction",
    "New Format Technology"
  ],
  "answer": "Non-Fungible Token",
  "explainer": "NFTs are unique digital assets that represent ownership of specific items like art, music, or videos, stored on a blockchain."
}
```

### Web3 Security
```json
{
  "question": "What should you never share with anyone?",
  "options": [
    "Your private key or seed phrase",
    "Your favorite crypto",
    "Your portfolio value"
  ],
  "answer": "Your private key or seed phrase",
  "explainer": "Private keys and seed phrases are your wallet's master passwords. Unlike banks, crypto transactions are irreversible - anyone with these credentials has permanent access to all your funds."
}
```

### DeFi & Trading
```json
{
  "question": "What is DeFi?",
  "options": [
    "Decentralized Finance - financial services built on blockchain technology",
    "Definitely Finance - traditional banking services",
    "Deferred Finance - future financial contracts"
  ],
  "answer": "Decentralized Finance - financial services built on blockchain technology",
  "explainer": "DeFi uses blockchain technology to provide financial services like lending, borrowing, and trading without traditional intermediaries like banks."
}
```

### Smart Contracts
```json
{
  "question": "What is a smart contract?",
  "options": [
    "Self-executing contracts with terms directly written into code",
    "Legal contracts for software developers",
    "Smart agreements between AI systems"
  ],
  "answer": "Self-executing contracts with terms directly written into code",
  "explainer": "Smart contracts automatically execute when predetermined conditions are met, eliminating the need for intermediaries and reducing transaction costs."
}
```

### Development Platforms
```json
{
  "question": "What is the primary purpose of {Platform Name}?",
  "options": [
    "To provide a platform for {specific technology} development with pre-built tools",
    "To create digital art",
    "To host art exhibitions"
  ],
  "answer": "To provide a platform for {specific technology} development with pre-built tools",
  "explainer": "{Platform Name} accelerates {technology} development by providing pre-built tools, SDKs, and infrastructure for building {specific applications}."
}
```

## Question Difficulty Levels

### Easy Questions (Beginner)
- Focus on definitions and basic concepts
- Use simple vocabulary
- Provide clear context
- Example: "What does NFT stand for?"

### Medium Questions (Intermediate)
- Require some understanding of concepts
- May involve comparisons or applications
- Include some technical terms
- Example: "What is the difference between a public and private key?"

### Hard Questions (Advanced)
- Require deeper knowledge
- May involve multiple concepts
- Include specific technical details
- Example: "How does a bonding curve algorithm determine token pricing?"

## Best Practices for Educational Impact

### 1. Progressive Learning
- Start with basic definitions
- Build to practical applications
- End with advanced concepts
- Connect related topics

### 2. Real-World Relevance
- Use current examples
- Reference actual platforms/tools
- Include practical implications
- Address common misconceptions

### 3. Engagement Techniques
- Use interesting scenarios
- Include "gotcha" elements in distractors
- Vary question formats
- Provide actionable insights

### 4. Consistency Standards
- Maintain similar question length
- Use consistent terminology
- Follow established patterns
- Ensure smooth difficulty progression

## Sample Question Sets

### Complete 5-Question Set Template
```json
[
  {
    "question": "What is the primary purpose of {Platform/Concept}?",
    "options": [
      "{Correct definition}",
      "{Related but incorrect option}",
      "{Completely different concept}"
    ],
    "answer": "{Correct definition}",
    "explainer": "{Educational explanation of core concept}"
  },
  {
    "question": "How does {Platform/Concept} help {target users}?",
    "options": [
      "{Correct benefit}",
      "{Misconception about benefits}",
      "{Irrelevant benefit}"
    ],
    "answer": "{Correct benefit}",
    "explainer": "{Explanation of how it provides value}"
  },
  {
    "question": "What type of {technology/content} does {Platform/Concept} primarily support?",
    "options": [
      "{Correct type}",
      "{Similar but incorrect type}",
      "{Unrelated type}"
    ],
    "answer": "{Correct type}",
    "explainer": "{Explanation of specialization}"
  },
  {
    "question": "What can users do with {Platform/Concept}?",
    "options": [
      "{Correct functionality}",
      "{Limited functionality}",
      "{Unrelated activity}"
    ],
    "answer": "{Correct functionality}",
    "explainer": "{Explanation of main use cases}"
  },
  {
    "question": "How does {Platform/Concept} ensure {quality/security/reliability}?",
    "options": [
      "{Correct mechanism}",
      "{Insufficient mechanism}",
      "{Overly complex solution}"
    ],
    "answer": "{Correct mechanism}",
    "explainer": "{Explanation of quality assurance approach}"
  }
]
```

## Quality Assurance Checklist

### Before Finalizing Questions
- [ ] Each question focuses on one clear concept
- [ ] Correct answers are specific and unambiguous
- [ ] Incorrect options are plausible but clearly wrong
- [ ] Explainers are educational and within character limit
- [ ] Questions progress logically in difficulty
- [ ] All answers match exactly between "answer" and "options"
- [ ] Terminology is consistent throughout
- [ ] No spelling or grammatical errors
- [ ] Content is current and accurate

### Educational Value Check
- [ ] Questions teach useful concepts
- [ ] Explainers provide actionable knowledge
- [ ] Content connects to real-world applications
- [ ] Difficulty progression makes sense
- [ ] Topics are relevant to NPC's theme

This template guide ensures consistent, educational quiz content that enhances player learning while maintaining engagement across all NPCs in QuiztalWorld.