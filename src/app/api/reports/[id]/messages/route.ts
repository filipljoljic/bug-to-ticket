import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MessageSchema } from "@/lib/schemas";

// POST /api/reports/[id]/messages - Add a message to a report
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const result = MessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid message data", details: result.error.issues },
        { status: 400 }
      );
    }

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        reportId: id,
        role: result.data.role,
        content: result.data.content,
      },
    });

    // Update report title if this is the first user message and no title exists
    if (result.data.role === "user" && !report.title) {
      const title =
        result.data.content.length > 100
          ? result.data.content.substring(0, 100) + "..."
          : result.data.content;

      await prisma.report.update({
        where: { id },
        data: { title },
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
