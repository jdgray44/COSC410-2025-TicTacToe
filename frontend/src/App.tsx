import TicTacToe from "@/components/TicTacToe";
import { GameProvider } from "./GameContext";
import {useGame} from "./GameContext";
import React from "react";
type Player = "X" | "O";

export default function App() {
  //current player state and big board state
  const {currentPlayer} = useGame(); 
  const [bigBoard, setBigBoard] = React.useState<(Player | null)[]>(Array(9).fill(null));
  const [activeBoardIndex, setActiveBoardIndex] = React.useState<number | null>(null);

  //handle a mini game win
  function handleMiniWin(index: number, winner: Player | "draw" | null) {
    if (winner === "X" || winner === "O") {
      setBigBoard(prev => {
        const copy = [...prev];
        copy[index] = winner;
        console.log("Big board updated:", copy);
        return copy;
      });
    }
    // TODO: check bigBoard for super-winner
  }

  function handleMovePlayed(cellIndex: number) {

    // Check if that board is already won or drawn
    if (bigBoard[cellIndex]) {
      // If it’s completed, allow player to play anywhere
      setActiveBoardIndex(null);
    } else {
      // Otherwise, restrict to the next mini-board
      setActiveBoardIndex(cellIndex);
    }
}



  return (
    <div>
      <div className="text-center mb-2 text-xl font-semibold p-2">{currentPlayer}</div>
      <div className="grid grid-cols-3 gap-0 rounded-lg max-w-screen-sm mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <TicTacToe
            key={i}
            index={i}
            onMove={(cellIndex) => handleMovePlayed(cellIndex)}
            onWin={(winner) => handleMiniWin(i, winner)}
            winner={bigBoard[i]}
            isActive={activeBoardIndex === null || activeBoardIndex === i}
          />
        ))}
      </div>
    </div>
  );

}