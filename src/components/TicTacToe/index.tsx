import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { getAIMove } from '../../services/aiService';
import { Player, Board, WinningLine, emptyBoard, GameResult } from './types';
import { styles, COLORS } from './styles';
import { checkWinner } from './utils';

export default function TicTacToe(): React.ReactElement {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.X);
  const [winningLine, setWinningLine] = useState<WinningLine>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handlePress = async (row: number, col: number) => {
    if (board[row][col] !== '' || currentPlayer !== Player.X) return;

    const newBoard = board.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? Player.X : c))
    );
    setBoard(newBoard);
    setCurrentPlayer(Player.O);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinningLine(result.line);
      startWinAnimation();
      endGame(result.winner === Player.X ? 'PLAYER_WON' : 'DRAW');
      return;
    }

    setIsAIThinking(true);

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

    const finalResult = checkWinner(iaBoard);
    if (finalResult.winner) {
      setWinningLine(finalResult.line);
      startWinAnimation();
      endGame(finalResult.winner === Player.O ? 'AI_WON' : 'DRAW');
    }
  };

  const resetGame = () => {
    scaleAnim.setValue(1);
    setBoard(emptyBoard);
    setCurrentPlayer(Player.X);
    setWinningLine([]);
    setIsAIThinking(false);
    setGameResult(null);
  };

  const endGame = (result: GameResult) => {
    setIsAIThinking(false);
    setGameResult(result);
  };

  const getGameStatusText = () => {
    if (gameResult === null) {
      return currentPlayer === Player.X ? 'Your turn (X)' : "AI's turn (O)";
    }

    switch (gameResult) {
      case 'PLAYER_WON':
        return 'You won! 🎉';
      case 'AI_WON':
        return 'AI wins! 🤖';
      case 'DRAW':
        return "It's a draw!";
      default:
        return '';
    }
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
              !gameResult && currentPlayer === Player.X && styles.turnTextPlayerX,
              !gameResult && currentPlayer === Player.O && styles.turnTextPlayerO,
              gameResult === 'PLAYER_WON' && styles.textWinnerX,
              gameResult === 'AI_WON' && styles.textWinnerO
            ]}>
              {getGameStatusText()}
            </Text>
            {isAIThinking && (
              <ActivityIndicator 
                style={styles.loadingIndicator} 
                color={COLORS.PLAYER_O}
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
                  disabled={gameResult !== null}
                >
                  {isWinningCell(i, j) ? (
                    <Animated.Text 
                      style={[
                        styles.cellText,
                        cell === Player.X && styles.cellTextX,
                        cell === Player.O && styles.cellTextO,
                        { transform: [{ scale: scaleAnim }] }
                      ]}
                    >
                      {cell}
                    </Animated.Text>
                  ) : (
                    <Text style={[
                      styles.cellText,
                      cell === Player.X && styles.cellTextX,
                      cell === Player.O && styles.cellTextO
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