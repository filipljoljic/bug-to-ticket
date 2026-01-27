import type {
  BugToTicketConfig,
  CaptureOptions,
  EnvironmentContext,
  Report,
  CreateReportResponse,
  GenerateDraftResponse,
  Message,
  TicketDraft,
  ApiError,
} from "./types";

// Re-export all types for consumers
export * from "./types";

/**
 * Bug-to-Ticket SDK
 *
 * Capture bugs and automatically generate structured tickets.
 *
 * @example
 * ```typescript
 * import { BugToTicket } from 'bug-to-ticket-sdk';
 *
 * const client = BugToTicket.init({
 *   apiKey: 'your-api-key',
 * });
 *
 * // Capture an error
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   await client.capture(error, { context: 'checkout-flow' });
 * }
 * ```
 */
export class BugToTicket {
  private config: Required<
    Pick<BugToTicketConfig, "apiKey" | "baseUrl" | "captureUnhandled" | "includeContext">
  > &
    Pick<BugToTicketConfig, "defaultMetadata">;

  private constructor(config: BugToTicketConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? "https://api.bug-to-ticket.com",
      captureUnhandled: config.captureUnhandled ?? true,
      includeContext: config.includeContext ?? true,
      defaultMetadata: config.defaultMetadata,
    };

    if (this.config.captureUnhandled && typeof window !== "undefined") {
      this.setupGlobalErrorHandlers();
    }
  }

  /**
   * Initialize the Bug-to-Ticket SDK
   */
  static init(config: BugToTicketConfig): BugToTicket {
    if (!config.apiKey) {
      throw new Error("BugToTicket: apiKey is required");
    }
    return new BugToTicket(config);
  }

  /**
   * Capture an error or bug report
   */
  async capture(
    error: Error | string,
    options: CaptureOptions = {}
  ): Promise<Report> {
    // Create a new report
    const report = await this.createReport();

    // Build the message content
    const content = this.buildCaptureMessage(error, options);

    // Add the initial message
    await this.addMessage(report.id, {
      role: "user",
      content,
    });

    // Fetch and return the updated report
    return this.getReport(report.id);
  }

  /**
   * Create a new empty report
   */
  async createReport(): Promise<CreateReportResponse> {
    const response = await this.request<CreateReportResponse>("/api/reports", {
      method: "POST",
    });
    return response;
  }

  /**
   * Get a report by ID
   */
  async getReport(reportId: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${reportId}`);
  }

  /**
   * List all reports
   */
  async listReports(): Promise<Report[]> {
    return this.request<Report[]>("/api/reports");
  }

  /**
   * Add a message to a report (for follow-up information)
   */
  async addMessage(
    reportId: string,
    message: { role: "user" | "assistant"; content: string }
  ): Promise<Message> {
    return this.request<Message>(`/api/reports/${reportId}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  }

  /**
   * Generate a ticket draft from the report's messages
   */
  async generateDraft(reportId: string): Promise<GenerateDraftResponse> {
    return this.request<GenerateDraftResponse>(
      `/api/reports/${reportId}/generate`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Update draft fields manually
   */
  async updateDraft(
    reportId: string,
    fields: Partial<TicketDraft>
  ): Promise<GenerateDraftResponse> {
    return this.request<GenerateDraftResponse>(
      `/api/reports/${reportId}/generate`,
      {
        method: "PUT",
        body: JSON.stringify(fields),
      }
    );
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/reports/${reportId}`, {
      method: "DELETE",
    });
  }

  /**
   * Quick capture and generate - captures the error and immediately generates a draft
   */
  async captureAndGenerate(
    error: Error | string,
    options: CaptureOptions = {}
  ): Promise<{ report: Report; draft: TicketDraft }> {
    const report = await this.capture(error, options);
    const { fields } = await this.generateDraft(report.id);
    const updatedReport = await this.getReport(report.id);
    return { report: updatedReport, draft: fields };
  }

  // ============= Private Methods =============

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new BugToTicketError(error.error, response.status, error.details);
    }

    return response.json();
  }

  private buildCaptureMessage(
    error: Error | string,
    options: CaptureOptions
  ): string {
    const parts: string[] = [];

    // Title if provided
    if (options.title) {
      parts.push(`**Bug Report: ${options.title}**\n`);
    }

    // Error information
    if (error instanceof Error) {
      parts.push(`**Error:** ${error.name}: ${error.message}`);
      if (error.stack) {
        parts.push(`\n**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\``);
      }
    } else {
      parts.push(`**Description:** ${error}`);
    }

    // Context
    if (options.context) {
      parts.push(`\n**Context:** ${options.context}`);
    }

    // Severity
    if (options.severity) {
      parts.push(`\n**Severity:** ${options.severity}`);
    }

    // User info
    if (options.user) {
      const userInfo = Object.entries(options.user)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      if (userInfo) {
        parts.push(`\n**User:** ${userInfo}`);
      }
    }

    // Tags
    if (options.tags?.length) {
      parts.push(`\n**Tags:** ${options.tags.join(", ")}`);
    }

    // Environment context
    if (this.config.includeContext) {
      const env = this.getEnvironmentContext();
      parts.push(`\n**Environment:**`);
      parts.push(`- OS: ${env.os ?? "Unknown"}`);
      parts.push(`- Browser: ${env.browser ?? "Unknown"}`);
      if (env.url) parts.push(`- URL: ${env.url}`);
      parts.push(`- Timestamp: ${env.timestamp}`);
    }

    // Custom metadata
    const metadata = { ...this.config.defaultMetadata, ...options.metadata };
    if (Object.keys(metadata).length > 0) {
      parts.push(`\n**Metadata:**\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``);
    }

    return parts.join("\n");
  }

  private getEnvironmentContext(): EnvironmentContext {
    const context: EnvironmentContext = {
      os: null,
      browser: null,
      device: null,
      app_version: null,
      timestamp: new Date().toISOString(),
    };

    if (typeof window === "undefined" || typeof navigator === "undefined") {
      // Node.js environment
      context.os = `${process.platform} ${process.arch}`;
      context.app_version = process.version;
      return context;
    }

    // Browser environment
    const ua = navigator.userAgent;
    context.userAgent = ua;
    context.url = window.location.href;

    // Parse OS
    if (ua.includes("Windows")) context.os = "Windows";
    else if (ua.includes("Mac")) context.os = "macOS";
    else if (ua.includes("Linux")) context.os = "Linux";
    else if (ua.includes("Android")) context.os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
      context.os = "iOS";

    // Parse Browser
    if (ua.includes("Firefox")) context.browser = "Firefox";
    else if (ua.includes("Chrome") && !ua.includes("Edg"))
      context.browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      context.browser = "Safari";
    else if (ua.includes("Edg")) context.browser = "Edge";

    // Parse Device
    if (ua.includes("Mobile")) context.device = "Mobile";
    else if (ua.includes("Tablet")) context.device = "Tablet";
    else context.device = "Desktop";

    return context;
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled errors
    window.addEventListener("error", (event) => {
      this.capture(event.error ?? event.message, {
        context: "Unhandled error",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }).catch(console.error);
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : String(event.reason ?? "Unknown rejection");
      this.capture(error, {
        context: "Unhandled promise rejection",
      }).catch(console.error);
    });
  }
}

/**
 * Custom error class for SDK errors
 */
export class BugToTicketError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "BugToTicketError";
  }
}

// Default export for convenience
export default BugToTicket;
