export type Category =
  | "data"
  | "image"
  | "video"
  | "vector"
  | "document"
  | "text"
  | "audio"
  | "archive"
  | "spreadsheet"
  | "presentation"
  | "font"
  | "code"
  | "binary";

export interface FormatDefinition {
  id: string;
  name: string;
  extension: string;
  extensions: string[];
  mime: string[];
  category: Category[];
  aliases?: string[];
}

export interface FileFormat {
  id: string;
  name: string;
  extension: string;
  mime: string;
  category: Category[];
  aliases: string[];
}

export interface PlanOptions {
  maxCandidates: number;
  maxSteps: number;
  strict: boolean;
}

export interface CliOptions {
  from?: string;
  to?: string;
  output?: string;
  force: boolean;
  strict: boolean;
  json: boolean;
  verbose: boolean;
  quiet: boolean;
  showRoute: boolean;
  keepTemp: boolean;
  timeoutMs?: number;
  maxSteps: number;
  maxCandidates: number;
}

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface CommandResult {
  ok: boolean;
  message?: string;
  data?: unknown;
  warnings?: string[];
}

export interface ConvertSummary {
  ok: boolean;
  input: string;
  output: string;
  route: string[];
  durationMs: number;
  warnings: string[];
}
