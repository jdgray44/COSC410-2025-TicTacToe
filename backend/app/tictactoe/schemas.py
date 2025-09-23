from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Player = Literal["X", "O"]


class GameCreate(BaseModel):
    starting_player: Player | None = Field(default="X")


class GameStateDTO(BaseModel):
    id: str
    board: list[Player | None]
    winner: Player | None
    is_draw: bool
    status: str


class MoveRequest(BaseModel):
    index: int
    current_player: Player


class SuperGameStateDTO(BaseModel):
    id: str
    boards: list[GameStateDTO]  # 9 mini-boards
    winner: Player | None
    is_draw: bool
    status: str


class SuperGameCreate(BaseModel):
    starting_player: Player | None = Field(default="X")


class SuperMoveRequest(BaseModel):
    board_index: int  # 0-8, which mini-board
    cell_index: int  # 0-8, cell within that mini-board
    current_player: Player
