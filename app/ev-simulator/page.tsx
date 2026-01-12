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
import { Loader2, ChevronDown, AlertCircle, TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS (matching backend API from src/Types.jl and src/RequestParser.jl)
// ============================================================================

type BonusType = "cashable" | "postwager" | "cashback" | "sticky" | "freespins" | "raw";
type CashbackType = "on_win" | "on_loss" | "both" | "fixed_wager";
type SimulationMode = "standard" | "two_tier";
type GameName = "bj" | "european_1s" | "european_12s" | "european_18s" | "american_18s" | "french_18s" | "slots" | "digits";
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
  const [cashableOnLoss, setCashableOnLoss] = useState<boolean>(false);
  const [freespinsCount, setFreespinsCount] = useState<number>(0);
  const [freespinsBetSize, setFreespinsBetSize] = useState<number>(0);
  const [freespinsRollover, setFreespinsRollover] = useState<boolean>(false);
  const [freespinsRolloverMultiplier, setFreespinsRolloverMultiplier] = useState<number>(1.0);
  const [maxCashout, setMaxCashout] = useState<number | null>(null);

  // Game 1 state
  const [game1Name, setGame1Name] = useState<GameName>("bj");
  const [game1BetSize, setGame1BetSize] = useState<number>(5.0);
  const [game1TimePerBet, setGame1TimePerBet] = useState<number>(3.0);
  const [game1Weighting, setGame1Weighting] = useState<number>(100.0);
  const [game1HouseEdge, setGame1HouseEdge] = useState<number | null>(null);
  const [game1DigitsType, setGame1DigitsType] = useState<string>("");
  const [game1Risk, setGame1Risk] = useState<RiskLevel | null>(null);
  const [game1HouseEdgeEnabled, setGame1HouseEdgeEnabled] = useState<boolean>(false);

  // Game 2 state
  const [game2Enabled, setGame2Enabled] = useState<boolean>(false);
  const [game2Name, setGame2Name] = useState<GameName>("slots");
  const [game2BetSize, setGame2BetSize] = useState<number>(2.0);
  const [game2TimePerBet, setGame2TimePerBet] = useState<number>(3.0);
  const [game2Weighting, setGame2Weighting] = useState<number>(100.0);
  const [game2SwitchBalance, setGame2SwitchBalance] = useState<number>(400);
  const [game2HouseEdge, setGame2HouseEdge] = useState<number | null>(null);
  const [game2DigitsType, setGame2DigitsType] = useState<string>("");
  const [game2Risk, setGame2Risk] = useState<RiskLevel | null>(null);
  const [game2HouseEdgeEnabled, setGame2HouseEdgeEnabled] = useState<boolean>(false);

  // Pre-coverplay state
  const [preCoverplayEnabled, setPreCoverplayEnabled] = useState<boolean>(false);
  const [preCoverplayGame, setPreCoverplayGame] = useState<GameName>("slots");
  const [preCoverplayBetSize, setPreCoverplayBetSize] = useState<number>(1.0);
  const [preCoverplayNumSpins, setPreCoverplayNumSpins] = useState<number>(10);
  const [preCoverplayRisk, setPreCoverplayRisk] = useState<RiskLevel | null>(null);
  const [preCoverplayHouseEdge, setPreCoverplayHouseEdge] = useState<number | null>(null);
  const [preCoverplayHouseEdgeEnabled, setPreCoverplayHouseEdgeEnabled] = useState<boolean>(false);

  // Post-coverplay state
  const [postCoverplayEnabled, setPostCoverplayEnabled] = useState<boolean>(false);
  const [postCoverplayGame, setPostCoverplayGame] = useState<GameName>("slots");
  const [postCoverplayBetSize, setPostCoverplayBetSize] = useState<number>(1.0);
  const [postCoverplayNumSpins, setPostCoverplayNumSpins] = useState<number>(10);
  const [postCoverplayRisk, setPostCoverplayRisk] = useState<RiskLevel | null>(null);
  const [postCoverplayHouseEdge, setPostCoverplayHouseEdge] = useState<number | null>(null);
  const [postCoverplayHouseEdgeEnabled, setPostCoverplayHouseEdgeEnabled] = useState<boolean>(false);

  // Simulation parameters
  const [numSessions, setNumSessions] = useState<number>(1000000);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

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
      european_1s: "European Roulette (Single)",
      european_12s: "European Roulette (Column/Dozen)",
      european_18s: "European Roulette (Red/Black)",
      american_18s: "American Roulette (Red/Black)",
      french_18s: "French Roulette (Red/Black)",
      slots: "Slots",
      digits: "Digits",
    };
    return gameNames[gameName] || gameName;
  };

  const validateForm = (): string | null => {
    if (deposit <= 0) return "Deposit must be greater than 0";
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
        "Cannot connect to backend."
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

      if (bonusType === "cashable") {
        bonusConfig.cashable_on_loss = cashableOnLoss;
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

      if (game1HouseEdgeEnabled && game1HouseEdge !== null) {
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

        if (game2HouseEdgeEnabled && game2HouseEdge !== null) {
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

        if (preCoverplayHouseEdgeEnabled && preCoverplayHouseEdge !== null) {
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

        if (postCoverplayHouseEdgeEnabled && postCoverplayHouseEdge !== null) {
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
          num_sessions: numSessions,
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
          </div>
        </div>
        {backendStatus === "offline" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot connect to backend.
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
                  <SelectItem value="cashable">Cashable</SelectItem>
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

          {/* CASHABLE SPECIFIC */}
          {bonusType === "cashable" && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="cashableOnLoss"
                checked={cashableOnLoss}
                onCheckedChange={(checked) => setCashableOnLoss(checked as boolean)}
              />
              <Label htmlFor="cashableOnLoss" className="font-normal cursor-pointer">
                Bonus only awarded on loss (cashable_on_loss)
              </Label>
            </div>
          )}

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
            <CardTitle>Game 1 Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game1Name">Game</Label>
              <Select value={game1Name} onValueChange={(v) => setGame1Name(v as GameName)}>
                <SelectTrigger id="game1Name">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bj">Blackjack</SelectItem>
                  <SelectItem value="european_1s">European Roulette (Single)</SelectItem>
                  <SelectItem value="european_12s">European Roulette (Column/Dozen)</SelectItem>
                  <SelectItem value="european_18s">European Roulette (Red/Black)</SelectItem>
                  <SelectItem value="american_18s">American Roulette (Red/Black)</SelectItem>
                  <SelectItem value="french_18s">French Roulette (Red/Black)</SelectItem>
                  <SelectItem value="slots">Slots</SelectItem>
                  <SelectItem value="digits">Digits</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {/* SLOTS SPECIFIC */}
          {game1Name === "slots" && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="game1Risk">Risk Level</Label>
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
            </div>
          )}

          {/* DIGITS SPECIFIC */}
          {game1Name === "digits" && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="game1DigitsType">Digits Type (e.g., &quot;10 & Under&quot;)</Label>
              <Input
                id="game1DigitsType"
                type="text"
                value={game1DigitsType}
                onChange={(e) => setGame1DigitsType(e.target.value)}
                placeholder="10 & Under"
              />
            </div>
          )}

          {/* HOUSE EDGE OVERRIDE */}
          <Collapsible open={game1HouseEdgeEnabled} onOpenChange={setGame1HouseEdgeEnabled}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4" />
              Custom House Edge
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-2">
              <Label htmlFor="game1HouseEdge">House Edge (%)</Label>
              <Input
                id="game1HouseEdge"
                type="number"
                step="0.01"
                value={game1HouseEdge || ""}
                onChange={(e) => setGame1HouseEdge(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g., 2.0"
              />
              <p className="text-xs text-muted-foreground">
                Override the default house edge for this game
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* GAME 2 CONFIGURATION */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Game 2 Configuration</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="game2Enabled"
                checked={game2Enabled}
                onCheckedChange={(checked) => setGame2Enabled(checked as boolean)}
              />
              <Label htmlFor="game2Enabled" className="font-normal cursor-pointer">
                Enable Two-Tier Strategy
              </Label>
            </div>
          </div>
        </CardHeader>
        {game2Enabled ? (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game2Name">Game</Label>
                  <Select value={game2Name} onValueChange={(v) => setGame2Name(v as GameName)}>
                    <SelectTrigger id="game2Name">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bj">Blackjack</SelectItem>
                      <SelectItem value="european_1s">European Roulette (Single)</SelectItem>
                      <SelectItem value="european_12s">
                        European Roulette (Column/Dozen)
                      </SelectItem>
                      <SelectItem value="european_18s">European Roulette (Red/Black)</SelectItem>
                      <SelectItem value="american_18s">American Roulette (Red/Black)</SelectItem>
                      <SelectItem value="french_18s">French Roulette (Red/Black)</SelectItem>
                      <SelectItem value="slots">Slots</SelectItem>
                      <SelectItem value="digits">Digits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label htmlFor="game2SwitchBalance">Switch Balance ($)</Label>
                  <Input
                    id="game2SwitchBalance"
                    type="number"
                    value={game2SwitchBalance}
                    onChange={(e) => setGame2SwitchBalance(Number(e.target.value))}
                    placeholder="400"
                  />
                </div>
              </div>

              {/* SLOTS SPECIFIC */}
              {game2Name === "slots" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="game2Risk">Risk Level</Label>
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
                </div>
              )}

              {/* DIGITS SPECIFIC */}
              {game2Name === "digits" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="game2DigitsType">
                    Digits Type (e.g., &quot;20 & Over&quot;)
                  </Label>
                  <Input
                    id="game2DigitsType"
                    type="text"
                    value={game2DigitsType}
                    onChange={(e) => setGame2DigitsType(e.target.value)}
                    placeholder="20 & Over"
                  />
                </div>
              )}

              {/* HOUSE EDGE OVERRIDE */}
              <Collapsible open={game2HouseEdgeEnabled} onOpenChange={setGame2HouseEdgeEnabled}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Custom House Edge
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-2">
                  <Label htmlFor="game2HouseEdge">House Edge (%)</Label>
                  <Input
                    id="game2HouseEdge"
                    type="number"
                    step="0.01"
                    value={game2HouseEdge || ""}
                    onChange={(e) =>
                      setGame2HouseEdge(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="e.g., 2.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Override the default house edge for this game
                  </p>
                </CollapsibleContent>
              </Collapsible>
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
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pre-Coverplay (Anti-Detection)</CardTitle>
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
              <p className="text-sm text-muted-foreground mb-4">
                Additional spins before main strategy to avoid casino detection
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preCoverplayGame">Game</Label>
                  <Select
                    value={preCoverplayGame}
                    onValueChange={(v) => setPreCoverplayGame(v as GameName)}
                  >
                    <SelectTrigger id="preCoverplayGame">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bj">Blackjack</SelectItem>
                      <SelectItem value="european_1s">European Roulette (Single)</SelectItem>
                      <SelectItem value="european_12s">
                        European Roulette (Column/Dozen)
                      </SelectItem>
                      <SelectItem value="european_18s">European Roulette (Red/Black)</SelectItem>
                      <SelectItem value="american_18s">American Roulette (Red/Black)</SelectItem>
                      <SelectItem value="french_18s">French Roulette (Red/Black)</SelectItem>
                      <SelectItem value="slots">Slots</SelectItem>
                      <SelectItem value="digits">Digits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

              {preCoverplayGame === "slots" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="preCoverplayRisk">Risk Level</Label>
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
                </div>
              )}

              <Collapsible
                open={preCoverplayHouseEdgeEnabled}
                onOpenChange={setPreCoverplayHouseEdgeEnabled}
              >
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Custom House Edge
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-2">
                  <Label htmlFor="preCoverplayHouseEdge">House Edge (%)</Label>
                  <Input
                    id="preCoverplayHouseEdge"
                    type="number"
                    step="0.01"
                    value={preCoverplayHouseEdge || ""}
                    onChange={(e) =>
                      setPreCoverplayHouseEdge(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="e.g., 2.0"
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable pre-coverplay to add additional spins before main strategy to avoid casino detection.
              </p>
            </CardContent>
          )}
        </Card>

        {/* POST-COVERPLAY CONFIGURATION */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Post-Coverplay (Anti-Detection)</CardTitle>
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
              <p className="text-sm text-muted-foreground mb-4">
                Additional spins after main strategy to avoid casino detection
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postCoverplayGame">Game</Label>
                  <Select
                    value={postCoverplayGame}
                    onValueChange={(v) => setPostCoverplayGame(v as GameName)}
                  >
                    <SelectTrigger id="postCoverplayGame">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bj">Blackjack</SelectItem>
                      <SelectItem value="european_1s">European Roulette (Single)</SelectItem>
                      <SelectItem value="european_12s">
                        European Roulette (Column/Dozen)
                      </SelectItem>
                      <SelectItem value="european_18s">European Roulette (Red/Black)</SelectItem>
                      <SelectItem value="american_18s">American Roulette (Red/Black)</SelectItem>
                      <SelectItem value="french_18s">French Roulette (Red/Black)</SelectItem>
                      <SelectItem value="slots">Slots</SelectItem>
                      <SelectItem value="digits">Digits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

              {postCoverplayGame === "slots" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="postCoverplayRisk">Risk Level</Label>
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
                </div>
              )}

              <Collapsible
                open={postCoverplayHouseEdgeEnabled}
                onOpenChange={setPostCoverplayHouseEdgeEnabled}
              >
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Custom House Edge
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-2">
                  <Label htmlFor="postCoverplayHouseEdge">House Edge (%)</Label>
                  <Input
                    id="postCoverplayHouseEdge"
                    type="number"
                    step="0.01"
                    value={postCoverplayHouseEdge || ""}
                    onChange={(e) =>
                      setPostCoverplayHouseEdge(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="e.g., 2.0"
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable post-coverplay to add additional spins after main strategy to avoid casino detection.
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* SIMULATION PARAMETERS */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numSessions">Number of Sessions</Label>
              <Input
                id="numSessions"
                type="number"
                value={numSessions}
                onChange={(e) => setNumSessions(Number(e.target.value))}
                placeholder="1000000"
              />
              <p className="text-xs text-muted-foreground">
                Higher values = more accurate results but slower
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="randomSeed">Random Seed (optional)</Label>
              <Input
                id="randomSeed"
                type="number"
                value={randomSeed || ""}
                onChange={(e) => setRandomSeed(e.target.value ? Number(e.target.value) : null)}
                placeholder="Leave empty for random"
              />
              <p className="text-xs text-muted-foreground">For reproducible results</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
