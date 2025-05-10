import { useEffect, useState } from "react";
import socket from "../socket";

function Platform() {
  const token = localStorage.getItem("token");
  let username;

  if (token) {
    username = "RegisteredUser"; // TODO: decode token for real username
  } else {
    username = localStorage.getItem("guest");
    if (!username) {
      username = `guest-${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("guest", username);
    }
  }

  const [openGames, setOpenGames] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [color, setColor] = useState("white");
  const [bet, setBet] = useState(0);

  useEffect(() => {
    socket.on("initial-data", ({ games, users }) => {
      setOpenGames(games);
      setOnlineUsers(users);
    });

    socket.on("game-list-update", (updatedGame) => {
      setOpenGames((prev) =>
        prev.some((g) => g.id === updatedGame.id)
          ? prev.map((g) => (g.id === updatedGame.id ? updatedGame : g))
          : [...prev, updatedGame]
      );
    });

    socket.on("game-removed", (gameId) => {
      setOpenGames((prev) => prev.filter((g) => g.id !== gameId));
    });

    socket.on("user-list-update", (users) => {
      setOnlineUsers(users);
    });

    socket.on("error-message", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("initial-data");
      socket.off("game-list-update");
      socket.off("game-removed");
      socket.off("user-list-update");
      socket.off("error-message");
    };
  }, []);

  useEffect(() => {
    socket.on("start-game", (game) => {
      if ([game.whitePlayer, game.blackPlayer].includes(username)) {
        const myColor = game.whitePlayer === username ? "white" : "black";
        window.open(`/game/${game.id}?color=${myColor}`, "_blank");
      }
    });

    return () => {
      socket.off("start-game");
    };
  }, [username]);

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
            openGames.map((game) => (
              <li
                key={game.id}
                className="border-b py-2 flex items-center justify-between"
              >
                <span className="text-sm">💰 {game.bet} coins</span>

                <div className="flex gap-2">
                  {/* White button */}
                  <button
                    disabled={!!game.whitePlayer}
                    onClick={() =>
                      socket.emit("join-game", {
                        gameId: game.id,
                        color: "white",
                      })
                    }
                    className={`px-3 py-1 rounded text-white ${
                      game.whitePlayer
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {game.whitePlayer || "Join White"}
                  </button>

                  {/* Black button */}
                  <button
                    disabled={!!game.blackPlayer}
                    onClick={() =>
                      socket.emit("join-game", {
                        gameId: game.id,
                        color: "black",
                      })
                    }
                    className={`px-3 py-1 rounded text-white ${
                      game.blackPlayer
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-gray-800"
                    }`}
                  >
                    {game.blackPlayer || "Join Black"}
                  </button>
                </div>
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
            {[0, 1, 5, 10, 50, 100, 500, 1000].map((amt) => (
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
          {onlineUsers.length === 0 ? (
            <li className="text-gray-500 italic">Nobody online</li>
          ) : (
            onlineUsers.map((user, index) => (
              <li key={index} className="text-sm">
                {user.username} — {user.coins} coins
              </li>
            ))
          )}
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
      User Public Data
      {/* {userData && (
        <div className="col-span-12 border p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">My Profile</h2>
          <p>
            <strong>Username:</strong> {userData.username}
          </p>
          <p>
            <strong>Games Played:</strong> {userData.gamesPlayed}
          </p>
          <p>
            <strong>Wins:</strong> {userData.wins}
          </p>
          <p>
            <strong>Losses:</strong> {userData.losses}
          </p>
          <p>
            <strong>Total Coins:</strong> {userData.coins}
          </p>
        </div>
      )} */}
    </div>
  );
}

export default Platform;
