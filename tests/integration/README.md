# Local Supabase Integration Tests

These tests verify Row-Level Security (RLS) policies and database access controls
against a **local Supabase instance**.

## Prerequisites

1. Install the Supabase CLI: https://supabase.com/docs/guides/local-development
2. Start local Supabase:

   ```powershell
   npx supabase start
   ```

3. Apply migrations:

   ```powershell
   npx supabase db reset
   ```

4. Copy `.env.local` values or set environment variables:

   ```powershell
   $env:NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "<local anon key>"
   $env:SUPABASE_SERVICE_ROLE_KEY = "<local service role key>"
   $env:RUN_SUPABASE_INTEGRATION = "1"
   ```

## Running

```powershell
npm run test -- tests/integration
```

> **Important:** All integration tests are gated behind `RUN_SUPABASE_INTEGRATION=1`.
> Without this variable set, every test file in this directory will be skipped.

## Safety

- These tests run against a **local** Supabase instance only.
- They never touch the production Supabase project.
- All test data is created and cleaned up within each test.
- If the cleanup step fails, you may need to manually delete test rows
  using the Supabase Studio dashboard at `http://localhost:54323`.

## What is tested

- RLS policies for `threads` table (SELECT, INSERT, DELETE)
- RLS policies for `documents` table
- RLS policies for `document_chunks` table
- Storage bucket folder isolation per user
- `match_chunks` function access control
