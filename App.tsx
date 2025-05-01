import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { OPENROUTER_API_KEY } from './Config';

// Removed OpenAI SDK, using fetch instead

type Board = string[][];

enum Player {
  X = 'X',
  O = 'O'
}

const emptyBoard: Board = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];

export default function App(): JSX.Element {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.X);
  const [currentTurnText, setCurrentTurnText] = useState<string>('Your turn (X)');

  const checkWinner = (b: Board): string | null => {
    const lines = [
      [b[0][0], b[0][1], b[0][2]],
      [b[1][0], b[1][1], b[1][2]],
      [b[2][0], b[2][1], b[2][2]],
      [b[0][0], b[1][0], b[2][0]],
      [b[0][1], b[1][1], b[2][1]],
      [b[0][2], b[1][2], b[2][2]],
      [b[0][0], b[1][1], b[2][2]],
      [b[0][2], b[1][1], b[2][0]]
    ];

    for (let line of lines) {
      if (line.every(cell => cell === Player.X)) return Player.X;
      if (line.every(cell => cell === Player.O)) return Player.O;
    }
    return b.flat().includes('') ? null : 'Draw';
  };

  const handlePress = async (row: number, col: number) => {
    if (board[row][col] !== '' || currentPlayer !== Player.X) return;

    const newBoard = board.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? Player.X : c))
    );
    setBoard(newBoard);
    setCurrentPlayer(Player.O);
    setCurrentTurnText("AI's turn (O)...");

    const result = checkWinner(newBoard);
    if (result) {
      endGame(result);
      return;
    }

    let iaMove: [number, number] | null = null;
    let retries = 3;

    while (retries-- > 0) {
      iaMove = await getAIMove(newBoard);
      if (!iaMove) return;
      const [i, j] = iaMove;
      if (newBoard[i]?.[j] === '') break;
      console.warn('AI selected an already occupied cell, retrying...', i, j);
      iaMove = null;
    }

    if (!iaMove) return;

    const [i, j] = iaMove;
    const iaBoard = newBoard.map((r, x) =>
      r.map((c, y) => (x === i && y === j ? Player.O : c))
    );
    setBoard(iaBoard);
    setCurrentPlayer(Player.X);
    setCurrentTurnText('Your turn (X)');

    const finalResult = checkWinner(iaBoard);
    if (finalResult) endGame(finalResult);
  };

  const getAIMove = async (boardState: Board): Promise<[number, number] | null> => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
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
        return null;
      }
      console.warn('Invalid AI response format:', content);
      return null;
    } catch (err) {
      console.error('AI Error:', err);
      Alert.alert('Error', 'Failed to get AI move.');
      return null;
    }
  };

  const endGame = (winner: string) => {
    setCurrentTurnText(winner === 'Draw' ? "It's a draw!" : `${winner} wins!`);
    Alert.alert('Game Over', winner === 'Draw' ? "It's a draw!" : `${winner} wins!`);
    setTimeout(() => {
      setBoard(emptyBoard);
      setCurrentPlayer(Player.X);
      setCurrentTurnText('Your turn (X)');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.turnText}>{currentTurnText}</Text>
      {board.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((cell, j) => (
            <TouchableOpacity key={j} style={styles.cell} onPress={() => handlePress(i, j)}>
              <Text style={styles.cellText}>{cell}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222'
  },
  row: {
    flexDirection: 'row'
  },
  cell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cellText: {
    fontSize: 32,
    color: '#fff'
  },
  turnText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20
  }
});