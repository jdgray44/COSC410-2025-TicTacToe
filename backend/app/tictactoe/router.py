from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException

from .engine import (
    GameState,
    SuperGameState,
    move,
    new_game,
    new_super_game,
    status,
    super_move,
    super_status,
)
from .schemas import (
    GameCreate,
    GameStateDTO,
    MoveRequest,
    SuperGameCreate,
    SuperGameStateDTO,
    SuperMoveRequest,
)

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])

# naive in-memory store; swap for a real cache/DB as needed
GAMES: dict[str, list[GameState]] = {}


def _to_dto(game_id: str, gs: GameState) -> GameStateDTO:
    return GameStateDTO(
        id=game_id,
        board=gs.board,
        current_player=gs.current_player,
        winner=gs.winner,
        is_draw=gs.is_draw,
        status=status(gs),
    )


@router.post("/new", response_model=GameStateDTO)
def create_game(payload: GameCreate) -> GameStateDTO:
    gs = new_game()
    gid = str(uuid4())
    GAMES[gid] = [gs]
    return _to_dto(gid, gs)


@router.get("/{game_id}", response_model=GameStateDTO)
def get_state(game_id: str) -> GameStateDTO:
    history = GAMES.get(game_id)
    if not history:
        raise HTTPException(status_code=404, detail="Game not found.")
    gs = GAMES.get(game_id)[-1]
    return _to_dto(game_id, gs)


@router.get("/{game_id}/history", response_model=list[GameStateDTO])
def get_state(game_id: str) -> GameStateDTO:
    gs = GAMES.get(game_id)
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    return [_to_dto(game_id, g) for g in gs]


@router.post("/{game_id}/move", response_model=GameStateDTO)
def make_move(game_id: str, payload: MoveRequest) -> GameStateDTO:
    gs = GAMES.get(game_id)[-1]
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    try:
        new_state = move(gs, payload.index, payload.current_player)
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    GAMES[game_id].append(new_state)
    return _to_dto(game_id, new_state)


@router.delete("/{game_id}")
def delete_game(game_id: str) -> dict:
    if game_id in GAMES:
        del GAMES[game_id]
        return {"ok": True}
    return {"ok": False, "reason": "not found"}


SUPER_GAMES: dict[str, list[SuperGameState]] = {}


def _super_to_dto(game_id: str, gs: SuperGameState) -> SuperGameStateDTO:
    return SuperGameStateDTO(
        id=game_id,
        boards=[
            GameStateDTO(
                id=f"{game_id}-{i}",
                board=b.board,
                winner=b.winner,
                is_draw=b.is_draw,
                status=status(b),
            )
            for i, b in enumerate(gs.boards)
        ],
        winner=gs.winner,
        is_draw=gs.is_draw,
        status=super_status(gs),
    )


@router.post("/super/new", response_model=SuperGameStateDTO)
def create_super_game(payload: SuperGameCreate) -> SuperGameStateDTO:
    gs = new_super_game()
    gid = str(uuid4())
    SUPER_GAMES[gid] = [gs]
    return _super_to_dto(gid, gs)


@router.get("/super/{game_id}", response_model=SuperGameStateDTO)
def get_super_state(game_id: str) -> SuperGameStateDTO:
    history = SUPER_GAMES.get(game_id)
    if not history:
        raise HTTPException(status_code=404, detail="Game not found.")
    gs = SUPER_GAMES.get(game_id)[-1]
    return _super_to_dto(game_id, gs)


@router.get("/super/{game_id}/history", response_model=list[SuperGameStateDTO])
def get_super_state_history(game_id: str) -> list[SuperGameStateDTO]:
    gs = SUPER_GAMES.get(game_id)
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    return [_super_to_dto(game_id, g) for g in gs]


@router.post("/super/{game_id}/move", response_model=SuperGameStateDTO)
def make_super_move(game_id: str, payload: SuperMoveRequest) -> SuperGameStateDTO:
    gs = SUPER_GAMES.get(game_id)[-1]
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    try:
        new_state = super_move(gs, payload.board_index, payload.cell_index, payload.current_player)
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    SUPER_GAMES[game_id].append(new_state)
    return _super_to_dto(game_id, new_state)


@router.delete("/super/{game_id}")
def delete_super_game(game_id: str) -> dict:
    if game_id in SUPER_GAMES:
        del SUPER_GAMES[game_id]
        return {"ok": True}
    return {"ok": False, "reason": "not found"}
