export enum Player {
  None = 0,
  X = 1,
  O = -1
}

export class TicTacToe {
  // Assuming that history keeps track of board indices changed by each move
  history: number[];
  
  constructor(public board: Player[] = Array(9).fill(Player.None), public currentPlayer: Player = Player.X) {
    this.history = []; // No moves have been made at the start
  }

  makeMove(index: number): boolean {
    if (this.board[index] !== Player.None || index < 0 || index >= 9) {
      return false; // Invalid move
    }

    this.board[index] = this.currentPlayer;
    this.currentPlayer = -this.currentPlayer; // Switch player
    this.history.push(index); // Record the move
    return true;
  }

  undoMove(): void {
    // Removes the last move from history and reverts the board
    const move = this.history.pop();
    if (move !== undefined) {
      this.board[move] = Player.None;
      this.currentPlayer = -this.currentPlayer; // Switch back player
    }
  }

  checkWinner(): Player {
    const winConditions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const condition of winConditions) {
      const [a, b, c] = condition;
      if (this.board[a] !== Player.None && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a]; // Return the winning player
      }
    }

    if (!this.board.includes(Player.None)) {
      return Player.None; // Draw
    }

    return Player.None; // Game still ongoing
  }

  isGameOver(): boolean {
    return this.checkWinner() !== Player.None || !this.board.includes(Player.None);
  }

  resetGame(): void {
    this.board = Array(9).fill(Player.None);
    this.currentPlayer = Player.X;
    this.history = []; // Clear the history
  }

  getState(): string {
    return this.board
      .map(cell => cell.toString())
      .join(',');
  }

  getAvailableMoves(): number[] {
    return this.board
      .map((cell, index) => cell === Player.None ? index : null)
      .filter(index => index !== null) as number[];
  }
}
