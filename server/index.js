// ✅ FILE: server/index.js

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const port = 3000;
const JWT_SECRET = "your-secret-key"; // Replace with env in production

const db = new Pool({
  user: "aviv",
  host: "localhost",
  database: "checkers",
  password: "", // update if needed
  port: 5432,
});

app.use(cors());
app.use(express.json());

// ✅ Sign Up Endpoint
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

// ✅ Sign In Endpoint
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

app.listen(port, () => {
  console.log(`✅ Server listening on http://localhost:${port}`);
});
