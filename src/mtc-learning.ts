import { TicTacToe } from './game-mtc';
import { EXPLORATION, ITERATIONS, MCTS  } from './mtc-training';

const worker = new Worker(new URL('./mtc-training.ts', import.meta.url), {
  type: 'module',
});

type Score = {
    index: number;
    score: number;
}

const boardElement = document.getElementById('board');
const iterationElement = document.getElementById('iteration');
const xWinsElement = document.getElementById('xWins');
const oWinsElement = document.getElementById('oWins');
const drawsElement = document.getElementById('draws');

const messageElement = document.getElementById('message');

const scoresLeftElement = document.getElementById('scoresLeft');
const scoresRightElement = document.getElementById('scoresRight');

const aiThoughtProcessElement = document.getElementById('aiThoughtProcess');

let game = new TicTacToe();
let mcts = new MCTS(game, 2, ITERATIONS, EXPLORATION);
let isPlayerTurn = true;
let buttonAdded = false;

function renderBoard(board:any): void {
  if (!boardElement) return;
  boardElement.innerHTML = '';

  if (!board) return;
  board.forEach((cell: number, index: number) => {
    const cellElement = document.createElement('div');
    cellElement.className = 'cell';
    cellElement.textContent = cell === 1 ? 'X' : cell === 2 ? 'O' : '';   
    cellElement.addEventListener('click', () => handleCellClick(index));

    boardElement?.appendChild(cellElement);
  });
}

function handleCellClick(index: number): void {
  if (isPlayerTurn && mcts.game.state.board[index] === 0) {
   // const move = mcts.selectMove();
    //game.playMove(move ? move: -1);
    mcts.game.playMove(index);
    isPlayerTurn = false;

    renderBoard(mcts.game.state.board);
    checkGameStatus();
  }
}

function aiMakeMove(): void {
  if (!isPlayerTurn) {
    const bestMove = mcts.selectMove();
    if (
      bestMove
    ) {
      console.log("aiMakeMove going to " + bestMove);
      //game.performMove(bestMove);
      mcts.game.playMove(bestMove);
      renderBoard(mcts.game.state.board);
      isPlayerTurn = true;
      checkGameStatus();
      // Call to display AI thought process with scores for each considered move
     // renderAIThoughtProcess(game, moveScores, bestMove.index);
     // printScores(moveScores);

    } else {
      console.error('Monte Carlo returned undefined or invalid', bestMove);
    }
  }
}

const printScores = (scores: Score[]) => {
    if (!scoresLeftElement || !scoresRightElement) return;
    let leftTextContent = '';
    let rightTextContent = '';
    let i = 1;
    let x = 1;
    let y = 1;
    scores.forEach(score => {
        
        if (i <= 4) {
            leftTextContent += `(${score.index + 1}): ${score.score} ${i % 2 === 0 ? '<br/>': ''}`;
        } else {
            rightTextContent += `(${score.index + 1}): ${score.score} ${i % 2 === 0 ? '<br/>': ''}`;
        }

        x++;
        i++;
        if (i % 3 === 0) {
            y++;
            x = 1;
        };
    });
    scoresLeftElement.innerHTML = leftTextContent;
    scoresRightElement.innerHTML = rightTextContent;
}

function checkGameStatus(): void {
  const winner = game.winner();
  if (winner !== -1 || game.gameOver()) {
    endGame(winner);
    isPlayerTurn = false;
  } else if (!isPlayerTurn) {
    console.log("timing out aiMakeMove");
    setTimeout(aiMakeMove, 20);
  }
}

function endGame(winner: number): void {
  const messages = {
    [-1]: "It's a <strong>&nbsp;draw!</strong>",
    [1]: 'Player <strong>&nbsp;X wins!</strong>',
    [2]: 'Player <strong>&nbsp;O wins!</strong>',
  };
  let message = messages[winner];

  setupRestartButton(message);
  isPlayerTurn = false;

  if (!xWinsElement || !oWinsElement || !drawsElement) return;
  xWinsElement.innerHTML = (Number(xWinsElement.innerHTML) + (winner === 1 ? 1 : 0)).toString().padStart(2, '0');
  oWinsElement.innerHTML = (Number(oWinsElement.innerHTML) + (winner === 2 ? 1 : 0)).toString().padStart(2, '0');
  drawsElement.innerHTML = (Number(drawsElement.innerHTML) + (winner === -1 ? 1 : 0)).toString().padStart(2, '0');
}

const setupRestartButton = (message: string) => {
  if (!messageElement) return;
  messageElement.innerHTML = message;

  const restartButton = document.createElement('button');
  restartButton.innerHTML = buildButtonPartial();

  restartButton.classList.add('button');

  if (!buttonAdded) {
    messageElement.appendChild(restartButton);
    buttonAdded = true;
  }
  messageElement.classList.add('transparent');

  restartButton.onclick = () => {
    buttonAdded = false;
    messageElement.classList.add('transparent');
    messageElement.classList.remove('fade-in');
    resetGameUI();
    startNewGame();
  };
  messageElement.classList.add('fade-in');
  messageElement.classList.remove('transparent');
};

worker.onmessage = (
  event: MessageEvent<{
    board: any;
    iteration: number;
    action: string;
    xWins: number;
    oWins: number;
    draws: number;
  }>
): void => {
  if (
    !iterationElement ||
    !xWinsElement ||
    !oWinsElement ||
    !drawsElement ||
    !messageElement
  )
    return;
  const data = event.data;

  if (data.action === 'updateBoard') {
    game.board = data.board;
    xWinsElement.innerHTML = data.xWins.toString().padStart(2, '0');
    oWinsElement.innerHTML = data.oWins.toString().padStart(2, '0');
    drawsElement.innerHTML = data.draws.toString().padStart(2, '0');

    renderBoard(game.board);
  }

  if (data.action === 'updateIteration') {
    iterationElement.textContent = `${data.iteration}`;
  }

  if (data.action === 'trainingComplete') {
    messageElement.textContent = 'Training done. Click a square to play.';
    xWinsElement.textContent = data.xWins.toString();
    oWinsElement.textContent = data.oWins.toString();
    startNewGame();
  }
};

function startNewGame(): void {
  game = new TicTacToe();
  mcts = new MCTS(game, 2, ITERATIONS, EXPLORATION);
  isPlayerTurn = true;
  renderBoard(mcts.game.state.board);
}

function resetGameUI(): void {
  if (!messageElement || !boardElement) return;

  messageElement.textContent = '';
  Array.from(boardElement.children).forEach((cell: { textContent: string }) => {
    cell.textContent = '';
  });

  if (!scoresLeftElement ||  !scoresRightElement || !aiThoughtProcessElement) return;
  scoresLeftElement.textContent = '';
  scoresRightElement.textContent = '';
  aiThoughtProcessElement.innerHTML = '';
}

worker.postMessage({ startTraining: true });

function renderAIThoughtProcess(
  game: TicTacToe,
  moveScores: Array<{ index: number; score: number }>,
  moveMade: number
): void {
  if (!aiThoughtProcessElement) return;

  aiThoughtProcessElement.innerHTML = '';

  const aiBoardContainer = document.createElement('div');
  const aiBoardLabel = document.createElement('div');
  aiBoardLabel.textContent = 'AI Thoughts';
  aiBoardContainer.appendChild(aiBoardLabel);

  const aiBoard = document.createElement('div');

  aiBoard.className = 'board ai-board';

  game.board.forEach((cell, index) => {
    const cellElement = document.createElement('div');
    cellElement.className = 'cell ai';

    if (cell === -1) {
      const moveScore = moveScores.find(
        (moveScore) => moveScore.index === index
      );
      if (moveScore) {
        cellElement.textContent = moveScore.score >= 0 ? 'Good' : 'Bad';
        cellElement.classList.add(
          moveScore.score > 0 ? 'good-move' : 'bad-move'
        );
      } else {
        cellElement.textContent = '0';
      }
    } else {
        cellElement.textContent = cell === 1 ? 'X' : '0';
        if (index === moveMade) {
            cellElement.classList.add('green');
        }
    }
    aiBoard.appendChild(cellElement);
    aiBoardContainer.appendChild(aiBoard);
  });

  aiThoughtProcessElement.appendChild(aiBoardContainer);
}

const buildButtonPartial = (): string => {
    return `<span class="text">Play Again</span>
    <div class="overlay">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>`;
}
