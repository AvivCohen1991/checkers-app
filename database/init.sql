CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  balance INTEGER DEFAULT 1000
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER,
  player2_id INTEGER,
  status TEXT,
  winner_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
