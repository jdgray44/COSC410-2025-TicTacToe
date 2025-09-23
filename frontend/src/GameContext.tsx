import React, { createContext, useContext, useState } from "react";

export type Player = "X" | "O";

type GameContextType = {
  currentPlayer: Player;
  switchPlayer: () => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");

  const switchPlayer = () => {
    setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
  };

  return (
    <GameContext.Provider value={{ currentPlayer, switchPlayer }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for easier use
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
