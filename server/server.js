// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js'); // Make sure chess.js is installed: npm install chess.js

// Initialize the app, server, and socket
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the static files (index.html and other assets)
app.use(express.static(__dirname + '/../front')); // Adjust the path as necessary

// Initialize a chess game
const chessGame = new Chess();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send the initial game state to the connected client
  socket.emit('gameUpdate', {
    fen: chessGame.fen(),
    pgn: chessGame.pgn()
  });

  // Handle move events from the client
  socket.on('move', (move) => {
    console.log('Move received:', move);

    // Try to make the move
    const moveResult = chessGame.move({
      from: move.from,
      to: move.to,
      promotion: 'q' // Automatically promote to a queen for simplicity
    });

    if (moveResult) {
      // If the move was successful, broadcast the updated game state to all clients
      io.emit('gameUpdate', {
        fen: chessGame.fen(),
        pgn: chessGame.pgn()
      });
    } else {
      // If the move was illegal, send an error message to the client
      socket.emit('invalidMove', 'Invalid move');
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
