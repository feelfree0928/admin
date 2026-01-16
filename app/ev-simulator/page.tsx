"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, AlertCircle, TrendingUp, TrendingDown, CheckCircle2, XCircle, Lock, Unlock, Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";

// ============================================================================
// TYPE DEFINITIONS (matching backend API from src/Types.jl and src/RequestParser.jl)
// ============================================================================

type BonusType = "cashable" | "postwager" | "cashback" | "sticky" | "freespins" | "raw";
type CashbackType = "on_win" | "on_loss" | "both" | "fixed_wager";
type SimulationMode = "standard" | "two_tier";
type GameName = "bj" | "european_1s" | "european_12s" | "european_18s" | "american_18s" | "american_1s" | "american_2s" | "american_3s" | "american_4s" | "american_6s" | "american_12s" | "french_18s" | "french_1s" | "french_2s" | "french_3s" | "french_4s" | "french_6s" | "french_12s" | "european_2s" | "european_3s" | "european_4s" | "european_6s" | "baccarat_player" | "baccarat_banker" | "baccarat_tie" | "slots" | "digits";
type GameCategory = "european_roulette" | "american_roulette" | "french_roulette" | "baccarat" | "blackjack" | "slots" | "digits";
type RiskLevel = "very_low" | "low" | "medium" | "high" | "very_high";

interface BonusConfig {
  type: BonusType;
  deposit: number;
  bonus_amount: number;
  wagering?: number;
  // Cashback specific
  cashback_type?: CashbackType;
  cashback_amount?: number;
  target_balance?: number;
  // FIXED_WAGER specific
  wager_target?: number;
  cashback_rate?: number;
  cashback_cap?: number;
  cashback_as_bonus?: boolean;
  cashback_wagering_requirement?: number;
  // Cashable specific
  cashable_on_loss?: boolean;
  // Freespins specific
  freespins_count?: number;
  freespins_bet_size?: number;
  freespins_rollover?: boolean;
  freespins_rollover_multiplier?: number;
  // Max cashout
  max_cashout?: number | null;
}

interface GameConfig {
  name: GameName;
  bet_size: number;
  time_per_bet?: number;
  game_weighting?: number;
  house_edge?: number | null;
  digits_type?: string | null;
  risk?: RiskLevel | null;
  switch_balance?: number; // For game2 in two-tier mode
}

interface CoverplayConfig {
  enabled: boolean;
  game?: GameName;
  bet_size?: number;
  num_spins?: number;
  risk?: RiskLevel | null;
  house_edge?: number | null;
}

interface SimulationRequest {
  mode: SimulationMode;
  bonus: BonusConfig;
  game1: GameConfig;
  game2?: GameConfig | null;
  pre_coverplay?: CoverplayConfig;
  post_coverplay?: CoverplayConfig;
  simulation: {
    num_sessions: number;
    random_seed?: number | null;
    precision?: number;
  };
  optimization?: {
    target_bust_rate: number;
  };
}

interface SimulationResults {
  sessions_completed: number;
  expected_value: number;
  bust_rate_percent: number;
  average_time_minutes: number;
  average_time_seconds: number;
  cash_per_hour: number;
  total_wagered_average: number;
  std_deviation: number;
  confidence_interval_95: {
    lower: number;
    upper: number;
  };
}

interface ApiResponse {
  status: string;
  execution_time_ms: number;
  mode: SimulationMode;
  results: SimulationResults;
  warnings: string[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EVSimulatorPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Mode is derived from game2Enabled - no separate state needed
  // When game2Enabled is true, mode is "two_tier", otherwise "standard"

  // Bonus state
  const [bonusType, setBonusType] = useState<BonusType>("cashable");
  const [deposit, setDeposit] = useState<number>(100);
  const [bonusAmount, setBonusAmount] = useState<number>(100);
  const [wagering, setWagering] = useState<number>(6000);
  const [cashbackType, setCashbackType] = useState<CashbackType>("on_loss");
  const [cashbackAmount, setCashbackAmount] = useState<number>(0);
  const [targetBalance, setTargetBalance] = useState<number>(0);
  const [wagerTarget, setWagerTarget] = useState<number>(2000);
  const [cashbackRate, setCashbackRate] = useState<number>(0.1);
  const [cashbackCap, setCashbackCap] = useState<number>(50);
  const [cashbackAsBonus, setCashbackAsBonus] = useState<boolean>(false);
  const [cashbackWageringRequirement, setCashbackWageringRequirement] = useState<number>(0);
  const [freespinsCount, setFreespinsCount] = useState<number>(0);
  const [freespinsBetSize, setFreespinsBetSize] = useState<number>(0);
  const [freespinsRollover, setFreespinsRollover] = useState<boolean>(false);
  const [freespinsRolloverMultiplier, setFreespinsRolloverMultiplier] = useState<number>(1.0);
  const [maxCashout, setMaxCashout] = useState<number | null>(null);

  // Game 1 state
  const [game1Name, setGame1Name] = useState<GameName>("european_1s");
  const [game1Category, setGame1Category] = useState<GameCategory>("european_roulette");
  const [game1Type, setGame1Type] = useState<string>("1s");
  const [game1BetSize, setGame1BetSize] = useState<number>(5.0);
  const [game1TimePerBet, setGame1TimePerBet] = useState<number>(3.0);
  const [game1Weighting, setGame1Weighting] = useState<number>(100.0);
  const [game1HouseEdge, setGame1HouseEdge] = useState<number | null>(null);
  const [game1HouseEdgeLocked, setGame1HouseEdgeLocked] = useState<boolean>(true);
  const [game1DigitsType, setGame1DigitsType] = useState<string>("0 & Under");
  const [game1Risk, setGame1Risk] = useState<RiskLevel | null>(null);

  // Game 2 state
  const [game2Enabled, setGame2Enabled] = useState<boolean>(false);
  const [game2Name, setGame2Name] = useState<GameName>("slots");
  const [game2Category, setGame2Category] = useState<GameCategory>("slots");
  const [game2Type, setGame2Type] = useState<string>("");
  const [game2BetSize, setGame2BetSize] = useState<number>(2.0);
  const [game2TimePerBet, setGame2TimePerBet] = useState<number>(3.0);
  const [game2Weighting, setGame2Weighting] = useState<number>(100.0);
  const [game2SwitchBalance, setGame2SwitchBalance] = useState<number>(400);
  const [switchBalanceCalculationType, setSwitchBalanceCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("bonus");
  const [switchBalanceMultiplier, setSwitchBalanceMultiplier] = useState<number>(4);
  const [game2HouseEdge, setGame2HouseEdge] = useState<number | null>(null);
  const [game2HouseEdgeLocked, setGame2HouseEdgeLocked] = useState<boolean>(true);
  const [game2DigitsType, setGame2DigitsType] = useState<string>("0 & Under");
  const [game2Risk, setGame2Risk] = useState<RiskLevel | null>(null);

  // Pre-coverplay state
  const [preCoverplayEnabled, setPreCoverplayEnabled] = useState<boolean>(false);
  const [preCoverplayGame, setPreCoverplayGame] = useState<GameName>("slots");
  const [preCoverplayCategory, setPreCoverplayCategory] = useState<GameCategory>("slots");
  const [preCoverplayType, setPreCoverplayType] = useState<string>("");
  const [preCoverplayBetSize, setPreCoverplayBetSize] = useState<number>(1.0);
  const [preCoverplayNumSpins, setPreCoverplayNumSpins] = useState<number>(10);
  const [preCoverplayRisk, setPreCoverplayRisk] = useState<RiskLevel | null>(null);
  const [preCoverplayHouseEdge, setPreCoverplayHouseEdge] = useState<number | null>(null);
  const [preCoverplayHouseEdgeLocked, setPreCoverplayHouseEdgeLocked] = useState<boolean>(true);
  const [preCoverplayDigitsType, setPreCoverplayDigitsType] = useState<string>("0 & Under");

  // Post-coverplay state
  const [postCoverplayEnabled, setPostCoverplayEnabled] = useState<boolean>(false);
  const [postCoverplayGame, setPostCoverplayGame] = useState<GameName>("slots");
  const [postCoverplayCategory, setPostCoverplayCategory] = useState<GameCategory>("slots");
  const [postCoverplayType, setPostCoverplayType] = useState<string>("");
  const [postCoverplayBetSize, setPostCoverplayBetSize] = useState<number>(1.0);
  const [postCoverplayNumSpins, setPostCoverplayNumSpins] = useState<number>(10);
  const [postCoverplayRisk, setPostCoverplayRisk] = useState<RiskLevel | null>(null);
  const [postCoverplayHouseEdge, setPostCoverplayHouseEdge] = useState<number | null>(null);
  const [postCoverplayHouseEdgeLocked, setPostCoverplayHouseEdgeLocked] = useState<boolean>(true);
  const [postCoverplayDigitsType, setPostCoverplayDigitsType] = useState<string>("0 & Under");

  // Simulation parameters (removed - now using globalConfig.defaults.numSessions)
  const [randomSeed, setRandomSeed] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  // Global configuration state
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Test backend connection
  const testBackendConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch("http://5.78.132.169:8000/health");
      if (response.ok) {
        const data = await response.json();
        return data.status === "healthy";
      }
      return false;
    } catch {
      return false;
    }
  };

  // Check backend status on mount and periodically
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus("checking");
      const isOnline = await testBackendConnection();
      setBackendStatus(isOnline ? "online" : "offline");
    };
    checkBackend();
    // Check every 10 seconds
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load global configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.success && data.config) {
          setGlobalConfig(data.config);
        }
      } catch (err) {
        console.error('Failed to load global configuration:', err);
      }
    };
    loadConfig();
  }, []);

  const getDefaultTimePerBet = (gameName: GameName): number => {
    // Use global config values if available, otherwise use hardcoded default
    if (globalConfig?.defaults?.timePerBet) {
      const category = getTimePerBetCategory(gameName);
      const configValue = globalConfig.defaults.timePerBet[category];
      if (configValue !== undefined) {
        return configValue;
      }
    }
    // Fallback to hardcoded default
    return 3.0;
  };

  // Apply default time per bet from config when it loads or when games change
  useEffect(() => {
    if (globalConfig?.defaults?.timePerBet) {
      setGame1TimePerBet(getDefaultTimePerBet(game1Name));
    }
  }, [globalConfig, game1Name]);

  useEffect(() => {
    if (globalConfig?.defaults?.timePerBet) {
      setGame2TimePerBet(getDefaultTimePerBet(game2Name));
    }
  }, [globalConfig, game2Name]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getGameDisplayName = (gameName: GameName): string => {
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
  };

  // Category mapping types for global configuration
  type TimePerBetCategory = 
    | "roulette"  // All roulette types share the same time per bet
    | "blackjack"
    | "baccarat"  // All baccarat types share the same time per bet
    | "slots"
    | "digits";

  type HouseEdgeCategory = 
    | "european_roulette" 
    | "american_roulette" 
    | "french_roulette_standard" 
    | "french_roulette_18s"
    | "blackjack"
    | "baccarat_player"
    | "baccarat_banker"
    | "baccarat_tie"
    | "slots"
    | "digits";

  const getTimePerBetCategory = (gameName: GameName): TimePerBetCategory => {
    // All roulette types use the same time per bet
    if (gameName.startsWith("european_") || gameName.startsWith("american_") || gameName.startsWith("french_")) {
      return "roulette";
    }
    if (gameName === "bj") return "blackjack";
    // All baccarat types use the same time per bet
    if (gameName.startsWith("baccarat_")) return "baccarat";
    if (gameName === "slots") return "slots";
    if (gameName === "digits") return "digits";
    return "blackjack"; // default
  };

  const getHouseEdgeCategory = (gameName: GameName): HouseEdgeCategory => {
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
    return "blackjack"; // default
  };

  // Helper functions for game category/type mapping
  const getGameCategoryFromName = (gameName: GameName): GameCategory => {
    if (gameName === "bj") return "blackjack";
    if (gameName.startsWith("european_")) return "european_roulette";
    if (gameName.startsWith("american_")) return "american_roulette";
    if (gameName.startsWith("french_")) return "french_roulette";
    if (gameName.startsWith("baccarat_")) return "baccarat";
    if (gameName === "slots") return "slots";
    if (gameName === "digits") return "digits";
    return "blackjack"; // default
  };

  const getRouletteBetTypeFromName = (gameName: GameName): string => {
    if (gameName.startsWith("european_") || gameName.startsWith("american_") || gameName.startsWith("french_")) {
      const parts = gameName.split("_");
      return parts[1] || "1s"; // Return "1s", "2s", "18s", etc.
    }
    return "1s";
  };

  const getGameTypeFromName = (gameName: GameName, category: GameCategory, digitsType?: string): string => {
    if (category === "european_roulette" || category === "american_roulette" || category === "french_roulette") {
      // Return just the bet type (1s, 2s, 3s, etc.) for roulette
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
      return digitsType || game1DigitsType || "0 & Under"; // For digits, use the provided digits type or fallback
    }
    return ""; // blackjack and slots have no types
  };

  const getGameNameFromCategoryAndType = (category: GameCategory, type: string, digitsType?: string): GameName => {
    if (category === "blackjack") return "bj";
    if (category === "slots") return "slots";
    if (category === "digits") return "digits";
    
    if (category === "european_roulette" || category === "american_roulette" || category === "french_roulette") {
      // Construct game name from category + bet type
      const variant = category.replace("_roulette", "");
      const betType = type || "1s";
      return `${variant}_${betType}` as GameName;
    }
    
    if (category === "baccarat") {
      const typeMap: Record<string, GameName> = {
        "Player": "baccarat_player",
        "Banker": "baccarat_banker",
        "Tie": "baccarat_tie",
      };
      return typeMap[type] || "baccarat_player";
    }
    
    return "bj"; // default
  };

  // Generate digits options (0-100)
  const digitsOptions = Array.from({ length: 101 }, (_, i) => `${i} & Under`);

  // Get default game type for a category
  const getDefaultGameType = (category: GameCategory): string => {
    switch (category) {
      case "european_roulette":
      case "american_roulette":
      case "french_roulette":
        return "1s";
      case "baccarat":
        return "Player";
      case "blackjack":
        return ""; // No types for blackjack
      case "slots":
        return "medium"; // Default risk level
      case "digits":
        return "0 & Under";
      default:
        return "";
    }
  };

  // Get default house edge for a game name
  const getDefaultHouseEdge = (gameName: GameName): number | null => {
    // Use global config values if available, otherwise use hardcoded defaults
    if (globalConfig?.defaults?.houseEdges) {
      const category = getHouseEdgeCategory(gameName);
      const configValue = globalConfig.defaults.houseEdges[category];
      if (configValue !== undefined && gameName !== "digits") {
        return configValue;
      }
    }

    // Fallback to hardcoded defaults
    switch (gameName) {
      case "bj":
        return 0.46;
      case "european_1s":
        return 2.703;
      case "european_12s":
        return 2.703;
      case "european_18s":
        return 2.703;
      case "european_2s":
        return 2.703;
      case "european_3s":
        return 2.703;
      case "european_4s":
        return 2.703;
      case "european_6s":
        return 2.703;
      case "american_18s":
        return 5.263;
      case "american_1s":
        return 5.263;
      case "american_2s":
        return 5.263;
      case "american_3s":
        return 5.263;
      case "american_4s":
        return 5.263;
      case "american_6s":
        return 5.263;
      case "american_12s":
        return 5.263;
      case "french_18s":
        return 1.351;
      case "french_1s":
        return 2.703;
      case "french_2s":
        return 2.703;
      case "french_3s":
        return 2.703;
      case "french_4s":
        return 2.703;
      case "french_6s":
        return 2.703;
      case "french_12s":
        return 2.703;
      case "baccarat_player":
        return 1.060;
      case "baccarat_banker":
        return 1.050;
      case "baccarat_tie":
        return 14.360;
      case "slots":
        return 3.0;
      case "digits":
        return null; // Variable based on threshold
      default:
        return null;
    }
  };

  // Set default type if empty when category is set
  useEffect(() => {
    if (game1Type === "" && game1Category !== "blackjack") {
      const defaultType = getDefaultGameType(game1Category);
      if (game1Category === "slots") {
        if (!game1Risk) {
          setGame1Risk(defaultType as RiskLevel);
        }
      } else if (game1Category === "digits") {
        setGame1Type(defaultType);
        setGame1DigitsType(defaultType);
      } else {
        setGame1Type(defaultType);
      }
    }
  }, [game1Category, game1Type, game1Risk]);

  // Sync game1Name with category and type
  useEffect(() => {
    if (game1Category === "digits") {
      setGame1Name("digits");
      setGame1DigitsType(game1Type || "0 & Under");
    } else {
      const newName = getGameNameFromCategoryAndType(game1Category, game1Type);
      setGame1Name(newName);
      setGame1DigitsType("");
    }
  }, [game1Category, game1Type]);

  // Reset house edge to default when game1Name changes
  useEffect(() => {
    setGame1HouseEdge(null);
  }, [game1Name]);

  // Initialize game1Category and game1Type from game1Name (on mount only)
  useEffect(() => {
    const category = getGameCategoryFromName(game1Name);
    const type = getGameTypeFromName(game1Name, category, game1DigitsType);
    setGame1Category(category);
    if (category === "digits") {
      setGame1Type(game1DigitsType || "0 & Under");
    } else {
      setGame1Type(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Set default type if empty when category is set
  useEffect(() => {
    if (game2Type === "" && game2Category !== "blackjack") {
      const defaultType = getDefaultGameType(game2Category);
      if (game2Category === "slots") {
        if (!game2Risk) {
          setGame2Risk(defaultType as RiskLevel);
        }
      } else if (game2Category === "digits") {
        setGame2Type(defaultType);
        setGame2DigitsType(defaultType);
      } else {
        setGame2Type(defaultType);
      }
    }
  }, [game2Category, game2Type, game2Risk]);

  // Sync game2Name with category and type
  useEffect(() => {
    if (game2Category === "digits") {
      setGame2Name("digits");
      setGame2DigitsType(game2Type || "0 & Under");
    } else {
      const newName = getGameNameFromCategoryAndType(game2Category, game2Type);
      setGame2Name(newName);
      setGame2DigitsType("");
    }
  }, [game2Category, game2Type]);

  // Reset house edge to default when game2Name changes
  useEffect(() => {
    setGame2HouseEdge(null);
    setGame2HouseEdgeLocked(true); // Lock when game changes
  }, [game2Name]);

  // Initialize game2Category and game2Type from game2Name (on mount only)
  useEffect(() => {
    const category = getGameCategoryFromName(game2Name);
    const type = getGameTypeFromName(game2Name, category, game2DigitsType);
    setGame2Category(category);
    if (category === "digits") {
      setGame2Type(game2DigitsType || "0 & Under");
    } else {
      setGame2Type(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Disable Two-Tier Strategy when bonus type doesn't support it (only cashable, postwager, and cashback support it)
  useEffect(() => {
    // Disable two-tier strategy only for bonus types that don't support it
    if (bonusType !== "cashable" && bonusType !== "postwager" && bonusType !== "cashback" && game2Enabled) {
      setGame2Enabled(false);
    }
  }, [bonusType, game2Enabled]);

  // Calculate switch balance based on selected type and multiplier
  const calculateSwitchBalance = (): number => {
    switch (switchBalanceCalculationType) {
      case "deposit":
        return deposit * switchBalanceMultiplier;
      case "bonus":
        return bonusAmount * switchBalanceMultiplier;
      case "both":
        return (deposit + bonusAmount) * switchBalanceMultiplier;
      case "fixed":
        return switchBalanceMultiplier;
      default:
        return deposit * switchBalanceMultiplier;
    }
  };

  // Auto-update switch balance when calculation inputs change
  useEffect(() => {
    if (game2Enabled) {
      let calculated: number;
      switch (switchBalanceCalculationType) {
        case "deposit":
          calculated = deposit * switchBalanceMultiplier;
          break;
        case "bonus":
          calculated = bonusAmount * switchBalanceMultiplier;
          break;
        case "both":
          calculated = (deposit + bonusAmount) * switchBalanceMultiplier;
          break;
        case "fixed":
          calculated = switchBalanceMultiplier;
          break;
        default:
          calculated = deposit * switchBalanceMultiplier;
      }
      setGame2SwitchBalance(calculated);
    }
  }, [switchBalanceCalculationType, switchBalanceMultiplier, deposit, bonusAmount, game2Enabled]);

  // Set default type if empty when category is set
  useEffect(() => {
    if (preCoverplayType === "" && preCoverplayCategory !== "blackjack") {
      const defaultType = getDefaultGameType(preCoverplayCategory);
      if (preCoverplayCategory === "slots") {
        if (!preCoverplayRisk) {
          setPreCoverplayRisk(defaultType as RiskLevel);
        }
      } else if (preCoverplayCategory === "digits") {
        setPreCoverplayType(defaultType);
        setPreCoverplayDigitsType(defaultType);
      } else {
        setPreCoverplayType(defaultType);
      }
    }
  }, [preCoverplayCategory, preCoverplayType, preCoverplayRisk]);

  // Sync preCoverplayGame with category and type
  useEffect(() => {
    if (preCoverplayCategory === "digits") {
      setPreCoverplayGame("digits");
      setPreCoverplayDigitsType(preCoverplayType || "0 & Under");
    } else {
      const newName = getGameNameFromCategoryAndType(preCoverplayCategory, preCoverplayType);
      setPreCoverplayGame(newName);
      setPreCoverplayDigitsType("");
    }
  }, [preCoverplayCategory, preCoverplayType]);

  // Reset house edge to default when preCoverplayGame changes
  useEffect(() => {
    setPreCoverplayHouseEdge(null);
    setPreCoverplayHouseEdgeLocked(true); // Lock when game changes
  }, [preCoverplayGame]);

  // Initialize preCoverplayCategory and preCoverplayType from preCoverplayGame (on mount only)
  useEffect(() => {
    const category = getGameCategoryFromName(preCoverplayGame);
    const type = getGameTypeFromName(preCoverplayGame, category, preCoverplayDigitsType);
    setPreCoverplayCategory(category);
    if (category === "digits") {
      setPreCoverplayType(preCoverplayDigitsType || "0 & Under");
    } else {
      setPreCoverplayType(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Set default type if empty when category is set
  useEffect(() => {
    if (postCoverplayType === "" && postCoverplayCategory !== "blackjack") {
      const defaultType = getDefaultGameType(postCoverplayCategory);
      if (postCoverplayCategory === "slots") {
        if (!postCoverplayRisk) {
          setPostCoverplayRisk(defaultType as RiskLevel);
        }
      } else if (postCoverplayCategory === "digits") {
        setPostCoverplayType(defaultType);
        setPostCoverplayDigitsType(defaultType);
      } else {
        setPostCoverplayType(defaultType);
      }
    }
  }, [postCoverplayCategory, postCoverplayType, postCoverplayRisk]);

  // Sync postCoverplayGame with category and type
  useEffect(() => {
    if (postCoverplayCategory === "digits") {
      setPostCoverplayGame("digits");
      setPostCoverplayDigitsType(postCoverplayType || "0 & Under");
    } else {
      const newName = getGameNameFromCategoryAndType(postCoverplayCategory, postCoverplayType);
      setPostCoverplayGame(newName);
      setPostCoverplayDigitsType("");
    }
  }, [postCoverplayCategory, postCoverplayType]);

  // Reset house edge to default when postCoverplayGame changes
  useEffect(() => {
    setPostCoverplayHouseEdge(null);
    setPostCoverplayHouseEdgeLocked(true); // Lock when game changes
  }, [postCoverplayGame]);

  // Initialize postCoverplayCategory and postCoverplayType from postCoverplayGame (on mount only)
  useEffect(() => {
    const category = getGameCategoryFromName(postCoverplayGame);
    const type = getGameTypeFromName(postCoverplayGame, category, postCoverplayDigitsType);
    setPostCoverplayCategory(category);
    if (category === "digits") {
      setPostCoverplayType(postCoverplayDigitsType || "0 & Under");
    } else {
      setPostCoverplayType(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const validateForm = (): string | null => {
    if ((bonusType === "postwager" || bonusType === "cashback") && deposit <= 0) {
      return "Deposit must be greater than 0";
    }
    if (bonusType !== "raw" && bonusAmount < 0) return "Bonus amount cannot be negative";
    if (game1BetSize <= 0) return "Game 1 bet size must be greater than 0";
    if (game2Enabled && game2BetSize <= 0) {
      return "Game 2 bet size must be greater than 0";
    }
    if (game1Name === "digits" && !game1DigitsType) {
      return "Digits type is required for Digits game (e.g., '10 & Under')";
    }
    if (bonusType === "cashback" && cashbackType === "fixed_wager") {
      if (wagerTarget <= 0) return "Wager target must be greater than 0";
      if (cashbackRate <= 0 || cashbackRate > 1) return "Cashback rate must be between 0 and 1";
      if (cashbackCap <= 0) return "Cashback cap must be greater than 0";
    }
    return null;
  };

  // ============================================================================
  // API INTEGRATION
  // ============================================================================

  const handleSubmit = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    // Test backend connection first
    const isBackendOnline = await testBackendConnection();
    if (!isBackendOnline) {
      setError(
        "Cannot connect to backend. Please ensure the Julia backend is running on http://5.78.132.169:8000. Run 'julia server.jl' in the ev-simulator-julia directory."
      );
      setLoading(false);
      return;
    }

    try {
      // Construct bonus config
      const bonusConfig: BonusConfig = {
        type: bonusType,
        deposit,
        bonus_amount: bonusAmount,
      };

      if (bonusType !== "raw" && bonusType !== "freespins") {
        bonusConfig.wagering = wagering;
      }

      if (bonusType === "cashback") {
        bonusConfig.cashback_type = cashbackType;
        if (cashbackType === "fixed_wager") {
          bonusConfig.wager_target = wagerTarget;
          bonusConfig.cashback_rate = cashbackRate;
          bonusConfig.cashback_cap = cashbackCap;
          bonusConfig.cashback_as_bonus = cashbackAsBonus;
          if (cashbackAsBonus && cashbackWageringRequirement > 0) {
            bonusConfig.cashback_wagering_requirement = cashbackWageringRequirement;
          }
        } else {
          bonusConfig.target_balance = targetBalance;
          bonusConfig.cashback_amount = cashbackAmount;
        }
      }

      if (bonusType === "sticky") {
        if (maxCashout !== null && maxCashout > 0) {
          bonusConfig.max_cashout = maxCashout;
        }
      }

      if (bonusType === "freespins") {
        bonusConfig.freespins_count = freespinsCount;
        bonusConfig.freespins_bet_size = freespinsBetSize;
        bonusConfig.freespins_rollover = freespinsRollover;
        if (freespinsRollover) {
          bonusConfig.freespins_rollover_multiplier = freespinsRolloverMultiplier;
        }
      }

      // Construct game1 config
      const game1Config: GameConfig = {
        name: game1Name,
        bet_size: game1BetSize,
        time_per_bet: game1TimePerBet,
        game_weighting: game1Weighting,
      };

      if (game1Name === "slots" && game1Risk) {
        game1Config.risk = game1Risk;
      }

      if (game1Name === "digits" && game1DigitsType) {
        game1Config.digits_type = game1DigitsType;
      }

      if (game1HouseEdge !== null) {
        game1Config.house_edge = game1HouseEdge;
      }

      // Construct game2 config if two-tier mode
      let game2Config: GameConfig | null = null;
      if (game2Enabled) {
        game2Config = {
          name: game2Name,
          bet_size: game2BetSize,
          time_per_bet: game2TimePerBet,
          game_weighting: game2Weighting,
          switch_balance: game2SwitchBalance,
        };

        if (game2Name === "slots" && game2Risk) {
          game2Config.risk = game2Risk;
        }

        if (game2Name === "digits" && game2DigitsType) {
          game2Config.digits_type = game2DigitsType;
        }

        if (game2HouseEdge !== null) {
          game2Config.house_edge = game2HouseEdge;
        }
      }

      // Construct pre-coverplay config
      let preCoverplayConfig: CoverplayConfig | undefined;
      if (preCoverplayEnabled) {
        preCoverplayConfig = {
          enabled: true,
          game: preCoverplayGame,
          bet_size: preCoverplayBetSize,
          num_spins: preCoverplayNumSpins,
        };

        if (preCoverplayGame === "slots" && preCoverplayRisk) {
          preCoverplayConfig.risk = preCoverplayRisk;
        }

        if (preCoverplayGame === "digits" && preCoverplayDigitsType) {
          // Note: CoverplayConfig doesn't have digits_type, but we'll handle it if needed
        }

        if (preCoverplayHouseEdge !== null) {
          preCoverplayConfig.house_edge = preCoverplayHouseEdge;
        }
      }

      // Construct post-coverplay config
      let postCoverplayConfig: CoverplayConfig | undefined;
      if (postCoverplayEnabled) {
        postCoverplayConfig = {
          enabled: true,
          game: postCoverplayGame,
          bet_size: postCoverplayBetSize,
          num_spins: postCoverplayNumSpins,
        };

        if (postCoverplayGame === "slots" && postCoverplayRisk) {
          postCoverplayConfig.risk = postCoverplayRisk;
        }

        if (postCoverplayGame === "digits" && postCoverplayDigitsType) {
          // Note: CoverplayConfig doesn't have digits_type, but we'll handle it if needed
        }

        if (postCoverplayHouseEdge !== null) {
          postCoverplayConfig.house_edge = postCoverplayHouseEdge;
        }
      }

      // Determine mode based on game2Enabled
      const mode: SimulationMode = game2Enabled ? "two_tier" : "standard";
      
      // Construct request
      const request: SimulationRequest = {
        mode: mode,
        bonus: bonusConfig,
        game1: game1Config,
        simulation: {
          num_sessions: globalConfig?.defaults?.numSessions ?? 1000000,
          random_seed: randomSeed,
        },
      };

      if (game2Config) {
        request.game2 = game2Config;
      }

      if (preCoverplayConfig) {
        request.pre_coverplay = preCoverplayConfig;
      }

      if (postCoverplayConfig) {
        request.post_coverplay = postCoverplayConfig;
      }

      // Make API call
      const apiUrl = "http://5.78.132.169:8000/api/simulate";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, get text
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        
        // Add helpful context for 404
        if (response.status === 404) {
          errorMessage += ". Is the backend running on http://5.78.132.169:8000?";
        }
        
        throw new Error(errorMessage);
      }

      const data: ApiResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold mb-2">EV Casino Simulator</h1>
            <p className="text-muted-foreground">
              Monte Carlo simulation for casino bonus optimization
            </p>
          </div>
          <div className="flex items-center gap-2">
            {backendStatus === "checking" && (
              <Badge variant="outline" className="gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking backend...
              </Badge>
            )}
            {backendStatus === "online" && (
              <Badge variant="default" className="gap-2 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Backend Online
              </Badge>
            )}
            {backendStatus === "offline" && (
              <Badge variant="destructive" className="gap-2">
                <XCircle className="h-3 w-3" />
                Backend Offline
              </Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettingsModal(true)}
              title="Global Settings"
              className="ml-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {backendStatus === "offline" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot connect to backend at http://5.78.132.169:8000. Please ensure the Julia backend is running. 
              Run <code className="px-1 py-0.5 bg-muted rounded">julia server.jl</code> in the ev-simulator-julia directory.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* BONUS CONFIGURATION */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bonus Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bonusType">Bonus Type</Label>
              <Select value={bonusType} onValueChange={(v) => setBonusType(v as BonusType)}>
                <SelectTrigger id="bonusType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashable">Deposit Bonuses</SelectItem>
                  <SelectItem value="postwager">Post-Wager</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  {/* <SelectItem value="sticky">Sticky</SelectItem>
                  <SelectItem value="freespins">Free Spins</SelectItem> */}
                  <SelectItem value="raw">Raw (Single Bet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bonusType !== "raw" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit ($)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonusAmount">Bonus Amount ($)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    placeholder="100"
                  />
                </div>

                {bonusType !== "freespins" && (
                  <div className="space-y-2">
                    <Label htmlFor="wagering">Wagering Requirement ($)</Label>
                    <Input
                      id="wagering"
                      type="number"
                      value={wagering}
                      onChange={(e) => setWagering(Number(e.target.value))}
                      placeholder="6000"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* CASHBACK SPECIFIC */}
          {bonusType === "cashback" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="cashbackType">Cashback Type</Label>
                <Select value={cashbackType} onValueChange={(v) => setCashbackType(v as CashbackType)}>
                  <SelectTrigger id="cashbackType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_win">On Win</SelectItem>
                    <SelectItem value="on_loss">On Loss</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="fixed_wager">Fixed Wager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cashbackType === "fixed_wager" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wagerTarget">Wager Target ($)</Label>
                    <Input
                      id="wagerTarget"
                      type="number"
                      value={wagerTarget}
                      onChange={(e) => setWagerTarget(Number(e.target.value))}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashbackRate">Cashback Rate (0-1)</Label>
                    <Input
                      id="cashbackRate"
                      type="number"
                      step="0.01"
                      value={cashbackRate}
                      onChange={(e) => setCashbackRate(Number(e.target.value))}
                      placeholder="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashbackCap">Cashback Cap ($)</Label>
                    <Input
                      id="cashbackCap"
                      type="number"
                      value={cashbackCap}
                      onChange={(e) => setCashbackCap(Number(e.target.value))}
                      placeholder="50"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cashbackAsBonus"
                      checked={cashbackAsBonus}
                      onCheckedChange={(checked) => setCashbackAsBonus(checked as boolean)}
                    />
                    <Label htmlFor="cashbackAsBonus" className="font-normal cursor-pointer">
                      Cashback as Bonus (requires wagering)
                    </Label>
                  </div>
                  {cashbackAsBonus && (
                    <div className="space-y-2">
                      <Label htmlFor="cashbackWageringRequirement">
                        Cashback Wagering Requirement ($)
                      </Label>
                      <Input
                        id="cashbackWageringRequirement"
                        type="number"
                        value={cashbackWageringRequirement}
                        onChange={(e) => setCashbackWageringRequirement(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetBalance">Target Balance ($)</Label>
                    <Input
                      id="targetBalance"
                      type="number"
                      value={targetBalance}
                      onChange={(e) => setTargetBalance(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashbackAmount">Cashback Amount ($)</Label>
                    <Input
                      id="cashbackAmount"
                      type="number"
                      value={cashbackAmount}
                      onChange={(e) => setCashbackAmount(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STICKY SPECIFIC */}
          {bonusType === "sticky" && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="maxCashout">Max Cashout ($) (optional)</Label>
              <Input
                id="maxCashout"
                type="number"
                value={maxCashout || ""}
                onChange={(e) => setMaxCashout(e.target.value ? Number(e.target.value) : null)}
                placeholder="Leave empty for no limit"
              />
            </div>
          )}

          {/* FREESPINS SPECIFIC */}
          {bonusType === "freespins" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freespinsCount">Free Spins Count</Label>
                  <Input
                    id="freespinsCount"
                    type="number"
                    value={freespinsCount}
                    onChange={(e) => setFreespinsCount(Number(e.target.value))}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freespinsBetSize">Free Spins Bet Size ($)</Label>
                  <Input
                    id="freespinsBetSize"
                    type="number"
                    step="0.01"
                    value={freespinsBetSize}
                    onChange={(e) => setFreespinsBetSize(Number(e.target.value))}
                    placeholder="1.0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freespinsRollover"
                  checked={freespinsRollover}
                  onCheckedChange={(checked) => setFreespinsRollover(checked as boolean)}
                />
                <Label htmlFor="freespinsRollover" className="font-normal cursor-pointer">
                  Require rollover on winnings
                </Label>
              </div>
              {freespinsRollover && (
                <div className="space-y-2">
                  <Label htmlFor="freespinsRolloverMultiplier">Rollover Multiplier</Label>
                  <Input
                    id="freespinsRolloverMultiplier"
                    type="number"
                    step="0.1"
                    value={freespinsRolloverMultiplier}
                    onChange={(e) => setFreespinsRolloverMultiplier(Number(e.target.value))}
                    placeholder="3.0"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GAME CONFIGURATIONS - SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* GAME 1 CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle>Game 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line 1: Game and Game Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game1Category">Game Type</Label>
                <Select value={game1Category} onValueChange={(v) => {
                  const newCategory = v as GameCategory;
                  setGame1Category(newCategory);
                  const defaultType = getDefaultGameType(newCategory);
                  if (newCategory === "slots") {
                    setGame1Risk(defaultType as RiskLevel);
                  } else if (newCategory === "digits") {
                    setGame1Type(defaultType);
                    setGame1DigitsType(defaultType);
                  } else {
                    setGame1Type(defaultType);
                  }
                }}>
                  <SelectTrigger id="game1Category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="european_roulette">European Roulette</SelectItem>
                    <SelectItem value="american_roulette">American Roulette</SelectItem>
                    <SelectItem value="french_roulette">French Roulette</SelectItem>
                    <SelectItem value="baccarat">Baccarat</SelectItem>
                    <SelectItem value="blackjack">Blackjack</SelectItem>
                    <SelectItem value="slots">Slots</SelectItem>
                    <SelectItem value="digits">Digits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="game1Type">
                  {game1Category === "slots" ? "Risk Level" : "Selection"}
                </Label>
                {(game1Category === "european_roulette" || game1Category === "american_roulette" || game1Category === "french_roulette") && (
                  <Select value={game1Type} onValueChange={setGame1Type}>
                    <SelectTrigger id="game1Type">
                      <SelectValue placeholder="Select bet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1s">1s</SelectItem>
                      <SelectItem value="2s">2s</SelectItem>
                      <SelectItem value="3s">3s</SelectItem>
                      <SelectItem value="4s">4s</SelectItem>
                      <SelectItem value="6s">6s</SelectItem>
                      <SelectItem value="12s">12s</SelectItem>
                      <SelectItem value="18s">18s</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {game1Category === "baccarat" && (
                  <Select value={game1Type} onValueChange={setGame1Type}>
                    <SelectTrigger id="game1Type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Player">Player</SelectItem>
                      <SelectItem value="Banker">Banker</SelectItem>
                      <SelectItem value="Tie">Tie</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {game1Category === "blackjack" && (
                  <Input
                    id="game1Type"
                    value=""
                    disabled
                    placeholder="No types available"
                    className="bg-muted"
                  />
                )}
                {game1Category === "slots" && (
                  <Select
                    value={game1Risk || "medium"}
                    onValueChange={(v) => setGame1Risk(v as RiskLevel)}
                  >
                    <SelectTrigger id="game1Risk">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_low">Very Low (0.25x)</SelectItem>
                      <SelectItem value="low">Low (0.5x)</SelectItem>
                      <SelectItem value="medium">Medium (1.0x)</SelectItem>
                      <SelectItem value="high">High (2.0x)</SelectItem>
                      <SelectItem value="very_high">Very High (4.0x)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {game1Category === "digits" && (
                  <Select value={game1Type} onValueChange={setGame1Type}>
                    <SelectTrigger id="game1Type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {digitsOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Line 2: Bet Size and Time Per Bet */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game1BetSize">Bet Size ($)</Label>
                <Input
                  id="game1BetSize"
                  type="number"
                  step="0.01"
                  value={game1BetSize}
                  onChange={(e) => setGame1BetSize(Number(e.target.value))}
                  placeholder="5.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="game1TimePerBet">Time Per Bet (seconds)</Label>
                <Input
                  id="game1TimePerBet"
                  type="number"
                  step="0.1"
                  value={game1TimePerBet}
                  onChange={(e) => setGame1TimePerBet(Number(e.target.value))}
                  placeholder="3.0"
                />
              </div>
            </div>

            {/* Line 3: Game Weighting and House Edge */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game1Weighting">Game Weighting (%)</Label>
                <Input
                  id="game1Weighting"
                  type="number"
                  step="0.1"
                  value={game1Weighting}
                  onChange={(e) => setGame1Weighting(Number(e.target.value))}
                  placeholder="100.0"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor="game1HouseEdge">House Edge (%)</Label>
                  <button
                    type="button"
                    onClick={() => setGame1HouseEdgeLocked(!game1HouseEdgeLocked)}
                    className="absolute top-0 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {game1HouseEdgeLocked ? (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>
                <Input
                  id="game1HouseEdge"
                  type="number"
                  step="0.01"
                  disabled={game1HouseEdgeLocked}
                  value={game1HouseEdge !== null ? game1HouseEdge : (getDefaultHouseEdge(game1Name) ?? "")}
                  onChange={(e) => setGame1HouseEdge(e.target.value ? Number(e.target.value) : null)}
                  placeholder={getDefaultHouseEdge(game1Name) !== null ? "" : "Variable"}
                  className={game1HouseEdgeLocked ? "bg-muted cursor-not-allowed" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {getDefaultHouseEdge(game1Name) !== null 
                    ? `Default value (${getDefaultHouseEdge(game1Name)}%)`
                    : "Variable based on threshold"}
                </p>
              </div>
            </div>


        </CardContent>
      </Card>

      {/* GAME 2 CONFIGURATION */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Game 2</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="game2Enabled"
                checked={game2Enabled}
                disabled={bonusType !== "cashable" && bonusType !== "postwager" && bonusType !== "cashback"}
                onCheckedChange={(checked) => setGame2Enabled(checked as boolean)}
              />
              <Label 
                htmlFor="game2Enabled" 
                className={`font-normal ${bonusType !== "cashable" && bonusType !== "postwager" && bonusType !== "cashback" ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}`}
              >
                Enable Two-Tier Strategy
                {bonusType !== "cashable" && bonusType !== "postwager" && bonusType !== "cashback" && (
                  <span className="text-xs block text-muted-foreground mt-1">
                    (Only available with Deposit Bonuses, Post-Wager, or Cashback)
                  </span>
                )}
              </Label>
            </div>
          </div>
        </CardHeader>
        {game2Enabled ? (
            <CardContent className="space-y-4">
              {/* Line 1: Game and Game Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game2Category">Game Type</Label>
                  <Select value={game2Category} onValueChange={(v) => {
                    const newCategory = v as GameCategory;
                    setGame2Category(newCategory);
                    const defaultType = getDefaultGameType(newCategory);
                    if (newCategory === "slots") {
                      setGame2Risk(defaultType as RiskLevel);
                    } else if (newCategory === "digits") {
                      setGame2Type(defaultType);
                      setGame2DigitsType(defaultType);
                    } else {
                      setGame2Type(defaultType);
                    }
                  }}>
                    <SelectTrigger id="game2Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="european_roulette">European Roulette</SelectItem>
                      <SelectItem value="american_roulette">American Roulette</SelectItem>
                      <SelectItem value="french_roulette">French Roulette</SelectItem>
                      <SelectItem value="baccarat">Baccarat</SelectItem>
                      <SelectItem value="blackjack">Blackjack</SelectItem>
                      <SelectItem value="slots">Slots</SelectItem>
                      <SelectItem value="digits">Digits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game2Type">
                    {game2Category === "slots" ? "Risk Level" : "Selection"}
                  </Label>
                  {(game2Category === "european_roulette" || game2Category === "american_roulette" || game2Category === "french_roulette") && (
                    <Select value={game2Type} onValueChange={setGame2Type}>
                      <SelectTrigger id="game2Type">
                        <SelectValue placeholder="Select bet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1s">1s</SelectItem>
                        <SelectItem value="2s">2s</SelectItem>
                        <SelectItem value="3s">3s</SelectItem>
                        <SelectItem value="4s">4s</SelectItem>
                        <SelectItem value="6s">6s</SelectItem>
                        <SelectItem value="12s">12s</SelectItem>
                        <SelectItem value="18s">18s</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {game2Category === "baccarat" && (
                    <Select value={game2Type} onValueChange={setGame2Type}>
                      <SelectTrigger id="game2Type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Player">Player</SelectItem>
                        <SelectItem value="Banker">Banker</SelectItem>
                        <SelectItem value="Tie">Tie</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {game2Category === "blackjack" && (
                    <Input
                      id="game2Type"
                      value=""
                      disabled
                      placeholder="No types available"
                      className="bg-muted"
                    />
                  )}
                  {game2Category === "slots" && (
                    <Select
                      value={game2Risk || "medium"}
                      onValueChange={(v) => setGame2Risk(v as RiskLevel)}
                    >
                      <SelectTrigger id="game2Risk">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very_low">Very Low (0.25x)</SelectItem>
                        <SelectItem value="low">Low (0.5x)</SelectItem>
                        <SelectItem value="medium">Medium (1.0x)</SelectItem>
                        <SelectItem value="high">High (2.0x)</SelectItem>
                        <SelectItem value="very_high">Very High (4.0x)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {game2Category === "digits" && (
                    <Select value={game2Type} onValueChange={setGame2Type}>
                      <SelectTrigger id="game2Type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {digitsOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Line 2: Bet Size and Time Per Bet */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game2BetSize">Bet Size ($)</Label>
                  <Input
                    id="game2BetSize"
                    type="number"
                    step="0.01"
                    value={game2BetSize}
                    onChange={(e) => setGame2BetSize(Number(e.target.value))}
                    placeholder="2.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game2TimePerBet">Time Per Bet (seconds)</Label>
                  <Input
                    id="game2TimePerBet"
                    type="number"
                    step="0.1"
                    value={game2TimePerBet}
                    onChange={(e) => setGame2TimePerBet(Number(e.target.value))}
                    placeholder="3.0"
                  />
                </div>
              </div>

              {/* Line 3: Game Weighting and House Edge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game2Weighting">Game Weighting (%)</Label>
                  <Input
                    id="game2Weighting"
                    type="number"
                    step="0.1"
                    value={game2Weighting}
                    onChange={(e) => setGame2Weighting(Number(e.target.value))}
                    placeholder="100.0"
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Label htmlFor="game2HouseEdge">House Edge (%)</Label>
                    <button
                      type="button"
                      onClick={() => setGame2HouseEdgeLocked(!game2HouseEdgeLocked)}
                      className="absolute top-0 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {game2HouseEdgeLocked ? (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>Edit</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3" />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  </div>
                  <Input
                    id="game2HouseEdge"
                    type="number"
                    step="0.01"
                    disabled={game2HouseEdgeLocked}
                    value={game2HouseEdge !== null ? game2HouseEdge : (getDefaultHouseEdge(game2Name) ?? "")}
                    onChange={(e) => setGame2HouseEdge(e.target.value ? Number(e.target.value) : null)}
                    placeholder={getDefaultHouseEdge(game2Name) !== null ? "" : "Variable"}
                    className={game2HouseEdgeLocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {getDefaultHouseEdge(game2Name) !== null 
                      ? `Default value (${getDefaultHouseEdge(game2Name)}%)`
                      : "Variable based on threshold"}
                  </p>
                </div>
              </div>

              {/* Switch Balance - Only shown when Game 2 is enabled */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-start gap-2 flex-wrap grid grid-cols-2">
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-xl font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">Switch Balance ($) :</span>
                      <span className="text-xl font-semibold text-green-600 dark:text-green-400">{calculateSwitchBalance().toLocaleString()}  </span>
                  </div>
                  <div className="flex items-center gap-2 ">
                    <Select
                      value={switchBalanceCalculationType}
                      onValueChange={(value) => setSwitchBalanceCalculationType(value as "deposit" | "bonus" | "both" | "fixed")}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-lg">✕</span>
                    <Input
                      id="switchBalanceMultiplier"
                      type="number"
                      step="1"
                      min="1"
                      value={switchBalanceMultiplier}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > 99999) {
                          return;
                        }
                        if (value > 0) {
                          setSwitchBalanceMultiplier(value);
                        }
                      }}
                      className="w-[120px]"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Balance threshold to switch from Game 1 to Game 2
                </p>
              </div>

            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable two-tier strategy to switch from Game 1 to Game 2 at a specific balance threshold.
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* COVERPLAY CONFIGURATIONS - SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PRE-COVERPLAY CONFIGURATION */}
        {globalConfig?.features?.preCoverplayEnabled && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pre-Coverplay</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preCoverplayEnabled"
                checked={preCoverplayEnabled}
                onCheckedChange={(checked) => setPreCoverplayEnabled(checked as boolean)}
              />
              <Label htmlFor="preCoverplayEnabled" className="font-normal cursor-pointer">
                Enable Pre-Coverplay
              </Label>
            </div>
          </div>
        </CardHeader>
        {preCoverplayEnabled ? (
          <CardContent className="space-y-4">
            {/* Line 1: Game and Game Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preCoverplayCategory">Game Type</Label>
                <Select value={preCoverplayCategory} onValueChange={(v) => {
                  const newCategory = v as GameCategory;
                  setPreCoverplayCategory(newCategory);
                  const defaultType = getDefaultGameType(newCategory);
                  if (newCategory === "slots") {
                    setPreCoverplayRisk(defaultType as RiskLevel);
                  } else if (newCategory === "digits") {
                    setPreCoverplayType(defaultType);
                    setPreCoverplayDigitsType(defaultType);
                  } else {
                    setPreCoverplayType(defaultType);
                  }
                }}>
                  <SelectTrigger id="preCoverplayCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="european_roulette">European Roulette</SelectItem>
                    <SelectItem value="american_roulette">American Roulette</SelectItem>
                    <SelectItem value="french_roulette">French Roulette</SelectItem>
                    <SelectItem value="baccarat">Baccarat</SelectItem>
                    <SelectItem value="blackjack">Blackjack</SelectItem>
                    <SelectItem value="slots">Slots</SelectItem>
                    <SelectItem value="digits">Digits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preCoverplayType">
                  {preCoverplayCategory === "slots" ? "Risk Level" : "Selection"}
                </Label>
                {(preCoverplayCategory === "european_roulette" || preCoverplayCategory === "american_roulette" || preCoverplayCategory === "french_roulette") && (
                  <Select value={preCoverplayType} onValueChange={setPreCoverplayType}>
                    <SelectTrigger id="preCoverplayType">
                      <SelectValue placeholder="Select bet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1s">1s</SelectItem>
                      <SelectItem value="2s">2s</SelectItem>
                      <SelectItem value="3s">3s</SelectItem>
                      <SelectItem value="4s">4s</SelectItem>
                      <SelectItem value="6s">6s</SelectItem>
                      <SelectItem value="12s">12s</SelectItem>
                      <SelectItem value="18s">18s</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {preCoverplayCategory === "baccarat" && (
                  <Select value={preCoverplayType} onValueChange={setPreCoverplayType}>
                    <SelectTrigger id="preCoverplayType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Player">Player</SelectItem>
                      <SelectItem value="Banker">Banker</SelectItem>
                      <SelectItem value="Tie">Tie</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {preCoverplayCategory === "blackjack" && (
                  <Input
                    id="preCoverplayType"
                    value=""
                    disabled
                    placeholder="No types available"
                    className="bg-muted"
                  />
                )}
                {preCoverplayCategory === "slots" && (
                  <Select
                    value={preCoverplayRisk || "medium"}
                    onValueChange={(v) => setPreCoverplayRisk(v as RiskLevel)}
                  >
                    <SelectTrigger id="preCoverplayRisk">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_low">Very Low (0.25x)</SelectItem>
                      <SelectItem value="low">Low (0.5x)</SelectItem>
                      <SelectItem value="medium">Medium (1.0x)</SelectItem>
                      <SelectItem value="high">High (2.0x)</SelectItem>
                      <SelectItem value="very_high">Very High (4.0x)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {preCoverplayCategory === "digits" && (
                  <Select value={preCoverplayType} onValueChange={setPreCoverplayType}>
                    <SelectTrigger id="preCoverplayType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {digitsOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Line 2: Bet Size and Number of Spins */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preCoverplayBetSize">Bet Size ($)</Label>
                <Input
                  id="preCoverplayBetSize"
                  type="number"
                  step="0.01"
                  value={preCoverplayBetSize}
                  onChange={(e) => setPreCoverplayBetSize(Number(e.target.value))}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preCoverplayNumSpins">Number of Spins</Label>
                <Input
                  id="preCoverplayNumSpins"
                  type="number"
                  value={preCoverplayNumSpins}
                  onChange={(e) => setPreCoverplayNumSpins(Number(e.target.value))}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Line 3: House Edge */}
            <div className="space-y-2">
              <div className="relative">
                <Label htmlFor="preCoverplayHouseEdge">House Edge (%)</Label>
                <button
                  type="button"
                  onClick={() => setPreCoverplayHouseEdgeLocked(!preCoverplayHouseEdgeLocked)}
                  className="absolute top-0 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {preCoverplayHouseEdgeLocked ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                id="preCoverplayHouseEdge"
                type="number"
                step="0.01"
                disabled={preCoverplayHouseEdgeLocked}
                value={preCoverplayHouseEdge !== null ? preCoverplayHouseEdge : (getDefaultHouseEdge(preCoverplayGame) ?? "")}
                onChange={(e) =>
                  setPreCoverplayHouseEdge(e.target.value ? Number(e.target.value) : null)
                }
                placeholder={getDefaultHouseEdge(preCoverplayGame) !== null ? "" : "Variable"}
                className={preCoverplayHouseEdgeLocked ? "bg-muted cursor-not-allowed" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {getDefaultHouseEdge(preCoverplayGame) !== null 
                  ? `Default value (${getDefaultHouseEdge(preCoverplayGame)}%)`
                  : "Variable based on threshold"}
              </p>
            </div>
          </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable pre-coverplay to add additional spins before main strategy to avoid casino detection.
              </p>
            </CardContent>
          )}
        </Card>
        )}

        {/* POST-COVERPLAY CONFIGURATION */}
        {globalConfig?.features?.postCoverplayEnabled && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Post-Coverplay</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="postCoverplayEnabled"
                checked={postCoverplayEnabled}
                onCheckedChange={(checked) => setPostCoverplayEnabled(checked as boolean)}
              />
              <Label htmlFor="postCoverplayEnabled" className="font-normal cursor-pointer">
                Enable Post-Coverplay
              </Label>
            </div>
          </div>
        </CardHeader>
        {postCoverplayEnabled ? (
          <CardContent className="space-y-4">
            {/* Line 1: Game and Game Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postCoverplayCategory">Game Type</Label>
                <Select value={postCoverplayCategory} onValueChange={(v) => {
                  const newCategory = v as GameCategory;
                  setPostCoverplayCategory(newCategory);
                  const defaultType = getDefaultGameType(newCategory);
                  if (newCategory === "slots") {
                    setPostCoverplayRisk(defaultType as RiskLevel);
                  } else if (newCategory === "digits") {
                    setPostCoverplayType(defaultType);
                    setPostCoverplayDigitsType(defaultType);
                  } else {
                    setPostCoverplayType(defaultType);
                  }
                }}>
                  <SelectTrigger id="postCoverplayCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="european_roulette">European Roulette</SelectItem>
                    <SelectItem value="american_roulette">American Roulette</SelectItem>
                    <SelectItem value="french_roulette">French Roulette</SelectItem>
                    <SelectItem value="baccarat">Baccarat</SelectItem>
                    <SelectItem value="blackjack">Blackjack</SelectItem>
                    <SelectItem value="slots">Slots</SelectItem>
                    <SelectItem value="digits">Digits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postCoverplayType">
                  {postCoverplayCategory === "slots" ? "Risk Level" : "Selection"}
                </Label>
                {(postCoverplayCategory === "european_roulette" || postCoverplayCategory === "american_roulette" || postCoverplayCategory === "french_roulette") && (
                  <Select value={postCoverplayType} onValueChange={setPostCoverplayType}>
                    <SelectTrigger id="postCoverplayType">
                      <SelectValue placeholder="Select bet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1s">1s</SelectItem>
                      <SelectItem value="2s">2s</SelectItem>
                      <SelectItem value="3s">3s</SelectItem>
                      <SelectItem value="4s">4s</SelectItem>
                      <SelectItem value="6s">6s</SelectItem>
                      <SelectItem value="12s">12s</SelectItem>
                      <SelectItem value="18s">18s</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {postCoverplayCategory === "baccarat" && (
                  <Select value={postCoverplayType} onValueChange={setPostCoverplayType}>
                    <SelectTrigger id="postCoverplayType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Player">Player</SelectItem>
                      <SelectItem value="Banker">Banker</SelectItem>
                      <SelectItem value="Tie">Tie</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {postCoverplayCategory === "blackjack" && (
                  <Input
                    id="postCoverplayType"
                    value=""
                    disabled
                    placeholder="No types available"
                    className="bg-muted"
                  />
                )}
                {postCoverplayCategory === "slots" && (
                  <Select
                    value={postCoverplayRisk || "medium"}
                    onValueChange={(v) => setPostCoverplayRisk(v as RiskLevel)}
                  >
                    <SelectTrigger id="postCoverplayRisk">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_low">Very Low (0.25x)</SelectItem>
                      <SelectItem value="low">Low (0.5x)</SelectItem>
                      <SelectItem value="medium">Medium (1.0x)</SelectItem>
                      <SelectItem value="high">High (2.0x)</SelectItem>
                      <SelectItem value="very_high">Very High (4.0x)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {postCoverplayCategory === "digits" && (
                  <Select value={postCoverplayType} onValueChange={setPostCoverplayType}>
                    <SelectTrigger id="postCoverplayType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {digitsOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Line 2: Bet Size and Number of Spins */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postCoverplayBetSize">Bet Size ($)</Label>
                <Input
                  id="postCoverplayBetSize"
                  type="number"
                  step="0.01"
                  value={postCoverplayBetSize}
                  onChange={(e) => setPostCoverplayBetSize(Number(e.target.value))}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postCoverplayNumSpins">Number of Spins</Label>
                <Input
                  id="postCoverplayNumSpins"
                  type="number"
                  value={postCoverplayNumSpins}
                  onChange={(e) => setPostCoverplayNumSpins(Number(e.target.value))}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Line 3: House Edge */}
            <div className="space-y-2">
              <div className="relative">
                <Label htmlFor="postCoverplayHouseEdge">House Edge (%)</Label>
                <button
                  type="button"
                  onClick={() => setPostCoverplayHouseEdgeLocked(!postCoverplayHouseEdgeLocked)}
                  className="absolute top-0 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {postCoverplayHouseEdgeLocked ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                id="postCoverplayHouseEdge"
                type="number"
                step="0.01"
                disabled={postCoverplayHouseEdgeLocked}
                value={postCoverplayHouseEdge !== null ? postCoverplayHouseEdge : (getDefaultHouseEdge(postCoverplayGame) ?? "")}
                onChange={(e) =>
                  setPostCoverplayHouseEdge(e.target.value ? Number(e.target.value) : null)
                }
                placeholder={getDefaultHouseEdge(postCoverplayGame) !== null ? "" : "Variable"}
                className={postCoverplayHouseEdgeLocked ? "bg-muted cursor-not-allowed" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {getDefaultHouseEdge(postCoverplayGame) !== null 
                  ? `Default value (${getDefaultHouseEdge(postCoverplayGame)}%)`
                  : "Variable based on threshold"}
              </p>
            </div>
          </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable post-coverplay to add additional spins after main strategy to avoid casino detection.
              </p>
            </CardContent>
          )}
        </Card>
        )}
      </div>


      {/* SUBMIT BUTTON */}
      <div className="flex flex-col gap-4 mb-6">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="w-full md:w-auto md:px-12"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Simulation...
            </>
          ) : (
            "Run Simulation"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* RESULTS DISPLAY */}
      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Simulation Results</h2>
            <Badge variant={results.results.expected_value >= 0 ? "default" : "destructive"}>
              {results.results.expected_value >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              EV: {formatCurrency(results.results.expected_value)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expected Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(results.results.expected_value)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.results.expected_value >= 0 ? "Positive" : "Negative"} EV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bust Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatPercentage(results.results.bust_rate_percent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.results.bust_rate_percent < 10 ? "Low" : results.results.bust_rate_percent < 40 ? "Medium" : "High"} risk
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {results.results.average_time_minutes.toFixed(1)}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cash Per Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(results.results.cash_per_hour)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Hourly rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>95% Confidence Interval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lower Bound</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(results.results.confidence_interval_95.lower)}
                  </p>
                </div>
                <div className="text-center flex-1 px-4">
                  <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Upper Bound</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(results.results.confidence_interval_95.upper)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Sessions Completed</span>
                  <span className="font-medium">{results.results.sessions_completed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Standard Deviation</span>
                  <span className="font-medium">{formatCurrency(results.results.std_deviation)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Avg Wagered</span>
                  <span className="font-medium">{formatCurrency(results.results.total_wagered_average)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Execution Time</span>
                  <span className="font-medium">{results.execution_time_ms.toFixed(2)}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.warnings && results.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {results.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        currentConfig={globalConfig}
        onConfigUpdate={() => {
          // Reload config after update
          const loadConfig = async () => {
            try {
              const response = await fetch('/api/config');
              const data = await response.json();
              if (data.success && data.config) {
                setGlobalConfig(data.config);
              }
            } catch (err) {
              console.error('Failed to reload configuration:', err);
            }
          };
          loadConfig();
        }}
      />
    </div>
  );
}
