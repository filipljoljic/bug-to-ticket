import Anthropic from "@anthropic-ai/sdk";
import { TicketDraftSchema, type TicketDraftFields } from "./schemas";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a bug report analyst. Your job is to extract structured information from a conversation about a software bug.

Analyze the conversation and extract the following information into a JSON object:

{
  "title": "A concise, descriptive title for the bug (max 200 chars)",
  "summary": "A brief summary of the bug",
  "expected_behavior": "What the user expected to happen",
  "actual_behavior": "What actually happened",
  "repro_steps": ["Step 1", "Step 2", ...], // Steps to reproduce the bug
  "environment": {
    "os": "Operating system or null if unknown",
    "browser": "Browser name and version or null if unknown",
    "device": "Device type or null if unknown",
    "app_version": "App version or null if unknown"
  },
  "severity": "low" | "medium" | "high" | "critical", // Based on impact
  "confidence": 0.0 to 1.0, // How confident you are in the extraction (based on completeness of info)
  "suspected_component": "The suspected component/area of the app affected, or null if unclear",
  "missing_info_questions": ["Question 1", "Question 2", ...] // Questions to ask for missing info
}

Guidelines:
- If information is missing, use null for optional fields and add relevant questions to missing_info_questions
- Severity should be based on: critical (app crash, data loss), high (major feature broken), medium (feature partially broken), low (minor issue, cosmetic)
- Confidence should be lower if: repro steps are unclear, expected behavior is vague, environment is unknown
- Be concise but accurate
- Output ONLY valid JSON, no other text`;

interface Message {
  role: string;
  content: string;
}

export async function extractTicketDraft(
  messages: Message[]
): Promise<TicketDraftFields> {
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Here is a conversation about a bug report:\n\n${conversationText}\n\nExtract the structured bug ticket information as JSON.`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  let jsonText = content.text.trim();
  
  // Try to extract JSON if wrapped in markdown code blocks
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // If parsing fails, try one more time with a fix prompt
    const retryResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `The following JSON is invalid. Please fix it and return ONLY valid JSON:\n\n${jsonText}`,
        },
      ],
    });

    const retryContent = retryResponse.content[0];
    if (retryContent.type !== "text") {
      throw new Error("Failed to get valid JSON from Claude");
    }

    let retryText = retryContent.text.trim();
    const retryMatch = retryText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (retryMatch) {
      retryText = retryMatch[1].trim();
    }

    parsed = JSON.parse(retryText);
  }

  // Validate with Zod
  const result = TicketDraftSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Validation errors:", result.error.issues);
    
    // Return a default structure with what we could parse
    const partial = parsed as Partial<TicketDraftFields>;
    return {
      title: partial.title || "Bug Report",
      summary: partial.summary || "",
      expected_behavior: partial.expected_behavior || "",
      actual_behavior: partial.actual_behavior || "",
      repro_steps: Array.isArray(partial.repro_steps) ? partial.repro_steps : [],
      environment: {
        os: partial.environment?.os || null,
        browser: partial.environment?.browser || null,
        device: partial.environment?.device || null,
        app_version: partial.environment?.app_version || null,
      },
      severity: partial.severity || "medium",
      confidence: typeof partial.confidence === "number" ? partial.confidence : 0.5,
      suspected_component: partial.suspected_component || null,
      missing_info_questions: Array.isArray(partial.missing_info_questions)
        ? partial.missing_info_questions
        : ["Could you provide more details about the bug?"],
    };
  }

  return result.data;
}
