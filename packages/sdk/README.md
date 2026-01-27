# bug-to-ticket-sdk

Capture bugs and automatically generate structured tickets with AI.

## Installation

```bash
npm install bug-to-ticket-sdk
# or
yarn add bug-to-ticket-sdk
# or
pnpm add bug-to-ticket-sdk
```

## Quick Start

```typescript
import { BugToTicket } from 'bug-to-ticket-sdk';

// Initialize the SDK
const client = BugToTicket.init({
  apiKey: 'your-api-key',
});

// Capture an error
try {
  riskyOperation();
} catch (error) {
  await client.capture(error, {
    context: 'checkout-flow',
    severity: 'high',
  });
}
```

## Features

- **Automatic error capture** - Catches unhandled errors and promise rejections
- **Environment detection** - Automatically includes browser, OS, and device info
- **AI-powered drafts** - Generate structured ticket drafts from bug reports
- **TypeScript support** - Full type definitions included
- **Lightweight** - Zero runtime dependencies

## Configuration

```typescript
const client = BugToTicket.init({
  // Required
  apiKey: 'your-api-key',
  
  // Optional
  baseUrl: 'https://api.bug-to-ticket.com', // Custom API endpoint
  captureUnhandled: true,  // Auto-capture unhandled errors (default: true)
  includeContext: true,    // Include environment info (default: true)
  defaultMetadata: {       // Metadata included with every report
    appVersion: '1.2.3',
    environment: 'production',
  },
});
```

## API Reference

### `BugToTicket.init(config)`

Initialize the SDK with your configuration. Returns a `BugToTicket` instance.

### `client.capture(error, options?)`

Capture an error or bug report.

```typescript
// Capture an Error object
await client.capture(new Error('Something went wrong'));

// Capture a string description
await client.capture('User reported: Button not working');

// With options
await client.capture(error, {
  title: 'Payment failed',
  context: 'checkout-flow',
  severity: 'critical',
  user: {
    id: 'user-123',
    email: 'user@example.com',
  },
  tags: ['payments', 'urgent'],
  metadata: {
    orderId: 'order-456',
  },
});
```

### `client.captureAndGenerate(error, options?)`

Capture an error AND immediately generate a ticket draft.

```typescript
const { report, draft } = await client.captureAndGenerate(error, {
  context: 'user-settings',
});

console.log(draft.title);        // AI-generated title
console.log(draft.summary);      // AI-generated summary
console.log(draft.repro_steps);  // Reproduction steps
console.log(draft.severity);     // Detected severity
```

### `client.createReport()`

Create an empty report (useful for manual input flows).

```typescript
const report = await client.createReport();
console.log(report.id); // Use this ID to add messages
```

### `client.addMessage(reportId, message)`

Add a follow-up message to a report.

```typescript
await client.addMessage(reportId, {
  role: 'user',
  content: 'I was on the checkout page when this happened',
});
```

### `client.generateDraft(reportId)`

Generate a ticket draft from a report's messages.

```typescript
const { fields } = await client.generateDraft(reportId);
console.log(fields.title);
console.log(fields.summary);
console.log(fields.repro_steps);
```

### `client.getReport(reportId)`

Get a report by ID with all messages and draft.

```typescript
const report = await client.getReport('report-id');
console.log(report.messages);
console.log(report.draft);
```

### `client.listReports()`

List all reports.

```typescript
const reports = await client.listReports();
```

### `client.deleteReport(reportId)`

Delete a report.

```typescript
await client.deleteReport('report-id');
```

## React Integration

For React apps, you can create a context provider:

```tsx
import { createContext, useContext, ReactNode } from 'react';
import { BugToTicket } from 'bug-to-ticket-sdk';

const BugToTicketContext = createContext<BugToTicket | null>(null);

export function BugToTicketProvider({ 
  children, 
  apiKey 
}: { 
  children: ReactNode; 
  apiKey: string;
}) {
  const client = BugToTicket.init({ apiKey });
  
  return (
    <BugToTicketContext.Provider value={client}>
      {children}
    </BugToTicketContext.Provider>
  );
}

export function useBugToTicket() {
  const client = useContext(BugToTicketContext);
  if (!client) {
    throw new Error('useBugToTicket must be used within BugToTicketProvider');
  }
  return client;
}
```

Usage:

```tsx
function MyComponent() {
  const bugToTicket = useBugToTicket();
  
  const handleError = async (error: Error) => {
    await bugToTicket.capture(error, {
      context: 'MyComponent',
    });
  };
  
  // ...
}
```

## Error Handling

The SDK throws `BugToTicketError` for API errors:

```typescript
import { BugToTicketError } from 'bug-to-ticket-sdk';

try {
  await client.capture(error);
} catch (e) {
  if (e instanceof BugToTicketError) {
    console.log(e.message);    // Error message
    console.log(e.statusCode); // HTTP status code
    console.log(e.details);    // Additional details
  }
}
```

## TypeScript

All types are exported:

```typescript
import type {
  BugToTicketConfig,
  CaptureOptions,
  Report,
  Message,
  TicketDraft,
  Severity,
} from 'bug-to-ticket-sdk';
```

## License

MIT
