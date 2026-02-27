"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { BonusType, CashbackType } from "@/types/simulation";

interface BonusConfigPanelProps {
  // Core bonus type
  bonusType: BonusType;
  setBonusType: (v: BonusType) => void;

  // Common fields
  deposit: number;
  setDeposit: (n: number) => void;
  bonusAmount: number;
  setBonusAmount: (n: number) => void;
  wagering: number;
  setWagering: (n: number) => void;

  // Cashback
  cashbackType: CashbackType;
  setCashbackType: (v: CashbackType) => void;
  calculateTargetBalance: () => number;
  targetBalanceCalculationType: string;
  setTargetBalanceCalculationType: (v: any) => void;
  targetBalanceMultiplier: number;
  setTargetBalanceMultiplier: (n: number) => void;
  calculateCashbackAmount: () => number;
  cashbackAmountCalculationType: string;
  setCashbackAmountCalculationType: (v: any) => void;
  cashbackAmountMultiplier: number;
  setCashbackAmountMultiplier: (n: number) => void;

  // Fixed wager
  wagerTarget: number;
  setWagerTarget: (n: number) => void;
  cashbackRate: number;
  setCashbackRate: (n: number) => void;
  cashbackCap: number;
  setCashbackCap: (n: number) => void;

  // Sticky
  maxCashout: number | null;
  setMaxCashout: (n: number | null) => void;

  // Freespins
  freespinsCount: number;
  setFreespinsCount: (n: number) => void;
  freespinsBetSize: number;
  setFreespinsBetSize: (n: number) => void;
  freespinsRollover: boolean;
  setFreespinsRollover: (b: boolean) => void;
  freespinsRolloverMultiplier: number;
  setFreespinsRolloverMultiplier: (n: number) => void;
}

function MultiplierRow({
  label,
  value,
  calcType,
  onCalcTypeChange,
  calcTypeOptions,
  multiplier,
  onMultiplierChange,
  multiplierStep = "1",
}: {
  label: string;
  value: number;
  calcType: string;
  onCalcTypeChange: (v: string) => void;
  calcTypeOptions: { value: string; label: string }[];
  multiplier: number;
  onMultiplierChange: (n: number) => void;
  multiplierStep?: string;
}) {
  const display = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-red-600 dark:text-white whitespace-nowrap">
            {label}:
          </span>
          <span className="text-xl font-semibold text-red-600 dark:text-white">
            {display}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={calcType} onValueChange={onCalcTypeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {calcTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-lg">✕</span>
          <Input
            type="number"
            step={multiplierStep}
            min="0"
            value={multiplier}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v <= 99999 && v >= 0) onMultiplierChange(v);
            }}
            className="w-[120px]"
          />
        </div>
      </div>
    </div>
  );
}

export function BonusConfigPanel({
  bonusType,
  setBonusType,
  deposit,
  setDeposit,
  bonusAmount,
  setBonusAmount,
  wagering,
  setWagering,
  cashbackType,
  setCashbackType,
  calculateTargetBalance,
  targetBalanceCalculationType,
  setTargetBalanceCalculationType,
  targetBalanceMultiplier,
  setTargetBalanceMultiplier,
  calculateCashbackAmount,
  cashbackAmountCalculationType,
  setCashbackAmountCalculationType,
  cashbackAmountMultiplier,
  setCashbackAmountMultiplier,
  wagerTarget,
  setWagerTarget,
  cashbackRate,
  setCashbackRate,
  cashbackCap,
  setCashbackCap,
  maxCashout,
  setMaxCashout,
  freespinsCount,
  setFreespinsCount,
  freespinsBetSize,
  setFreespinsBetSize,
  freespinsRollover,
  setFreespinsRollover,
  freespinsRolloverMultiplier,
  setFreespinsRolloverMultiplier,
}: BonusConfigPanelProps) {
  const isFixedWager = bonusType === "cashback" && cashbackType === "fixed_wager";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Bonus Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bonus Type */}
          <div className="space-y-2">
            <Label htmlFor="bonusType">Bonus Type</Label>
            <Select
              value={bonusType}
              onValueChange={(v) => setBonusType(v as BonusType)}
            >
              <SelectTrigger id="bonusType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashable">Deposit Bonuses</SelectItem>
                <SelectItem value="postwager">Post-Wager</SelectItem>
                <SelectItem value="cashback">Cashback</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit / Bonus Amount / Wagering (conditional) */}
          {bonusType !== "raw" && !isFixedWager && (
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
              {bonusType !== "cashback" && (
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
              )}
              {bonusType !== "freespins" && bonusType !== "cashback" && (
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

          {bonusType === "raw" && (
            <div className="space-y-2">
              <Label htmlFor="wagering">Wagering Requirement ($)</Label>
              <Input
                id="wagering"
                type="number"
                value={wagering}
                onChange={(e) => setWagering(Number(e.target.value))}
                placeholder="10000"
              />
            </div>
          )}
        </div>

        {/* CASHBACK SPECIFIC */}
        {bonusType === "cashback" && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="cashbackType">Cashback Type</Label>
              <Select
                value={cashbackType}
                onValueChange={(v) => setCashbackType(v as CashbackType)}
              >
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

            {isFixedWager ? (
              <>
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
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Note: In Fixed Wager mode, deposits are automatically managed.
                  The system will continue betting until the Wager Target is met.
                </p>
              </>
            ) : (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <MultiplierRow
                    label="Target Balance ($)"
                    value={calculateTargetBalance()}
                    calcType={targetBalanceCalculationType}
                    onCalcTypeChange={setTargetBalanceCalculationType}
                    calcTypeOptions={[
                      { value: "deposit", label: "Deposit" },
                      { value: "fixed", label: "Fixed" },
                    ]}
                    multiplier={targetBalanceMultiplier}
                    onMultiplierChange={setTargetBalanceMultiplier}
                  />
                  <MultiplierRow
                    label="Cashback Amount ($)"
                    value={calculateCashbackAmount()}
                    calcType={cashbackAmountCalculationType}
                    onCalcTypeChange={setCashbackAmountCalculationType}
                    calcTypeOptions={[
                      { value: "deposit", label: "Deposit" },
                      { value: "fixed", label: "Fixed" },
                    ]}
                    multiplier={cashbackAmountMultiplier}
                    onMultiplierChange={setCashbackAmountMultiplier}
                    multiplierStep="0.1"
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
              onChange={(e) =>
                setMaxCashout(e.target.value ? Number(e.target.value) : null)
              }
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
                onCheckedChange={(checked) =>
                  setFreespinsRollover(checked as boolean)
                }
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
                  onChange={(e) =>
                    setFreespinsRolloverMultiplier(Number(e.target.value))
                  }
                  placeholder="3.0"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
