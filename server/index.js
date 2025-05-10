// ✅ FILE: server/index.js

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const JWT_SECRET = "your-secret-key";

const db = new Pool({
  user: "aviv",
  host: "localhost",
  database: "checkers",
  password: "",
  port: 5432,
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const openGames = [];
const activeGames = {};

io.on("connection", async (socket) => {
  const rawToken = socket.handshake.auth?.token;

  if (rawToken) {
    try {
      const payload = jwt.verify(rawToken, JWT_SECRET);
      const result = await db.query(
        "SELECT id, username, coins FROM users WHERE id = $1",
        [payload.id]
      );

      if (result.rows.length > 0) {
        socket.data.username = result.rows[0].username;
        socket.data.userId = result.rows[0].id;
        socket.data.coins = result.rows[0].coins;
      } else {
        console.warn("⚠️ No user found for ID in token:", payload.id);
      }
    } catch (err) {
      console.warn("⚠️ Invalid token, using guest instead.");
    }
  }

  if (!socket.data.username) {
    socket.data.username = `guest-${socket.id.slice(0, 5)}`;
    socket.data.coins = 0;
  }

  const users = Array.from(io.sockets.sockets.values()).map((s) => ({
    username: s.data.username,
    coins: s.data.coins || 0,
  }));

  socket.emit("initial-data", {
    games: openGames,
    users,
  });

  io.emit("user-list-update", users);

  socket.on("new-game", (game) => {
    const username = socket.data.username;
    const coins = socket.data.coins;
    const bet = game.bet;

    if (coins < bet) {
      socket.emit("error-message", "Not enough coins to open this game.");
      return;
    }

    socket.data.coins -= bet;

    const fullGame = {
      id: Date.now(),
      bet,
      whitePlayer: game.color === "white" ? username : null,
      blackPlayer: game.color === "black" ? username : null,
      status: "waiting",
    };

    openGames.push(fullGame);

    io.emit("game-list-update", fullGame);
    emitUserUpdate();
  });

  socket.on("join-game", ({ gameId, color }) => {
    const username = socket.data.username;
    const coins = socket.data.coins;
    const game = openGames.find((g) => g.id === gameId);

    if (!game || game[color + "Player"]) return;

    if (coins < game.bet) {
      socket.emit("error-message", "Not enough coins to join this game.");
      return;
    }

    socket.data.coins -= game.bet;
    game[color + "Player"] = username;

    io.emit("game-list-update", game);
    emitUserUpdate();

    // Start game when both spots are filled
    if (game.whitePlayer && game.blackPlayer) {
      activeGames[gameId] = {
        id: gameId,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
        currentTurn: "white",
        board: initializeBoard(),
        bet: game.bet,
        moveHistory: [],
      };

      io.emit("start-game", activeGames[gameId]);
    }
  });

  socket.on("game-ended", async ({ gameId, winner }) => {
    const game = openGames.find((g) => g.id === gameId);
    if (!game) return;

    const winnerSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.data.username === winner
    );

    if (winnerSocket) {
      winnerSocket.data.coins += game.bet * 2;

      if (winnerSocket.data.userId) {
        await db.query("UPDATE users SET coins = coins + $1 WHERE id = $2", [
          game.bet * 2,
          winnerSocket.data.userId,
        ]);
      }
    }

    openGames.splice(
      openGames.findIndex((g) => g.id === gameId),
      1
    );
    io.emit("game-removed", gameId);
    emitUserUpdate();
  });

  socket.on("disconnect", () => {
    emitUserUpdate();
  });

  socket.on("make-move", ({ gameId, move }) => {
    const game = activeGames[gameId];
    if (!game) return;

    game.board = applyMove(game.board, move);
    game.moveHistory.push(move);
    game.currentTurn = game.currentTurn === "white" ? "black" : "white";

    io.to(`game-${gameId}`).emit("opponent-move", move);
  });

  socket.on("surrender-game", async ({ gameId }) => {
    const game = activeGames[gameId];
    if (!game) return;

    const surrenderingUser = socket.data.username;
    const winnerUsername =
      surrenderingUser === game.whitePlayer
        ? game.blackPlayer
        : game.whitePlayer;

    // Fetch winner and loser userIds from sockets:
    const winnerSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.data.username === winnerUsername
    );
    const loserSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.data.username === surrenderingUser
    );

    if (!winnerSocket || !loserSocket) return;

    // Transfer coins:
    winnerSocket.data.coins += game.bet * 2;

    // Save to DB:
    if (winnerSocket.data.userId && loserSocket.data.userId) {
      await db.query(
        "INSERT INTO games (white_player_id, black_player_id, bet, winner_id) VALUES ($1, $2, $3, $4)",
        [
          winnerSocket.data.username === game.whitePlayer
            ? winnerSocket.data.userId
            : loserSocket.data.userId,
          winnerSocket.data.username === game.blackPlayer
            ? winnerSocket.data.userId
            : loserSocket.data.userId,
          game.bet,
          winnerSocket.data.userId,
        ]
      );

      // Update winner's coins in DB
      await db.query("UPDATE users SET coins = coins + $1 WHERE id = $2", [
        game.bet * 2,
        winnerSocket.data.userId,
      ]);
    }

    // Remove from active games
    delete activeGames[gameId];

    // Remove from open games (just in case)
    const openGameIdx = openGames.findIndex((g) => g.id === gameId);
    if (openGameIdx !== -1) openGames.splice(openGameIdx, 1);

    io.emit("game-ended", { gameId, winner: winnerUsername });
    emitUserUpdate();
  });
});

function emitUserUpdate() {
  const users = Array.from(io.sockets.sockets.values()).map((s) => ({
    username: s.data.username,
    coins: s.data.coins || 0,
  }));
  io.emit("user-list-update", users);
}

app.post("/api/signup", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, coins",
      [email, username, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Email or username already exists" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, username: user.username, coins: user.coins },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

server.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

function initializeBoard() {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Initialize checkers positions clearly
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 1) board[i][j] = "b"; // black
    }
  }
  for (let i = 5; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 1) board[i][j] = "w"; // white
    }
  }

  return board;
}
