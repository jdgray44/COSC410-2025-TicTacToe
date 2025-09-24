import TicTacToe from "@/components/TicTacToe";
import { GameProvider } from "./GameContext";
import {useGame} from "./GameContext";
import React from "react";
import { R } from "node_modules/msw/lib/core/HttpResponse-B4YmE-GJ.mjs";

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

type Player = "X" | "O";
type Cell = Player | null;

type SuperGameStateDTO = {
  id: string;
  boards: GameStateDTO[];
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

export default function App() {
  //current player state and big board state
  const [bigBoard, setBigBoard] = React.useState<(Player | null)[]>(Array(9).fill(null));
  const [activeBoardIndex, setActiveBoardIndex] = React.useState<number | null>(null);
  const { currentPlayer, switchPlayer } = useGame();
  const [superGame, setSuperGame] = React.useState<SuperGameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);



  //create a new super game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const sg = await createSuperGame();
        if (!canceled) setSuperGame(sg);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start super game");
      } finally {
        if (!canceled) setLoading(false);
      }
    } start();
    return () => {
      canceled = true;
    };
  }, []);

  //create a new super game
  async function createSuperGame(): Promise<SuperGameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/super/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    return r.json();
  }

async function handleCellClick(boardIndex: number, cellIndex: number) {
  if (!superGame) return;
  setLoading(true);
  setError(null);
  try {
    const updatedSuperGame = await playSuperMove(boardIndex, cellIndex);
    setSuperGame(updatedSuperGame);

    // update big board if this mini-game was won
    const miniWinner = updatedSuperGame.boards[boardIndex].winner;
    if (miniWinner === "X" || miniWinner === "O") {
      setBigBoard(prev => {
        const copy = [...prev];
        copy[boardIndex] = miniWinner;
        return copy;
      });
    }

    // update active board
    const nextActive = updatedSuperGame.boards[cellIndex].winner
      ? null
      : cellIndex;
    setActiveBoardIndex(nextActive);

    switchPlayer(); // update currentPlayer in context
  } catch (e: any) {
    setError(e?.message ?? "Move failed");
  } finally {
    setLoading(false);
  }
}


  async function playSuperMove(boardIndex: number, cellIndex: number): Promise<SuperGameStateDTO> {
    if (!superGame) throw new Error("No super game started");
    const r = await fetch(`${API_BASE}/tictactoe/super/${superGame.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        board_index: boardIndex,
        cell_index: cellIndex,
        current_player: currentPlayer,
      }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }


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

  async function resetSuperGame() {
    setLoading(true);
    setError(null);
    try {
      const sg = await createSuperGame();
      setSuperGame(sg);
      setBigBoard(Array(9).fill(null));
      setActiveBoardIndex(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset super game");
    } finally {
      setLoading(false);
    }
  }

  function getSuperGameStatus(): string {
    if (!superGame) return "Loading…";

    if (superGame.winner) {
      return superGame.is_draw
        ? "Game is a draw!"
        : `${superGame.winner} wins the super game!`;
    }

    return `${currentPlayer}'s turn`;
  }


  return (
    <div>
      <div className="text-center mb-2 text-xl font-semibold p-2">{getSuperGameStatus()}</div>
      <div className="grid grid-cols-3 gap-0 rounded-lg max-w-screen-sm mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <TicTacToe
            key={i}
            index={i}
            board={superGame?.boards[i].board ?? Array(9).fill(null)}
            onCellClick={handleCellClick}
            onWin={(winner) => handleMiniWin(i, winner)}
            winner={bigBoard[i]}
            isActive={(activeBoardIndex === null || activeBoardIndex === i) && !loading && !superGame?.winner && !superGame?.is_draw}
          />
        ))}
      </div>
      <div className="text-center mb-2 text-xl font-semibold p-2">
        <button
          className="rounded-2xl px-4 py-2 border"
          onClick={resetSuperGame}
          disabled={loading}
        >
          New Super Game
        </button>
      </div>
    </div>
  );

}