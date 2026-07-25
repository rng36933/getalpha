/** Raw inputs the AI Session Brief is built from. */

export type TradingSession = "LONDON" | "NEW_YORK" | "ASIA";

export type CalendarInput = {
  time: string;
  currency: string;
  title: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  actual: string | null;
  forecast: string | null;
  previous: string | null;
};

export type TechnicalLevelsInput = {
  symbol: string;
  timeframe: string;
  lastPrice: number;
  support: number[];
  resistance: number[];
};

export type NewsInput = {
  title: string;
  source: string;
  publishedAt: string;
  summary?: string | null;
};

export type SessionBriefInput = {
  session: TradingSession;
  asOf: string;
  economicEvents: CalendarInput[];
  technicalLevels: TechnicalLevelsInput[];
  newsHeadlines: NewsInput[];
};

export type SessionBrief = {
  riskTone: {
    tone: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
    reason: string;
  };
  keyMarketDriver: string;
  watchlistVolatilityWarning: string;
};

/** Inputs for the AI Coach — one trade, its computed metrics, and history. */
export type CoachInput = {
  trade: {
    asset: string;
    direction: "BUY" | "SELL";
    setup: string | null;
    timeframe: string | null;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    size: number;
    contractSize: number;
    pnl: number | null;
    accountBalance: number | null;
    marketContext: string | null;
    emotionalState: string | null;
    openedAt: string;
    closedAt: string | null;
  };
  /** Computed in code, never by the model. */
  metrics: import("./trade-metrics").TradeMetrics;
  history: import("./trade-metrics").PortfolioContext;
};

export type CoachRating = "STRONG" | "ADEQUATE" | "WEAK" | "NOT_ASSESSABLE";

export type CoachDimension = {
  rating: CoachRating;
  note: string;
};

export type CoachReview = {
  verdict: "PROCESS_SOUND" | "PROCESS_MIXED" | "PROCESS_BROKEN";
  headline: string;
  scorecard: {
    tradeSelection: CoachDimension;
    positionSizing: CoachDimension;
    stopPlacement: CoachDimension;
    exitManagement: CoachDimension;
    planAdherence: CoachDimension;
    emotionalControl: CoachDimension;
  };
  primaryLeak: {
    name: string;
    evidence: string;
    /** Why it costs money over a sample, not just on this trade. */
    costOverSample: string;
  } | null;
  strengths: string[];
  ruleForNextTime: string;
  missingData: string[];
};

/** Token usage, carried back so cost tracking can record it. */
export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  model: string;
};

export type AiResult<T> = {
  data: T;
  usage: AiUsage & { costUsd: number };
};
