import { Player, TicTacToe } from "./game";
import { minimax } from "./trainWorker";

const worker = new Worker(new URL("./trainWorker.ts", import.meta.url), {
  type: "module",
});

const boardElement = document.getElementById("board");
const iterationElement = document.getElementById("iteration");
const xWinsElement = document.getElementById("xWins");
const oWinsElement = document.getElementById("oWins");
const drawsElement = document.getElementById("draws");

const messageElement = document.getElementById("message");

let game = new TicTacToe();
let isPlayerTurn = false;

function renderBoard(board: Player[]): void {
  if (!boardElement) return;
  boardElement.innerHTML = "";

  board.forEach((cell: Player, index: number) => {
    const cellElement = document.createElement("div");
    cellElement.className = "cell";
    cellElement.textContent =
      cell === Player.X ? "X" : cell === Player.O ? "O" : "";
    cellElement.addEventListener("click", () => handleCellClick(index));
    boardElement?.appendChild(cellElement);
  });
}

function handleCellClick(index: number) {
  if (isPlayerTurn && game.board[index] === Player.None) {
    game.makeMove(index);
    isPlayerTurn = false;
    renderBoard(game.board);
    checkGameStatus();
  }
}
function aiMakeMove() {
  if (!isPlayerTurn) {
    const bestMove = minimax(game, Player.O, 0);
    if (
      bestMove &&
      typeof bestMove.score !== "undefined" &&
      bestMove.index !== null
    ) {
      game.makeMove(bestMove.index);
      renderBoard(game.board);
      isPlayerTurn = true;
      checkGameStatus();
    } else {
      console.error("Minimax returned undefined or invalid", bestMove);
    }
  }
}

function checkGameStatus() {
  const winner = game.checkWinner();
  if (winner !== Player.None || game.isGameOver()) {
    endGame(winner);
    isPlayerTurn = false;
  } else if (!isPlayerTurn) {
    setTimeout(aiMakeMove, 50);
  }
}

function endGame(winner: Player): void {
  if (!messageElement) return;

  let message = "It's a draw!";
  if (winner === Player.X) {
    message = "Player X wins!";
  } else if (winner === Player.O) {
    message = "Player O wins!";
  }

  messageElement.textContent = message;

  isPlayerTurn = false;

  const restartButton = document.createElement("button");
  restartButton.textContent = "Play Again";
  restartButton.onclick = () => {
    messageElement.removeChild(restartButton);
    resetGameUI();
    startNewGame();
  };
  messageElement.appendChild(restartButton);
}

worker.onmessage = (event: MessageEvent<any>): void => {
  if (
    !iterationElement ||
    !xWinsElement ||
    !oWinsElement ||
    !drawsElement ||
    !messageElement
  )
    return;
  const data = event.data;

  if (data.action === "updateBoard") {
    game.board = data.board;
    xWinsElement.textContent = data.xWins.toString();
    oWinsElement.textContent = data.oWins.toString();
    drawsElement.textContent = data.draws.toString();

    renderBoard(game.board);
  }

  if (data.action === "updateIteration") {
    iterationElement.textContent = `Iteration: ${data.iteration}`;
  }

  if (data.action === "trainingComplete") {
    messageElement.textContent =
      "Training complete. Click any square to start playing.";
    xWinsElement.textContent = data.xWins.toString();
    oWinsElement.textContent = data.oWins.toString();
    startNewGame();
  }
};

function startNewGame() {
  game = new TicTacToe();
  isPlayerTurn = true; // Player goes first
  renderBoard(game.board);
}

function resetGameUI() {
  if (!messageElement || !boardElement) return;

  messageElement.textContent = "";
  Array.from(boardElement.children).forEach((cell: { textContent: string }) => {
    cell.textContent = "";
  });
}

worker.postMessage({ startTraining: true }); // Begin training as soon as the worker is ready
