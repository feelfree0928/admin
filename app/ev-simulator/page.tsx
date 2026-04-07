"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle2, XCircle, Settings, Lock, LockOpen, ClipboardList } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { BonusConfigPanel } from "@/components/BonusConfigPanel";
import { GameConfigPanel } from "@/components/GameConfigPanel";
import { SimulationResults } from "@/components/SimulationResults";
import { SimulationProgress } from "@/components/SimulationProgress";
import { useGameConfig } from "@/hooks/useGameConfig";
import {
  getTimePerBetCategory,
  getHouseEdgeCategory,
  getDefaultHouseEdge as getDefaultHouseEdgeBase,
} from "@/lib/game-utils";
import { randomSimulationId } from "@/lib/utils";
import type {
  BonusType,
  CashbackType,
  SimulationMode,
  GameName,
  GameConfig,
  CoverplayConfig,
  BonusConfig,
  SimulationRequest,
  ApiResponse,
  SimulationProgress as SimulationProgressData,
} from "@/types/simulation";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EVSimulatorPage() {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Bonus state
  // ---------------------------------------------------------------------------
  const [bonusType, setBonusType] = useState<BonusType>("cashable");
  const [deposit, setDeposit] = useState<number>(100);
  const [bonusAmount, setBonusAmount] = useState<number>(100);
  const [wagering, setWagering] = useState<number>(3000);
  const [cashbackType, setCashbackType] = useState<CashbackType>("on_loss");
  const [cashbackAmount, setCashbackAmount] = useState<number>(0);
  const [targetBalance, setTargetBalance] = useState<number>(0);
  const [targetBalanceCalculationType, setTargetBalanceCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("deposit");
  const [targetBalanceMultiplier, setTargetBalanceMultiplier] = useState<number>(3);
  const [cashbackAmountCalculationType, setCashbackAmountCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("deposit");
  const [cashbackAmountMultiplier, setCashbackAmountMultiplier] = useState<number>(0.1);
  const [wagerTarget, setWagerTarget] = useState<number>(2000);
  const [cashbackRate, setCashbackRate] = useState<number>(0.1);
  const [cashbackCap, setCashbackCap] = useState<number>(50);
  const [cashbackAsBonus, setCashbackAsBonus] = useState<boolean>(false);
  const [cashbackWageringRequirement, setCashbackWageringRequirement] = useState<number>(0);
  const [applyBonusPlay, setApplyBonusPlay] = useState<boolean>(true);
  const [bonusWageringRequirement, setBonusWageringRequirement] = useState<number>(0);
  const [bonusWageringCalculationType, setBonusWageringCalculationType] = useState<"bonus" | "fixed">("bonus");
  const [bonusWageringMultiplier, setBonusWageringMultiplier] = useState<number>(1);
  const [applyCashbackBonusPlay, setApplyCashbackBonusPlay] = useState<boolean>(true);
  const [cashbackBonusWageringRequirement, setCashbackBonusWageringRequirement] = useState<number>(0);
  const [cashbackBonusWageringCalculationType, setCashbackBonusWageringCalculationType] = useState<"cashback" | "fixed">("cashback");
  const [cashbackBonusWageringMultiplier, setCashbackBonusWageringMultiplier] = useState<number>(1);
  const [freespinsCount, setFreespinsCount] = useState<number>(0);
  const [freespinsBetSize, setFreespinsBetSize] = useState<number>(0);
  const [freespinsRollover, setFreespinsRollover] = useState<boolean>(false);
  const [freespinsRolloverMultiplier, setFreespinsRolloverMultiplier] = useState<number>(1.0);
  const [maxCashout, setMaxCashout] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Game configurations (via hook)
  // ---------------------------------------------------------------------------
  const game1 = useGameConfig({ initialName: "european_1s", initialBetSize: 5.0, initialContribution: 100 });
  const [game1Weighting, setGame1Weighting] = useState<number>(100);

  const [game2Enabled, setGame2Enabled] = useState<boolean>(false);
  const game2 = useGameConfig({ initialName: "slots", initialBetSize: 2.0, initialContribution: 100 });
  const [game2Weighting, setGame2Weighting] = useState<number>(100);
  const [game2SwitchBalance, setGame2SwitchBalance] = useState<number>(400);
  const [switchBalanceCalculationType, setSwitchBalanceCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("bonus");
  const [switchBalanceMultiplier, setSwitchBalanceMultiplier] = useState<number>(4);

  const bonusGame1 = useGameConfig({ initialName: "bj", initialBetSize: 5, initialContribution: 100, initialRisk: "medium" });
  const [bonusGame2Enabled, setBonusGame2Enabled] = useState<boolean>(false);
  const bonusGame2 = useGameConfig({ initialName: "bj", initialBetSize: 5, initialContribution: 100, initialRisk: "medium" });
  const [bonusGame2SwitchBalance, setBonusGame2SwitchBalance] = useState<number>(400);
  const [bonusGame2SwitchBalanceCalculationType, setBonusGame2SwitchBalanceCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("bonus");
  const [bonusGame2SwitchBalanceMultiplier, setBonusGame2SwitchBalanceMultiplier] = useState<number>(4);

  const cashbackBonusGame1 = useGameConfig({ initialName: "bj", initialBetSize: 5, initialContribution: 100, initialRisk: "medium" });
  const [cashbackBonusGame2Enabled, setCashbackBonusGame2Enabled] = useState<boolean>(false);
  const cashbackBonusGame2 = useGameConfig({ initialName: "bj", initialBetSize: 5, initialContribution: 100, initialRisk: "medium" });
  const [cashbackBonusGame2SwitchBalance, setCashbackBonusGame2SwitchBalance] = useState<number>(400);
  const [cashbackBonusGame2SwitchBalanceCalculationType, setCashbackBonusGame2SwitchBalanceCalculationType] = useState<"deposit" | "bonus" | "both" | "fixed">("bonus");
  const [cashbackBonusGame2SwitchBalanceMultiplier, setCashbackBonusGame2SwitchBalanceMultiplier] = useState<number>(4);

  const preCoverplay = useGameConfig({ initialName: "slots", initialBetSize: 1.0 });
  const [preCoverplayEnabled, setPreCoverplayEnabled] = useState<boolean>(false);
  const [preCoverplayNumSpins, setPreCoverplayNumSpins] = useState<number>(10);

  const postCoverplay = useGameConfig({ initialName: "slots", initialBetSize: 1.0 });
  const [postCoverplayEnabled, setPostCoverplayEnabled] = useState<boolean>(false);
  const [postCoverplayNumSpins, setPostCoverplayNumSpins] = useState<number>(10);

  // ---------------------------------------------------------------------------
  // UI / simulation state
  // ---------------------------------------------------------------------------
  const [randomSeed, setRandomSeed] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [progress, setProgress] = useState<SimulationProgressData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simIdRef = useRef<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customSimCount, setCustomSimCount] = useState<string>("");
  const [simCountLocked, setSimCountLocked] = useState<boolean>(true);
  const [playerProfitEnabled, setPlayerProfitEnabled] = useState<boolean>(false);
  const [playerBaseProfit, setPlayerBaseProfit] = useState<number>(5);
  const [playerBonusPct, setPlayerBonusPct] = useState<number>(1);

  const effectiveSimCount = simCountLocked
    ? (globalConfig?.defaults?.numSessions ?? 1000000)
    : (parseInt(customSimCount, 10) || (globalConfig?.defaults?.numSessions ?? 1000000));

  // ---------------------------------------------------------------------------
  // Backend status + config
  // ---------------------------------------------------------------------------
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

  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus("checking");
      const isOnline = await testBackendConnection();
      setBackendStatus(isOnline ? "online" : "offline");
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("http://5.78.132.169:8000/api/config");
        const data = await response.json();
        if (data.success && data.config) setGlobalConfig(data.config);
      } catch (err) {
        console.error("Failed to load global configuration:", err);
      }
    };
    loadConfig();
  }, []);

  // Poll for simulation progress while loading (scoped to current sim_id)
  useEffect(() => {
    if (!loading) { setProgress(null); return; }
    const interval = setInterval(async () => {
      try {
        const id = simIdRef.current ?? "default";
        const res = await fetch(`http://5.78.132.169:8000/api/simulate/progress?sim_id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data: SimulationProgressData = await res.json();
          if (data.phase !== "idle") setProgress(data);
        }
      } catch { /* backend unreachable — skip this tick */ }
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const getDefaultTimePerBet = (gameName: GameName): number => {
    if (globalConfig?.defaults?.timePerBet) {
      const category = getTimePerBetCategory(gameName);
      const configValue = globalConfig.defaults.timePerBet[category];
      if (configValue !== undefined) return configValue;
    }
    return 3.0;
  };

  const getDefaultHouseEdge = (gameName: GameName): number | null =>
    getDefaultHouseEdgeBase(gameName, globalConfig);

  useEffect(() => {
    if (globalConfig?.defaults?.timePerBet) {
      game1.setTimePerBet(getDefaultTimePerBet(game1.name));
    }
  }, [globalConfig, game1.name]);

  useEffect(() => {
    if (globalConfig?.defaults?.timePerBet) {
      game2.setTimePerBet(getDefaultTimePerBet(game2.name));
    }
  }, [globalConfig, game2.name]);

  // Disable Two-Tier Strategy when bonus type doesn't support it
  useEffect(() => {
    if (bonusType !== "cashable" && bonusType !== "postwager" && bonusType !== "cashback" && game2Enabled) {
      setGame2Enabled(false);
    }
  }, [bonusType, game2Enabled]);

  // Target bust rate is only for deposit-style bonuses; force fixed bet for postwager / cashback / raw
  useEffect(() => {
    if (bonusType === "postwager" || bonusType === "cashback" || bonusType === "raw") {
      game1.setBetSizeMode("fixed");
    }
  }, [bonusType, game1.setBetSizeMode]);

  // ---------------------------------------------------------------------------
  // Calculated value effects
  // ---------------------------------------------------------------------------
  const calcSwitchBalance = () => {
    switch (switchBalanceCalculationType) {
      case "deposit": return deposit * switchBalanceMultiplier;
      case "bonus": return bonusAmount * switchBalanceMultiplier;
      case "both": return (deposit + bonusAmount) * switchBalanceMultiplier;
      case "fixed": return switchBalanceMultiplier;
      default: return deposit * switchBalanceMultiplier;
    }
  };

  const calculateBonusWageringRequirement = () =>
    bonusWageringCalculationType === "fixed" ? bonusWageringMultiplier : bonusAmount * bonusWageringMultiplier;

  const calculateCashbackBonusWageringRequirement = () => {
    if (cashbackBonusWageringCalculationType === "fixed") return cashbackBonusWageringMultiplier;
    return cashbackType === "fixed_wager"
      ? cashbackBonusWageringMultiplier
      : cashbackAmount * cashbackBonusWageringMultiplier;
  };

  const calculateTargetBalance = () => {
    switch (targetBalanceCalculationType) {
      case "deposit": return deposit * targetBalanceMultiplier;
      case "bonus": return bonusAmount * targetBalanceMultiplier;
      case "both": return (deposit + bonusAmount) * targetBalanceMultiplier;
      case "fixed": return targetBalanceMultiplier;
      default: return targetBalanceMultiplier;
    }
  };

  const calculateCashbackAmount = () => {
    switch (cashbackAmountCalculationType) {
      case "deposit": return deposit * cashbackAmountMultiplier;
      case "bonus": return bonusAmount * cashbackAmountMultiplier;
      case "both": return (deposit + bonusAmount) * cashbackAmountMultiplier;
      case "fixed": return cashbackAmountMultiplier;
      default: return cashbackAmountMultiplier;
    }
  };

  const calculateBonusGame2SwitchBalance = () => {
    switch (bonusGame2SwitchBalanceCalculationType) {
      case "deposit": return deposit * bonusGame2SwitchBalanceMultiplier;
      case "bonus": return bonusAmount * bonusGame2SwitchBalanceMultiplier;
      case "both": return (deposit + bonusAmount) * bonusGame2SwitchBalanceMultiplier;
      case "fixed": return bonusGame2SwitchBalanceMultiplier;
      default: return bonusAmount * bonusGame2SwitchBalanceMultiplier;
    }
  };

  const calculateCashbackBonusGame2SwitchBalance = () => {
    switch (cashbackBonusGame2SwitchBalanceCalculationType) {
      case "deposit": return deposit * cashbackBonusGame2SwitchBalanceMultiplier;
      case "bonus": return cashbackAmount * cashbackBonusGame2SwitchBalanceMultiplier;
      case "both": return (deposit + cashbackAmount) * cashbackBonusGame2SwitchBalanceMultiplier;
      case "fixed": return cashbackBonusGame2SwitchBalanceMultiplier;
      default: return cashbackAmount * cashbackBonusGame2SwitchBalanceMultiplier;
    }
  };

  useEffect(() => {
    if (game2Enabled) setGame2SwitchBalance(calcSwitchBalance());
  }, [switchBalanceCalculationType, switchBalanceMultiplier, deposit, bonusAmount, game2Enabled]);

  useEffect(() => {
    if (bonusType === "postwager") setBonusWageringRequirement(calculateBonusWageringRequirement());
    if (bonusType === "cashback") setCashbackBonusWageringRequirement(calculateCashbackBonusWageringRequirement());
  }, [bonusWageringCalculationType, bonusWageringMultiplier, deposit, bonusAmount, bonusType, cashbackBonusWageringCalculationType, cashbackBonusWageringMultiplier, cashbackType, cashbackRate, cashbackCap, cashbackAmount]);

  useEffect(() => {
    if (bonusGame2Enabled) setBonusGame2SwitchBalance(calculateBonusGame2SwitchBalance());
  }, [bonusGame2SwitchBalanceCalculationType, bonusGame2SwitchBalanceMultiplier, deposit, bonusAmount, bonusGame2Enabled]);

  useEffect(() => {
    if (cashbackBonusGame2Enabled) setCashbackBonusGame2SwitchBalance(calculateCashbackBonusGame2SwitchBalance());
  }, [cashbackBonusGame2SwitchBalanceCalculationType, cashbackBonusGame2SwitchBalanceMultiplier, deposit, cashbackAmount, cashbackBonusGame2Enabled]);

  useEffect(() => {
    setTargetBalance(calculateTargetBalance());
  }, [targetBalanceCalculationType, targetBalanceMultiplier, deposit, bonusAmount]);

  useEffect(() => {
    setCashbackAmount(calculateCashbackAmount());
  }, [cashbackAmountCalculationType, cashbackAmountMultiplier, deposit, bonusAmount]);

  useEffect(() => {
    if (cashbackType === "fixed_wager" && cashbackBonusWageringCalculationType !== "cashback") {
      setCashbackBonusWageringCalculationType("cashback");
    }
  }, [cashbackType, cashbackBonusWageringCalculationType]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validateForm = (): string | null => {
    if ((bonusType === "postwager" || bonusType === "cashback") && deposit <= 0)
      return "Deposit must be greater than 0";
    if (bonusType !== "raw" && bonusAmount < 0) return "Bonus amount cannot be negative";
    if (game1.betSizeMode === "fixed" && game1.betSize <= 0) return "Game 1 bet size must be greater than 0";
    if (game2Enabled && game2.betSize <= 0) return "Game 2 bet size must be greater than 0";
    if (game1.name === "digits" && !game1.digitsType)
      return "Digits type is required for Digits game (e.g., '10 & Under')";
    if (bonusType === "cashback" && cashbackType === "fixed_wager") {
      if (wagerTarget <= 0) return "Wager target must be greater than 0";
      if (cashbackRate <= 0 || cashbackRate > 1) return "Cashback rate must be between 0 and 1";
      if (cashbackCap <= 0) return "Cashback cap must be greater than 0";
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // API call
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    setResults(null);

    const isBackendOnline = await testBackendConnection();
    if (!isBackendOnline) {
      setError("Cannot connect to backend. Please ensure the Julia backend is running.");
      setLoading(false);
      return;
    }

    try {
      const bonusConfig: BonusConfig = {
        type: bonusType,
        deposit: bonusType === "cashback" && cashbackType === "fixed_wager" ? 100 : deposit,
        bonus_amount: bonusAmount,
      };

      if (bonusType !== "freespins" && bonusType !== "cashback") bonusConfig.wagering = wagering;

      if (bonusType === "cashback") {
        bonusConfig.cashback_type = cashbackType;
        if (cashbackType === "fixed_wager") {
          bonusConfig.wager_target = wagerTarget;
          bonusConfig.cashback_rate = cashbackRate;
          bonusConfig.cashback_cap = cashbackCap;
          bonusConfig.cashback_as_bonus = cashbackAsBonus;
          if (cashbackAsBonus && cashbackWageringRequirement > 0)
            bonusConfig.cashback_wagering_requirement = cashbackWageringRequirement;
        } else {
          bonusConfig.target_balance = targetBalance;
          bonusConfig.cashback_amount = cashbackAmount;
        }
      }

      if (bonusType === "sticky" && maxCashout !== null && maxCashout > 0)
        bonusConfig.max_cashout = maxCashout;

      if (bonusType === "freespins") {
        bonusConfig.freespins_count = freespinsCount;
        bonusConfig.freespins_bet_size = freespinsBetSize;
        bonusConfig.freespins_rollover = freespinsRollover;
        if (freespinsRollover) bonusConfig.freespins_rollover_multiplier = freespinsRolloverMultiplier;
      }

      if (bonusType === "postwager") {
        bonusConfig.apply_bonus_play = applyBonusPlay;
        if (applyBonusPlay) {
          bonusConfig.use_bonus_wagering_multiplier = false;
          bonusConfig.bonus_wagering_requirement = bonusWageringRequirement;
        }
      }

      if (bonusType === "cashback") {
        bonusConfig.apply_bonus_play = applyCashbackBonusPlay;
        if (applyCashbackBonusPlay) {
          if (cashbackType === "fixed_wager") {
            bonusConfig.use_bonus_wagering_multiplier = true;
            bonusConfig.bonus_wagering_multiplier = cashbackBonusWageringMultiplier;
          } else {
            bonusConfig.use_bonus_wagering_multiplier = false;
            bonusConfig.bonus_wagering_requirement = cashbackBonusWageringRequirement;
          }
        }
      }

      const isTargetBustRate =
        game1.betSizeMode === "target_bust_rate" &&
        bonusType !== "postwager" &&
        bonusType !== "cashback" &&
        bonusType !== "raw";

      const game1Config: GameConfig = {
        name: game1.name,
        bet_size: isTargetBustRate ? 1.0 : game1.betSize,
        time_per_bet: game1.timePerBet,
        game_weighting: game1Weighting,
      };
      if (game1.name === "slots" && game1.risk) game1Config.risk = game1.risk;
      if (game1.name === "digits" && game1.digitsType) game1Config.digits_type = game1.digitsType;
      if (game1.houseEdge !== null) game1Config.house_edge = game1.houseEdge;

      let game2Config: GameConfig | null = null;
      if (game2Enabled) {
        game2Config = {
          name: game2.name,
          bet_size: game2.betSize,
          time_per_bet: game2.timePerBet,
          game_weighting: game2Weighting,
          switch_balance: game2SwitchBalance,
        };
        if (game2.name === "slots" && game2.risk) game2Config.risk = game2.risk;
        if (game2.name === "digits" && game2.digitsType) game2Config.digits_type = game2.digitsType;
        if (game2.houseEdge !== null) game2Config.house_edge = game2.houseEdge;
      }

      let preCoverplayConfig: CoverplayConfig | undefined;
      if (preCoverplayEnabled) {
        preCoverplayConfig = {
          enabled: true,
          game: preCoverplay.name,
          bet_size: preCoverplay.betSize,
          num_spins: preCoverplayNumSpins,
        };
        if (preCoverplay.name === "slots" && preCoverplay.risk) preCoverplayConfig.risk = preCoverplay.risk;
        if (preCoverplay.houseEdge !== null) preCoverplayConfig.house_edge = preCoverplay.houseEdge;
      }

      let postCoverplayConfig: CoverplayConfig | undefined;
      if (postCoverplayEnabled) {
        postCoverplayConfig = {
          enabled: true,
          game: postCoverplay.name,
          bet_size: postCoverplay.betSize,
          num_spins: postCoverplayNumSpins,
        };
        if (postCoverplay.name === "slots" && postCoverplay.risk) postCoverplayConfig.risk = postCoverplay.risk;
        if (postCoverplay.houseEdge !== null) postCoverplayConfig.house_edge = postCoverplay.houseEdge;
      }

      const mode: SimulationMode = isTargetBustRate ? "optimal" : (game2Enabled ? "two_tier" : "standard");
      const currentSimId = randomSimulationId();
      simIdRef.current = currentSimId;

      const request: SimulationRequest = {
        mode,
        sim_id: currentSimId,
        bonus: bonusConfig,
        game1: game1Config,
        simulation: {
          num_sessions: effectiveSimCount,
          random_seed: randomSeed,
          ...(playerProfitEnabled && {
            player_profit_enabled: true,
            player_base_profit: playerBaseProfit,
            player_bonus_pct: playerBonusPct / 100,
          }),
        },
      };

      if (isTargetBustRate) {
        request.optimization = { target_bust_rate: game1.targetBustRate };
      }

      if (game2Config) request.game2 = game2Config;
      if (preCoverplayConfig) request.pre_coverplay = preCoverplayConfig;
      if (postCoverplayConfig) request.post_coverplay = postCoverplayConfig;

      if (bonusType === "postwager" && applyBonusPlay) {
        const bg1: GameConfig = {
          name: bonusGame1.name,
          bet_size: bonusGame1.betSize,
          time_per_bet: bonusGame1.timePerBet,
          game_weighting: bonusGame1.contribution,
        };
        if (bonusGame1.name === "slots" && bonusGame1.risk) bg1.risk = bonusGame1.risk;
        if (bonusGame1.name === "digits" && bonusGame1.digitsType) bg1.digits_type = bonusGame1.digitsType;
        if (bonusGame1.houseEdge !== null) bg1.house_edge = bonusGame1.houseEdge;
        request.bonus_game1 = bg1;

        if (bonusGame2Enabled) {
          const bg2: GameConfig = {
            name: bonusGame2.name,
            bet_size: bonusGame2.betSize,
            time_per_bet: bonusGame2.timePerBet,
            game_weighting: bonusGame2.contribution,
            switch_balance: bonusGame2SwitchBalance,
          };
          if (bonusGame2.name === "slots" && bonusGame2.risk) bg2.risk = bonusGame2.risk;
          if (bonusGame2.name === "digits" && bonusGame2.digitsType) bg2.digits_type = bonusGame2.digitsType;
          if (bonusGame2.houseEdge !== null) bg2.house_edge = bonusGame2.houseEdge;
          request.bonus_game2 = bg2;
        }
      }

      if (bonusType === "cashback" && applyCashbackBonusPlay) {
        const cbg1: GameConfig = {
          name: cashbackBonusGame1.name,
          bet_size: cashbackBonusGame1.betSize,
          time_per_bet: cashbackBonusGame1.timePerBet,
          game_weighting: cashbackBonusGame1.contribution,
        };
        if (cashbackBonusGame1.name === "slots" && cashbackBonusGame1.risk) cbg1.risk = cashbackBonusGame1.risk;
        if (cashbackBonusGame1.name === "digits" && cashbackBonusGame1.digitsType) cbg1.digits_type = cashbackBonusGame1.digitsType;
        if (cashbackBonusGame1.houseEdge !== null) cbg1.house_edge = cashbackBonusGame1.houseEdge;
        request.bonus_game1 = cbg1;

        if (cashbackBonusGame2Enabled) {
          const cbg2: GameConfig = {
            name: cashbackBonusGame2.name,
            bet_size: cashbackBonusGame2.betSize,
            time_per_bet: cashbackBonusGame2.timePerBet,
            game_weighting: cashbackBonusGame2.contribution,
            switch_balance: cashbackBonusGame2SwitchBalance,
          };
          if (cashbackBonusGame2.name === "slots" && cashbackBonusGame2.risk) cbg2.risk = cashbackBonusGame2.risk;
          if (cashbackBonusGame2.name === "digits" && cashbackBonusGame2.digitsType) cbg2.digits_type = cashbackBonusGame2.digitsType;
          if (cashbackBonusGame2.houseEdge !== null) cbg2.house_edge = cashbackBonusGame2.houseEdge;
          request.bonus_game2 = cbg2;
        }
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("http://5.78.132.169:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        if (response.status === 404)
          errorMessage += ". Is the backend running on http://5.78.132.169:8000?";
        throw new Error(errorMessage);
      }

      const data: ApiResponse = await response.json();
      if ((data as { status?: string }).status === "cancelled") {
        return; // simulation was stopped — do nothing
      }
      setResults(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // user cancelled — do nothing
      }
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      simIdRef.current = null;
    }
  };

  const handleCancel = async () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    try {
      const id = simIdRef.current ?? "default";
      await fetch(`http://5.78.132.169:8000/api/simulate?sim_id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch { /* ignore */ }
    simIdRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // Bonus wagering extra-panel (shown alongside Game 1 for postwager/cashback)
  // ---------------------------------------------------------------------------
  const postwagerBonusPanel = bonusType === "postwager" ? (
    <div className="mt-6 p-4 border-2 border-gray dark:border-white rounded-md space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="applyBonusPlay" checked={applyBonusPlay} onCheckedChange={(c) => setApplyBonusPlay(c === true)} />
        <Label htmlFor="applyBonusPlay" className="text-sm font-medium">Apply Bonus Play</Label>
      </div>
      {applyBonusPlay && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">Bonus Wagering ($):</span>
            <span className="text-xl font-semibold text-red-600 dark:text-red-400">
              {(() => { const v = calculateBonusWageringRequirement(); return Number.isInteger(v) ? v.toString() : v.toFixed(2); })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={bonusWageringCalculationType} onValueChange={(v) => setBonusWageringCalculationType(v as "bonus" | "fixed")}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-lg">✕</span>
            <Input
              type="number" step="1" min="1" value={bonusWageringMultiplier} className="w-[120px]"
              onChange={(e) => { const v = Number(e.target.value); if (v > 0 && v <= 99999) setBonusWageringMultiplier(v); }}
            />
          </div>
        </div>
      )}
    </div>
  ) : null;

  const cashbackBonusPanel = bonusType === "cashback" ? (
    <div className="mt-6 p-4 border-2 border-gray dark:border-white rounded-md space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="applyCashbackBonusPlay" checked={applyCashbackBonusPlay} onCheckedChange={(c) => setApplyCashbackBonusPlay(c === true)} />
        <Label htmlFor="applyCashbackBonusPlay" className="text-sm font-medium">Apply Bonus Play</Label>
      </div>
      {applyCashbackBonusPlay && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">Bonus Wagering ($):</span>
            <span className="text-xl font-semibold text-red-600 dark:text-red-400">
              {cashbackType === "fixed_wager" ? "Cashback" : (() => { const v = calculateCashbackBonusWageringRequirement(); return Number.isInteger(v) ? v.toString() : v.toFixed(2); })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {cashbackType !== "fixed_wager" ? (
              <Select value={cashbackBonusWageringCalculationType} onValueChange={(v) => setCashbackBonusWageringCalculationType(v as "cashback" | "fixed")}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            ) : <span className="w-[120px]" />}
            <span className="text-lg">✕</span>
            <Input
              type="number" step="1" min="1" value={cashbackBonusWageringMultiplier} className="w-[120px]"
              onChange={(e) => { const v = Number(e.target.value); if (v > 0 && v <= 99999) setCashbackBonusWageringMultiplier(v); }}
            />
          </div>
        </div>
      )}
    </div>
  ) : null;

  const game1ExtraPanel = postwagerBonusPanel ?? cashbackBonusPanel;
  const isWideLayout = bonusType === "postwager" || bonusType === "cashback";

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold mb-2">EV Casino Simulator</h1>
            <p className="text-muted-foreground">Monte Carlo simulation for casino bonus optimization</p>
          </div>
          <div className="flex items-center gap-2">
            {backendStatus === "checking" && (
              <Badge variant="outline" className="gap-2"><Loader2 className="h-3 w-3 animate-spin" />Checking backend...</Badge>
            )}
            {backendStatus === "online" && (
              <Badge variant="default" className="gap-2 bg-green-600"><CheckCircle2 className="h-3 w-3" />Backend Online</Badge>
            )}
            {backendStatus === "offline" && (
              <Badge variant="destructive" className="gap-2"><XCircle className="h-3 w-3" />Backend Offline</Badge>
            )}
            <Button variant="outline" size="icon" onClick={() => router.push("/ev-simulator/log")} title="View Logs">
              <ClipboardList className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowSettingsModal(true)} title="Global Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {backendStatus === "offline" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cannot connect to backend at http://5.78.132.169:8000. Please ensure the Julia backend is running.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Bonus Configuration */}
      <BonusConfigPanel
        bonusType={bonusType} setBonusType={setBonusType}
        deposit={deposit} setDeposit={setDeposit}
        bonusAmount={bonusAmount} setBonusAmount={setBonusAmount}
        wagering={wagering} setWagering={setWagering}
        cashbackType={cashbackType} setCashbackType={setCashbackType}
        calculateTargetBalance={calculateTargetBalance}
        targetBalanceCalculationType={targetBalanceCalculationType}
        setTargetBalanceCalculationType={setTargetBalanceCalculationType}
        targetBalanceMultiplier={targetBalanceMultiplier}
        setTargetBalanceMultiplier={setTargetBalanceMultiplier}
        calculateCashbackAmount={calculateCashbackAmount}
        cashbackAmountCalculationType={cashbackAmountCalculationType}
        setCashbackAmountCalculationType={setCashbackAmountCalculationType}
        cashbackAmountMultiplier={cashbackAmountMultiplier}
        setCashbackAmountMultiplier={setCashbackAmountMultiplier}
        wagerTarget={wagerTarget} setWagerTarget={setWagerTarget}
        cashbackRate={cashbackRate} setCashbackRate={setCashbackRate}
        cashbackCap={cashbackCap} setCashbackCap={setCashbackCap}
        maxCashout={maxCashout} setMaxCashout={setMaxCashout}
        freespinsCount={freespinsCount} setFreespinsCount={setFreespinsCount}
        freespinsBetSize={freespinsBetSize} setFreespinsBetSize={setFreespinsBetSize}
        freespinsRollover={freespinsRollover} setFreespinsRollover={setFreespinsRollover}
        freespinsRolloverMultiplier={freespinsRolloverMultiplier} setFreespinsRolloverMultiplier={setFreespinsRolloverMultiplier}
      />

      {/* Cash Play Configuration */}
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game 1 */}
          <GameConfigPanel
            id="game1"
            label={isWideLayout ? "Game 1 (Cash Play)" : "Game 1"}
            config={game1}
            getDefaultHouseEdge={getDefaultHouseEdge}
            className={isWideLayout ? "lg:col-span-2" : ""}
            wideLayout={isWideLayout}
            showWeighting
            weighting={game1Weighting}
            onWeightingChange={setGame1Weighting}
            extraPanel={game1ExtraPanel}
            allowTargetBustRate={
              !game2Enabled &&
              bonusType !== "postwager" &&
              bonusType !== "cashback" &&
              bonusType !== "raw"
            }
          />

          {/* Game 2 */}
          {bonusType !== "postwager" && bonusType !== "cashback" && (
            <GameConfigPanel
              id="game2"
              label="Game 2"
              config={game2}
              getDefaultHouseEdge={getDefaultHouseEdge}
              showWeighting
              weighting={game2Weighting}
              onWeightingChange={setGame2Weighting}
              enabled={game2Enabled}
              onToggleEnabled={setGame2Enabled}
              toggleLabel="Enable Two-Tier Strategy"
              toggleDisabled={bonusType !== "cashable"}
              disabledMessage="Enable two-tier strategy to switch from Game 1 to Game 2 at a specific balance threshold."
              switchBalance={{
                value: game2SwitchBalance,
                calcType: switchBalanceCalculationType,
                setCalcType: (v) => setSwitchBalanceCalculationType(v as any),
                multiplier: switchBalanceMultiplier,
                setMultiplier: setSwitchBalanceMultiplier,
              }}
            />
          )}
        </div>
      </div>

      {/* Post-Wager Bonus Play section */}
      {bonusType === "postwager" && applyBonusPlay && (
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GameConfigPanel
              id="bonusGame1"
              label="Game 1 Bonus (Bonus Play)"
              config={bonusGame1}
              getDefaultHouseEdge={getDefaultHouseEdge}
              showWeighting
              weighting={bonusGame1.contribution}
              onWeightingChange={bonusGame1.setContribution}
            />
            <GameConfigPanel
              id="bonusGame2"
              label="Game 2 Bonus (Bonus Play)"
              config={bonusGame2}
              getDefaultHouseEdge={getDefaultHouseEdge}
              showWeighting
              weighting={bonusGame2.contribution}
              onWeightingChange={bonusGame2.setContribution}
              enabled={bonusGame2Enabled}
              onToggleEnabled={setBonusGame2Enabled}
              toggleLabel="Enable Two-Tier Strategy"
              disabledMessage="Enable two-tier strategy to switch from Game 1 Bonus to Game 2 Bonus at a specific balance threshold."
              switchBalance={{
                value: bonusGame2SwitchBalance,
                calcType: bonusGame2SwitchBalanceCalculationType,
                setCalcType: (v) => setBonusGame2SwitchBalanceCalculationType(v as any),
                multiplier: bonusGame2SwitchBalanceMultiplier,
                setMultiplier: setBonusGame2SwitchBalanceMultiplier,
                description: "Balance threshold to switch from Game 1 Bonus to Game 2 Bonus",
              }}
            />
          </div>
        </div>
      )}

      {/* Cashback Bonus Play section */}
      {bonusType === "cashback" && applyCashbackBonusPlay && (
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GameConfigPanel
              id="cashbackBonusGame1"
              label="Game 1 Bonus (Bonus Play)"
              config={cashbackBonusGame1}
              getDefaultHouseEdge={getDefaultHouseEdge}
              showWeighting
              weighting={cashbackBonusGame1.contribution}
              onWeightingChange={cashbackBonusGame1.setContribution}
            />
            <GameConfigPanel
              id="cashbackBonusGame2"
              label="Game 2 Bonus (Bonus Play)"
              config={cashbackBonusGame2}
              getDefaultHouseEdge={getDefaultHouseEdge}
              showWeighting
              weighting={cashbackBonusGame2.contribution}
              onWeightingChange={cashbackBonusGame2.setContribution}
              enabled={cashbackBonusGame2Enabled}
              onToggleEnabled={setCashbackBonusGame2Enabled}
              toggleLabel="Enable Two-Tier Strategy"
              disabledMessage="Enable two-tier strategy to switch from Game 1 Bonus to Game 2 Bonus at a specific balance threshold."
              switchBalance={{
                value: cashbackBonusGame2SwitchBalance,
                calcType: cashbackBonusGame2SwitchBalanceCalculationType,
                setCalcType: (v) => setCashbackBonusGame2SwitchBalanceCalculationType(v as any),
                multiplier: cashbackBonusGame2SwitchBalanceMultiplier,
                setMultiplier: setCashbackBonusGame2SwitchBalanceMultiplier,
                description: "Balance threshold to switch from Game 1 Bonus to Game 2 Bonus",
              }}
            />
          </div>
        </div>
      )}

      {/* Coverplay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {globalConfig?.features?.preCoverplayEnabled && (
          <GameConfigPanel
            id="preCoverplay"
            label="Pre-Coverplay"
            config={preCoverplay}
            getDefaultHouseEdge={getDefaultHouseEdge}
            isSpinMode
            numSpins={preCoverplayNumSpins}
            onNumSpinsChange={setPreCoverplayNumSpins}
            enabled={preCoverplayEnabled}
            onToggleEnabled={setPreCoverplayEnabled}
            toggleLabel="Enable Pre-Coverplay"
            disabledMessage="Enable pre-coverplay to add additional spins before main strategy to avoid casino detection."
          />
        )}
        {globalConfig?.features?.postCoverplayEnabled && (
          <GameConfigPanel
            id="postCoverplay"
            label="Post-Coverplay"
            config={postCoverplay}
            getDefaultHouseEdge={getDefaultHouseEdge}
            isSpinMode
            numSpins={postCoverplayNumSpins}
            onNumSpinsChange={setPostCoverplayNumSpins}
            enabled={postCoverplayEnabled}
            onToggleEnabled={setPostCoverplayEnabled}
            toggleLabel="Enable Post-Coverplay"
            disabledMessage="Enable post-coverplay to add additional spins after main strategy to avoid casino detection."
          />
        )}
      </div>

      {/* Simulations + Submit */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
          <Label className="text-sm font-medium whitespace-nowrap">Simulations</Label>
          <Input
            type="number"
            disabled={simCountLocked}
            value={simCountLocked
              ? String(globalConfig?.defaults?.numSessions ?? 1000000)
              : customSimCount}
            onChange={(e) => setCustomSimCount(e.target.value)}
            className="w-40 text-right"
            min={1000}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!simCountLocked) setCustomSimCount("");
              setSimCountLocked((prev) => !prev);
            }}
          >
            {simCountLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            <span className="ml-1 text-xs">{simCountLocked ? "Locked" : "Custom"}</span>
          </Button>
          {!simCountLocked && (
            <span className="text-xs text-muted-foreground">
              Default: {(globalConfig?.defaults?.numSessions ?? 1000000).toLocaleString()}
            </span>
          )}
        </div>
        {/* Player Profit row */}
        <div className="flex flex-wrap items-center gap-3 p-3 border rounded-md bg-muted/30">
          <div className="flex items-center gap-2">
            <Checkbox
              id="playerProfitEnabled"
              checked={playerProfitEnabled}
              onCheckedChange={(v) => setPlayerProfitEnabled(!!v)}
            />
            <Label htmlFor="playerProfitEnabled" className="text-sm font-medium whitespace-nowrap cursor-pointer">
              Player Profit
            </Label>
          </div>
          {playerProfitEnabled && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Base $</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={playerBaseProfit}
                  onChange={(e) => setPlayerBaseProfit(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Bonus %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={playerBonusPct}
                  onChange={(e) => setPlayerBonusPct(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right"
                />
                <span className="text-xs text-muted-foreground">of profit on wins</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1" size="lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running Simulation...</> : "Run Simulation"}
          </Button>
          {loading && (
            <Button variant="destructive" size="lg" onClick={handleCancel}>
              Stop
            </Button>
          )}
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Live progress */}
      {loading && <SimulationProgress progress={progress} />}

      {/* Results */}
      {results && (
        <SimulationResults results={results} globalConfig={globalConfig} wagering={wagering} />
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        currentConfig={globalConfig}
        onConfigUpdate={() => {
          const loadConfig = async () => {
            try {
              const response = await fetch("http://5.78.132.169:8000/api/config");
              const data = await response.json();
              if (data.success && data.config) setGlobalConfig(data.config);
            } catch (err) {
              console.error("Failed to reload configuration:", err);
            }
          };
          loadConfig();
        }}
      />
    </div>
  );
}
