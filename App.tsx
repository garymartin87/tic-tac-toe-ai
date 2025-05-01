import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

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
          Authorization: `Bearer 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`
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                "You are a Tic Tac Toe AI. Always respond ONLY with the coordinates of your move in the format: row,column (e.g. 1,2). Do not add anything else. Never pick a cell that is already taken."
            },
            {
              role: 'user',
              content: `Here is the current board as a 3x3 array with X, O or empty strings. Pick your next move and respond only with row,column:
${JSON.stringify(
                boardState
              )}`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log('AI raw response:', content);

      const match = content?.match(/\d+/g);
      if (match && match.length === 2) {
        return [parseInt(match[0], 10), parseInt(match[1], 10)];
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