const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const RpsGame = require('./rps-game')

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
  }
  else {
    waitingPlayer = sock;
    waitingPlayer.emit('message', 'Waiting for opponent...');
  }

  sock.on('message', (text) => {
    // sends to all
    io.emit('message', text);
  });

});

server.on('error', (err) => {
  console.error('Server Error: ', err);
});

server.listen(8080, () => {
  console.log('RPS Start on 8080');
});
