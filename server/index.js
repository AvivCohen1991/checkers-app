const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔥 the user connected:", socket.id);

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ the user disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
