# Farcaster Frame Integration

This directory contains the Farcaster Frame implementation for Quiztal World.

## Overview

Farcaster Frames allow users to interact with Quiztal World directly from Farcaster without leaving the app. This implementation provides:

1. Quick Web3 quizzes
2. Leaderboard viewing
3. Links to the full game

## Installation

1. Ensure you have the required dependencies:
```bash
npm install express
```

2. Add the frame routes to your existing server:
```javascript
// In your main server file (e.g., server.js)
const farcasterFrame = require('./src/server/farcaster-frame');
app.use('/', farcasterFrame);
```

## Endpoints

- `GET /farcaster/frame` - Main frame entry point
- `POST /farcaster/frame/action` - Handles frame button actions
- `POST /farcaster/frame/quiz-result` - Processes quiz results

## Configuration

Update the following URLs in the frame implementation:
- Replace `https://yourdomain.com` with your actual domain
- Ensure all image assets are accessible via HTTPS
- Update the "Play Full Game" link to point to your game

## Testing

1. Start your server:
```bash
node src/server/farcaster-frame.js
```

2. Test locally at:
```
http://localhost:3000/farcaster/frame
```

3. Use the official Farcaster Frame Validator:
https://frames-validator.vercel.app/

## Assets

You'll need to create the following image assets:
- `frame-preview.png` - Main preview image (1200x630px)
- `quiz-frame.png` - Quiz question display
- `leaderboard-frame.png` - Leaderboard display
- `result-frame.png` - Quiz result display

Place these in your `public/assets/ui/` directory.

## Deployment

1. Deploy your server with the frame endpoints
2. Ensure HTTPS is configured
3. Verify all assets are accessible
4. Test with the Frame Validator
5. Share your frame with the Farcaster community

## Customization

You can customize the quiz questions by modifying the `questions` array in the `generateQuizFrame` function. Add more questions or update existing ones to match your game's content.

## Support

For issues with the Farcaster Frame implementation, refer to:
- [Farcaster Frame Documentation](https://docs.farcaster.xyz/reference/frames/spec)
- [Frame Validator Tool](https://frames-validator.vercel.app/)