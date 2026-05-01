export type ItemState = "upcoming" | "active" | "done" | "skipped" | "overrun";

export type Energy = "CREATIVE" | "PROB-SOLV" | "LEISURE" | "PHYSICAL";

export type CounterStation = "DROP" | "DOCKET" | "TILL" | "DRAWER";

export type BoxKey =
  | "DROP"
  | "DOCKET"
  | "TILL"
  | "DRAWER"
  | "ADMIN"
  | "PCS_IDEAS"
  | "PCS_DELEGATION"
  | "READ_RESEARCH"
  | "HEALTH_IDEAS"
  | "MISC_IDEAS"
  | "RON"
  | "SWB_PLAN"
  | "MEASUREMENTS"
  | "LIFTING"
  | "PCS_MISC"
  | "NOTES"
  | (string & {});

export type Item = {
  id: string;
  box: BoxKey;
  title: string;
  area?: string | null;
  minutes?: number | null;
  urgent: boolean;
  must: boolean;
  todayOrder?: number | null;
  energy?: Energy | null;
  category?: string | null;
  potential?: 1 | 2 | 3 | 4 | 5 | null;
  person?: string | null;
  tag?: "Admin" | "Creative" | "Numbers" | "Ron" | (string & {}) | null;
  notes?: string | null;
  body?: string | null;

  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  state?: ItemState | null;
  pinned: boolean;

  createdAt: string;
  modifiedAt: string;
  deletedAt?: string | null;
};

export type DayInputs = {
  date: string;
  hoursAvailable: number;
  creative: 1 | 2 | 3 | 4 | 5;
  probSolv: 1 | 2 | 3 | 4 | 5;
  tieBreak: "CREATIVE" | "PROB-SOLV";
  endOfDay: string;
};

export type Settings = {
  stressorAnchorMinutes: number;
  defaultEndOfDay: string;
  defaultHours: number;
  captureToken: string | null;
  showAnnualBudget: boolean;
  annualHours: number;
};

export const DEFAULT_SETTINGS: Settings = {
  stressorAnchorMinutes: 91,
  defaultEndOfDay: "16:30",
  defaultHours: 7,
  captureToken: null,
  showAnnualBudget: false,
  annualHours: 500,
};
