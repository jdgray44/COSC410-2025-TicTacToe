from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

Player = Literal["X", "O"]
Cell = Optional[Player]

WIN_LINES: tuple[tuple[int, int, int], ...] = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),  # rows
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),  # cols
    (0, 4, 8),
    (2, 4, 6),  # diagonals
)


@dataclass
class GameState:
    board: list[Cell] = field(default_factory=lambda: [None] * 9)
    current_player: Player = "X"
    winner: Player | None = None
    is_draw: bool = False

    def copy(self) -> GameState:
        return GameState(self.board.copy(), self.current_player, self.winner, self.is_draw)


def _check_winner(board: list[Cell]) -> Player | None:
    for a, b, c in WIN_LINES:
        if board[a] is not None and board[a] == board[b] == board[c]:
            return board[a]
    return None


def _is_full(board: list[Cell]) -> bool:
    return all(cell is not None for cell in board)


def new_game() -> GameState:
    return GameState()


def move(state: GameState, index: int, current_player: Player) -> GameState:
    if state.winner or state.is_draw:
        raise ValueError("Game is already over.")
    if not (0 <= index < 9):
        raise IndexError("Index must be in range [0, 8].")
    if state.board[index] is not None:
        raise ValueError("Cell already occupied.")

    next_state = state.copy()
    next_state.board[index] = current_player

    w = _check_winner(next_state.board)
    if w:
        next_state.winner = w
    elif _is_full(next_state.board):
        next_state.is_draw = True
    return next_state


def available_moves(state: GameState) -> list[int]:
    return [i for i, cell in enumerate(state.board) if cell is None]


def status(state: GameState) -> str:
    if state.winner:
        return f"{state.winner} wins"
    if state.is_draw:
        return "draw"
    return "no winner yet"


@dataclass
class SuperGameState:
    boards: list[GameState] = field(default_factory=lambda: [GameState() for _ in range(9)])
    winner: Player | None = None  # Winner of the big board
    is_draw: bool = False

    def copy(self) -> SuperGameState:
        return SuperGameState(
            boards=[b.copy() for b in self.boards],
            winner=self.winner,
            is_draw=self.is_draw,
        )


def new_super_game() -> SuperGameState:
    return SuperGameState()


def _check_super_winner(boards: list[GameState]) -> Player | None:
    big_board = [b.winner for b in boards]
    return _check_winner(big_board)


def _is_super_full(boards: list[GameState]) -> bool:
    return all(b.winner is not None or b.is_draw for b in boards)


def super_move(
    super_state: SuperGameState, mini_board_index: int, cell_index: int, player: Player
) -> SuperGameState:
    # 1. Check game over on big board
    if super_state.winner or super_state.is_draw:
        raise ValueError("Super game is already over.")

    board = super_state.boards[mini_board_index]

    # 2. Check mini-board move validity
    if board.winner or board.is_draw:
        raise ValueError("Mini-board is already finished.")
    if board.board[cell_index] is not None:
        raise ValueError("Cell is already occupied.")

    # 3. Play move on copy
    next_super_state = super_state.copy()
    board = next_super_state.boards[mini_board_index]
    board.board[cell_index] = player

    # 4. Check if mini-board is now won or drawn
    mini_winner = _check_winner(board.board)  # reuse existing function
    if mini_winner:
        board.winner = mini_winner
    elif _is_full(board.board):
        board.is_draw = True

    # 5. Check if big board is won or draw
    big_winner = _check_super_winner(next_super_state.boards)
    if big_winner:
        next_super_state.winner = big_winner
    elif _is_super_full(next_super_state.boards):
        next_super_state.is_draw = True

    return next_super_state


def super_status(state: SuperGameState) -> str:
    if state.winner:
        return f"{state.winner} wins"
    if state.is_draw:
        return "draw"
    return "no winner"
