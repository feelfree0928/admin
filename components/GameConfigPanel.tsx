"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Unlock } from "lucide-react";
import type { GameName, GameCategory, RiskLevel } from "@/types/simulation";
import type { GameConfig } from "@/hooks/useGameConfig";
import { getDefaultGameType, digitsSelectionOptions } from "@/lib/game-utils";

interface SwitchBalanceProps {
  value: number;
  calcType: string;
  setCalcType: (t: string) => void;
  multiplier: number;
  setMultiplier: (n: number) => void;
  description?: string;
}

interface GameConfigPanelProps {
  /** Unique id prefix used for htmlFor attributes */
  id: string;
  /** Card header title */
  label: string;
  /** Game state object from useGameConfig */
  config: GameConfig;
  /** Function to resolve default house edge for a game name */
  getDefaultHouseEdge: (name: GameName) => number | null;

  /** Additional CSS classes for the Card */
  className?: string;

  /** When true, renders 4-column top row with bet/time inline (postwager/cashback game1) */
  wideLayout?: boolean;

  /** Show a Game Weighting field */
  showWeighting?: boolean;
  weighting?: number;
  onWeightingChange?: (n: number) => void;

  /** Coverplay mode: replace Time Per Bet with Number of Spins */
  isSpinMode?: boolean;
  numSpins?: number;
  onNumSpinsChange?: (n: number) => void;

  /** Optional enable/disable toggle in the card header */
  enabled?: boolean;
  onToggleEnabled?: (b: boolean) => void;
  toggleLabel?: string;
  toggleDisabled?: boolean;
  /** Message shown when the card is toggled off */
  disabledMessage?: string;

  /** Switch balance section (game 2 variants) */
  switchBalance?: SwitchBalanceProps;

  /** Slot for extra content next to weighting/house-edge row (e.g. bonus wagering panel) */
  extraPanel?: React.ReactNode;

  /** When true, shows Fixed / Target mode toggle on Game 1's bet size row (omit for Post-Wager / Cashback / Raw). */
  allowTargetBustRate?: boolean;
}

// ---------------------------------------------------------------------------
// Selection sub-component (game type / risk / digits)
// ---------------------------------------------------------------------------
function GameTypeSelector({
  id,
  category,
  type,
  risk,
  onTypeChange,
  onRiskChange,
}: {
  id: string;
  category: GameCategory;
  type: string;
  risk: RiskLevel | null;
  onTypeChange: (t: string) => void;
  onRiskChange: (r: RiskLevel | null) => void;
}) {
  if (
    category === "european_roulette" ||
    category === "american_roulette" ||
    category === "french_roulette"
  ) {
    return (
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger id={`${id}Type`}>
          <SelectValue placeholder="Select bet type" />
        </SelectTrigger>
        <SelectContent>
          {["1s", "2s", "3s", "4s", "6s", "12s", "18s"].map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (category === "baccarat") {
    return (
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger id={`${id}Type`}>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Player">Player</SelectItem>
          <SelectItem value="Banker">Banker</SelectItem>
          <SelectItem value="Tie">Tie</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (category === "blackjack") {
    return (
      <Input
        id={`${id}Type`}
        value=""
        disabled
        placeholder="No types available"
        className="bg-muted"
      />
    );
  }
  if (category === "slots") {
    return (
      <Select
        value={risk || "medium"}
        onValueChange={(v) => onRiskChange(v as RiskLevel)}
      >
        <SelectTrigger id={`${id}Risk`}>
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
    );
  }
  if (category === "digits") {
    return (
      <div>
        <Label htmlFor={`${id}DigitsSelection`}>Selection</Label>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger id={`${id}DigitsSelection`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {digitsSelectionOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function GameConfigPanel({
  id,
  label,
  config,
  getDefaultHouseEdge,
  className,
  wideLayout = false,
  showWeighting = false,
  weighting,
  onWeightingChange,
  isSpinMode = false,
  numSpins,
  onNumSpinsChange,
  enabled,
  onToggleEnabled,
  toggleLabel,
  toggleDisabled,
  disabledMessage,
  switchBalance,
  extraPanel,
  allowTargetBustRate = false,
}: GameConfigPanelProps) {
  const hasToggle = onToggleEnabled !== undefined;
  const isDisabled = hasToggle && !enabled;
  const defaultHE = getDefaultHouseEdge(config.name);

  const handleCategoryChange = (v: string) => {
    const newCat = v as GameCategory;
    config.setCategory(newCat);
    const defaultType = getDefaultGameType(newCat);
    if (newCat === "slots") {
      config.setRisk(defaultType as RiskLevel);
    } else if (newCat === "digits") {
      config.setType(defaultType);
      config.setDigitsType(defaultType);
    } else {
      config.setType(defaultType);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          {hasToggle && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${id}Enabled`}
                checked={enabled}
                disabled={toggleDisabled}
                onCheckedChange={(checked) => onToggleEnabled!(checked as boolean)}
              />
              <Label
                htmlFor={`${id}Enabled`}
                className={`font-normal ${toggleDisabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}`}
              >
                {toggleLabel ?? "Enable"}
              </Label>
            </div>
          )}
        </div>
      </CardHeader>

      {isDisabled ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {disabledMessage ?? "Enable this section to configure."}
          </p>
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
          {/* Row 1: Game Type + Selection, and optionally Bet Size + Time inline */}
          <div className={`grid gap-4 ${wideLayout ? "grid-cols-4" : "grid-cols-2"}`}>
            <div className="space-y-2">
              <Label htmlFor={`${id}Category`}>Game Type</Label>
              <Select value={config.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id={`${id}Category`}>
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
              <Label htmlFor={`${id}Type`}>
                {config.category === "slots"
                  ? "Risk Level"
                  : config.category === "digits"
                  ? ""
                  : "Selection"}
              </Label>
              <GameTypeSelector
                id={id}
                category={config.category}
                type={config.type}
                risk={config.risk}
                onTypeChange={config.setType}
                onRiskChange={config.setRisk}
              />
            </div>

            {/* Bet Size and Time Per Bet inline (wide layout only) */}
            {wideLayout && (
              <>
                <div className="space-y-2">
                  {config.betSizeMode === "fixed" ? (
                    <>
                      <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                        <Label htmlFor={`${id}BetSize`} className="shrink-0">
                          Bet Size ($)
                        </Label>
                        {allowTargetBustRate && (
                          <div className="flex gap-0.5 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant={config.betSizeMode === "fixed" ? "default" : "outline"}
                              className="h-7 text-xs px-2"
                              onClick={() => config.setBetSizeMode("fixed")}
                            >
                              Fixed
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                config.betSizeMode === "target_bust_rate" ? "default" : "outline"
                              }
                              className="h-7 text-xs px-2"
                              onClick={() => config.setBetSizeMode("target_bust_rate")}
                            >
                              Target
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        id={`${id}BetSize`}
                        type="number"
                        step="0.01"
                        value={config.betSize}
                        onChange={(e) => config.setBetSize(Number(e.target.value))}
                        placeholder="5.0"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                        <Label htmlFor={`${id}TargetBustRate`} className="shrink-0">
                          Target Bust Rate (%)
                        </Label>
                        {allowTargetBustRate && (
                          <div className="flex gap-0.5 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant={config.betSizeMode === "fixed" ? "default" : "outline"}
                              className="h-7 text-xs px-2"
                              onClick={() => config.setBetSizeMode("fixed")}
                            >
                              Fixed
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                config.betSizeMode === "target_bust_rate" ? "default" : "outline"
                              }
                              className="h-7 text-xs px-2"
                              onClick={() => config.setBetSizeMode("target_bust_rate")}
                            >
                              Target
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        id={`${id}TargetBustRate`}
                        type="number"
                        step="1"
                        min={1}
                        max={99}
                        value={config.targetBustRate}
                        onChange={(e) => config.setTargetBustRate(Number(e.target.value))}
                        placeholder="90"
                      />
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}TimePerBet`}>Time Per Bet (seconds)</Label>
                  <Input
                    id={`${id}TimePerBet`}
                    type="number"
                    step="0.1"
                    value={config.timePerBet}
                    onChange={(e) => config.setTimePerBet(Number(e.target.value))}
                    placeholder="3.0"
                  />
                </div>
              </>
            )}
          </div>

          {/* Row 2: Bet Size + Time Per Bet (or NumSpins) — non-wide layout */}
          {!wideLayout && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {config.betSizeMode === "fixed" ? (
                  <>
                    <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                      <Label htmlFor={`${id}BetSize`} className="shrink-0">
                        Bet Size ($)
                      </Label>
                      {allowTargetBustRate && (
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant={config.betSizeMode === "fixed" ? "default" : "outline"}
                            className="h-7 text-xs px-2"
                            onClick={() => config.setBetSizeMode("fixed")}
                          >
                            Fixed
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              config.betSizeMode === "target_bust_rate" ? "default" : "outline"
                            }
                            className="h-7 text-xs px-2"
                            onClick={() => config.setBetSizeMode("target_bust_rate")}
                          >
                            Target
                          </Button>
                        </div>
                      )}
                    </div>
                    <Input
                      id={`${id}BetSize`}
                      type="number"
                      step="0.01"
                      value={config.betSize}
                      onChange={(e) => config.setBetSize(Number(e.target.value))}
                      placeholder="1.0"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                      <Label htmlFor={`${id}TargetBustRate`} className="shrink-0">
                        Target Bust Rate (%)
                      </Label>
                      {allowTargetBustRate && (
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant={config.betSizeMode === "fixed" ? "default" : "outline"}
                            className="h-7 text-xs px-2"
                            onClick={() => config.setBetSizeMode("fixed")}
                          >
                            Fixed
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              config.betSizeMode === "target_bust_rate" ? "default" : "outline"
                            }
                            className="h-7 text-xs px-2"
                            onClick={() => config.setBetSizeMode("target_bust_rate")}
                          >
                            Target
                          </Button>
                        </div>
                      )}
                    </div>
                    <Input
                      id={`${id}TargetBustRate`}
                      type="number"
                      step="1"
                      min={1}
                      max={99}
                      value={config.targetBustRate}
                      onChange={(e) => config.setTargetBustRate(Number(e.target.value))}
                      placeholder="90"
                    />
                  </>
                )}
              </div>
              <div className="space-y-2">
                {isSpinMode ? (
                  <>
                    <Label htmlFor={`${id}NumSpins`}>Number of Spins</Label>
                    <Input
                      id={`${id}NumSpins`}
                      type="number"
                      value={numSpins ?? 10}
                      onChange={(e) => onNumSpinsChange?.(Number(e.target.value))}
                      placeholder="10"
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor={`${id}TimePerBet`}>Time Per Bet (seconds)</Label>
                    <Input
                      id={`${id}TimePerBet`}
                      type="number"
                      step="0.1"
                      value={config.timePerBet}
                      onChange={(e) => config.setTimePerBet(Number(e.target.value))}
                      placeholder="3.0"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Row 3: Weighting + House Edge (+ optional extraPanel) */}
          <div className="flex justify-start items-start">
            <div
              className={`grid grid-cols-2 gap-4 ${
                showWeighting
                  ? extraPanel
                    ? "w-1/2"
                    : "w-full"
                  : extraPanel
                  ? "w-1/2"
                  : "w-full"
              }`}
            >
              {showWeighting && (
                <div className="space-y-2">
                  <Label htmlFor={`${id}Weighting`}>Game Weighting (%)</Label>
                  <Input
                    id={`${id}Weighting`}
                    type="number"
                    step="0.1"
                    value={weighting ?? 100}
                    onChange={(e) => onWeightingChange?.(Number(e.target.value))}
                    placeholder="100.0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor={`${id}HouseEdge`}>House Edge (%)</Label>
                  <button
                    type="button"
                    onClick={() => config.setHouseEdgeLocked(!config.houseEdgeLocked)}
                    className="absolute top-0 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {config.houseEdgeLocked ? (
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
                  id={`${id}HouseEdge`}
                  type="number"
                  step="0.01"
                  disabled={config.houseEdgeLocked}
                  value={
                    config.houseEdge !== null
                      ? config.houseEdge
                      : (defaultHE ?? "")
                  }
                  onChange={(e) =>
                    config.setHouseEdge(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder={defaultHE !== null ? "" : "Variable"}
                  className={config.houseEdgeLocked ? "bg-muted cursor-not-allowed" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {defaultHE !== null
                    ? `Default value (${defaultHE}%)`
                    : "Variable based on threshold"}
                </p>
              </div>
            </div>

            {extraPanel && (
              <div className="ml-6 w-1/2">{extraPanel}</div>
            )}
          </div>

          {/* Switch Balance */}
          {switchBalance && (
            <div className="space-y-2 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                    Switch Balance ($):
                  </span>
                  <span className="text-xl font-semibold text-red-600 dark:text-red-400">
                    {Number.isInteger(switchBalance.value)
                      ? switchBalance.value.toString()
                      : switchBalance.value.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={switchBalance.calcType}
                    onValueChange={switchBalance.setCalcType}
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
                    id={`${id}SwitchMultiplier`}
                    type="number"
                    step="1"
                    min="1"
                    value={switchBalance.multiplier}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 0 && v <= 99999) switchBalance.setMultiplier(v);
                    }}
                    className="w-[120px]"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {switchBalance.description ??
                  "Balance threshold to switch from Game 1 to Game 2"}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
