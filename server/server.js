const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const RpsGame = require('./rps-game');

let P1 = 0;
let P2 = 0;

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

let waitingPlayer = null;

io.on('connection', (sock) => {
  // sends to individual is sock.emit
  if(waitingPlayer) {
    //start game
    new RpsGame(waitingPlayer, sock);
    waitingPlayer = null;
    P1 = sock;
  }
  else {
    waitingPlayer = sock;
    waitingPlayer.emit('message', 'Waiting for opponent...');
    P2 = sock;
  }

  sock.on('message', (text) => {
    // sends to all
    if (sock == P1){
      io.emit('message', 'P1: ' + text);
    }
    else if (sock == P2){
      io.emit('message', 'P2: ' + text);
    }
    else{
      io.emit('message', 'dis shit broke');
    }
  });

});

server.on('error', (err) => {
  console.error('Server Error: ', err);
});

server.listen(8080, () => {
  console.log('RPS Start on 8080');
});
