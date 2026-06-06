# Live Smoke Tests

These tests verify NovaGen integrates correctly with real external services
(Gemini API and Supabase).

## Danger

These tests call **real APIs** and modify **real data**.

Only run against an isolated test project, never against production.

## Prerequisites

Set the following environment variables in a terminal session:

```powershell
$env:RUN_LIVE_SMOKE_TESTS = "1"
$env:GEMINI_API_KEY = "your-gemini-api-key"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://your-test-project.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-test-anon-key"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-test-service-role-key"
```

## Running

```powershell
npm run test -- tests/live
```

## What is tested

- Gemini API returns a non-empty reply
- A synthetic TXT file can be uploaded to Supabase Storage
- A synthetic document chunk can be indexed (inserted into `document_chunks`)
- A grounded question returns a relevant answer (Gemini + RAG flow)

## Cleanup

Every test cleans up after itself:

- Created Storage objects are deleted
- Inserted database rows are removed
- API keys are never printed
