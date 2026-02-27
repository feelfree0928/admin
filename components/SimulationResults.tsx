"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { ApiResponse } from "@/types/simulation";
import { formatCurrency, formatPercentage } from "@/lib/game-utils";

interface SimulationResultsProps {
  results: ApiResponse;
  globalConfig?: any;
  /** Wagering requirement used for loss/win probability labels */
  wagering: number;
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SimulationResults({
  results,
  globalConfig,
  wagering,
}: SimulationResultsProps) {
  const r = results.results;
  const ev = r.expected_value;

  const averageHours = r.average_time_minutes / 60;
  const evPercent = globalConfig?.defaults?.baseProfit?.evPercent ?? 10;
  const hourlyRate = globalConfig?.defaults?.baseProfit?.hourlyRate ?? 15;
  const evBasedProfit = ev * (evPercent / 100);
  const hourBasedProfit = averageHours * hourlyRate;
  const baseProfit = Math.max(evBasedProfit, hourBasedProfit);
  const baseProfitMethod =
    evBasedProfit >= hourBasedProfit
      ? `${evPercent}% of EV`
      : `$${hourlyRate}/hr × ${averageHours.toFixed(2)}h`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Simulation Results</h2>
        <Badge variant={ev >= 0 ? "default" : "destructive"}>
          {ev >= 0 ? (
            <TrendingUp className="mr-1 h-3 w-3" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3" />
          )}
          EV: {formatCurrency(ev)}
        </Badge>
      </div>

      {/* Top 5 metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Expected Value"
          value={formatCurrency(ev)}
          subtitle={`${ev >= 0 ? "Positive" : "Negative"} EV`}
        />
        <StatCard
          title="Base Profit"
          value={formatCurrency(baseProfit)}
          subtitle={`Based on ${baseProfitMethod}`}
        />
        <StatCard
          title="Bust Rate"
          value={formatPercentage(r.bust_rate_percent)}
          subtitle={`${r.bust_rate_percent < 10 ? "Low" : r.bust_rate_percent < 40 ? "Medium" : "High"} risk`}
        />
        <StatCard
          title="Average Time"
          value={`${r.average_time_minutes.toFixed(1)}m`}
          subtitle="Per session"
        />
        <StatCard
          title="Cash Per Hour"
          value={formatCurrency(r.cash_per_hour)}
          subtitle="Hourly rate"
        />
      </div>

      {/* Confidence Interval */}
      <Card>
        <CardHeader>
          <CardTitle>95% Confidence Interval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Lower Bound</p>
              <p className="text-xl font-bold">
                {formatCurrency(r.confidence_interval_95.lower)}
              </p>
            </div>
            <div className="text-center flex-1 px-4">
              <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Upper Bound</p>
              <p className="text-xl font-bold">
                {formatCurrency(r.confidence_interval_95.upper)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Sessions Completed</span>
              <span className="font-medium">{r.sessions_completed.toLocaleString()}</span>
            </div>
            {r.average_deposited !== undefined && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Average Deposited Amount</span>
                <span className="font-medium">{formatCurrency(r.average_deposited)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Standard Deviation</span>
              <span className="font-medium">{formatCurrency(r.std_deviation)}</span>
            </div>
            {r.variance !== undefined && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Variance</span>
                <span className="font-medium">{formatCurrency(r.variance)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Avg Wagered</span>
              <span className="font-medium">{formatCurrency(r.total_wagered_average)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Execution Time</span>
              <span className="font-medium">{results.execution_time_ms.toFixed(2)}ms</span>
            </div>
          </div>

          {/* Risk Analysis */}
          {r.loss_win_probabilities && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-bold">Risk Analysis</h3>
                <span className="text-sm text-muted-foreground">
                  (Loss &amp; Win Probabilities)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Loss Probabilities */}
                <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <CardTitle className="text-base font-semibold text-red-700 dark:text-red-400">
                        Probability of Losing
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "100%", amount: -wagering, value: r.loss_win_probabilities.loss_100_percent, severity: "high" },
                      { label: "50%", amount: -wagering * 0.5, value: r.loss_win_probabilities.loss_50_percent, severity: "high" },
                      { label: "25%", amount: -wagering * 0.25, value: r.loss_win_probabilities.loss_25_percent, severity: "medium" },
                      { label: "10%", amount: -wagering * 0.1, value: r.loss_win_probabilities.loss_10_percent, severity: "low" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Lose {item.label} or more
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatCurrency(item.amount)})
                            </span>
                          </div>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatPercentage(item.value)}
                          </span>
                        </div>
                        <div className="w-full bg-red-100 dark:bg-red-950/40 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.severity === "high"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : item.severity === "medium"
                                ? "bg-gradient-to-r from-red-400 to-red-500"
                                : "bg-gradient-to-r from-red-300 to-red-400"
                            }`}
                            style={{ width: `${Math.min(item.value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Win Probabilities */}
                <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <CardTitle className="text-base font-semibold text-green-700 dark:text-green-400">
                        Probability of Winning
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "10%", amount: wagering * 0.1, value: r.loss_win_probabilities.win_10_percent, severity: "low" },
                      { label: "25%", amount: wagering * 0.25, value: r.loss_win_probabilities.win_25_percent, severity: "medium" },
                      { label: "50%", amount: wagering * 0.5, value: r.loss_win_probabilities.win_50_percent, severity: "high" },
                      { label: "100%", amount: wagering, value: r.loss_win_probabilities.win_100_percent, severity: "high" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Win {item.label} or more
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatCurrency(item.amount)})
                            </span>
                          </div>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatPercentage(item.value)}
                          </span>
                        </div>
                        <div className="w-full bg-green-100 dark:bg-green-950/40 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.severity === "high"
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : item.severity === "medium"
                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                : "bg-gradient-to-r from-green-300 to-green-400"
                            }`}
                            style={{ width: `${Math.min(item.value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Break Even */}
              <Card className="mt-4 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                        <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                          =
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Break Even or Lose
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Probability of profit ≤ $0
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        {formatPercentage(r.loss_win_probabilities.break_even)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
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
  );
}
