import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAIMove, Board } from './services/aiService';

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

  const endGame = (winner: string) => {
    let message = '';
    let title = '';
    
    if (winner === 'Draw') {
      title = 'Game Over';
      message = "It's a draw!";
    } else if (winner === Player.X) {
      title = 'Victory!';
      message = 'Congratulations! You won! 🎉';
    } else {
      title = 'Defeat';
      message = 'AI wins! Better luck next time! 😠';
    }
    
    setCurrentTurnText(message);
    Alert.alert(title, message);
    setTimeout(() => {
      setBoard(emptyBoard);
      setCurrentPlayer(Player.X);
      setCurrentTurnText('Your turn (X)');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={[
        styles.turnText,
        currentPlayer === Player.X && { color: '#7CB9E8' }, // Pastel blue for X
        currentPlayer === Player.O && { color: '#FFB6C1' }  // Pastel pink for O
      ]}>{currentTurnText}</Text>
      {board.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((cell, j) => (
            <TouchableOpacity key={j} style={styles.cell} onPress={() => handlePress(i, j)}>
              <Text style={[
                styles.cellText,
                cell === Player.X && { color: '#7CB9E8' }, // Pastel blue for X
                cell === Player.O && { color: '#FFB6C1' }  // Pastel pink for O
              ]}>{cell}</Text>
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
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  turnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  }
});