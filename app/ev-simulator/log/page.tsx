"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost:8000";

export interface SimulationLogEntry {
  id?: string;
  timestamp: string;
  bonus_type: string;
  deposit?: number;
  bonus_amount?: number;
  wagering?: number;
  num_sessions?: number;
  game1_name?: string;
  game1_bet_size?: number;
  mode?: string;
  expected_value?: number | null;
  bust_rate_percent?: number | null;
  execution_time_ms?: number;
  status: "success" | "error";
  error_message?: string;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    const s = String(d.getUTCSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  } catch {
    return iso;
  }
}

function getDatePart(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function getTimePart(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    return `${h}:${min}`;
  } catch {
    return "";
  }
}

const BONUS_LABELS: Record<string, string> = {
  cashable: "Cashable",
  postwager: "Post-Wager",
  cashback: "Cashback",
  sticky: "Sticky",
  freespins: "Free Spins",
  raw: "Raw",
};

export default function LogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SimulationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");
  const [filterBonusType, setFilterBonusType] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setError("Failed to load logs");
      }
    } catch (err) {
      setError("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      const datePart = getDatePart(entry.timestamp);
      const timePart = getTimePart(entry.timestamp);
      if (filterDate && datePart !== filterDate) return false;
      if (filterTimeFrom && timePart < filterTimeFrom) return false;
      if (filterTimeTo && timePart > filterTimeTo) return false;
      if (filterBonusType !== "all" && entry.bonus_type !== filterBonusType)
        return false;
      return true;
    });
  }, [logs, filterDate, filterTimeFrom, filterTimeTo, filterBonusType]);

  const clearFilters = () => {
    setFilterDate("");
    setFilterTimeFrom("");
    setFilterTimeTo("");
    setFilterBonusType("all");
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        await fetchLogs();
        setDeleteDialogOpen(false);
      } else {
        setError("Failed to delete logs");
      }
    } catch {
      setError("Cannot connect to backend");
    }
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      return;
    }
    const rows = filteredLogs.map((entry) => ({
      "Timestamp (GMT)": formatTimestamp(entry.timestamp),
      "Bonus Type": BONUS_LABELS[entry.bonus_type] ?? entry.bonus_type,
      Deposit: entry.deposit ?? null,
      "Bonus Amount": entry.bonus_amount ?? null,
      Wagering: entry.wagering ?? null,
      Sessions: entry.num_sessions ?? null,
      Game: entry.game1_name ?? null,
      "Bet Size": entry.game1_bet_size ?? null,
      Mode: entry.mode ?? null,
      "EV %": entry.expected_value ?? null,
      "Bust Rate %": entry.bust_rate_percent ?? null,
      "Exec Time (ms)": entry.execution_time_ms ?? null,
      Status: entry.status,
      "Error Message": entry.error_message ?? null,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const filename = `simulation-logs-${yyyy}-${mm}-${dd}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Back button */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/ev-simulator")}
          title="Back to Simulator"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Simulation Logs</h1>
          <p className="text-sm text-muted-foreground">
            All times in GMT (British Standard Time)
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 mb-4 rounded-lg border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Time from
            </label>
            <input
              type="time"
              value={filterTimeFrom}
              onChange={(e) => setFilterTimeFrom(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Time to
            </label>
            <input
              type="time"
              value={filterTimeTo}
              onChange={(e) => setFilterTimeTo(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Bonus type
            </label>
            <Select
              value={filterBonusType}
              onValueChange={setFilterBonusType}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cashable">Cashable</SelectItem>
                <SelectItem value="postwager">Post-Wager</SelectItem>
                <SelectItem value="cashback">Cashback</SelectItem>
                <SelectItem value="sticky">Sticky</SelectItem>
                <SelectItem value="freespins">Free Spins</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
          >
            Export to Excel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={logs.length === 0}
          >
            Delete all logs
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Log table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No logs match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Timestamp (GMT)</th>
                <th className="px-4 py-3 text-left font-medium">Bonus Type</th>
                <th className="px-4 py-3 text-left font-medium">Game / Mode</th>
                <th className="px-4 py-3 text-right font-medium">Sessions</th>
                <th className="px-4 py-3 text-right font-medium">EV %</th>
                <th className="px-4 py-3 text-right font-medium">Bust Rate %</th>
                <th className="px-4 py-3 text-right font-medium">Exec Time</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry, i) => (
                <tr key={entry.id ?? i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        entry.bonus_type === "postwager"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {BONUS_LABELS[entry.bonus_type] ?? entry.bonus_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {entry.game1_name ?? "-"} / {entry.mode ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.num_sessions != null
                      ? entry.num_sessions.toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.expected_value != null
                      ? entry.expected_value.toFixed(2)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.bust_rate_percent != null
                      ? entry.bust_rate_percent.toFixed(2)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.execution_time_ms != null
                      ? `${entry.execution_time_ms.toFixed(0)} ms`
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        entry.status === "success" ? "default" : "destructive"
                      }
                    >
                      {entry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all logs?</DialogTitle>
            <DialogDescription>
              This will permanently remove all simulation logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
