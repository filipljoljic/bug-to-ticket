# Bug-to-Ticket Copilot

A simple web app that turns messy bug reports into structured tickets using AI, with Word document export.

## Features

- Chat interface to describe bugs naturally
- AI-powered extraction of structured ticket fields using Claude
- Editable ticket draft with:
  - Title, Summary, Expected/Actual Behavior
  - Steps to Reproduce (add/remove steps)
  - Environment details (OS, Browser, Device, App Version)
  - Severity selector and Confidence score
  - Suspected Component
- "Missing Information" panel with AI-generated questions
- Export to Word document (.docx)

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **AI**: Anthropic Claude API
- **Export**: docx npm package

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
ANTHROPIC_API_KEY=your_key_here
```

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click **"+ New Report"** to create a new bug report
2. Describe the bug in the chat (be detailed about expected vs actual behavior, environment, etc.)
3. Click **"Generate"** to extract structured ticket fields using AI
4. Edit any fields in the draft panel as needed
5. Click **"Export .docx"** to download a Word document

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home - reports list
│   ├── reports/[id]/page.tsx       # Report detail + chat + draft
│   └── api/
│       └── reports/                # API routes
├── components/
│   ├── ReportsList.tsx             # Reports table
│   ├── ChatPanel.tsx               # Chat interface
│   ├── TicketDraftEditor.tsx       # Editable draft form
│   └── MissingInfoPanel.tsx        # AI questions panel
└── lib/
    ├── db.ts                       # Prisma client
    ├── ai.ts                       # Claude extraction
    ├── schemas.ts                  # Zod validation
    └── export-docx.ts              # Word doc generator
```

## API Endpoints

- `GET /api/reports` - List all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report with messages and draft
- `DELETE /api/reports/:id` - Delete a report
- `POST /api/reports/:id/messages` - Add a message
- `POST /api/reports/:id/generate` - Generate draft with AI
- `PUT /api/reports/:id/generate` - Update draft manually
- `GET /api/reports/:id/export` - Download Word document

## Extracted Ticket Fields

The AI extracts these fields from the conversation:

```typescript
{
  title: string,
  summary: string,
  expected_behavior: string,
  actual_behavior: string,
  repro_steps: string[],
  environment: {
    os: string | null,
    browser: string | null,
    device: string | null,
    app_version: string | null
  },
  severity: "low" | "medium" | "high" | "critical",
  confidence: number, // 0-1
  suspected_component: string | null,
  missing_info_questions: string[]
}
```

## License

MIT
