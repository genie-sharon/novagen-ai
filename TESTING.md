# NovaGen Testing Guide

## Installed Testing Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^2.1.9 | Test runner and assertion library |
| `@testing-library/react` | ^16.3.2 | React component testing |
| `@testing-library/user-event` | ^14.6.1 | Simulating user interactions |
| `@testing-library/jest-dom` | ^6.9.1 | DOM-specific matchers |
| `jsdom` | ^24.1.3 | Browser environment simulation |
| `@vitest/coverage-v8` | ^2.1.9 | Code coverage reporting |
| `@playwright/test` | ^1.60.0 | End-to-end browser testing |
| `docx` | ^8.0.0 | DOCX fixture generation |

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit/component/API tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Run Playwright tests with UI mode |
| `npm run test:typecheck` | TypeScript type checking |
| `npm run test:all` | Typecheck + unit tests + E2E tests |

## Directory Structure

```
tests/
  __mocks__/            # Vitest module mocks
    server-only.js      # Mock for Next.js server-only
  e2e/                  # Playwright end-to-end tests
    branding.spec.ts
    auth.spec.ts
    chat.spec.ts
    file-types.spec.ts
    threads.spec.ts
  fixtures/             # Synthetic test files
    sample.txt          # TXT fixture
    sample.csv          # CSV fixture
    sample.docx         # DOCX fixture
    sample-selectable-text.pdf
    sample-image-only-placeholder.pdf
    sample-empty.txt
    sample-large.txt
    unsupported.doc
    generate-fixtures.mjs
  integration/          # Local Supabase RLS tests (opt-in)
    README.md
    rls.test.ts
  live/                 # Live API smoke tests (opt-in)
    README.md
    gemini.smoke.test.ts
    supabase.smoke.test.ts
  setup.ts              # Test environment setup
  chunker.test.ts       # Unit: text chunking
  document-parser.test.ts # Unit: file parsing
  embeddings.test.ts    # Unit: embedding generation (mocked)
  sanitization.test.ts  # Unit: filename sanitization
  AttachmentChip.test.tsx    # Component: attachment chip
  ChatInput.test.tsx         # Component: composer input
  MessageBubble.test.tsx     # Component: chat bubble
  Sidebar.test.tsx           # Component: sidebar
  AuthForm.test.tsx          # Component: login/signup
  upload-route.test.ts       # API: document upload
  documents-route.test.ts    # API: document list/delete
  chat-route.test.ts         # API: chat endpoint
```

## Coverage

Coverage thresholds are configured in `vitest.config.ts`:

- Statements: 75%
- Branches: 65%
- Functions: 75%
- Lines: 75%

These thresholds are realistic starting points. Increase them as coverage
improves over time.

## How Mocks Work

### Unit Tests
- **chunker.ts**: Pure function, no mocking needed.
- **document-parser.ts**: `server-only` is replaced via `resolve.alias` in `vitest.config.ts`.
- **embeddings.ts**: `@/lib/gemini` and `ai` modules are mocked with `vi.mock`.

### Component Tests
- **ChatInput**: `fetch` is stubbed with `vi.stubGlobal`.
- **Sidebar**: `next/navigation` and `@/lib/supabase/client` are mocked.
- **AuthForm**: Same mocking approach as Sidebar.

### API Route Tests
- **Supabase server client**: Fully mocked with `vi.mock("@/lib/supabase/server")`.
- **document-parser, chunker, embeddings**: Mocked at module level.
- **ai (streamText, convertToModelMessages)**: Mocked at module level.

No real API calls are made during normal test runs.

## How to Add a New Test

1. Create a `.test.ts` or `.test.tsx` file in `tests/`.
2. Import the module under test using the `@/` alias.
3. Mock any external dependencies with `vi.mock(...)`.
4. Write tests using `describe` / `it` / `expect`.

For components:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
```

For API routes, mock the Supabase server client:
```ts
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ ... }),
}));
```

## How to Read Playwright Reports

After running E2E tests, HTML reports are generated in `playwright-report/`:

```powershell
npx playwright show-report
```

Screenshots and videos are captured only for failed tests.

## How to Run Only One Test File

```powershell
npx vitest run tests/chunker.test.ts
npx vitest run tests/ChatInput.test.tsx
npx playwright test tests/e2e/branding.spec.ts
```

## Local Supabase Integration Setup

See `tests/integration/README.md` for full setup.

Quick start:
```powershell
npx supabase start
$env:RUN_SUPABASE_INTEGRATION = "1"
npm run test -- tests/integration
```

## Optional Live Smoke Setup

See `tests/live/README.md` for full setup.

```powershell
$env:RUN_LIVE_SMOKE_TESTS = "1"
$env:GEMINI_API_KEY = "..."
npm run test -- tests/live
```

## Known Limitations

1. **DOCX extraction test** requires a valid `.docx` fixture. If regeneration fails,
   the test is skipped gracefully.
2. **Image-only PDF test** uses a best-effort approach; `pdf-parse` may not
   consistently reject empty PDFs across all versions.
3. **Playwright E2E tests** require a running Next.js dev server (`npm run dev`).
   The `playwright.config.ts` starts it automatically.
4. **Upload route tests** mock the entire Supabase surface. The actual multipart
   `request.formData()` parsing depends on the jsdom/web API implementation in
   Node.js, which works correctly in Node 22.
5. **Messaging tests** that verify `streamText` is called require proper mock
   chain setup for Supabase query builder. See `chat-route.test.ts` for the pattern.
