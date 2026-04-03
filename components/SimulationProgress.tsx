"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Activity, Clock, TrendingDown, DollarSign, Timer, BarChart3 } from "lucide-react";
import type { SimulationProgress as ProgressData } from "@/types/simulation";
import { formatCurrency, formatPercentage } from "@/lib/game-utils";

interface SimulationProgressProps {
  progress: ProgressData | null;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toFixed(0)}s`;
}

function formatSessions(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function SimulationProgress({ progress }: SimulationProgressProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setElapsedMs(Date.now() - startTime), 100);
    return () => clearInterval(timer);
  }, [startTime]);

  const phase = progress?.phase ?? "idle";
  const pct = Math.min((progress?.progress ?? 0) * 100, 100);
  const isSearching = phase === "searching";
  const isSimulating = phase === "simulating";
  const hasData = isSearching || isSimulating;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <CardContent className="pt-6 pb-5 space-y-4">
        {/* Header row: phase label + elapsed timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <Search className="h-4 w-4 text-amber-500 animate-pulse" />
            ) : (
              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
            )}
            <span className="text-sm font-medium">
              {isSearching ? "Searching for optimal bet size..." : isSimulating ? "Running simulation..." : "Initializing..."}
            </span>
            {isSearching && (
              <Badge variant="outline" className="text-xs font-normal">
                Optimization
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatElapsed(elapsedMs)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isSearching
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${hasData ? Math.max(pct, 1) : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {hasData ? `${pct.toFixed(1)}%` : "Starting..."}
            </span>
            {isSimulating && progress?.sessions_completed != null && progress?.total_sessions != null && (
              <span>
                {formatSessions(progress.sessions_completed)} / {formatSessions(progress.total_sessions)} sessions
              </span>
            )}
            {isSearching && progress?.search_iteration != null && (
              <span>
                Iteration {progress.search_iteration} / {progress.search_max_iterations ?? 40}
              </span>
            )}
          </div>
        </div>

        {/* Search phase details */}
        {isSearching && progress?.search_bet_mid != null && (
          <div className="grid grid-cols-3 gap-3 pt-1">
            <MiniStat
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Current Bet"
              value={`$${progress.search_bet_mid.toFixed(2)}`}
            />
            <MiniStat
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              label="Probe Bust Rate"
              value={formatPercentage(progress.search_bust_rate ?? 0)}
            />
            <MiniStat
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Bet Range"
              value={`$${(progress.search_bet_lo ?? 0).toFixed(2)} – $${(progress.search_bet_hi ?? 0).toFixed(2)}`}
            />
          </div>
        )}

        {/* Simulation phase intermediate results */}
        {isSimulating && progress?.intermediate_ev != null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <MiniStat
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="EV (running)"
              value={formatCurrency(progress.intermediate_ev)}
              highlight
            />
            <MiniStat
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              label="Bust Rate"
              value={formatPercentage(progress.intermediate_bust_rate ?? 0)}
            />
            <MiniStat
              icon={<Timer className="h-3.5 w-3.5" />}
              label="Avg Time"
              value={`${(progress.intermediate_avg_time_min ?? 0).toFixed(1)} min`}
            />
            <MiniStat
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Cash/Hour"
              value={formatCurrency(progress.intermediate_cash_per_hour ?? 0)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] leading-none">{label}</span>
      </div>
      <div className={`text-sm font-semibold tabular-nums transition-all duration-300 ${highlight ? "text-foreground" : ""}`}>
        {value}
      </div>
    </div>
  );
}
