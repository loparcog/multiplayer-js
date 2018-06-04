const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

io.on('connection', (sock) => {
  console.log("someone connected");
  // sends to individual
  sock.emit('message', 'Hi, you are connected');

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
