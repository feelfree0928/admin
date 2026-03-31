import { useState, useEffect } from "react";
import type { GameName, GameCategory, RiskLevel } from "@/types/simulation";
import {
  getGameCategoryFromName,
  getGameTypeFromName,
  getGameNameFromCategoryAndType,
  getDefaultGameType,
} from "@/lib/game-utils";

export interface GameConfig {
  name: GameName;
  setName: (n: GameName) => void;
  category: GameCategory;
  setCategory: (c: GameCategory) => void;
  type: string;
  setType: (t: string) => void;
  betSize: number;
  setBetSize: (n: number) => void;
  betSizeMode: "fixed" | "target_bust_rate";
  setBetSizeMode: (m: "fixed" | "target_bust_rate") => void;
  targetBustRate: number;
  setTargetBustRate: (n: number) => void;
  timePerBet: number;
  setTimePerBet: (n: number) => void;
  contribution: number;
  setContribution: (n: number) => void;
  houseEdge: number | null;
  setHouseEdge: (n: number | null) => void;
  houseEdgeLocked: boolean;
  setHouseEdgeLocked: (b: boolean) => void;
  risk: RiskLevel | null;
  setRisk: (r: RiskLevel | null) => void;
  digitsType: string;
  setDigitsType: (s: string) => void;
}

interface UseGameConfigOptions {
  initialName: GameName;
  initialBetSize?: number;
  initialTimePerBet?: number;
  initialContribution?: number;
  initialRisk?: RiskLevel | null;
  initialDigitsType?: string;
}

export function useGameConfig({
  initialName,
  initialBetSize = 5,
  initialTimePerBet = 3.0,
  initialContribution = 100,
  initialRisk = null,
  initialDigitsType = "Exactly 0",
}: UseGameConfigOptions): GameConfig {
  const [name, setName] = useState<GameName>(initialName);
  const [category, setCategory] = useState<GameCategory>(
    getGameCategoryFromName(initialName)
  );
  const [type, setType] = useState<string>("");
  const [betSize, setBetSize] = useState<number>(initialBetSize);
  const [betSizeMode, setBetSizeMode] = useState<"fixed" | "target_bust_rate">("fixed");
  const [targetBustRate, setTargetBustRate] = useState<number>(90);
  const [timePerBet, setTimePerBet] = useState<number>(initialTimePerBet);
  const [contribution, setContribution] = useState<number>(initialContribution);
  const [houseEdge, setHouseEdge] = useState<number | null>(null);
  const [houseEdgeLocked, setHouseEdgeLocked] = useState<boolean>(true);
  const [risk, setRisk] = useState<RiskLevel | null>(initialRisk);
  const [digitsType, setDigitsType] = useState<string>(initialDigitsType);

  // Initialize type from name on mount only
  useEffect(() => {
    const cat = getGameCategoryFromName(name);
    const t = getGameTypeFromName(name, cat, digitsType);
    setCategory(cat);
    if (cat === "digits") {
      setType(digitsType || "Exactly 0");
    } else {
      setType(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default type when category changes and type is empty
  useEffect(() => {
    if (type === "" && category !== "blackjack") {
      const defaultType = getDefaultGameType(category);
      if (category === "slots") {
        if (!risk) setRisk(defaultType as RiskLevel);
      } else if (category === "digits") {
        setType(defaultType);
        setDigitsType(defaultType);
      } else {
        setType(defaultType);
      }
    }
  }, [category, type, risk]);

  // Sync name with category + type
  useEffect(() => {
    if (category === "digits") {
      setName("digits");
      setDigitsType(type || "Exactly 0");
    } else {
      const newName = getGameNameFromCategoryAndType(category, type);
      setName(newName);
      setDigitsType("");
    }
  }, [category, type]);

  // Reset house edge when name changes
  useEffect(() => {
    setHouseEdge(null);
    setHouseEdgeLocked(true);
  }, [name]);

  return {
    name,
    setName,
    category,
    setCategory,
    type,
    setType,
    betSize,
    setBetSize,
    betSizeMode,
    setBetSizeMode,
    targetBustRate,
    setTargetBustRate,
    timePerBet,
    setTimePerBet,
    contribution,
    setContribution,
    houseEdge,
    setHouseEdge,
    houseEdgeLocked,
    setHouseEdgeLocked,
    risk,
    setRisk,
    digitsType,
    setDigitsType,
  };
}
