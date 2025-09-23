import React from "react";
import { useGame } from "../GameContext";

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  index: number; // which mini-board this is
  onMove: (cellIndex: number) => void;
  onWin: (winner: Player | "draw" | null) => void;
  winner: Player | null| "draw";
  isActive: boolean;
};


// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";



export default function TicTacToe({ index, onMove, onWin, winner, isActive }: Props) {
  const {currentPlayer, switchPlayer} = useGame();
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const gs = await createGame();
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
  }, []);

  // Notify parent when result changes
  React.useEffect(() => {
    if (!state || !onWin) return;
    if (state.winner) onWin(state.winner);
    else if (state.is_draw) onWin("draw");
  }, [state?.winner, state?.is_draw]);

  async function createGame(): Promise<GameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    return r.json();
  }

  async function playMove(index: number): Promise<GameStateDTO> {
    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        index, 
        current_player: currentPlayer }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }

  async function handleClick(i: number) {
    if (!state || loading) return;
    // Light client-side guard to avoid noisy 400s:
    if (!isActive ||state.winner || state.is_draw || state.board[i] !== null) return;

    setLoading(true);
    setError(null);
    try {
      const next = await playMove(i);
      setState(next);
      if (next.winner) onWin(next.winner);
      else if (next.is_draw) onWin("draw");
      onMove(i);
      switchPlayer();
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const gs = await createGame();
      setState(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
        <button className="rounded-2xl px-4 py-2 border" onClick={reset}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const { board, status } = state;

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
            disabled={!isActive ||loading || c !== null || state.winner !== null || state.is_draw}
          >
            {c}
          </button>
        ))}
      </div>
    {/* Overlay big X/O if board is won */}
    {(state.winner || state.is_draw) && (
      <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold z-10">
        {state.is_draw ? "--" : state.winner}
      </div>
    )}
      {/*<div className="text-center mt-3">
        <button className="rounded-2xl px-4 py-2 border" onClick={reset} disabled={loading}>
          New Game
        </button>
      </div>*/}
    </div>
  );
}