# TicTacToe AI

A React Native Tic Tac Toe game powered by advanced AI capabilities.

The game integrates with OpenRouter.ai's API to provide intelligent gameplay using the Anthropic Claude 3 Sonnet model, which was selected after benchmarking various models for optimal performance in game strategy.

The implementation includes a retry system that attempts up to 3 times to get a valid move from the AI when it either fails to respond or suggests an already occupied position. If all retries are exhausted, the system falls back to a random valid move to ensure the game can continue.

## Demo
https://github.com/user-attachments/assets/2dbbb6fa-591e-4490-8a24-d498b12d9eec

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Xcode (for iOS development)
- CocoaPods
- Ruby
- OpenRouter API key (get it from https://openrouter.ai/)

## Installation

1. Clone the repository

2. Create a .env file in the root directory with your OpenRouter API key:
```bash
OPENROUTER_API_KEY=your_api_key_here
```

3. Install dependencies:
```bash
npm install
```

4. Install iOS dependencies:
```bash
cd ios
pod install
cd ..
```

5. Run the project:
```bash
npm run ios
```

6. Start Metro (in a new terminal):
```bash
npm start
```
