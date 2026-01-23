import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import type { TicketDraftFields } from "./schemas";

export async function generateTicketDocument(
  draft: TicketDraftFields
): Promise<Buffer> {
  const severityColors: Record<string, string> = {
    critical: "FF0000",
    high: "FF6600",
    medium: "FFCC00",
    low: "00CC00",
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: draft.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),

          // Metadata line
          new Paragraph({
            children: [
              new TextRun({
                text: `Severity: ${draft.severity.toUpperCase()}`,
                bold: true,
                color: severityColors[draft.severity],
              }),
              new TextRun({
                text: `  |  Confidence: ${Math.round(draft.confidence * 100)}%`,
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Summary
          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: draft.summary || "No summary provided.",
            spacing: { after: 200 },
          }),

          // Expected Behavior
          new Paragraph({
            text: "Expected Behavior",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: draft.expected_behavior || "Not specified.",
            spacing: { after: 200 },
          }),

          // Actual Behavior
          new Paragraph({
            text: "Actual Behavior",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: draft.actual_behavior || "Not specified.",
            spacing: { after: 200 },
          }),

          // Steps to Reproduce
          new Paragraph({
            text: "Steps to Reproduce",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          ...(draft.repro_steps.length > 0
            ? draft.repro_steps.map(
                (step, index) =>
                  new Paragraph({
                    text: `${index + 1}. ${step}`,
                    spacing: { after: 100 },
                  })
              )
            : [
                new Paragraph({
                  text: "No reproduction steps provided.",
                  spacing: { after: 200 },
                }),
              ]),

          // Environment
          new Paragraph({
            text: "Environment",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "OS", bold: true } as Parameters<typeof Paragraph>[0])],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(draft.environment.os || "Unknown"),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Browser", bold: true } as Parameters<typeof Paragraph>[0])],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(draft.environment.browser || "Unknown"),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Device", bold: true } as Parameters<typeof Paragraph>[0])],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(draft.environment.device || "Unknown"),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "App Version", bold: true } as Parameters<typeof Paragraph>[0])],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(draft.environment.app_version || "Unknown"),
                    ],
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),

          // Suspected Component
          ...(draft.suspected_component
            ? [
                new Paragraph({
                  text: "Suspected Component",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 100 },
                }),
                new Paragraph({
                  text: draft.suspected_component,
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Missing Information
          ...(draft.missing_info_questions.length > 0
            ? [
                new Paragraph({
                  text: "Missing Information (Questions to Ask)",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 100 },
                }),
                ...draft.missing_info_questions.map(
                  (q) =>
                    new Paragraph({
                      text: `• ${q}`,
                      spacing: { after: 50 },
                    })
                ),
              ]
            : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
