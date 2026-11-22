
import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const pieces = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('Welcome to Knightly!');
  const [socket] = useState(() => io(SERVER_URL || window.location.origin, {
    autoConnect: false
  }));

  function createGame() {
    if (!name.trim()) {
      setMessage('Enter your name first.');
      return;
    }
    socket.connect();
    socket.emit('createGame', { name });
    setMessage('Connecting to the chess server...');
    socket.once('roomCreated', data => {
      setRoom(data.room);
      setMessage('Room created! Share code: ' + data.room);
    });
    socket.once('error', data => setMessage(data.message));
  }

  function joinGame() {
    if (!name.trim() || !room.trim()) {
      setMessage('Enter your name and room code.');
      return;
    }
    socket.connect();
    socket.emit('joinGame', { name, room: room.toUpperCase() });
    setMessage('Joining game...');
    socket.once('error', data => setMessage(data.message));
  }

  function moveSquare(square) {
    if (game.isGameOver()) return;

    if (!selected) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelected(square);
      }
      return;
    }

    try {
      const move = game.move({ from: selected, to: square, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
        setMessage(game.isGameOver() ? 'Game over!' : 'Move played.');
        socket.emit('move', { room, move: { from: selected, to: square, promotion: 'q' } });
      }
    } catch {
      const piece = game.get(square);
      setSelected(piece && piece.color === game.turn() ? square : null);
      return;
    }
    setSelected(null);
  }

  const files = ['a','b','c','d','e','f','g','h'];

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">♞ KNIGHTLY</div>
        <span className="online">● ONLINE CHESS</span>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">YOUR NEXT MOVE STARTS HERE</p>
          <h1>Play sharp.<br/><span>Think deeper.</span></h1>
          <p className="subtitle">
            Challenge your friends. Improve your skills.
            Experience chess in a new way.
          </p>
        </section>

        <section className="layout">
          <div className="board">
            {Array.from({ length: 64 }, (_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const square = files[col] + (8 - row);
              const piece = game.get(square);
              const dark = (row + col) % 2 === 1;
              return (
                <button
                  key={square}
                  className={`square ${dark ? 'dark' : 'light'} ${selected === square ? 'selected' : ''}`}
                  onClick={() => moveSquare(square)}
                  aria-label={square}
                >
                  {piece ? pieces[piece.color][piece.type] : ''}
                </button>
              );
            })}
          </div>

          <aside className="panel">
            <h2>Play Online</h2>
            <p>Create a private room or join your brother's game.</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your player name"
            />
            <button className="primary" onClick={createGame}>
              Create a game
            </button>
            <div className="separator">OR JOIN A GAME</div>
            <input
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="Enter room code"
            />
            <button className="secondary" onClick={joinGame}>
              Join room
            </button>
            <div className="status">{message}</div>
            <p className="note">♟ Standard chess · Private rooms</p>
          </aside>
        </section>

        <section className="features">
          <div><span>♜</span><h3>Play Together</h3><p>Challenge friends online.</p></div>
          <div><span>♛</span><h3>Learn Chess</h3><p>Build your chess knowledge.</p></div>
          <div><span>♞</span><h3>Improve</h3><p>Become a stronger player.</p></div>
        </section>
      </main>

      <footer>KNIGHTLY · PLAY SHARP. THINK DEEPER.</footer>
    </div>
  );
}
