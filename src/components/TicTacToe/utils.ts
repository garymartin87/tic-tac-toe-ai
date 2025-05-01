import { Board, WinningLine } from './types';

export const checkWinner = (b: Board): { winner: string | null; line: WinningLine } => {
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