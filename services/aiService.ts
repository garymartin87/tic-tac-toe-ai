import { Alert } from 'react-native';
import { OPENROUTER_API_KEY } from '@env';

export type Board = string[][];

const getRandomEmptyCell = (boardState: Board): [number, number] | null => {
  const emptyCells: [number, number][] = [];
  
  // Find all empty cells
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (boardState[i][j] === '') {
        emptyCells.push([i, j]);
      }
    }
  }
  
  // If there are empty cells, return a random one
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }
  
  return null;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getAIMove = async (boardState: Board): Promise<[number, number] | null> => {
  if (!OPENROUTER_API_KEY) {
    console.error('Missing OPENROUTER_API_KEY in environment variables');
    Alert.alert('Error', 'API key not configured');
    return getRandomEmptyCell(boardState);
  }

  let retries = MAX_RETRIES;
  
  while (retries > 0) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Tic Tac Toe AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet',
          messages: [
            {
              role: 'system',
              content: `You are a Tic Tac Toe AI. Your task is to:
1. Analyze the current board state
2. Choose an empty cell (marked as '') for your move
3. Respond ONLY with the coordinates in the format: row,column (e.g. 1,2)
4. NEVER pick a cell that is already taken (marked as 'X' or 'O')
5. Make strategic moves to win or prevent the opponent from winning

The board is a 3x3 grid where:
- Empty cells are marked as ''
- X represents the player's moves
- O represents your moves (the AI)

IMPORTANT RULES:
- Only respond with the coordinates, nothing else
- Double-check that your chosen cell is empty before responding
- If you're unsure, choose a different cell
- The response must be exactly in the format: row,column (e.g. 1,2)
- Do not include any explanation or additional text`
            },
            {
              role: 'user',
              content: `Current board state (row,column format):
${boardState.map((row, i) => 
  row.map((cell, j) => `${i},${j}: ${cell || 'empty'}`).join(' | ')
).join('\n')}

Available empty cells:
${boardState.flatMap((row, i) => 
  row.map((cell, j) => cell === '' ? `${i},${j}` : null)
).filter(Boolean).join(', ')}

Choose your next move. Respond only with row,column.`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      console.log('AI raw response:', data);
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log('AI decision:', content);

      const match = content?.match(/\d+/g);
      if (match && match.length === 2) {
        const [row, col] = [parseInt(match[0], 10), parseInt(match[1], 10)];
        if (boardState[row]?.[col] === '') {
          return [row, col];
        }
        console.warn('AI selected an already occupied cell:', row, col);
      } else {
        console.warn('Invalid AI response format:', content);
      }

      retries--;
      if (retries > 0) {
        console.log(`Retrying AI move... (${retries} attempts remaining)`);
        await sleep(RETRY_DELAY);
      }
    } catch (err) {
      console.error('AI Error:', err);
      retries--;
      if (retries > 0) {
        console.log(`Retrying after error... (${retries} attempts remaining)`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.log('All retries exhausted, falling back to random move');
  return getRandomEmptyCell(boardState);
}; 