/**
 * Configuration options for the Bug-to-Ticket SDK
 */
export interface BugToTicketConfig {
  /**
   * Your API key for authentication
   */
  apiKey: string;

  /**
   * Base URL for the Bug-to-Ticket API
   * @default "https://api.bug-to-ticket.com"
   */
  baseUrl?: string;

  /**
   * Automatically capture unhandled errors
   * @default true
   */
  captureUnhandled?: boolean;

  /**
   * Automatically include browser/environment context
   * @default true
   */
  includeContext?: boolean;

  /**
   * Custom metadata to include with every report
   */
  defaultMetadata?: Record<string, unknown>;
}

/**
 * Environment information captured automatically
 */
export interface EnvironmentContext {
  os: string | null;
  browser: string | null;
  device: string | null;
  app_version: string | null;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Severity levels for bug reports
 */
export type Severity = "low" | "medium" | "high" | "critical";

/**
 * Options when capturing a bug report
 */
export interface CaptureOptions {
  /**
   * Custom title for the report
   */
  title?: string;

  /**
   * Additional context about what the user was doing
   */
  context?: string;

  /**
   * Bug severity level
   */
  severity?: Severity;

  /**
   * Custom metadata specific to this report
   */
  metadata?: Record<string, unknown>;

  /**
   * User information
   */
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };

  /**
   * Tags for categorization
   */
  tags?: string[];
}

/**
 * A message in the bug report conversation
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/**
 * Generated ticket draft fields
 */
export interface TicketDraft {
  title: string;
  summary: string;
  expected_behavior: string;
  actual_behavior: string;
  repro_steps: string[];
  environment: {
    os: string | null;
    browser: string | null;
    device: string | null;
    app_version: string | null;
  };
  severity: Severity;
  confidence: number;
  suspected_component: string | null;
  missing_info_questions: string[];
}

/**
 * A bug report with all its data
 */
export interface Report {
  id: string;
  title: string | null;
  status: "draft" | "pending" | "complete";
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  draft?: {
    id: string;
    fields: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Response from creating a report
 */
export interface CreateReportResponse {
  id: string;
  status: string;
}

/**
 * Response from generating a ticket draft
 */
export interface GenerateDraftResponse {
  draft: {
    id: string;
    fields: string;
  };
  fields: TicketDraft;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  details?: unknown;
}
