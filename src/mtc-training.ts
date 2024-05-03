import { TicTacToe } from "./game-mtc";

const NUM_ITERATIONS = 50;
const EXPLORATION_RATE = 0.2;
let xWins = 0;
let oWins = 0;
let draws = 0;

export const ITERATIONS = 50000;
export const EXPLORATION = 1.41;

function trainAgent(): void {
  for (let i = 1; i <= NUM_ITERATIONS; i++) {
    let game = new TicTacToe();
    const mcts = new MCTS(game, 2, ITERATIONS, EXPLORATION);
    let gameOver = false;

    if (i % 2 === 0) {
      // because worker goes too fast anyway
      postMessage({
        action: 'updateIteration',
        iteration: i,
      });
    }

    while (!gameOver) {
      let bestMove = -1;
      //if (Math.random() < EXPLORATION_RATE) {
      if (game.playerTurn() === 1) {
        const availableMoves = game.moves();
        bestMove =
          availableMoves[Math.floor(Math.random() * availableMoves.length)];
          game.playMove(bestMove);
      } else {
        //const aiMoveIndex = mcts.selectMove();
        const aiMoveIndex = besty(mcts.game, 1);
        console.log("AI turn picks aiMoveIndex " + aiMoveIndex );
        game.playMove(aiMoveIndex ? aiMoveIndex : -1);
      }

      gameOver = game.gameOver();
      const winner = game.winner();
      if (winner === 2) {
        oWins++;
      } else if (winner === 1) {
        xWins++;
      } else if (gameOver && winner === null) {
        draws++;
      }


      if (i % 3 === 0) {
        postMessage({
          action: 'updateBoard',
          board: game.state.board,
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

const besty0 = (game: TicTacToe): number => {
    const originalState = game.cloneState();

    
    while (notDone) {



    }


    game.setState(originalState);
    return 0;

}


interface Node {
    state: number[]; // Store the board state directly
    parent: Node | null;
    children: Node[];
    visits: number;
    wins: number;
}

const UCT_CONSTANT = Math.sqrt(2);

const selectPromisingNode = (rootNode: Node): Node => {
    let node = rootNode;

    while (node.children.length !== 0) {
        let maxUCT = -Infinity;
        let selectedNode: Node | null = null;

        for (const child of node.children) {
            const uct = (child.wins / child.visits) + UCT_CONSTANT * Math.sqrt(Math.log(node.visits) / child.visits);
            if (uct > maxUCT) {
                maxUCT = uct;
                selectedNode = child;
            }
        }

        if (selectedNode === null) {
            throw new Error("Selected node is null");
        }

        node = selectedNode;
    }

    return node;
};

const expandNode = (node: Node, game: TicTacToe): Node => {
    const possibleMoves = game.moves();
    for (const move of possibleMoves) {
        const newState = node.state.slice();
        newState[move] = game.playerTurn();
        const childNode: Node = {
            state: newState, // Store the updated board state
            parent: node,
            children: [],
            visits: 0,
            wins: 0
        };
        node.children.push(childNode);
    }
    const randomChild = node.children[Math.floor(Math.random() * node.children.length)];
    return randomChild;
};

const simulateRandomPlayout = (node: Node, player: number, game: TicTacToe): number => {
    const tempGame = new TicTacToe(); // Create a temporary game for simulation
    tempGame.setState({ board: node.state.slice(), playerTurn: game.playerTurn(), gameOver: game.gameOver(), winner: game.winner(), moves: game.moves() });

    while (!tempGame.gameOver()) {
        const moves = tempGame.moves();
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        tempGame.playMove(randomMove);
    }

    const winner = tempGame.winner();
    if (winner === player) {
        return 1;
    } else if (winner !== -1) {
        return -1;
    }
    return 0;
};

const backpropagate = (node: Node, result: number): void => {
    let currentNode: Node | null = node;
    while (currentNode !== null) {
        currentNode.visits++;
        if (currentNode.parent !== null && currentNode.parent.state.findIndex((value, index) => value !== currentNode.state[index]) === currentNode.state.findIndex((value, index) => value !== currentNode.parent.state[index])) {
            currentNode.wins++;
        }
        currentNode = currentNode.parent;
    }
};

const besty = (game: TicTacToe, player: number): number => {
    const rootNode: Node = {
        state: game.getState().board, // Store the initial board state
        parent: null,
        children: [],
        visits: 0,
        wins: 0
    };

    const maxIterations = 1000; // Adjust as needed

    for (let i = 0; i < maxIterations; i++) {
        const promisingNode = selectPromisingNode(rootNode);
        const expandedNode = expandNode(promisingNode, game);
        const playoutResult = simulateRandomPlayout(expandedNode, player, game);
        backpropagate(expandedNode, playoutResult);
    }

    let bestMoveIndex = -1;
    let bestWinRate = -Infinity;

    for (const child of rootNode.children) {
        const winRate = child.wins / child.visits;
        if (winRate > bestWinRate) {
            bestWinRate = winRate;
            bestMoveIndex = child.state.findIndex((value, index) => value !== rootNode.state[index]);
        }
    }

    return bestMoveIndex;
};



class MCTSNode {
    constructor(moves, parent){
        this.parent = parent
        this.visits = 0 
        this.wins = 0 
        this.numUnexpandedMoves = moves.length
        this.children = new Array(this.numUnexpandedMoves).fill(null)
    }   
}


export class MCTS {
    game: TicTacToe;
    player: any;
    iterations: any;
    exploration: any;
    constructor(game, player, iterations, exploration){
        this.game = game
        this.player = player
        this.iterations = iterations
        this.exploration = exploration

        if (this.iterations == undefined){
            this.iterations = 500
        }
        if (this.exploration == undefined){
            this.exploration = 1.41
        }
    }

    selectMove(){
        const originalState = this.game.getState()
        const possibleMoves = this.game.moves();
        const root = new MCTSNode(possibleMoves, null)

        for (let i = 0; i < this.iterations; i++){
            this.game.setState(originalState)
            const clonedState = this.game.cloneState()
            this.game.setState(clonedState)
            
            let selectedNode = this.selectNode2(root)
            //if selected node is terminal and we lost, make sure we never choose that move
            if (this.game.gameOver()){
                if (this.game.winner() !== this.player){
                    selectedNode.parent.wins = Number.MIN_SAFE_INTEGER
                }
            }
            let expandedNode = this.expandNode(selectedNode)
            this.playout(expandedNode)
            
            let reward;
            if (this.game.winner() == -1)               {reward = 0 }
            else if (this.game.winner() == this.player) {reward = 10 }
            else                                        {reward = -10}
            this.backprop(expandedNode, reward)
        }

        //choose move with most wins
        let maxWins = -Infinity
        let maxIndex = -1
        for (let i in root.children){
            const child = root.children[i]
            if (child == null) {continue}
            if (child.wins > maxWins){
                maxWins = child.wins
                maxIndex = i
            }
        }

        this.game.setState(originalState)
        return possibleMoves[maxIndex]
    }

    selectNode(root): Node {
        let currentNode = root;
        while (currentNode.numUnexpandedMoves === 0) {
          let maxUCB1 = -Infinity;
          let maxIndex = -1;
          let Ni = currentNode.visits;
          for (let i in currentNode.children) {
            const child = currentNode.children[i];
            const ni = child.visits;
            const wi = child.wins;
            const ucb1 = this.computeUCB1(child, this.exploration);
           //const ucb1 = this.computeUCB(wi,ni,this.iterations,Ni)

            if (ucb1 > maxUCB1) {
              maxUCB1 = ucb1;
              maxIndex = Number(i);
            }
          }
          const moves = this.game.moves();
          this.game.playMove(moves[maxIndex]);
          currentNode = currentNode.children[maxIndex];
          if (this.game.gameOver()) {
            return currentNode;
          }
        }
        return currentNode;
      }

    selectNode2(root){

        while (root.numUnexpandedMoves == 0){
            let maxUBC = -Infinity
            let maxIndex = -1
            let Ni = root.visits
            for (let i in root.children){
                const child = root.children[i]
                const ni = child.visits
                const wi = child.wins
                const ubc = this.computeUCB(wi, ni, this.exploration, Ni)
                if (ubc > maxUBC){
                    maxUBC = ubc
                    maxIndex =Number(i)
                }
            }
            const moves = this.game.moves()
            this.game.playMove(moves[maxIndex])
           
            root = root.children[maxIndex]
            if (this.game.gameOver()){
                return root
            }
        }
        return root
    }

    expandNode(node){
        if (this.game.gameOver()){
            return node
        }
        let moves = this.game.moves() 
        const childIndex = this.selectRandomUnexpandedChild(node)
        this.game.playMove(moves[childIndex])

        moves = this.game.moves()
        const newNode = new MCTSNode(moves, node)
        node.children[childIndex] = newNode
        node.numUnexpandedMoves -= 1
       
        return newNode
    }

    playout(node){
        while (!this.game.gameOver()){
            const moves = this.game.moves()
            const randomChoice = Math.floor(Math.random() * moves.length)
            this.game.playMove(moves[randomChoice])
        }
        return this.game.winner()
    }
    backprop(node, reward){  
        while (node != null){
            node.visits += 1
            node.wins += reward 
            node = node.parent
        }
    }

    // returns index of a random unexpanded child of node
    selectRandomUnexpandedChild(node){
        const choice = Math.floor(Math.random() * node.numUnexpandedMoves) //expand random nth unexpanded node
        let count = -1
        for (let i in node.children){
            const child = node.children[i]
            if (child == null){
                count += 1
            }
            if (count == choice){
                return i
            }
        }
    }

    computeUCB(wi, ni, c, Ni){
        return (wi/ni) + c * Math.sqrt(Math.log(Ni)/ni)
    }

    computeUCB1(node: Node, c: number): number {
        const n = node.visits;
        const N = node.parent.visits;
        const Q = node.wins / n;
        const U = c * Math.sqrt(Math.log(N) / n);
        return Q + U;
      }
}




  self.onmessage = (e) => {
    if (e.data.startTraining) {
      trainAgent();
    }
  };