import { TicTacToe, Player } from '../src/game';

interface QTable {
  [state: string]: StateActionValues;
}

interface StateActionValues {
  [action: number]: number;
}

const NUM_ITERATIONS = 3000000;
const LEARNING_RATE = 0.15;
const DISCOUNT_FACTOR = 0.1;
let explorationRate = 1.0;
const EXPLORATION_DECAY = 0.999999;
export const qTable: QTable = {};
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

      if (reward === 1) {
        oWins++;
      } else if (reward === -1) {
        xWins++;
      } else if (gameOver) {
        draws++;
      }

      const bestAction = selectBestAction(nextState);
      updateQValue(game, qTable, state, action, reward, nextState, bestAction);

      state = nextState;

      // Reduce exploration rate
      explorationRate *= EXPLORATION_DECAY;
      explorationRate = Math.max(explorationRate, 0.0001);


      if (i % 10000 === 0){

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

  function updateQValue(game: TicTacToe, qTable: QTable, state: string, action: number, reward: number, nextState: string, bestAction: number): void {
    const numActions = 9;
  
    if (!qTable[state]) {
      const qValues: StateActionValues = {};
      for (let i = 0; i < numActions; i++) {
        qValues[i] = Math.random();
      }
      qTable[state] = qValues;
    }
  
    const qValues = qTable[state];
    const oldQValue = qValues[action];
    const maxFutureReward = getMaxFutureReward(nextState, game);
    const newQValue = oldQValue + LEARNING_RATE * (reward + DISCOUNT_FACTOR * maxFutureReward - oldQValue);
  
    qValues[action] = newQValue;
  
    qTable[state] = qValues;
  }



postMessage({
    action: 'trainingComplete',
    qTable: Array.from(Object.entries(qTable)),
    xWins,
    oWins,
    draws,
  });
}

function selectAction(state: string, game: TicTacToe): number {
  const availableMoves = game.getAvailableMoves();

  if (Math.random() < explorationRate || !qTable[state]) {
    // Explore
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  } else {
    // Exploit
    const stateActionValues = qTable[state];
    const maxQValue = Math.max(...Object.values(stateActionValues));
    const bestActions = Object.keys(stateActionValues).filter(action => stateActionValues[action] === maxQValue);
    return parseInt(bestActions[Math.floor(Math.random() * bestActions.length)]);
  }
}


function getReward(game: TicTacToe): number {
  if (game.checkWinner() === Player.X) {
    return -1;
  } else if (game.checkWinner() === Player.O) {
    return 1; 
  }
  return 0;
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
    console.log("starting training");
    trainQLearningAgent();
  }
};

export function selectBestAction(state: string): number {
  if (!qTable[state]) {
    // If no Q-values for this state, return a random action
    return Math.floor(Math.random() * 9);
  }

  const qValues = qTable[state];
  let bestAction = -1;
  let maxQValue = Number.NEGATIVE_INFINITY;

  // find the highest Q-value
  for (const action in qValues) {
    if (qValues.hasOwnProperty(action)) {
      if (qValues[action] > maxQValue) {
        maxQValue = qValues[action];
        bestAction = parseInt(action);
      }
    }
  }

  return bestAction;
}
