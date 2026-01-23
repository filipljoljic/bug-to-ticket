import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTicketDocument } from "@/lib/export-docx";
import type { TicketDraftFields } from "@/lib/schemas";

// GET /api/reports/[id]/export - Export ticket as Word document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get report with draft
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        draft: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.draft) {
      return NextResponse.json(
        { error: "No draft to export. Generate a draft first." },
        { status: 400 }
      );
    }

    // Parse draft fields
    const fields = JSON.parse(report.draft.fields) as TicketDraftFields;

    // Generate Word document
    const buffer = await generateTicketDocument(fields);

    // Create filename from title
    const filename = `${fields.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}_ticket.docx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting document:", error);
    return NextResponse.json(
      { error: "Failed to export document" },
      { status: 500 }
    );
  }
}
