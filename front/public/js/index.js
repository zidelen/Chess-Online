
let gameHasStarted = false;
var board = null
var game = new Chess()
var $status = $('#status')
var $pgn = $('#pgn')
var $fen = $('#fen');
let gameOver = false;
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '');
  }
  
  function greySquare(square) {
    var $square = $('#myBoard .square-' + square);
    var background = whiteSquareGrey;
  
    if ($square.hasClass('black-3c85d')) {
      background = blackSquareGrey;
    }
  
    $square.css('background', background);
  }

function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false
    if (!gameHasStarted) return false;
    if (gameOver) return false;

    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        return false;
    }

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop (source, target) {
    removeGreySquares();
    let theMove = {
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    };
    // see if the move is legal
    var move = game.move(theMove);


    // illegal move
    if (move === null) return 'snapback'

    socket.emit('move', theMove);

    updateStatus()
}

socket.on('newMove', function(move) {
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
      square: square,
      verbose: true
    });
  
    // exit if there are no moves available for this square
    if (moves.length === 0) return;
  
    // highlight the square they moused over
    greySquare(square);
  
    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to);
    }
  }

  function onMouseoutSquare(square, piece) {
    removeGreySquares();
  }

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    else if (gameOver) {
        status = 'Opponent disconnected, you win!'
    }

    else if (!gameHasStarted) {
        status = 'Waiting for black to join'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
        
    }

    $status.html(status)
    $fen.html(game.fen());

    // Split PGN into individual moves and format them
    var moves = game.pgn().split(' '); // Split PGN by spaces to get moves
    var formattedPGN = ''; // Initialize a variable to hold formatted PGN
  
    // Loop through moves and create a new line for each move pair
    for (let i = 0; i < moves.length; i += 3) {
      formattedPGN += `${moves[i]} ${moves[i + 1] || ''} ${moves[i + 2] || ''}<br>`;
    }
  
    $pgn.html(formattedPGN); // Update the PGN container with formatted PGN
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
}
board = Chessboard('myBoard', config)
if (playerColor == 'black') {
    board.flip();
}

updateStatus()

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    socket.emit('joinGame', {
        code: urlParams.get('code')
    });
}

socket.on('startGame', function() {
    gameHasStarted = true;
    updateStatus()
});

socket.on('gameOverDisconnect', function() {
    gameOver = true;
    updateStatus()
});

