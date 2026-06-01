"use client";

import React, { createContext, useContext, useState } from "react";

interface Layers {
  baseLayer: any;
  backgroundLayer: any;
  thirdLayer: any;
  fourthLayer: any;
  fifthLayer: any;
}

interface GameContextProps extends Layers {
  speed: number;
  stage: any;
  multiplier: number;
  maxMultiplier: number;
  flyAway: string;
  setLayers: (layers: Layers) => void;
  setStage: (stage: any) => void;
  setMultiplier: (value: number) => void;
  setMaxMultiplier: (value: number) => void;
  setFlyAway: (value: string) => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [speed] = useState(0.003); // Global speed value
  const [layers, setLayers] = useState<Layers>({
    baseLayer: null,
    backgroundLayer: null,
    thirdLayer: null,
    fourthLayer: null,
    fifthLayer: null,
  });
  const [stage, setStage] = useState<any>(null);
  const [multiplier, setMultiplier] = useState<number>(30.50); // Default multiplier value
  const [maxMultiplier, setMaxMultiplier] = useState<number>(3.50); // Default maxMultiplier value
  const [flyAway, setFlyAway] = useState<string>("false");  // Default fly-away flag

  const value: GameContextProps = {
    speed,
    ...layers,
    stage,
    multiplier,
    maxMultiplier,
    flyAway,
    setLayers,
    setStage,
    setMultiplier,
    setMaxMultiplier,
    setFlyAway,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
