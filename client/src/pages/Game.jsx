// ✅ FILE: client/src/pages/Game.jsx
function Game() {
  useEffect(() => {
    socket.on("start-game", (game) => {
      setBoard(game.board);
      setMyTurn(game.currentTurn === myColor);
    });

    socket.on("opponent-move", (move) => {
      applyMoveToBoard(move);
      setMyTurn(true);
      setTimeLeft(60);
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Game Room</h1>
      <p>This is where the board, timer, and chat will go.</p>
    </div>
  );
}

export default Game;
