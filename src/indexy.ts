import { Player, TicTacToe } from './gamy';

const worker = new Worker(new URL('./trainning.ts', import.meta.url), { type: 'module' });

const boardElement = document.getElementById('board');
const iterationElement = document.getElementById('iteration');
const xWinsElement = document.getElementById('xWins');
const oWinsElement = document.getElementById('oWins');
const messageElement = document.getElementById('message');

let game = new TicTacToe();
let isPlayerTurn = false; // Start with the AI's turn because the AI trains first
let qTable = new Map();  // To hold the Q-values after training

function renderBoard(): void {
    boardElement.innerHTML = '';  // Clear the board

    game.board.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.textContent = cell === Player.X ? 'X' : cell === Player.O ? 'O' : '';
        cellElement.addEventListener('click', () => handleCellClick(index));
        boardElement.appendChild(cellElement);
    });
}

function handleCellClick(index: number): void {
    if (isPlayerTurn && game.board[index] === Player.None) {
        game.makeMove(index);
        isPlayerTurn = false;
        renderBoard();
        checkGameStatus();
    }
}

function aiMakeMove(): void {
    const state = game.getState();
    const qValues = qTable.get(state) || Array(9).fill(0);
    const availableMoves = game.getAvailableMoves();
    let bestMove = availableMoves[0];
    let maxQValue = qValues[bestMove];

    availableMoves.forEach(move => {
        const qValue = qValues[move];
        if (qValue > maxQValue) {
            maxQValue = qValue;
            bestMove = move;
        }
    });

    game.makeMove(bestMove);  // AI makes the move
    renderBoard();
    isPlayerTurn = true;  // Hand the turn back to the player
    checkGameStatus();
}

function checkGameStatus(): void {
    const winner = game.checkWinner();
    if (winner !== Player.None) {
        endGame(winner);
    } else if (!game.board.includes(Player.None)) {
        endGame(Player.None);  // The board is full, and it's a draw
    } else if (!isPlayerTurn) {
        aiMakeMove();  // If there is no winner or draw and it isn't the player's turn, the AI goes
    }
}

function endGame(winner: Player): void {
  let message = winner === Player.X ? 'Player X wins!' : winner === Player.O ? 'Player O wins!' : "It's a draw!";
  messageElement.textContent = message;

  setTimeout(() => {
      if (confirm('Game over! Play again?')) {
          game.resetGame();
          isPlayerTurn = true; // The player starts new games
          messageElement.textContent = 'Your turn!'; // Prompt the player to move
          renderBoard();
      }
  }, 1000);  // Delay to allow the players to see the endgame condition
}

function startGame(): void {
    game = new TicTacToe();
    isPlayerTurn = false; // The AI makes the first move after training
    renderBoard();
}

worker.onmessage = (event) => {
  const data = event.data;

  // Update the board during the training visualization
  if (data.action === 'updateBoard') {
      game.board = data.board.map((cell) => parseInt(cell, 10));
      renderBoard();
  }

  // Update iteration count during training
  if (data.iteration) {
      iterationElement.textContent = `Iteration: ${data.iteration}`;
  }

  // Update win counts if provided by the worker
  if (data.xWins !== undefined && data.oWins !== undefined) {
      xWinsElement.textContent = data.xWins.toString();
      oWinsElement.textContent = data.oWins.toString();
  }

  // If training data is complete, setup game to play against the trained AI
  if (data.qTable) {
      // Store the Q-table received from the worker
      qTable = new Map(data.qTable);

      // Update the message to show training is complete and ready for play
      messageElement.textContent = 'Training complete. Click any square to start playing.';

      // Reset the game board and enable player's turn to start playing against AI
      game.resetGame();
      isPlayerTurn = true;
      renderBoard();
  }
};

worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

worker.postMessage({ startTraining: true });
startGame();
