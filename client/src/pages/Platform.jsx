import { useEffect, useState } from "react";
import socket from "../socket";

function Platform() {
  const token = localStorage.getItem("token");
  const username = token
    ? "RegisteredUser" // TODO: decode from token
    : `guest-${Math.floor(Math.random() * 10000)}`;

  const [openGames, setOpenGames] = useState([]);
  const [color, setColor] = useState("white");
  const [bet, setBet] = useState(1);

  useEffect(() => {
    socket.on("game-list-update", (game) => {
      setOpenGames((prev) => [...prev, game]);
    });

    return () => socket.off("game-list-update");
  }, []);

  const handleOpenGame = (e) => {
    e.preventDefault();
    const newGame = {
      player: username,
      color,
      bet,
    };
    socket.emit("new-game", newGame);
  };

  return (
    <div className="p-4 grid grid-cols-12 gap-4">
      {/* 🕹️ Open Games List */}
      <div className="col-span-7 border p-4">
        <h2 className="text-xl font-semibold mb-2">Open Games</h2>
        <ul>
          {openGames.length === 0 ? (
            <li className="text-gray-500 italic">No games yet</li>
          ) : (
            openGames.map((game, i) => (
              <li key={i} className="border-b py-1">
                🎯 {game.player} ({game.color}) — 💰 {game.bet} coins
              </li>
            ))
          )}
        </ul>
      </div>

      {/* ➕ Open New Game */}
      <div className="col-span-5 border p-4">
        <h2 className="text-xl font-semibold mb-2">Create New Game</h2>
        <form onSubmit={handleOpenGame}>
          <label className="block mb-2">Choose Color:</label>
          <select
            className="block w-full p-2 border mb-4"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>

          <label className="block mb-2">Choose Bet:</label>
          <select
            className="block w-full p-2 border mb-4"
            value={bet}
            onChange={(e) => setBet(parseInt(e.target.value))}
          >
            {[1, 5, 10, 50, 100, 500, 1000].map((amt) => (
              <option key={amt} value={amt}>
                {amt} coins
              </option>
            ))}
          </select>

          <button className="bg-green-600 text-white px-4 py-2">
            Open Game
          </button>
        </form>
      </div>

      {/* 👥 Connected Users */}
      <div className="col-span-4 border p-4">
        <h2 className="text-xl font-semibold mb-2">Online Users</h2>
        <ul>
          <li className="text-gray-500 italic">Nobody online</li>
        </ul>
      </div>

      {/* 💬 Global Chat */}
      <div className="col-span-8 border p-4">
        <h2 className="text-xl font-semibold mb-2">Global Chat</h2>
        <div className="h-40 overflow-y-auto border p-2 mb-2 bg-gray-50">
          <div className="text-gray-500 italic">No messages yet</div>
        </div>
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border p-2"
          />
          <button className="bg-blue-500 text-white px-4 py-2">Send</button>
        </form>
      </div>

      {/* 🔐 Auth Buttons */}
      {!token && (
        <div className="col-span-12 text-center mt-4">
          <a href="/signin" className="text-blue-600 underline mx-2">
            Sign In
          </a>
          <a href="/signup" className="text-blue-600 underline mx-2">
            Sign Up
          </a>
        </div>
      )}
    </div>
  );
}

export default Platform;
