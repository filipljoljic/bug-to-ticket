import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTicketDraft } from "@/lib/ai";

// POST /api/reports/[id]/generate - Generate ticket draft from messages
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get report with messages
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages to generate draft from" },
        { status: 400 }
      );
    }

    // Extract ticket draft using AI
    const draftFields = await extractTicketDraft(report.messages);

    // Upsert the draft
    const draft = await prisma.ticketDraft.upsert({
      where: { reportId: id },
      update: {
        fields: JSON.stringify(draftFields),
      },
      create: {
        reportId: id,
        fields: JSON.stringify(draftFields),
      },
    });

    // Update report title if extracted
    if (draftFields.title && !report.title) {
      await prisma.report.update({
        where: { id },
        data: { title: draftFields.title },
      });
    }

    return NextResponse.json({
      draft,
      fields: draftFields,
    });
  } catch (error) {
    console.error("Error generating draft:", error);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id]/generate - Update draft fields manually
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const draft = await prisma.ticketDraft.upsert({
      where: { reportId: id },
      update: {
        fields: JSON.stringify(body),
      },
      create: {
        reportId: id,
        fields: JSON.stringify(body),
      },
    });

    return NextResponse.json({ draft, fields: body });
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}
