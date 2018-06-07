
class RpsGame {

  constructor(p1, p2){
    this._players = [p1, p2];
    this._turns = [null, null];
    this._scores = [0,0];

    this._sendToPlayers('Rock Paper Scissors Begin!');

    this._players.forEach((player, idx) => {
      player.on('turn', (turn) => {
        this._onTurn(idx, turn)
      })
    })
  }

  _sendToPlayer(playerIndex, msg){
    this._players[playerIndex].emit('message', msg);
  }

  _sendToPlayers(msg){
    this._players.forEach(player => {
      player.emit('message', msg);
    });
  }

  _onTurn(playerIndex, turn){
    if(this._turns[playerIndex] == null){
      this._turns[playerIndex] = turn;
      this._sendToPlayer(playerIndex, `You selected ${turn}`);
      this._checkGameOver();
    }
  }

  _checkGameOver(){
    const turns = this._turns;

    if(turns[0] && turns[1]){
      if (turns[0] == turns[1]){
        this._sendToPlayers('Tie! Both chose ' + turns[0] + "!");
      }
      if (turns[0] == 'rock' && turns[1] == 'paper'){
        this._sendToPlayers('P1 wins!');
        this._scores[0]++;
      }
      if (turns[0] == 'rock' && turns[1] == 'scissors'){
        this._sendToPlayers('P2 wins!');
        this._scores[1]++;
      }
      if (turns[0] == 'paper' && turns[1] == 'rock'){
        this._sendToPlayers('P2 wins!');
        this._scores[1]++;
      }
      if (turns[0] == 'paper' && turns[1] == 'scissors'){
        this._sendToPlayers('P1 wins!');
        this._scores[0]++;
      }
      if (turns[0] == 'scissors' && turns[1] == 'rock'){
        this._sendToPlayers('P1 wins!');
        this._scores[0]++;
      }
      if (turns[0] == 'scissors' && turns[1] == 'paper'){
        this._sendToPlayers('P2 wins!');
        this._scores[1]++;
      }
      this._turns = [null, null];
      this._sendToPlayers('Scores: P1(' + this._scores[0] + '), P2(' + this._scores[1] + ')');
    }
  }
}

module.exports = RpsGame;
