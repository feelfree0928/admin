// ============================================================================
// TYPE DEFINITIONS (matching backend API from src/Types.jl and src/RequestParser.jl)
// ============================================================================

export type BonusType = "cashable" | "postwager" | "cashback" | "sticky" | "freespins" | "raw";
export type CashbackType = "on_win" | "on_loss" | "both" | "fixed_wager";
export type SimulationMode = "standard" | "two_tier";
export type GameName =
  | "bj"
  | "european_1s" | "european_2s" | "european_3s" | "european_4s" | "european_6s" | "european_12s" | "european_18s"
  | "american_1s" | "american_2s" | "american_3s" | "american_4s" | "american_6s" | "american_12s" | "american_18s"
  | "french_1s" | "french_2s" | "french_3s" | "french_4s" | "french_6s" | "french_12s" | "french_18s"
  | "baccarat_player" | "baccarat_banker" | "baccarat_tie"
  | "slots"
  | "digits";
export type GameCategory =
  | "european_roulette"
  | "american_roulette"
  | "french_roulette"
  | "baccarat"
  | "blackjack"
  | "slots"
  | "digits";
export type RiskLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export type TimePerBetCategory =
  | "roulette"
  | "blackjack"
  | "baccarat"
  | "slots"
  | "digits";

export type HouseEdgeCategory =
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

export interface BonusConfig {
  type: BonusType;
  deposit: number;
  bonus_amount: number;
  wagering?: number;
  cashback_type?: CashbackType;
  cashback_amount?: number;
  target_balance?: number;
  wager_target?: number;
  cashback_rate?: number;
  cashback_cap?: number;
  cashback_as_bonus?: boolean;
  cashback_wagering_requirement?: number;
  cashable_on_loss?: boolean;
  freespins_count?: number;
  freespins_bet_size?: number;
  freespins_rollover?: boolean;
  freespins_rollover_multiplier?: number;
  use_bonus_wagering_multiplier?: boolean;
  bonus_wagering_multiplier?: number;
  bonus_wagering_requirement?: number;
  apply_bonus_play?: boolean;
  max_cashout?: number | null;
}

export interface GameConfig {
  name: GameName;
  bet_size: number;
  time_per_bet?: number;
  game_weighting?: number;
  house_edge?: number | null;
  digits_type?: string | null;
  risk?: RiskLevel | null;
  switch_balance?: number;
}

export interface CoverplayConfig {
  enabled: boolean;
  game?: GameName;
  bet_size?: number;
  num_spins?: number;
  risk?: RiskLevel | null;
  house_edge?: number | null;
}

export interface SimulationRequest {
  mode: SimulationMode;
  bonus: BonusConfig;
  game1: GameConfig;
  game2?: GameConfig | null;
  bonus_game1?: GameConfig;
  bonus_game2?: GameConfig;
  pre_coverplay?: CoverplayConfig;
  post_coverplay?: CoverplayConfig;
  simulation: {
    num_sessions: number;
    random_seed?: number | null;
    precision?: number;
    player_profit_enabled?: boolean;
    player_base_profit?: number;
    player_bonus_pct?: number;
  };
  optimization?: {
    target_bust_rate: number;
  };
}

export interface SimulationResults {
  sessions_completed: number;
  expected_value: number;
  bust_rate_percent: number;
  average_time_minutes: number;
  average_time_seconds: number;
  cash_per_hour: number;
  total_wagered_average: number;
  average_deposited?: number;
  std_deviation: number;
  variance?: number;
  confidence_interval_95: {
    lower: number;
    upper: number;
  };
  loss_win_probabilities?: {
    loss_100_percent: number;
    loss_50_percent: number;
    loss_25_percent: number;
    loss_10_percent: number;
    break_even: number;
    win_10_percent: number;
    win_25_percent: number;
    win_50_percent: number;
    win_100_percent: number;
  };
}

export interface ApiResponse {
  status: string;
  execution_time_ms: number;
  mode: SimulationMode;
  results: SimulationResults;
  warnings: string[];
}
