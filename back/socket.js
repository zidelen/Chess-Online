const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Chess = require('chess.js').Chess;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let games = {}; // Store active games

// Serve the static frontend
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new game
  socket.on('newGame', () => {
    const gameId = Math.random().toString(36).substr(2, 9); // Generate unique ID
    games[gameId] = new Chess();
    socket.join(gameId);
    socket.emit('gameCreated', { gameId });
  });

  // Join an existing game
  socket.on('joinGame', (gameId) => {
    if (games[gameId]) {
      socket.join(gameId);
      socket.emit('gameJoined', { gameId, fen: games[gameId].fen() });
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  // Handle moves
  socket.on('move', ({ gameId, from, to, promotion }) => {
    const game = games[gameId];
    if (game) {
      const move = game.move({ from, to, promotion });
      if (move) {
        io.to(gameId).emit('moveMade', { fen: game.fen(), pgn: game.pgn() });
      } else {
        socket.emit('invalidMove', 'Move is not valid');
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
