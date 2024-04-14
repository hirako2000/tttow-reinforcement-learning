import { TicTacToe, Player } from './game';

interface QTable {
  [state: string]: StateActionValues;
}

interface StateActionValues {
  [action: number]: number;
}

const NUM_ITERATIONS = 100000; // Adjust as needed
const LEARNING_RATE = 0.5;
const DISCOUNT_FACTOR = 0.9;
let explorationRate = 1.0;
const EXPLORATION_DECAY = 0.9599;
const qTable: QTable = {};
let xWins = 0;
let oWins = 0;
let draws = 0;

function trainQLearningAgent(): void {
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    let game = new TicTacToe();
    let state = game.getState();
    let gameOver = false;

    while (!gameOver) {
      const action = selectAction(state, game);
      game.makeMove(action);
      const reward = getReward(game);
      const nextState = game.getState();
      gameOver = game.isGameOver();

      // Update wins/draws counts
      if (reward === 1) {
        oWins++;
      } else if (reward === -1) {
        xWins++;
      } else if (gameOver) {
        draws++;
      }

      // Update Q-table
      if (!qTable[state]) {
        qTable[state] = {};
      }
      const qValues = qTable[state];
      const maxFutureReward = getMaxFutureReward(nextState, game);
      qValues[action] = (qValues[action] || 0) + LEARNING_RATE * (reward + DISCOUNT_FACTOR * maxFutureReward - (qValues[action] || 0));

      // Transition to the next state
      state = nextState;

      // Reduce exploration rate
      explorationRate *= EXPLORATION_DECAY;
      explorationRate = Math.max(explorationRate, 0.1);

      // Send board update
      postMessage({
        action: 'updateBoard',
        board: game.board,
        xWins,
        oWins,
        draws
      });
    }
  }

  // Training complete
  postMessage({
    action: 'trainingComplete',
    qTable: Array.from(Object.entries(qTable)),
    xWins,
    oWins,
    draws
  });
}

function selectAction(state: string, game: TicTacToe): number {
  const availableMoves = game.getAvailableMoves();
  if (Math.random() < explorationRate || !qTable[state]) {
    // Some randomness force some Exploration, and if we don't have a winning move for this condition, well we've got to explore..
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  } else {
    // Or we exploit
    const stateActionValues = qTable[state];
    return parseInt(Object.keys(stateActionValues).reduce((a, b) => stateActionValues[a] > stateActionValues[b] ? a : b));
  }
}

function getReward(game: TicTacToe): number {
  if (game.checkWinner() === Player.X) {
    return -1; // AI lost
  } else if (game.checkWinner() === Player.O) {
    return 1; // AI wins
  }
  return 0; // Draw or ongoing game
}

function getMaxFutureReward(state: string, game: TicTacToe): number {
  if (!qTable[state]) {
    return 0;
  }
  const qValues = qTable[state];
  return Math.max(...Object.values(qValues));
}

self.onmessage = (e) => {
  if (e.data.startTraining) {
    trainQLearningAgent();
  }
};

