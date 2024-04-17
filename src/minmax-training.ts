import { TicTacToe, Player, getOppositePlayer } from './game';

const NUM_ITERATIONS = 50;
const EXPLORATION_RATE = 0.2;
let xWins = 0;
let oWins = 0;
let draws = 0;

function trainMinimaxAgent(): void {
  for (let i = 1; i <= NUM_ITERATIONS; i++) {
    let game = new TicTacToe();
    let gameOver = false;
    let currentPlayer = Player.O;

    if (i % 2 === 0) {
      // because worker goes too fast anyway
      postMessage({
        action: 'updateIteration',
        iteration: i,
      });
    }

    while (!gameOver) {
      let bestMove = -1;
      if (Math.random() < EXPLORATION_RATE) {
        const availableMoves = game.getAvailableMoves();
        bestMove =
          availableMoves[Math.floor(Math.random() * availableMoves.length)];
      } else {
        let bestScore = currentPlayer === Player.O ? -Infinity : Infinity;
        game.getAvailableMoves().forEach((move) => {
          game.makeMove(move);
          const score = minimax(game, -currentPlayer, 0);
          game.undoMove();
          if (currentPlayer === Player.O) {
            if (score.score > bestScore) {
              bestScore = score.score;
              bestMove = move;
            }
          } else {
            if (score.score < bestScore) {
              bestScore = score.score;
              bestMove = move;
            }
          }
        });
      }

      if (bestMove !== -1) {
        game.makeMove(bestMove);
      }

      gameOver = game.isGameOver();
      const winner = game.checkWinner();
      if (winner === Player.O) {
        oWins++;
      } else if (winner === Player.X) {
        xWins++;
      } else if (gameOver && winner === Player.None) {
        draws++;
      }

      currentPlayer = -currentPlayer;

      if (i % 3 === 0) {
        postMessage({
          action: 'updateBoard',
          board: game.board,
          xWins,
          oWins,
          draws,
        });
      }
    }
  }

  postMessage({
    action: 'trainingComplete',
    xWins,
    oWins,
    draws,
  });
}

export function minimax(game: TicTacToe, player: Player, depth: number) {
  const winner = game.checkWinner();

  if (winner === Player.O) {
    return { index: null, score: 4 - depth };
  } else if (winner === Player.X) {
    return { index: null, score: -4 + depth };
  } else if (game.isGameOver()) {
    return { index: null, score: 0 };
  }

  const moves = game.getAvailableMoves();
  let bestMove = {
    score: player === Player.O ? -Infinity : Infinity,
    index: 0,
  };

  for (const move of moves) {
    game.makeMove(move);
    // recurisvely minmax going down levels
    const result = minimax(game, getOppositePlayer(player), depth + 1);
    game.undoMove();

    if (
      (player === Player.O && result.score > bestMove.score) ||
      (player === Player.X && result.score < bestMove.score)
    ) {
      bestMove.index = move;
      bestMove.score = result.score;
    }
  }

  return bestMove;
}

self.onmessage = (e) => {
  if (e.data.startTraining) {
    trainMinimaxAgent();
  }
};
