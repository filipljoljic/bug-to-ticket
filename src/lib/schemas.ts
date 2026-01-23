import { z } from "zod";

export const TicketDraftSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string(),
  expected_behavior: z.string(),
  actual_behavior: z.string(),
  repro_steps: z.array(z.string()),
  environment: z.object({
    os: z.string().nullable(),
    browser: z.string().nullable(),
    device: z.string().nullable(),
    app_version: z.string().nullable(),
  }),
  severity: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  suspected_component: z.string().nullable(),
  missing_info_questions: z.array(z.string()),
});

export type TicketDraftFields = z.infer<typeof TicketDraftSchema>;

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export type MessageInput = z.infer<typeof MessageSchema>;
