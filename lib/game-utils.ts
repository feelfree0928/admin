import type {
  GameName,
  GameCategory,
  RiskLevel,
  TimePerBetCategory,
  HouseEdgeCategory,
} from "@/types/simulation";

// ============================================================================
// FORMATTING
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ============================================================================
// GAME NAME / CATEGORY / TYPE MAPPINGS
// ============================================================================

export function getGameDisplayName(gameName: GameName): string {
  const gameNames: Record<GameName, string> = {
    bj: "Blackjack",
    european_1s: "Roulette European 1s",
    european_12s: "Roulette European 12s",
    european_18s: "Roulette European 18s",
    american_18s: "Roulette American 18s",
    american_1s: "Roulette American 1s",
    american_2s: "Roulette American 2s",
    american_3s: "Roulette American 3s",
    american_4s: "Roulette American 4s",
    american_6s: "Roulette American 6s",
    american_12s: "Roulette American 12s",
    french_18s: "Roulette French 18s",
    french_1s: "Roulette French 1s",
    french_2s: "Roulette French 2s",
    french_3s: "Roulette French 3s",
    french_4s: "Roulette French 4s",
    french_6s: "Roulette French 6s",
    french_12s: "Roulette French 12s",
    european_2s: "Roulette European 2s",
    european_3s: "Roulette European 3s",
    european_4s: "Roulette European 4s",
    european_6s: "Roulette European 6s",
    baccarat_player: "Baccarat (Player)",
    baccarat_banker: "Baccarat (Banker)",
    baccarat_tie: "Baccarat (Tie)",
    slots: "Slots",
    digits: "Digits",
  };
  return gameNames[gameName] || gameName;
}

export function getTimePerBetCategory(gameName: GameName): TimePerBetCategory {
  if (
    gameName.startsWith("european_") ||
    gameName.startsWith("american_") ||
    gameName.startsWith("french_")
  )
    return "roulette";
  if (gameName === "bj") return "blackjack";
  if (gameName.startsWith("baccarat_")) return "baccarat";
  if (gameName === "slots") return "slots";
  if (gameName === "digits") return "digits";
  return "blackjack";
}

export function getHouseEdgeCategory(gameName: GameName): HouseEdgeCategory {
  if (gameName.startsWith("european_")) return "european_roulette";
  if (gameName.startsWith("american_")) return "american_roulette";
  if (gameName === "french_18s") return "french_roulette_18s";
  if (gameName.startsWith("french_")) return "french_roulette_standard";
  if (gameName === "bj") return "blackjack";
  if (gameName === "baccarat_player") return "baccarat_player";
  if (gameName === "baccarat_banker") return "baccarat_banker";
  if (gameName === "baccarat_tie") return "baccarat_tie";
  if (gameName === "slots") return "slots";
  if (gameName === "digits") return "digits";
  return "blackjack";
}

export function getGameCategoryFromName(gameName: GameName): GameCategory {
  if (gameName === "bj") return "blackjack";
  if (gameName.startsWith("european_")) return "european_roulette";
  if (gameName.startsWith("american_")) return "american_roulette";
  if (gameName.startsWith("french_")) return "french_roulette";
  if (gameName.startsWith("baccarat_")) return "baccarat";
  if (gameName === "slots") return "slots";
  if (gameName === "digits") return "digits";
  return "blackjack";
}

export function getRouletteBetTypeFromName(gameName: GameName): string {
  if (
    gameName.startsWith("european_") ||
    gameName.startsWith("american_") ||
    gameName.startsWith("french_")
  ) {
    return gameName.split("_")[1] || "1s";
  }
  return "1s";
}

export function getGameTypeFromName(
  gameName: GameName,
  category: GameCategory,
  digitsType?: string
): string {
  if (
    category === "european_roulette" ||
    category === "american_roulette" ||
    category === "french_roulette"
  ) {
    return getRouletteBetTypeFromName(gameName);
  }
  if (category === "baccarat") {
    const typeMap: Record<string, string> = {
      baccarat_player: "Player",
      baccarat_banker: "Banker",
      baccarat_tie: "Tie",
    };
    return typeMap[gameName] || "";
  }
  if (category === "digits") {
    return digitsType || "Exactly 0";
  }
  return "";
}

export function getGameNameFromCategoryAndType(
  category: GameCategory,
  type: string,
  _digitsType?: string
): GameName {
  if (category === "blackjack") return "bj";
  if (category === "slots") return "slots";
  if (category === "digits") return "digits";

  if (
    category === "european_roulette" ||
    category === "american_roulette" ||
    category === "french_roulette"
  ) {
    const variant = category.replace("_roulette", "");
    return `${variant}_${type || "1s"}` as GameName;
  }

  if (category === "baccarat") {
    const typeMap: Record<string, GameName> = {
      Player: "baccarat_player",
      Banker: "baccarat_banker",
      Tie: "baccarat_tie",
    };
    return typeMap[type] || "baccarat_player";
  }

  return "bj";
}

export function getDefaultGameType(category: GameCategory): string {
  switch (category) {
    case "european_roulette":
    case "american_roulette":
    case "french_roulette":
      return "1s";
    case "baccarat":
      return "Player";
    case "blackjack":
      return "";
    case "slots":
      return "medium" as RiskLevel;
    case "digits":
      return "Exactly 0";
    default:
      return "";
  }
}

// ============================================================================
// DIGITS OPTIONS
// ============================================================================

export const digitsSelectionOptions: string[] = [
  "Exactly 0",
  ...Array.from({ length: 99 }, (_, i) => `${i + 1} & Under`),
  "Exactly 100",
];

export function convertDigitsNotation(value: string): string {
  if (value === "Exactly 0") return "Exactly 100";
  if (value === "Exactly 100") return "Exactly 0";

  const match = value.match(/^(\d+)\s*&\s*(Under|Over)$/i);
  if (!match) return value;

  const num = parseInt(match[1]);
  const direction = match[2].toLowerCase();
  const opposite = 100 - num;

  if (direction === "under") {
    if (opposite === 0) return "Exactly 100";
    if (opposite === 100) return "Exactly 0";
    return `${opposite} & Over`;
  } else {
    if (opposite === 0) return "Exactly 100";
    if (opposite === 100) return "Exactly 0";
    return `${opposite} & Under`;
  }
}

// ============================================================================
// DEFAULT HOUSE EDGE (needs global config passed in)
// ============================================================================

export function getDefaultHouseEdge(
  gameName: GameName,
  globalConfig?: any
): number | null {
  if (globalConfig?.defaults?.houseEdges) {
    const category = getHouseEdgeCategory(gameName);
    const configValue = globalConfig.defaults.houseEdges[category];
    if (configValue !== undefined && gameName !== "digits") {
      return configValue;
    }
  }

  switch (gameName) {
    case "bj":
      return 0.46;
    case "european_1s":
    case "european_2s":
    case "european_3s":
    case "european_4s":
    case "european_6s":
    case "european_12s":
    case "european_18s":
      return 2.703;
    case "american_1s":
    case "american_2s":
    case "american_3s":
    case "american_4s":
    case "american_6s":
    case "american_12s":
    case "american_18s":
      return 5.263;
    case "french_18s":
      return 1.351;
    case "french_1s":
    case "french_2s":
    case "french_3s":
    case "french_4s":
    case "french_6s":
    case "french_12s":
      return 2.703;
    case "baccarat_player":
      return 1.235;
    case "baccarat_banker":
      return 1.058;
    case "baccarat_tie":
      return 14.36;
    case "slots":
      return 4.0;
    case "digits":
      return null;
    default:
      return null;
  }
}
