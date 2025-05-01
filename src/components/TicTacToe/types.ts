export enum Player {
  X = 'X',
  O = 'O'
}

export type Board = string[][];

export type WinningLine = Array<{ row: number; col: number }>;

export type GameResult = 'PLAYER_WON' | 'AI_WON' | 'DRAW' | null;

export const emptyBoard: Board = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
]; 