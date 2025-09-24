import React from "react";
import { useGame } from "../GameContext";

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  index: number; // which mini-board this is
  board: Cell[];
  onCellClick: (boardIndex: number, cellIndex: number) => void;
  onWin: (winner: Player | "draw" | null) => void;
  winner: Player | null| "draw";
  isActive: boolean;
};


export default function TicTacToe({ index, board, onCellClick, onWin, winner, isActive }: Props) {
  const { currentPlayer } = useGame();

  function handleClick(i: number) {
    if (!isActive ||board[i] !== null || winner) return;
    // Instead of calling backend here, just notify parent
    onCellClick(index, i);
  }

  return (
    <div className="relative w-48 p-2">
      {/*<div className="text-center mb-2 text-xl font-semibold">{status}</div>*/}
      <div className="grid grid-cols-3 gap-1 border border-gray-700 rounded-md">
        {board.map((c, i) => (
          <button
            key={i}
            className="aspect-square border border-gray-500 text-2xl font-bold flex items-center justify-center disabled:opacity-50"
            onClick={() => handleClick(i)}
            aria-label={`cell-${i}`}
            disabled={!isActive || c !== null || winner !== null }
          >
            {c}
          </button>
        ))}
      </div>
    {/* Overlay big X/O if board is won */}
    {(winner) && (
      <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold z-10">
        {winner == "draw" ? "--" :winner}
      </div>
    )}
    </div>
  );
}