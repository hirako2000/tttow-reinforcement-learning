### Struggles

- It's been tricky, looked at Q training algorithm, after some struggle to get what I believe was a proper alogitm, training would always lead to a terrible map in term of win rate against human. Still in progress
- Took a stab using minmax function. For some reason, Sutton wrote minmax is inadequate for Tic Tac Toe game... yet it works 

> For example, the classical “minimax” solution from game theory is not correct here because it assumes a particular way of playing by the opponent. For example, a minimax player would never reach a game state from which it could lose, even if in fact it always won from that state because of incorrect play by the opponent.

### min max algorithm 

- Afaik also a reinforcement algo, tried this implementaiton to see outcome.
- 100 (deep) iteration seems to get some play
- Could add alpha-beta for optimization and cut many branch exploration
- Could also add pruning

But performance for limited depth of tic tac toe is already good enough - would be good to try with a game leading to more depth


