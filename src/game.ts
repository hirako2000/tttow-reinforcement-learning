export enum Player {
  None = 0,
  X = 1,
  O = -1,
}

const BOARD_SIZE = 3 * 3;

export function getOppositePlayer(player: Player): Player {
  return player === Player.X ? Player.O : Player.X;
}

export class TicTacToe {
  history: number[];


  constructor(
    public board: Player[] = Array(9).fill(Player.None),
    public currentPlayer: Player = Player.X
  ) {
    this.history = [];
  }

  makeMove(index: number): boolean {
    if (this.board[index] !== Player.None || index < 0 || index >= BOARD_SIZE) {
      return false;
    }

    this.board[index] = this.currentPlayer;
    this.currentPlayer = -this.currentPlayer;
    this.history.push(index);
    return true;
  }

  undoMove(): void {
    const move = this.history.pop();
    if (move !== undefined) {
      this.board[move] = Player.None;
      this.currentPlayer = -this.currentPlayer;
    }
  }

  checkWinner(): Player {
    const winConditions = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Left-to-right diagonal
      [2, 4, 6], // Right-to-left diagonal
    ];

    for (const condition of winConditions) {
      const [a, b, c] = condition;
      if (
        this.board[a] !== Player.None &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        // returning winning player
        return this.board[a];
      }
    }

    if (!this.board.includes(Player.None)) {
      return Player.None;
    }

    // or Game still ongoing
    return Player.None;
  }

  isGameOver(): boolean {
    return (
      this.checkWinner() !== Player.None || !this.board.includes(Player.None)
    );
  }

  resetGame(): void {
    this.board = Array(BOARD_SIZE).fill(Player.None);
    this.currentPlayer = Player.X;
    this.history = [];
  }

  getState(): string {
    return this.board.map((cell) => cell.toString()).join(',');
  }

  getAvailableMoves(): number[] {
    return this.board
      .map((cell, index) => (cell === Player.None ? index : null))
      .filter((index) => index !== null) as number[];
  }
}
