// app.test.tsx
import React from "react";
import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { GameProvider } from "../GameContext";

// @ts-ignore
declare const global: any;

// Helper to generate a fresh empty super game
function mockEmptySuperGame(overrides = {}) {
  const boards = Array.from({ length: 9 }, (_, i) => ({
    id: `board-${i}`,
    board: Array(9).fill(null),
    winner: null,
    is_draw: false,
    status: "no winner yet",
  }));

  return {
    id: "super-1",
    boards,
    winner: null,
    is_draw: false,
    status: "X's turn",
    ...overrides,
  };
}

describe("Super TicTacToe App", () => {
  let fetchMock: typeof global.fetch;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;

    // Mock the initial super game creation
    fetchMock.mockImplementation((url: RequestInfo, opts?: RequestInit) => {
      if (url?.toString().includes("/super/new")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptySuperGame()),
        });
      }

      // Default fallback for moves
      if (url?.toString().includes("/move")) {
        const body = opts?.body ? JSON.parse(opts.body.toString()) : {};
        const player = body.current_player;

        const superGame = mockEmptySuperGame();
        // mark the move in the corresponding board
        superGame.boards[body.board_index].board[body.cell_index] = player;

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(superGame),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 9 mini-boards with 9 cells each", async () => {
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/super/new"),
        expect.any(Object)
      );
    });

    const cells = screen.getAllByRole("button", { name: /board-\d-cell-\d/ });
    expect(cells.length).toBe(81); // 9 boards x 9 cells
  });

  it("clicking a cell marks it with current player and switches player", async () => {
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    await waitFor(() => screen.getByText(/X's turn/));

    const firstCell = screen.getByRole("button", { name: "board-0-cell-0" });
    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(firstCell).toHaveTextContent("X");
      expect(screen.getByText(/O's turn/)).toBeInTheDocument();
    });
  });

  it("does not allow clicking an occupied cell", async () => {
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    await waitFor(() => screen.getByText(/X's turn/));

    const firstCell = screen.getByRole("button", { name: "board-0-cell-0" });
    fireEvent.click(firstCell);

    await waitFor(() => expect(firstCell).toHaveTextContent("X"));

    // Try clicking again
    fireEvent.click(firstCell);
    await waitFor(() => {
      // Still X, no change
      expect(firstCell).toHaveTextContent("X");
      // Current player did not switch back
      expect(screen.getByText(/O's turn/)).toBeInTheDocument();
    });
  });

  it("handles moves across multiple boards correctly", async () => {
    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    await waitFor(() => screen.getByText(/X's turn/));

    const cellA = screen.getByRole("button", { name: "board-0-cell-4" });
    const cellB = screen.getByRole("button", { name: "board-4-cell-1" });

    fireEvent.click(cellA);

    await waitFor(() => {
      expect(cellA).toHaveTextContent("X");
      expect(screen.getByText(/O's turn/)).toBeInTheDocument();
    });

    fireEvent.click(cellB);

    await waitFor(() => {
      expect(cellB).toHaveTextContent("O");
      expect(screen.getByText(/X's turn/)).toBeInTheDocument();
    });
  });

  it("shows super game status when won or draw", async () => {
    // Mock a super game with a winner
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          mockEmptySuperGame({
            winner: "X",
            is_draw: false,
          })
        ),
    });

    render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/X wins the super game!/)).toBeInTheDocument()
    );
  });
});
