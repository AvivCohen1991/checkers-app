// Game.jsx — Full checkers logic implementation

import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const BOARD_SIZE = 8;

function initializeBoard() {
  const board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if ((i + j) % 2 === 1) board[i][j] = { color: "b", king: false };
    }
  }
  for (let i = 5; i < 8; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if ((i + j) % 2 === 1) board[i][j] = { color: "w", king: false };
    }
  }
  return board;
}

function Game() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const color = searchParams.get("color");

  const [board, setBoard] = useState(initializeBoard());
  const [selected, setSelected] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [mustCapture, setMustCapture] = useState([]);

  useEffect(() => {
    const captures = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const piece = board[i][j];
        if (piece && piece.color === currentTurn) {
          const paths = getAllCapturePaths(i, j, piece, board);
          if (paths.length > 0) {
            captures.push({ x: i, y: j, paths });
          }
        }
      }
    }
    setMustCapture(captures);
  }, [board, currentTurn]);

  function isInsideBoard(x, y) {
    return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
  }

  function getAllCapturePaths(
    x,
    y,
    piece,
    boardSnapshot,
    directionChain = [],
    jumped = []
  ) {
    const dirs = piece.king
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : piece.color === "w"
      ? [
          [-1, -1],
          [-1, 1],
        ]
      : [
          [1, -1],
          [1, 1],
        ];

    if (directionChain.length > 0) {
      dirs.push(
        ...(piece.color === "w"
          ? [
              [1, -1],
              [1, 1],
            ]
          : [
              [-1, -1],
              [-1, 1],
            ])
      );
    }

    let paths = [];

    for (const [dx, dy] of dirs) {
      const midX = x + dx;
      const midY = y + dy;
      const landingX = x + 2 * dx;
      const landingY = y + 2 * dy;

      if (!isInsideBoard(midX, midY) || !isInsideBoard(landingX, landingY))
        continue;

      const midPiece = boardSnapshot[midX][midY];
      const landing = boardSnapshot[landingX][landingY];

      if (
        midPiece &&
        midPiece.color !== piece.color &&
        !landing &&
        !jumped.some(([jx, jy]) => jx === midX && jy === midY)
      ) {
        const newJumped = [...jumped, [midX, midY]];
        const newPath = [...directionChain, [landingX, landingY]];
        const cloned = boardSnapshot.map((r) => r.slice());
        cloned[x][y] = null;
        cloned[midX][midY] = null;
        cloned[landingX][landingY] = { ...piece };
        const subPaths = getAllCapturePaths(
          landingX,
          landingY,
          piece,
          cloned,
          newPath,
          newJumped
        );
        if (subPaths.length > 0) paths.push(...subPaths);
        else paths.push(newPath);
      }
    }
    return paths;
  }

  function getValidMoves(x, y) {
    const piece = board[x][y];
    if (!piece || piece.color !== currentTurn) return [];

    if (mustCapture.length > 0) {
      const entry = mustCapture.find((m) => m.x === x && m.y === y);
      if (entry) {
        return entry.paths.map((path) => ({ type: "capture", path }));
      } else {
        return [];
      }
    }

    const dirs = piece.king
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : piece.color === "w"
      ? [
          [-1, -1],
          [-1, 1],
        ]
      : [
          [1, -1],
          [1, 1],
        ];

    const steps = piece.king ? 8 : 1;
    const moves = [];

    for (const [dx, dy] of dirs) {
      for (let step = 1; step <= steps; step++) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        if (!isInsideBoard(nx, ny)) break;
        if (board[nx][ny]) break;
        moves.push({ type: "move", path: [[nx, ny]] });
        if (!piece.king) break;
      }
    }
    return moves;
  }

  function handleCellClick(x, y) {
    const piece = board[x][y];

    if (selected) {
      const { x: sx, y: sy, moves } = selected;
      const move = moves.find(
        (m) =>
          m.path[m.path.length - 1][0] === x &&
          m.path[m.path.length - 1][1] === y
      );
      if (!move) {
        setSelected(null);
        return;
      }

      const newBoard = board.map((r) => r.slice());
      const movingPiece = { ...newBoard[sx][sy] };
      newBoard[sx][sy] = null;

      if (move.type === "capture") {
        let px = sx;
        let py = sy;
        for (const [nx, ny] of move.path) {
          const mx = (px + nx) / 2;
          const my = (py + ny) / 2;
          newBoard[mx][my] = null;
          px = nx;
          py = ny;
        }
        newBoard[px][py] = movingPiece;

        const promote =
          (movingPiece.color === "w" && px === 0) ||
          (movingPiece.color === "b" && px === 7);
        if (promote) movingPiece.king = true;

        const further = getAllCapturePaths(px, py, movingPiece, newBoard);
        if (further.length > 0) {
          setBoard(newBoard);
          setSelected({
            x: px,
            y: py,
            moves: further.map((path) => ({ type: "capture", path })),
          });
          return;
        }
      } else {
        const [nx, ny] = move.path[0];
        newBoard[nx][ny] = movingPiece;

        const promote =
          (movingPiece.color === "w" && nx === 0) ||
          (movingPiece.color === "b" && nx === 7);
        if (promote) movingPiece.king = true;
      }

      setBoard(newBoard);
      setSelected(null);
      setCurrentTurn(currentTurn === "w" ? "b" : "w");
    } else {
      if (!piece || piece.color !== currentTurn) return;
      const moves = getValidMoves(x, y);
      if (moves.length > 0) setSelected({ x, y, moves });
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Checkers — Game {gameId}</h1>
      <p className="mb-1">Your Color: {color}</p>
      <p className="mb-2">
        {currentTurn === color ? "🟢 Your move" : "⏳ Opponent's turn"}
      </p>

      <div className="grid grid-cols-8 w-[32rem] h-[32rem] border">
        {board.flatMap((row, i) =>
          row.map((cell, j) => {
            const isBlackCell = (i + j) % 2 === 1;
            const bg = isBlackCell ? "bg-gray-700" : "bg-gray-300";
            const isSelected = selected?.x === i && selected?.y === j;

            return (
              <div
                key={`${i}-${j}`}
                className={`relative flex items-center justify-center ${bg} border border-black aspect-square min-w-0`}
                onClick={() => handleCellClick(i, j)}
              >
                {cell && (
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold uppercase text-black ${
                      cell.color === "w"
                        ? "bg-white border border-black"
                        : "bg-red-600 border border-black"
                    } ${isSelected ? "ring-4 ring-yellow-400" : ""}`}
                  >
                    {cell.king ? "K" : ""}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Game;
