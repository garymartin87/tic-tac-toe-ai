import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
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

type WinningLine = { row: number; col: number }[];

export default function App(): JSX.Element {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.X);
  const [currentTurnText, setCurrentTurnText] = useState<string>('Your turn (X)');
  const [winningLine, setWinningLine] = useState<WinningLine>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startWinAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const checkWinner = (b: Board): { winner: string | null; line: WinningLine } => {
    const lines = [
      // Rows
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
      [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
      // Columns
      [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
      [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
      // Diagonals
      [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
      [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }]
    ];

    for (const line of lines) {
      const [pos1, pos2, pos3] = line;
      const cellA = b[pos1.row][pos1.col];
      const cellB = b[pos2.row][pos2.col];
      const cellC = b[pos3.row][pos3.col];
      
      if (cellA !== '' && cellA === cellB && cellA === cellC) {
        return { winner: cellA, line };
      }
    }
    return { winner: b.flat().includes('') ? null : 'Draw', line: [] };
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
    if (result.winner) {
      setWinningLine(result.line);
      startWinAnimation();
      endGame(result.winner);
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
    if (finalResult.winner) {
      setWinningLine(finalResult.line);
      startWinAnimation();
      endGame(finalResult.winner);
    }
  };

  const endGame = (winner: string) => {
    let message = '';
    let title = '';
    
    if (winner === 'Draw') {
      title = 'It is a draw!';
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
      setWinningLine([]);
    }, 2000);
  };

  const isWinningCell = (row: number, col: number): boolean => {
    return winningLine.some(pos => pos.row === row && pos.col === col);
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
            <TouchableOpacity 
              key={j} 
              style={styles.cell} 
              onPress={() => handlePress(i, j)}
            >
              {isWinningCell(i, j) ? (
                <Animated.Text 
                  style={[
                    styles.cellText,
                    cell === Player.X && { color: '#7CB9E8' },
                    cell === Player.O && { color: '#FFB6C1' },
                    { transform: [{ scale: scaleAnim }] }
                  ]}
                >
                  {cell}
                </Animated.Text>
              ) : (
                <Text style={[
                  styles.cellText,
                  cell === Player.X && { color: '#7CB9E8' }, // Pastel blue for X
                  cell === Player.O && { color: '#FFB6C1' }  // Pastel pink for O
                ]}>
                  {cell}
                </Text>
              )}
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