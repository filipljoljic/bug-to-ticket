import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { identifyComponent, fixComponent, applyFix } from "@/lib/ai-fixer";
import type { TicketDraftFields } from "@/lib/schemas";

// POST /api/reports/[id]/fix - Generate a fix for the buggy component
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get report with messages and draft
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        draft: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.draft) {
      return NextResponse.json(
        { error: "No ticket draft found. Generate a draft first." },
        { status: 400 }
      );
    }

    const fields = JSON.parse(report.draft.fields) as TicketDraftFields;
    const conversation = report.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    // Identify which component has the bug
    const componentPath = await identifyComponent(
      fields.title,
      fields.summary,
      fields.suspected_component,
      conversation
    );

    if (!componentPath) {
      return NextResponse.json(
        { error: "Could not identify which component to fix. Please mention the component name in your bug report." },
        { status: 400 }
      );
    }

    // Generate the fix
    const fixResult = await fixComponent(
      componentPath,
      fields.title,
      fields.summary,
      fields.expected_behavior,
      fields.actual_behavior,
      fields.repro_steps
    );

    return NextResponse.json(fixResult);
  } catch (error) {
    console.error("Error generating fix:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate fix" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id]/fix - Apply the fix to the component
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { componentPath, fixedCode } = await request.json();

    if (!componentPath || !fixedCode) {
      return NextResponse.json(
        { error: "Missing componentPath or fixedCode" },
        { status: 400 }
      );
    }

    // Verify the report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Apply the fix
    await applyFix(componentPath, fixedCode);

    // Update report status
    await prisma.report.update({
      where: { id },
      data: { status: "fixed" },
    });

    return NextResponse.json({ success: true, message: "Fix applied successfully" });
  } catch (error) {
    console.error("Error applying fix:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply fix" },
      { status: 500 }
    );
  }
}
