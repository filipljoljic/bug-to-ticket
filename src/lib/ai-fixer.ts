import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Map of component names to their file paths
const COMPONENT_PATHS: Record<string, string> = {
  "BrokenSubmitButton": "src/components/broken/BrokenSubmitButton.tsx",
  "BrokenForm": "src/components/broken/BrokenForm.tsx",
  "BrokenCounter": "src/components/broken/BrokenCounter.tsx",
  "BrokenModal": "src/components/broken/BrokenModal.tsx",
  "BrokenSearch": "src/components/broken/BrokenSearch.tsx",
  "Submit Button": "src/components/broken/BrokenSubmitButton.tsx",
  "Contact Form": "src/components/broken/BrokenForm.tsx",
  "Counter": "src/components/broken/BrokenCounter.tsx",
  "Modal": "src/components/broken/BrokenModal.tsx",
  "Modal Dialog": "src/components/broken/BrokenModal.tsx",
  "Search": "src/components/broken/BrokenSearch.tsx",
  "Search Box": "src/components/broken/BrokenSearch.tsx",
};

const FIX_SYSTEM_PROMPT = `You are an expert React/TypeScript developer tasked with fixing bugs in components.

You will receive:
1. A bug ticket with details about the issue
2. The current source code of the buggy component

Your job is to:
1. Analyze the bug description
2. Identify the root cause in the code
3. Generate a FIXED version of the entire component

Rules:
- Return ONLY the fixed TypeScript/React code, no explanations
- Keep the same file structure and exports
- Fix ALL bugs mentioned in the ticket
- Add appropriate error handling
- Keep the component functional and maintain its purpose
- Remove any intentional bugs or comments about bugs
- The code must be valid TypeScript/React that compiles without errors

Return the complete fixed component code.`;

export interface FixResult {
  componentPath: string;
  componentName: string;
  originalCode: string;
  fixedCode: string;
  applied: boolean;
}

export async function identifyComponent(
  ticketTitle: string,
  ticketSummary: string,
  suspectedComponent: string | null,
  conversation: string
): Promise<string | null> {
  // First try the suspected component
  if (suspectedComponent) {
    for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
      if (
        suspectedComponent.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(suspectedComponent.toLowerCase())
      ) {
        return path;
      }
    }
  }

  // Search in ticket content
  const searchText = `${ticketTitle} ${ticketSummary} ${conversation}`.toLowerCase();
  
  for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
    if (searchText.includes(name.toLowerCase())) {
      return path;
    }
  }

  // If no match found, ask AI to identify
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Based on this bug report, which component is affected? Return ONLY the component name, nothing else.

Available components:
- BrokenSubmitButton (Submit Button)
- BrokenForm (Contact Form)  
- BrokenCounter (Counter)
- BrokenModal (Modal Dialog)
- BrokenSearch (Search Box)

Bug report:
Title: ${ticketTitle}
Summary: ${ticketSummary}
Suspected: ${suspectedComponent || "Unknown"}

If you cannot determine, respond with "Unknown".`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") return null;

  const identified = content.text.trim();
  return COMPONENT_PATHS[identified] || null;
}

export async function fixComponent(
  componentPath: string,
  ticketTitle: string,
  ticketSummary: string,
  expectedBehavior: string,
  actualBehavior: string,
  reproSteps: string[]
): Promise<FixResult> {
  const fullPath = join(process.cwd(), componentPath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Component file not found: ${componentPath}`);
  }

  const originalCode = readFileSync(fullPath, "utf-8");
  const componentName = componentPath.split("/").pop()?.replace(".tsx", "") || "Unknown";

  const ticketContent = `
## Bug Ticket

**Title:** ${ticketTitle}

**Summary:** ${ticketSummary}

**Expected Behavior:** ${expectedBehavior}

**Actual Behavior:** ${actualBehavior}

**Steps to Reproduce:**
${reproSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: FIX_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${ticketContent}

## Current Component Code

\`\`\`typescript
${originalCode}
\`\`\`

Please provide the FIXED version of this component. Return ONLY the code, no markdown code blocks or explanations.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from AI");
  }

  let fixedCode = content.text.trim();
  
  // Remove markdown code blocks if present
  if (fixedCode.startsWith("```")) {
    fixedCode = fixedCode
      .replace(/^```(?:typescript|tsx|javascript|jsx)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  return {
    componentPath,
    componentName,
    originalCode,
    fixedCode,
    applied: false,
  };
}

export async function applyFix(componentPath: string, fixedCode: string): Promise<void> {
  const fullPath = join(process.cwd(), componentPath);
  writeFileSync(fullPath, fixedCode, "utf-8");
}
