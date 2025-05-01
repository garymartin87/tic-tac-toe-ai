import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
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
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentTextColor, setCurrentTextColor] = useState('#fff');

  const startWinAnimation = () => {
    const animation = Animated.sequence([
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
    ]);

    Animated.loop(animation).start();
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
    setCurrentTurnText("AI's turn (O)");
    setIsAIThinking(true);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setIsAIThinking(false);
      setWinningLine(result.line);
      startWinAnimation();
      endGame(result.winner);
      return;
    }

    let iaMove: [number, number] | null = null;
    let retries = 3;

    while (retries-- > 0) {
      iaMove = await getAIMove(newBoard);
      if (!iaMove) {
        setIsAIThinking(false);
        return;
      }
      const [i, j] = iaMove;
      if (newBoard[i]?.[j] === '') break;
      console.warn('AI selected an already occupied cell, retrying...', i, j);
      iaMove = null;
    }

    setIsAIThinking(false);

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

  const resetGame = () => {
    scaleAnim.setValue(1);
    setBoard(emptyBoard);
    setCurrentPlayer(Player.X);
    setCurrentTurnText('Your turn (X)');
    setWinningLine([]);
    setIsAIThinking(false);
    setGameEnded(false);
  };

  const endGame = (winner: string) => {
    let message = '';
    let messageColor = '#fff';  // default white color
    
    if (winner === 'Draw') {
      message = "It's a draw!";
    } else if (winner === Player.X) {
      message = 'You won! 🎉';
      messageColor = '#7CB9E8';  // player X color
    } else {
      message = 'AI wins! 🤖';
      messageColor = '#FFB6C1';  // matching AI/O symbol color
    }
    
    setIsAIThinking(false);
    setCurrentTurnText(message);
    setCurrentTextColor(messageColor);
    setGameEnded(true);
    startWinAnimation(); // Start animation when game ends
  };

  const isWinningCell = (row: number, col: number): boolean => {
    return winningLine.some(pos => pos.row === row && pos.col === col);
  };

  return (
    <View style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.turnContainer}>
          <View style={styles.turnTextContainer}>
            <Text style={[
              styles.turnText,
              !gameEnded && currentPlayer === Player.X && { color: '#7CB9E8' },
              !gameEnded && currentPlayer === Player.O && { color: '#FFB6C1' },
              gameEnded && { color: currentTextColor }
            ]}>
              {currentTurnText}
            </Text>
            {isAIThinking && (
              <ActivityIndicator 
                style={styles.loadingIndicator} 
                color="#FFB6C1"
                size="small"
              />
            )}
          </View>
        </View>
        {board.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((cell, j) => (
              <View key={j} style={styles.cellBorder}>
                <TouchableOpacity 
                  style={styles.cell} 
                  onPress={() => handlePress(i, j)}
                  activeOpacity={0.7}
                  disabled={gameEnded}
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
                      cell === Player.X && { color: '#7CB9E8' },
                      cell === Player.O && { color: '#FFB6C1' }
                    ]}>
                      {cell}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </View>
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetGame}
        activeOpacity={0.8}
      >
        <Text style={styles.resetButtonText}>RESET GAME</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingBottom: 40
  },
  gameContainer: {
    alignItems: 'center'
  },
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    minHeight: 40
  },
  turnTextContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  turnText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center'
  },
  loadingIndicator: {
    marginLeft: 4
  },
  row: {
    flexDirection: 'row'
  },
  cellBorder: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#fff',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222'
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  resetButton: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#444',
    borderRadius: 8,
    elevation: 3,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});